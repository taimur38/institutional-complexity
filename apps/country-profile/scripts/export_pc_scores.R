#!/usr/bin/env Rscript
# Export PC1-PC3 country-year scores from the pooled-panel PCA for the
# country-profile app.
#
# Outputs:
#   apps/country-profile/public/pc_scores.parquet
#       Wide format: iso3 (dict-encoded), year (int16), pc1, pc2, pc3,
#       pc4, pc5 (float32). Snappy compression. Read in-browser via
#       hyparquet — same pattern as vdem_explorer.parquet.
#   apps/country-profile/public/pc_meta.json
#       Display metadata for each PC: short label, longer description,
#       pole-meaning prose, share of total panel variance explained.
#       Hand-written prose in this script — keeping it next to the data
#       export so refining the wording doesn't require touching React.
#
# Sign convention sanity-check: confirmed in the source PCA fit that the
# stored scores already match our prose convention (positive PC1 = liberal
# democracy, positive PC2 = state encompassment, positive PC3 = organised
# mobilisational politics). No sign flip applied here.

suppressMessages({
  library(tidyverse)
  library(arrow)
  library(countrycode)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

# Reuse the V-Dem -> ISO3 mapping rules from export_bdm_series.R.
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
      "Republic of Vietnam" = NA_character_,
      "Vietnam, Democratic Republic of" = NA_character_,
      "Yemen, People's Republic of" = NA_character_,
      "South Yemen" = NA_character_,
      "Zanzibar" = NA_character_
    )
  )
}

target_isos <- fromJSON("apps/country-profile/public/countries.json")$iso3

message("Loading PC scores…")
scores <- read_csv("outputs/pooled_pca/country_year_pc_scores.csv",
                   show_col_types = FALSE)

message("Loading PCA fit for variance shares…")
pca <- readRDS("outputs/pooled_pca/pca_pool.rds")
var_exp <- pca$sdev^2 / sum(pca$sdev^2)

panel <- scores %>%
  mutate(iso3 = fix_iso(country_name)) %>%
  filter(!is.na(iso3), iso3 %in% target_isos) %>%
  transmute(
    iso3 = factor(iso3, levels = sort(unique(iso3))),
    year = as.integer(year),
    pc1  = round(PC1, 4),
    pc2  = round(PC2, 4),
    pc3  = round(PC3, 4),
    pc4  = round(PC4, 4),
    pc5  = round(PC5, 4)
  ) %>%
  arrange(iso3, year)

message("Country-year rows: ", format(nrow(panel), big.mark = ","))
message("Distinct ISO3s:    ", length(unique(panel$iso3)))
message("Year range:        ", min(panel$year), "-", max(panel$year))

out_parquet <- "apps/country-profile/public/pc_scores.parquet"
write_parquet(
  panel,
  out_parquet,
  compression = "snappy",
  use_dictionary = TRUE,
  write_statistics = TRUE
)
message("Wrote ", out_parquet,
        " (", format(file.info(out_parquet)$size / 1024,
                     digits = 4), " KB)")

# -- Display metadata --------------------------------------------------------
# Prose for each PC is condensed from the takeaways in
# analyses/pooled-panel-pca.Rmd — the per-PC interpretive sections that
# emerged from the audit-table + blind-subagent process.

components <- list(
  list(
    key            = unbox("pc1"),
    name           = unbox("Liberal democracy"),
    var_explained  = unbox(round(var_exp[1], 4)),
    short          = unbox(paste0(
      "Whether political life runs by liberal-democratic norms ",
      "(rights, free press, rule of law, broad consultation) or by a ",
      "state-controlled, leader-centric model. The dominant axis V-Dem ",
      "was built to measure."
    )),
    positive_pole  = unbox(paste0(
      "Liberal democracy: free expression and free press, autonomous ",
      "electoral management, peaceful assembly, no civil-society ",
      "repression, freedom from torture, transparent laws with ",
      "predictable enforcement, broad consultation in deliberation."
    )),
    negative_pole  = unbox(paste0(
      "Personalist / ideological autocracy with a state-controlled ",
      "information environment: state-owned media, control of ",
      "entertainment, person-of-the-leader and ideological executive ",
      "legitimation, state-administered mass organisations, autocratic ",
      "mobilisation."
    ))
  ),
  list(
    key            = unbox("pc2"),
    name           = unbox("State encompassment"),
    var_explained  = unbox(round(var_exp[2], 4)),
    short          = unbox(paste0(
      "Where the state-society line sits, holding regime type fixed. ",
      "Captures whether the state penetrates society uniformly or ",
      "whether non-state actors carry visible weight."
    )),
    positive_pole  = unbox(paste0(
      "State encompasses society: equal delivery of education, health, ",
      "and public services across income, region, gender, and group; ",
      "uniform subnational administration; clean everyday politics; ",
      "*and* state ownership of the broadcast / economic / civil-society ",
      "sphere (state media, party gating, controlled CSOs). One ",
      "infrastructural reach, both surfaces."
    )),
    negative_pole  = unbox(paste0(
      "Society encompasses the state: private economy, autonomous ",
      "media, independent universities, dense plural CSOs, judicial ",
      "review constraining the executive --- alongside political ",
      "violence by non-state actors and anti-system mobilisation. ",
      "Unifying thread: non-state actors having weight, whether ",
      "constitutional or contentious."
    ))
  ),
  list(
    key            = unbox("pc3"),
    name           = unbox("Programmatic vs personalist rule"),
    var_explained  = unbox(round(var_exp[3], 4)),
    short          = unbox(paste0(
      "How politics is organised, holding regime type and stateness ",
      "fixed. Captures whether rule is conducted through institutions ",
      "and mobilisational machinery or through a person and their ",
      "clients. Note: the positive pole is agnostic to regime type --- ",
      "Scandinavian democracies and one-party mass-mobilisational ",
      "autocracies sit on the same side."
    )),
    positive_pole  = unbox(paste0(
      "Organised programmatic politics: parties with permanent local ",
      "branches and national organisations, mass mobilisation (whether ",
      "pro-democratic or state-orchestrated), patriotic / civic ",
      "socialisation in schools, performance-based regime legitimation, ",
      "gender inclusion in public life, executive embedded in ",
      "legislative process."
    )),
    negative_pole  = unbox(paste0(
      "Personalist neopatrimonial rule: head of government appoints ",
      "and dismisses cabinet at will, dissolves the legislature, ",
      "wields un-overridable veto; pervasive corruption across ",
      "executive / legislative / judicial / public-sector branches; ",
      "elections marked by fraud and intimidation."
    ))
  )
)

out_meta <- "apps/country-profile/public/pc_meta.json"
write_json(
  list(
    source         = unbox("outputs/pooled_pca/country_year_pc_scores.csv"),
    panel_window   = c(min(panel$year), max(panel$year)),
    n_country_years = unbox(nrow(panel)),
    n_features     = unbox(length(pca$indicators)),
    components     = components
  ),
  out_meta,
  pretty = TRUE,
  na = "null"
)
message("Wrote ", out_meta)
