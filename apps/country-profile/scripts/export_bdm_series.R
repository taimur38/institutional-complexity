#!/usr/bin/env Rscript
# Export Bueno de Mesquita & Smith (2022) winning-coalition (W) size for
# every country in our index. W is the mean of four cross-panel z-scored
# V-Dem components — see analyses/winning_coalition.R for the formula and
# motivation.
#
# Output: apps/country-profile/public/bdm_series.json
#   { "PAK": [{ year, value }, ...], ... }
#
# We ship from year >= 1945 so the series aligns with the BdM convention
# and stays compact. Pre-1945 W values exist for many countries but they
# rest on V-Dem coding for events most readers won't recognize at this
# level of aggregation.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(countrycode)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

START_YEAR <- 1945

# Reuse the V-Dem -> ISO3 mapping rules from export_peers.R / export_vdem_indices.R.
fix_iso <- function(country_names) {
  countrycode(
    country_names,
    origin = "country.name", destination = "iso3c",
    custom_match = c(
      "Burma/Myanmar" = "MMR",
      "Czech Republic" = "CZE",
      "German Democratic Republic" = "DDR",
      "Hong Kong" = "HKG",
      "Ivory Coast" = "CIV",
      "Kosovo" = "XKX",
      "Palestine/Gaza" = "PSE",
      "Palestine/West Bank" = "PSE",
      "Republic of the Congo" = "COG",
      "Sao Tome and Principe" = "STP",
      "Somaliland" = NA_character_,
      "South Vietnam" = NA_character_,
      "Vietnam, Democratic Republic of" = NA_character_,
      "Yemen, People's Republic of" = NA_character_,
      "Zanzibar" = NA_character_
    )
  )
}

target_isos <- fromJSON("apps/country-profile/public/countries.json")$iso3

message("Loading V-Dem components for W…")
vdem <- read_parquet(
  "data/shared-data/vdem/vdem.parquet",
  col_select = c(
    "country_name", "year",
    "v2elembaut", "v2psoppaut", "v2psbars",
    "v2x_ex_hereditary", "v2x_ex_military", "v2x_ex_party"
  )
)

zscore <- function(x) (x - mean(x, na.rm = TRUE)) / sd(x, na.rm = TRUE)

w_panel <- vdem %>%
  mutate(
    closed_succession = -pmax(
      v2x_ex_hereditary, v2x_ex_military, v2x_ex_party,
      na.rm = FALSE
    ),
    z_elembaut = zscore(v2elembaut),
    z_oppaut   = zscore(v2psoppaut),
    z_bars     = zscore(v2psbars),
    z_succ     = zscore(closed_succession)
  ) %>%
  rowwise() %>%
  mutate(W = mean(c(z_elembaut, z_oppaut, z_bars, z_succ), na.rm = FALSE)) %>%
  ungroup() %>%
  filter(!is.na(W), year >= START_YEAR) %>%
  mutate(iso3 = fix_iso(country_name)) %>%
  filter(!is.na(iso3), iso3 %in% target_isos) %>%
  select(iso3, year, W)

# Collapse duplicate iso/year rows (e.g. Palestine variants) by mean W.
w_panel <- w_panel %>%
  group_by(iso3, year) %>%
  summarise(W = mean(W), .groups = "drop") %>%
  arrange(iso3, year)

records <- w_panel %>%
  group_by(iso3) %>%
  summarise(
    series = list(pmap(list(year, W), function(y, w)
      list(year = unbox(as.integer(y)), value = unbox(round(w, 4))))),
    .groups = "drop"
  )

out <- setNames(records$series, records$iso3)

dir.create("apps/country-profile/public", recursive = TRUE, showWarnings = FALSE)
write_json(out,
           "apps/country-profile/public/bdm_series.json",
           auto_unbox = FALSE, na = "null")

message(
  "Wrote bdm_series.json — ", length(out), " countries, ",
  format(nrow(w_panel), big.mark = ","), " country-year rows."
)
