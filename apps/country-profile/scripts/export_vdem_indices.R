#!/usr/bin/env Rscript
# Export V-Dem headline-index time series for the country-profile app.
#
# We ship one file per country (apps/country-profile/public/vdem/{ISO3}.json)
# so the React app can fetch the focus country eagerly and only fetch peer
# files when the "show peers" overlay toggle is on. A separate
# vdem_meta.json carries the index labels and group assignments.
#
# Index set comes from the vdem-dataset-advisor — 11 aggregate (vartype=="D")
# indices in three groups: Democracy bundle, Rights & Liberties, Governance.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(countrycode)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

# -- Index set ----------------------------------------------------------------
indices <- tribble(
  ~tag,                ~label,                       ~group,
  "v2x_polyarchy",     "Electoral Democracy",        "Democracy",
  "v2x_libdem",        "Liberal Democracy",          "Democracy",
  "v2x_partipdem",     "Participatory Democracy",    "Democracy",
  "v2x_delibdem",      "Deliberative Democracy",     "Democracy",
  "v2x_egaldem",       "Egalitarian Democracy",      "Democracy",
  "v2x_freexp_altinf", "Press & Expression",         "Rights & Liberties",
  "v2x_clphy",         "Physical Integrity",         "Rights & Liberties",
  "v2xcs_ccsi",        "Civil Society",              "Rights & Liberties",
  "v2x_rule",          "Rule of Law",                "Governance",
  "v2x_jucon",         "Judicial Constraints",       "Governance",
  "v2x_neopat",        "Neopatrimonialism",          "Governance"
)

START_YEAR <- 1900

# -- Codebook copy: question + clarification for each tag --------------------
codebook <- read_parquet("data/shared-data/vdem/vdem_codebook.parquet") %>%
  filter(tag %in% indices$tag) %>%
  transmute(
    tag,
    question = str_squish(question),
    description = str_squish(clarification)
  ) %>%
  mutate(description = if_else(description == "NA" | description == "",
                               NA_character_, description))

indices <- indices %>% left_join(codebook, by = "tag")

# -- Load V-Dem ---------------------------------------------------------------
message("Loading V-Dem…")
vdem <- read_parquet(
  "data/shared-data/vdem/vdem.parquet",
  col_select = c("country_name", "year", indices$tag)
) %>%
  filter(year >= START_YEAR)

# -- Map country_name -> ISO3 (same lookup as export_peers.R) -----------------
country_names <- unique(vdem$country_name)
iso_lookup <- countrycode(
  country_names,
  origin = "country.name",
  destination = "iso3c",
  custom_match = c(
    "Burma/Myanmar"      = "MMR",
    "Czech Republic"     = "CZE",
    "German Democratic Republic" = "DDR",
    "Hong Kong"          = "HKG",
    "Ivory Coast"        = "CIV",
    "Kosovo"             = "XKX",
    "Palestine/Gaza"     = "PSE",
    "Palestine/West Bank" = "PSE",
    "Republic of the Congo" = "COG",
    "Sao Tome and Principe" = "STP",
    "Somaliland"         = NA_character_,
    "South Vietnam"      = NA_character_,
    "Vietnam, Democratic Republic of" = NA_character_,
    "Yemen, People's Republic of" = NA_character_,
    "Zanzibar"           = NA_character_
  )
)
names(iso_lookup) <- country_names
iso_lookup <- iso_lookup[!is.na(iso_lookup)]

# Constrain to ISO3s present in countries.json so the UI never asks for a
# file we didn't ship.
target_isos <- fromJSON(
  "apps/country-profile/public/countries.json"
)$iso3
keep_iso <- intersect(unique(unname(iso_lookup)), target_isos)

# -- Build per-country records ------------------------------------------------
out_dir <- "apps/country-profile/public/vdem"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

# Trim file size: round to 4 decimal places, drop leading-NA rows so each
# index series starts at its first non-NA year.
to_index_series <- function(years, vals) {
  if (length(vals) == 0 || all(is.na(vals))) return(list())
  ord <- order(years)
  years <- years[ord]
  vals  <- vals[ord]
  pmap(list(year = years, value = vals), function(year, value) {
    if (is.na(value)) return(NULL)
    list(year = unbox(as.integer(year)),
         value = unbox(round(value, 4)))
  }) %>% compact()
}

vdem_iso <- vdem %>%
  mutate(iso3 = unname(iso_lookup[country_name])) %>%
  filter(!is.na(iso3), iso3 %in% keep_iso)

# Some V-Dem rows collapse to the same ISO3 (e.g. Palestine variants).
# Average them so each ISO3 has one series per index per year.
vdem_iso <- vdem_iso %>%
  select(iso3, year, all_of(indices$tag)) %>%
  group_by(iso3, year) %>%
  summarise(across(all_of(indices$tag), ~ mean(.x, na.rm = TRUE)),
            .groups = "drop") %>%
  mutate(across(all_of(indices$tag), ~ ifelse(is.nan(.x), NA, .x)))

written <- 0
for (iso in unique(vdem_iso$iso3)) {
  d <- vdem_iso %>% filter(iso3 == iso) %>% arrange(year)
  series <- map(indices$tag, function(tag) to_index_series(d$year, d[[tag]]))
  names(series) <- indices$tag
  # Skip countries where literally every index is empty.
  if (all(map_int(series, length) == 0)) next
  write_json(
    c(list(iso3 = unbox(iso)), series),
    file.path(out_dir, paste0(iso, ".json")),
    auto_unbox = FALSE, na = "null"
  )
  written <- written + 1
}

# -- Meta ---------------------------------------------------------------------
meta <- list(
  start_year = unbox(START_YEAR),
  groups = unique(indices$group),
  indices = pmap(indices, function(tag, label, group, question, description)
    list(
      tag = unbox(tag),
      label = unbox(label),
      group = unbox(group),
      question = unbox(question),
      description = if (is.na(description)) NA else unbox(description)
    ))
)
write_json(meta,
           "apps/country-profile/public/vdem_meta.json",
           auto_unbox = FALSE, pretty = TRUE)

message("Wrote ", written, " per-country files to ", out_dir)
message("Wrote vdem_meta.json with ", nrow(indices), " indices.")
