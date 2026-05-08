#!/usr/bin/env Rscript
# Export per-country growth-break / sectoral / ECI time series for the
# country-profile app. Reuses the methodology from
# case-studies/cambodia/cambodia-analysis.Rmd:
#
#   - Bai-Perron with n_breaks = 4 on PWT real-GDP-per-capita growth
#   - Kar et al. (2013) acceleration filter labels the period transitions
#   - Sectoral value-added (constant 2015 USD) from macro_df WDI columns
#   - Sectoral labour productivity = VA / (sector_share * total_labour_force)
#   - ECI from the Atlas hs4digit snapshot (1994-2021)
#
# Output: apps/country-profile/public/growth_series.json — one entry per ISO3
#         in countries.json, plus a few series-only entries (no breaks) for
#         countries with insufficient history. Countries with no PWT and no
#         WDI rows are omitted.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(strucchange)
  library(readxl)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

# -- Reference set ------------------------------------------------------------
countries <- fromJSON("apps/country-profile/public/countries.json") %>%
  as_tibble()
target_isos <- countries$iso3

# -- 1. PWT real GDP per capita ----------------------------------------------
message("Loading PWT…")
pwt <- read_excel("~/dev/political-economy-pakistan/data/pwt110.xlsx",
                  sheet = "Data") %>%
  filter(countrycode %in% target_isos) %>%
  transmute(iso3 = countrycode, year = as.integer(year),
            gdp_per_cap = rgdpna / pop) %>%
  filter(!is.na(gdp_per_cap)) %>%
  arrange(iso3, year)

# -- 2. Macro: sectoral VA + employment shares + total labour force -----------
message("Loading macro_df sectoral columns…")
macro <- read_parquet(
  "data/shared-data/growth-lab/glmacro_master_alldata.parquet",
  col_select = c("countrycodeiso", "year",
                 "wdi_nv_agr_totl_kd", "wdi_nv_ind_totl_kd",
                 "wdi_nv_srv_totl_kd",
                 "wdi_sl_agr_empl_zs", "wdi_sl_ind_empl_zs",
                 "wdi_sl_srv_empl_zs", "wdi_sl_tlf_totl_in")
) %>%
  rename(iso3 = countrycodeiso) %>%
  mutate(year = as.integer(year)) %>%
  filter(iso3 %in% target_isos)

# -- 3. Atlas HS-based ECI ----------------------------------------------------
message("Loading Atlas hs4digit-old for ECI…")
eci_all <- read_parquet("~/dev/shared-data/growth-lab/atlas/hs4digit-old.parquet") %>%
  distinct(location_code, year, hs_eci) %>%
  filter(!is.na(hs_eci), location_code %in% target_isos) %>%
  rename(iso3 = location_code, value = hs_eci) %>%
  mutate(year = as.integer(year)) %>%
  arrange(iso3, year)

# -- Bai-Perron + Kar helpers -------------------------------------------------
# Returns a list { years, periods } or NULL if the series is too short / the
# break-detection fails.
compute_breaks <- function(country_growth, target_breaks = 4,
                           min_years = 25) {
  # Mirror cambodia-analysis.Rmd exactly: build the ts on growth_rate[-1]
  # (drops the leading NA), label it with start = min(year). This produces
  # breakpoint labels that are off by one from the calendar year of the
  # growth observation, but that's the convention the writeup uses and the
  # downstream analyses key off — so we replicate it.
  cg <- country_growth %>% arrange(year)
  cg <- cg[!is.na(cg$gdp_per_cap), ]
  if (nrow(cg) < min_years + 1) return(NULL)

  start_year <- cg$year[1]
  end_year   <- cg$year[nrow(cg)]
  growth_ts  <- ts(cg$growth_rate[-1], start = start_year, end = end_year,
                   frequency = 1)

  bp <- tryCatch(breakpoints(growth_ts ~ 1),
                 error = function(e) NULL)
  if (is.null(bp)) return(NULL)

  bd <- summary(bp)$breakdates
  if (is.null(bd)) return(NULL)
  # bd is a matrix where row k holds the optimal k-break solution. Use the
  # k = target_breaks row, falling back to the largest available row.
  target_row <- min(target_breaks, nrow(bd))
  yrs <- as.integer(bd[target_row, ])
  yrs <- yrs[!is.na(yrs)]
  if (length(yrs) == 0) return(NULL)

  # Build the period table including the initial (no-transition) and final
  # segments. The cambodia-analysis convention is to cut on
  # c(start_year, break_years, end_year).
  cut_breaks <- c(start_year, yrs, end_year)
  periods <- cg %>%
    mutate(period = cut(year, breaks = cut_breaks,
                        include.lowest = TRUE, dig.lab = 4)) %>%
    group_by(period) %>%
    summarise(start = min(year), end = max(year),
              avg_growth = mean(growth_rate, na.rm = TRUE),
              median_growth = median(growth_rate, na.rm = TRUE),
              n = n(), .groups = "drop") %>%
    arrange(start)

  # Kar (2013) acceleration filter: pass if |Δ avg growth| ≥ 0.02 baseline,
  # 0.03 on direction reversal, 0.01 on continuation.
  diff_g <- c(NA, diff(periods$avg_growth))
  prev_dir <- c(NA, NA, sign(diff_g[-c(1, length(diff_g))]) *
                sign(diff_g[-c(1, 2)]))
  # simpler: walk through and apply the rule per the cambodia analysis
  passes_kar <- rep(NA, nrow(periods))
  prev_sign <- NA_real_
  for (i in seq_along(diff_g)) {
    d <- diff_g[i]
    if (is.na(d)) next
    threshold <- if (is.na(prev_sign)) 0.02
                 else if (sign(d) != prev_sign && prev_sign != 0) 0.03
                 else 0.01
    passes_kar[i] <- abs(d) >= threshold
    prev_sign <- sign(d)
  }

  list(
    years = yrs,
    periods = pmap(
      list(periods$start, periods$end, periods$avg_growth,
           periods$median_growth, passes_kar),
      function(s, e, ag, mg, pk) {
        list(
          start = unbox(s),
          end = unbox(e),
          avg_growth = unbox(round(ag, 5)),
          median_growth = unbox(round(mg, 5)),
          passes_kar = if (is.na(pk)) unbox(NA) else unbox(unname(pk))
        )
      }
    )
  )
}

