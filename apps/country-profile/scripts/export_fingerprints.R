#!/usr/bin/env Rscript
# Export the 2025 z-scored V-Dem fingerprint matrix for the country-profile
# app. This is the same Mz that drives the peer-distance calculation in
# export_peers.R, shipped per-cell so the app can show *why* each peer pair
# is close (which indicators they're both anomalous on).
#
# Output:
#   apps/country-profile/public/fingerprints_2025.parquet
#       Long format: iso3 (dict-encoded), tag (dict-encoded), z (float32).
#       Read in-browser via hyparquet, same pattern as pc_scores.parquet.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(countrycode)
})

setwd("/home/taimur/dev/institutional-complexity")

spaces <- readRDS("scratch/country_spaces_by_year.rds")
Mz     <- spaces[["2025"]]$Mz

# Same V-Dem -> ISO3 mapping used in export_peers.R.
country_names <- rownames(Mz)
iso_lookup <- countrycode(
  country_names,
  origin = "country.name", destination = "iso3c",
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

keep      <- !is.na(iso_lookup)
Mz_keep   <- Mz[keep, , drop = FALSE]
iso_keep  <- iso_lookup[keep]

# Collapse duplicate ISO3s by mean fingerprint (matches export_peers.R).
if (anyDuplicated(iso_keep)) {
  Mz_collapsed <- t(sapply(unique(iso_keep), function(code) {
    rows <- which(iso_keep == code)
    if (length(rows) == 1) Mz_keep[rows, ]
    else colMeans(Mz_keep[rows, , drop = FALSE])
  }))
  rownames(Mz_collapsed) <- unique(iso_keep)
  Mz_keep  <- Mz_collapsed
  iso_keep <- unique(iso_keep)
}
rownames(Mz_keep) <- iso_keep

long <- as_tibble(Mz_keep, rownames = "iso3") %>%
  pivot_longer(-iso3, names_to = "tag", values_to = "z") %>%
  mutate(
    iso3 = factor(iso3, levels = sort(unique(iso3))),
    tag  = factor(tag,  levels = sort(unique(tag))),
    z    = round(z, 4)
  ) %>%
  arrange(iso3, tag)

message("ISO3 rows:        ", length(unique(long$iso3)))
message("Indicators:       ", length(unique(long$tag)))
message("Total cells:      ", format(nrow(long), big.mark = ","))

out <- "apps/country-profile/public/fingerprints_2025.parquet"
write_parquet(
  long, out,
  compression = "snappy",
  use_dictionary = TRUE,
  write_statistics = TRUE
)
message("Wrote ", out, " (",
        format(file.info(out)$size / 1024, digits = 4), " KB)")
