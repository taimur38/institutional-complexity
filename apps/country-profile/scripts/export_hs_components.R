#!/usr/bin/env Rscript
# Export Hanson & Sigman (2021) component indicators for the country-profile app.
#
# Source: notes/literature/hanson-sigman-replication/HansonSigman_source.dta
# (Harvard Dataverse DOI 10.7910/DVN/IFZXQX, CC0). 21 indicators organised
# into the three dimensions H&S theorise — extractive, coercive, administrative.
# Coverage 1960-2015.
#
# Ships one file per country with all 21 series, plus a meta file describing
# the three dimensions, their indicators, and the default pick for each.

suppressMessages({
  library(haven)
  library(dplyr)
  library(purrr)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

SRC <- "notes/literature/hanson-sigman-replication/HansonSigman_source.dta"
OUT_DIR <- "apps/country-profile/public/hs_components"
META_PATH <- "apps/country-profile/public/hs_components_meta.json"

# -- Indicator catalogue -----------------------------------------------------
# Defaults are picked for broad temporal coverage and intuitive interpretation.
indicators <- list(
  extractive = list(
    label = "Extractive capacity",
    description = paste(
      "The state's ability to extract resources — chiefly tax revenue — from",
      "society. Motivated by Tilly (1990), Levi (1988), and Besley & Persson",
      "(2009). H&S follow Lieberman (2002) in distinguishing administratively",
      "complex tax bases from easy-to-collect ones."
    ),
    default = "taxrev_gdp",
    items = list(
      list(tag = "taxrev_gdp", label = "Total tax revenue (% of GDP)",
           source = "ICTD / IMF / OECD",
           description = "Overall extractive effort. Excludes nontax revenues (resource rents, trade taxes don't require the enforcement and information apparatus that taxation of domestic activity does)."),
      list(tag = "tax_inc_tax", label = "Income taxes (% of total taxes)",
           source = "ICTD / IMF",
           description = "Reliance on administratively complex tax bases — income, property, consumption — that require record-keeping and a sophisticated bureaucracy. Higher share signals stronger administrative reach as well as extractive depth."),
      list(tag = "tax_trade_tax", label = "Trade taxes (% of total taxes)",
           source = "ICTD / IMF",
           description = "Inverse signal — trade taxes are cheap to collect at the border. Heavy reliance on them indicates the state lacks the apparatus to tax domestic activity. Enters the H&S model with a negative loading."),
      list(tag = "irai_erm", label = "Efficiency of revenue mobilization (CPIA)",
           source = "World Bank CPIA",
           description = "Expert-coded rating of how efficiently the state mobilizes revenue. IDA-eligible countries only, 2005-2015."),
      list(tag = "v2stfisccap", label = "Fiscal capacity (V-Dem)",
           source = "V-Dem v9",
           description = "Expert assessment of the extent to which the state can fund itself through taxes of greater administrative complexity. A direct V-Dem analogue of the Lieberman logic.")
    )
  ),
  coercive = list(
    label = "Coercive capacity",
    description = paste(
      "The state's monopoly on legitimate violence and the institutionalization",
      "of the means of coercion. H&S pair quantitative personnel/spending",
      "measures with expert-coded indicators of order and 'stateness',",
      "warning that raw force size can signal either capacity or insecurity."
    ),
    default = "milexpercap",
    items = list(
      list(tag = "milexpercap", label = "Military expenditures per capita (log)",
           source = "SIPRI / COW",
           description = "Logged USD per capita. Resources devoted to military capability — logging dampens influence of oil-state and war-economy outliers."),
      list(tag = "milpercap", label = "Military personnel per 1,000 (log)",
           source = "COW / WDI",
           description = "Logged size of armed forces relative to population. Long-standing Correlates-of-War measure of coercive reach."),
      list(tag = "policecap", label = "Police officers per 1,000 (log)",
           source = "UN Office on Drugs and Crime",
           description = "Logged size of the internal security apparatus. Distinguishes domestic order maintenance from external defense."),
      list(tag = "bti_mo", label = "Monopoly on use of force (BTI)",
           source = "Bertelsmann Transformation Index",
           description = "BTI expert rating of the degree to which the state actually holds a monopoly on legitimate violence across its territory. Note: the H&S replication column ranges 0–18 (a non-standard rescaling); for the canonical BTI 1–10 series see the BTI Monopoly on Use of Force entry under Explore related indicators."),
      list(tag = "v2terr", label = "State authority over territory",
           source = "V-Dem v9",
           description = "Percentage of territory controlled by the central state, converted via the inverse cumulative normal. Captures 'stateness' in the territorial sense."),
      list(tag = "StateHist50s", label = "State antiquity index",
           source = "Bockstette, Chanda & Putterman (2002), extended by H&S",
           description = "Historical depth of state institutions on a given territory (50-year discounting). Components: presence of a state, share of territory controlled, sovereignty. Long-run capacity to hold territory as the deepest indicator of institutionalized coercion.")
    )
  ),
  administrative = list(
    label = "Administrative capacity",
    description = paste(
      "The state's ability to formulate policy, deliver services, keep records,",
      "and execute decisions through a professional bureaucracy. H&S pull in",
      "component-level expert ratings plus a distinct cluster of",
      "information-gathering indicators that capture the state's ability to",
      "see its own population."
    ),
    default = "v2clrspct",
    items = list(
      list(tag = "v2clrspct", label = "Rigorous and impartial public administration",
           source = "V-Dem v9",
           description = "Expert survey ratings of whether public officials respect the law rigorously and impartially — the rule-of-law-in-administration dimension of Weberian bureaucracy."),
      list(tag = "AdmEffic", label = "Administrative efficiency (Adelman & Morris)",
           source = "Adelman & Morris (1967)",
           description = "Early cross-national rating of administrative apparatus efficiency. Covers only 1960-62 but is one of very few series reaching that far back."),
      list(tag = "weberian", label = "Weberianness (Rauch & Evans)",
           source = "Rauch & Evans (2000)",
           description = "Index of meritocratic recruitment and career stability in the core economic bureaucracy. The operational benchmark for 'Weberian' bureaucracies. 34 countries, 1970-90."),
      list(tag = "irai_qbfm", label = "Quality of budgetary & financial management (CPIA)",
           source = "World Bank CPIA",
           description = "Expert rating of technical competence of fiscal management. IDA-eligible countries only, 2005-2015."),
      list(tag = "irai_qpa", label = "Quality of public administration (CPIA)",
           source = "World Bank CPIA",
           description = "Expert rating of broader public-administration capability — policy coordination, civil service, service delivery. IDA-eligible countries only."),
      list(tag = "censusfreq", label = "Census frequency",
           source = "UN census records",
           description = "Annualised frequency of national censuses, computed by looking forward and backward from each year to the nearest census records. Higher values = more frequent censuses = stronger information capacity. Range in the data ≈ 0.1–2.4."),
      list(tag = "infcap", label = "Information capacity (Brambor et al.)",
           source = "Brambor et al. (2020)",
           description = "Composite of whether the state operates a statistical agency, civil register, and population register, plus its capabilities for producing a census and a statistical yearbook."),
      list(tag = "wbstat", label = "Statistical capacity (World Bank)",
           source = "World Bank",
           description = "Extensiveness of national statistical systems. 2004-2015.")
    )
  )
)

all_tags <- unname(unlist(lapply(indicators, function(d) sapply(d$items, function(i) i$tag))))

# -- Load --------------------------------------------------------------------
message("Loading H&S replication source from ", SRC)
df <- haven::read_dta(SRC)

missing <- setdiff(all_tags, names(df))
if (length(missing) > 0) stop("Missing columns: ", paste(missing, collapse = ", "))

# Constrain to ISO3s present in countries.json so the app's selectors match.
target_isos <- fromJSON("apps/country-profile/public/countries.json")$iso3

d <- df %>%
  filter(year >= 1960, iso3 %in% target_isos) %>%
  select(iso3, year, all_of(all_tags)) %>%
  mutate(year = as.integer(year))

# H&S stores tax variables as proportions (0-1). Rescale to percent so the
# tooltip reads as "18.2" (% of GDP) rather than "0.182" — matches the label
# the user sees in the dropdown.
for (col in intersect(c("taxrev_gdp", "tax_inc_tax", "tax_trade_tax"), names(d))) {
  d[[col]] <- d[[col]] * 100
}

# -- Per-country files -------------------------------------------------------
dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)

# Clear stale files so removals propagate.
old <- list.files(OUT_DIR, pattern = "\\.json$", full.names = TRUE)
if (length(old) > 0) file.remove(old)

written <- 0
for (iso in sort(unique(d$iso3))) {
  ci <- d %>% filter(iso3 == iso) %>% arrange(year)
  series <- list()
  for (tag in all_tags) {
    vals <- ci[[tag]]
    keep <- !is.na(vals)
    if (!any(keep)) next
    yrs <- as.integer(ci$year[keep])
    vs  <- round(as.numeric(vals[keep]), 4)
    series[[tag]] <- pmap(
      list(year = yrs, value = vs),
      function(year, value) list(year = unbox(year), value = unbox(value))
    )
  }
  if (length(series) == 0) next
  write_json(
    list(iso3 = unbox(iso), series = series),
    file.path(OUT_DIR, paste0(iso, ".json")),
    auto_unbox = FALSE, na = "null"
  )
  written <- written + 1
}

# -- Meta --------------------------------------------------------------------
build_indicator_list <- function(items) {
  lapply(items, function(i) {
    list(
      tag         = unbox(i$tag),
      label       = unbox(i$label),
      source      = unbox(i$source),
      description = unbox(i$description)
    )
  })
}

meta <- list(
  source     = unbox("Hanson & Sigman (2021), replication archive (Harvard Dataverse DOI 10.7910/DVN/IFZXQX, CC0)"),
  citation   = unbox(paste(
    "Hanson, Jonathan K. and Rachel Sigman. 2021.",
    "'Leviathan's Latent Dimensions: Measuring State Capacity for",
    "Comparative Political Research.'",
    "Journal of Politics 83(4): 1495–1510."
  )),
  start_year = unbox(min(d$year, na.rm = TRUE)),
  end_year   = unbox(max(d$year, na.rm = TRUE)),
  dimensions = list(
    extractive = list(
      key         = unbox("extractive"),
      label       = unbox(indicators$extractive$label),
      description = unbox(indicators$extractive$description),
      default     = unbox(indicators$extractive$default),
      indicators  = build_indicator_list(indicators$extractive$items)
    ),
    coercive = list(
      key         = unbox("coercive"),
      label       = unbox(indicators$coercive$label),
      description = unbox(indicators$coercive$description),
      default     = unbox(indicators$coercive$default),
      indicators  = build_indicator_list(indicators$coercive$items)
    ),
    administrative = list(
      key         = unbox("administrative"),
      label       = unbox(indicators$administrative$label),
      description = unbox(indicators$administrative$description),
      default     = unbox(indicators$administrative$default),
      indicators  = build_indicator_list(indicators$administrative$items)
    )
  )
)

write_json(meta, META_PATH, auto_unbox = FALSE, pretty = TRUE)
message("Wrote ", written, " per-country files to ", OUT_DIR)
message("Wrote meta: ", META_PATH)