# -- Per-country build --------------------------------------------------------
to_series <- function(df, value_cols, round_digits = 4) {
  if (nrow(df) == 0) return(list())
  df <- df %>% arrange(year)
  pmap(c(list(year = df$year), lapply(value_cols, function(c) df[[c]])),
       function(year, ...) {
         vals <- list(...)
         names(vals) <- value_cols
         vals <- lapply(vals, function(v) {
           if (is.na(v) || !is.finite(v)) NULL
           else unbox(round(v, round_digits))
         })
         c(list(year = unbox(as.integer(year))), vals)
       })
}

build_country_record <- function(iso) {
  pwt_iso <- pwt %>% filter(iso3 == iso) %>%
    mutate(growth_rate = (gdp_per_cap - lag(gdp_per_cap)) / lag(gdp_per_cap))

  breaks <- if (nrow(pwt_iso) > 0) compute_breaks(pwt_iso) else NULL

  gdp_series <- if (nrow(pwt_iso) > 0)
    to_series(pwt_iso %>% select(year, value = gdp_per_cap),
              "value", round_digits = 2)
    else list()

  growth_series <- if (nrow(pwt_iso) > 0)
    to_series(pwt_iso %>% select(year, value = growth_rate) %>%
                filter(!is.na(value)),
              "value", round_digits = 5)
    else list()

  m_iso <- macro %>% filter(iso3 == iso)

  va <- m_iso %>%
    transmute(year,
              agr = wdi_nv_agr_totl_kd,
              ind = wdi_nv_ind_totl_kd,
              srv = wdi_nv_srv_totl_kd) %>%
    filter(!if_all(c(agr, ind, srv), is.na))

  prod <- m_iso %>%
    filter(!is.na(wdi_sl_tlf_totl_in)) %>%
    transmute(year,
              agr = wdi_nv_agr_totl_kd /
                    (wdi_sl_agr_empl_zs / 100 * wdi_sl_tlf_totl_in),
              ind = wdi_nv_ind_totl_kd /
                    (wdi_sl_ind_empl_zs / 100 * wdi_sl_tlf_totl_in),
              srv = wdi_nv_srv_totl_kd /
                    (wdi_sl_srv_empl_zs / 100 * wdi_sl_tlf_totl_in)) %>%
    mutate(across(c(agr, ind, srv),
                  ~ ifelse(is.finite(.) & . > 0, ., NA))) %>%
    filter(!if_all(c(agr, ind, srv), is.na))

  eci <- eci_all %>% filter(iso3 == iso) %>% select(year, value)

  list(
    iso3 = unbox(iso),
    breaks = if (is.null(breaks)) NULL else list(
      years = breaks$years, periods = breaks$periods
    ),
    gdp_per_capita = gdp_series,
    growth_rate = growth_series,
    sectoral_va = to_series(va, c("agr", "ind", "srv"), round_digits = 0),
    sectoral_productivity = to_series(prod, c("agr", "ind", "srv"),
                                      round_digits = 1),
    eci = to_series(eci, "value", round_digits = 4)
  )
}

# -- Loop ---------------------------------------------------------------------
message("Building per-country records for ", length(target_isos), " countries…")
records <- list()
for (i in seq_along(target_isos)) {
  iso <- target_isos[i]
  rec <- tryCatch(build_country_record(iso),
                  error = function(e) {
                    message("  ", iso, " failed: ", conditionMessage(e))
                    NULL
                  })
  if (is.null(rec)) next
  # Drop countries with literally nothing to show.
  if (length(rec$gdp_per_capita) == 0 &&
      length(rec$sectoral_va)   == 0 &&
      length(rec$eci)           == 0) next
  records[[iso]] <- rec
  if (i %% 25 == 0) message("  …", i, "/", length(target_isos))
}

# -- Summary ------------------------------------------------------------------
n_with_breaks <- sum(map_lgl(records, ~ !is.null(.x$breaks)))
n_with_eci    <- sum(map_lgl(records, ~ length(.x$eci) > 0))
n_with_prod   <- sum(map_lgl(records, ~ length(.x$sectoral_productivity) > 0))
message("\nKept ", length(records), " countries.")
message("  with growth breaks: ", n_with_breaks)
message("  with ECI series   : ", n_with_eci)
message("  with productivity : ", n_with_prod)

# -- Write --------------------------------------------------------------------
write_json(records,
           "apps/country-profile/public/growth_series.json",
           auto_unbox = FALSE, na = "null")

message("Wrote apps/country-profile/public/growth_series.json")
