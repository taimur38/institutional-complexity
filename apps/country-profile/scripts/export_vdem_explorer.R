#!/usr/bin/env Rscript
# Export the full V-Dem indicator catalog for the country-profile app's
# "explore any indicator" panel.
#
# Output:
#   apps/country-profile/public/vdem_indicators.json
#       Registry (tag, name, category, vartype, question, description,
#       responses, scale). Loaded once by the UI to populate the dropdown.
#   apps/country-profile/public/vdem_explorer.parquet
#       Long-format country-year-indicator panel:
#           iso3 (string, dictionary), year (int16), tag (string, dictionary),
#           value (float32). Snappy-compressed. Read in-browser with
#           hyparquet on first explorer use, then kept in memory.
#
# Scope: vartype C (expert-coded components) + D (derived/aggregate indices).
# Skips A (party/aggregate variants), A* (metadata), E (external — covered by
# our other macro/Atlas exports).

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(countrycode)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

KEEP_VARTYPES <- c("C", "D")
START_YEAR    <- 1900

# -- Tag -> category mapping comes from the markdown codebook (parquet codebook
#    lacks the category column).
md <- readLines("data/shared-data/vdem/vdem_codebook.md")
tag_idx <- grep("^### `", md)
tag     <- gsub("^### `([^`]+)`.*", "\\1", md[tag_idx])
category <- map_chr(tag_idx, function(i) {
  block <- md[i:min(i + 12L, length(md))]
  m <- grep("^- \\*\\*Category:", block, value = TRUE)
  if (length(m) == 0) return(NA_character_)
  sub("^- \\*\\*Category:\\*\\*\\s*", "", m[1])
})
md_categories <- tibble(tag, category)

# -- Codebook ----------------------------------------------------------------
codebook <- read_parquet("data/shared-data/vdem/vdem_codebook.parquet") %>%
  filter(vartype %in% KEEP_VARTYPES) %>%
  left_join(md_categories, by = "tag") %>%
  mutate(
    category    = if_else(is.na(category) | category == "",
                          "Other / Misc", category),
    name        = str_squish(name),
    question    = str_squish(question),
    description = str_squish(clarification),
    responses   = str_squish(responses),
    scale       = str_squish(scale),
    description = if_else(description %in% c("", "NA"), NA_character_, description),
    responses   = if_else(responses   %in% c("", "NA"), NA_character_, responses),
    question    = if_else(question    %in% c("", "NA"), NA_character_, question)
  )

# -- Drop tags missing from the data parquet ---------------------------------
parquet_path <- "data/shared-data/vdem/vdem.parquet"
parquet_cols <- arrow::ParquetFileReader$create(parquet_path)$GetSchema()$names
present_tags <- intersect(codebook$tag, parquet_cols)
codebook <- codebook %>% filter(tag %in% present_tags)
message("Indicators kept: ", nrow(codebook),
        " (vartype ", paste(KEEP_VARTYPES, collapse = "+"), ")")

# -- Read country_name + year + all kept tags in one pass --------------------
# 28k rows × ~470 numeric cols ≈ 100 MB of doubles + tibble overhead. Fine in
# one shot once we're done with per-tag JSON building.
message("Reading V-Dem panel…")
vdem <- read_parquet(parquet_path,
                     col_select = c("country_name", "year", all_of(present_tags))) %>%
  filter(year >= START_YEAR)

iso_lookup <- countrycode(
  unique(vdem$country_name),
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
names(iso_lookup) <- unique(vdem$country_name)

target_isos <- fromJSON("apps/country-profile/public/countries.json")$iso3

vdem <- vdem %>%
  mutate(iso3 = unname(iso_lookup[country_name])) %>%
  filter(!is.na(iso3), iso3 %in% target_isos) %>%
  select(-country_name)

# Collapse duplicate (iso3, year) rows (e.g. Palestine variants) by mean.
vdem <- vdem %>%
  group_by(iso3, year) %>%
  summarise(across(all_of(present_tags), ~ mean(.x, na.rm = TRUE)),
            .groups = "drop") %>%
  mutate(across(all_of(present_tags), ~ ifelse(is.nan(.x), NA, .x)))

# -- Pivot wide -> long, drop NAs, write parquet -----------------------------
message("Pivoting to long format…")
long <- vdem %>%
  pivot_longer(all_of(present_tags), names_to = "tag", values_to = "value") %>%
  filter(!is.na(value)) %>%
  mutate(
    iso3  = factor(iso3),
    tag   = factor(tag, levels = present_tags),
    year  = as.integer(year),
    value = round(value, 4)
  ) %>%
  arrange(tag, iso3, year)

message("Long rows: ", format(nrow(long), big.mark = ","))

out_parquet <- "apps/country-profile/public/vdem_explorer.parquet"
write_parquet(
  long,
  out_parquet,
  compression = "snappy",
  use_dictionary = TRUE,
  write_statistics = TRUE
)
message("Wrote ", out_parquet,
        " (", format(file.info(out_parquet)$size / 1024 / 1024,
                     digits = 3), " MB)")

# -- Indicator registry ------------------------------------------------------
categories <- codebook %>% count(category, sort = TRUE) %>% pull(category)

indicators <- pmap(codebook, function(tag, name, category, vartype,
                                     question, description, responses, scale,
                                     ...) {
  list(
    tag         = unbox(tag),
    name        = unbox(name),
    category    = unbox(category),
    vartype     = unbox(vartype),
    question    = if (is.na(question))    NA else unbox(question),
    description = if (is.na(description)) NA else unbox(description),
    responses   = if (is.na(responses))   NA else unbox(responses),
    scale       = if (is.na(scale))       NA else unbox(scale)
  )
})

write_json(
  list(
    start_year = unbox(START_YEAR),
    categories = categories,
    indicators = indicators
  ),
  "apps/country-profile/public/vdem_indicators.json",
  auto_unbox = FALSE, pretty = TRUE, na = "null"
)

message("Wrote vdem_indicators.json with ", nrow(codebook), " indicators in ",
        length(categories), " categories.")
