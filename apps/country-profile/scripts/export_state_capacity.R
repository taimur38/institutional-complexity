#!/usr/bin/env Rscript
# Export Hanson & Sigman state-capacity series for the country-profile app.
#
# Source: QoG `lld_capacity` / `lld_capstd` (Hanson & Sigman 2021, "Leviathan's
# Latent Dimensions"). Annual 1960–2015, ~163 countries. In the macro master
# they live as `qog_lld_capacity` and `qog_lld_capstd`.
#
# Ships one file per country (apps/country-profile/public/state_capacity/{ISO3}.json)
# with both the capacity estimate and its posterior SD, so the UI can draw
# a ±1 SD band around the focus country.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

START_YEAR <- 1960

# -- Load --------------------------------------------------------------------
message("Loading state-capacity series from macro master…")
df <- read_parquet(
  "~/dev/shared-data/growth-lab/glmacro_master_alldata.parquet",
  col_select = c("countrycodeiso", "year",
                 "qog_lld_capacity", "qog_lld_capstd")
) %>%
  filter(!is.na(qog_lld_capacity), year >= START_YEAR) %>%
  transmute(
    iso3 = countrycodeiso,
    year = as.integer(year),
    capacity = round(qog_lld_capacity, 4),
    sd       = round(qog_lld_capstd, 4)
  )

# Constrain to ISO3s present in countries.json.
target_isos <- fromJSON(
  "apps/country-profile/public/countries.json"
)$iso3
df <- df %>% filter(iso3 %in% target_isos)

# -- Per-country files -------------------------------------------------------
out_dir <- "apps/country-profile/public/state_capacity"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

written <- 0
for (iso in sort(unique(df$iso3))) {
  d <- df %>% filter(iso3 == iso) %>% arrange(year)
  points <- pmap(
    list(year = d$year, value = d$capacity, sd = d$sd),
    function(year, value, sd)
      list(year = unbox(year), value = unbox(value), sd = unbox(sd))
  )
  write_json(
    list(iso3 = unbox(iso), capacity = points),
    file.path(out_dir, paste0(iso, ".json")),
    auto_unbox = FALSE, na = "null"
  )
  written <- written + 1
}

# -- Meta --------------------------------------------------------------------
meta <- list(
  start_year = unbox(START_YEAR),
  end_year   = unbox(max(df$year)),
  source     = unbox("Hanson & Sigman (2021), via QoG dataset 'lld'"),
  citation   = unbox(paste(
    "Hanson, Jonathan K. and Rachel Sigman. 2021.",
    "'Leviathan's Latent Dimensions: Measuring State Capacity",
    "for Comparative Political Research.'",
    "Journal of Politics 83(4): 1495–1510."
  )),
  index = list(
    tag = unbox("lld_capacity"),
    label = unbox("State capacity"),
    description = unbox(paste(
      "Bayesian latent index of state capacity combining extractive",
      "(taxation), coercive (military / police), and administrative",
      "(bureaucratic quality) dimensions. Unitless; higher = more capable.",
      "Typical range ≈ [-2.5, 3.0]. The shaded band shows ±1 posterior",
      "standard deviation."
    ))
  )
)
write_json(meta,
           "apps/country-profile/public/state_capacity_meta.json",
           auto_unbox = FALSE, pretty = TRUE)

message("Wrote ", written, " per-country files to ", out_dir)
message("Wrote state_capacity_meta.json.")
