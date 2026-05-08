#!/usr/bin/env Rscript
# Export 2025 peers data for the country-profile app.
#
# For each country with a 2025 V-Dem fingerprint, find its top-K nearest
# institutional peers by Euclidean distance on the z-scored indicator matrix
# (the same Mz built in analyses/country-space-writeup.Rmd, cached in
# scratch/country_spaces_by_year.rds).
#
# Outputs:
#   apps/country-profile/public/countries.json — index keyed by ISO3
#       [{ iso3, name, region }, ...]
#   apps/country-profile/public/peers_2025.json — per-country peer lists
#       { ISO3: [{ iso3, name, distance }, ...], ... }
#
# We attach ISO3 via countrycode so the React app can route on iso3 codes.

suppressMessages({
  library(tidyverse)
  library(countrycode)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

spaces <- readRDS("scratch/country_spaces_by_year.rds")
sp     <- spaces[["2025"]]
Mz     <- sp$Mz                       # rows = country names, cols = indicators
coords <- sp$coords                   # has country, region

# -- Country -> ISO3 ----------------------------------------------------------
# V-Dem uses common-name strings like "United States of America", "Czechia",
# "Cape Verde", etc. countrycode handles most of these; a small custom_match
# patches the residual.
country_names <- rownames(Mz)
iso_lookup <- countrycode(
  country_names,
  origin = "country.name",
  destination = "iso3c",
  custom_match = c(
    "Burma/Myanmar"      = "MMR",
    "Czech Republic"     = "CZE",
    "German Democratic Republic" = "DDR",   # historical; not in 2025
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

# Drop rows where we can't resolve an ISO3 — they wouldn't be selectable in
# the URL-routed UI anyway.
keep <- !is.na(iso_lookup)
if (any(!keep)) {
  cat("Dropping (no ISO3):", paste(country_names[!keep], collapse = ", "), "\n")
}
Mz_keep   <- Mz[keep, , drop = FALSE]
iso_keep  <- iso_lookup[keep]
name_keep <- country_names[keep]

# Some V-Dem rows resolve to the same ISO3 (e.g., Palestine variants).
# Collapse by averaging the z-scored vectors so each ISO3 has one fingerprint.
if (anyDuplicated(iso_keep)) {
  dup_iso <- unique(iso_keep[duplicated(iso_keep)])
  cat("Collapsing duplicate ISO3s by mean fingerprint:",
      paste(dup_iso, collapse = ", "), "\n")
  Mz_collapsed <- t(sapply(unique(iso_keep), function(code) {
    rows <- which(iso_keep == code)
    if (length(rows) == 1) Mz_keep[rows, ] else colMeans(Mz_keep[rows, , drop = FALSE])
  }))
  rownames(Mz_collapsed) <- unique(iso_keep)
  # Pick a representative name for each iso (first occurrence).
  name_by_iso <- name_keep[match(unique(iso_keep), iso_keep)]
  names(name_by_iso) <- unique(iso_keep)
  Mz_keep   <- Mz_collapsed
  iso_keep  <- unique(iso_keep)
  name_keep <- unname(name_by_iso[iso_keep])
}

# -- Pairwise Euclidean distance ----------------------------------------------
D <- as.matrix(dist(Mz_keep, method = "euclidean"))
dimnames(D) <- list(iso_keep, iso_keep)

# -- Per-country peer lists ---------------------------------------------------
K <- 25  # ship more than we'd ever need; UI picks top-N
region_by_iso <- coords %>%
  mutate(iso3 = iso_lookup[match(country, country_names)]) %>%
  filter(!is.na(iso3)) %>%
  group_by(iso3) %>%
  slice_head(n = 1) %>%
  ungroup() %>%
  select(iso3, region) %>%
  deframe()

peers <- lapply(iso_keep, function(code) {
  d <- D[code, ]
  d <- d[names(d) != code]
  ord <- order(d)[seq_len(min(K, length(d)))]
  lapply(seq_along(ord), function(i) {
    peer_iso <- names(d)[ord[i]]
    list(
      iso3     = peer_iso,
      name     = name_keep[match(peer_iso, iso_keep)],
      distance = round(unname(d[ord[i]]), 4)
    )
  })
})
names(peers) <- iso_keep

countries <- tibble(
  iso3   = iso_keep,
  name   = name_keep,
  region = unname(region_by_iso[iso_keep])
) %>%
  arrange(name)

# -- Write --------------------------------------------------------------------
dir.create("apps/country-profile/public", recursive = TRUE, showWarnings = FALSE)

write_json(
  pmap(countries, function(iso3, name, region)
    list(iso3 = iso3, name = name, region = region)),
  "apps/country-profile/public/countries.json",
  auto_unbox = TRUE, pretty = TRUE
)

write_json(
  peers,
  "apps/country-profile/public/peers_2025.json",
  auto_unbox = TRUE
)

cat("Wrote ", nrow(countries), "countries and peer lists (top-", K, " each).\n")
