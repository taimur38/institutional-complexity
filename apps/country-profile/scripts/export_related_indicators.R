#!/usr/bin/env Rscript
# Export "related capacity indicators" for the country-profile app.
#
# These are governance / quality-of-government series that Hanson & Sigman
# used for convergent-validity checks in Table 3 of their paper, plus a few
# adjacent ones with strong coverage. Pulled from macro_df where present
# (longer time series, current through ~2023) and supplemented with the
# H&S replication source for five indicators not in macro_df.
#
# Output:
#   apps/country-profile/public/related_indicators/{ISO3}.json  (per country)
#   apps/country-profile/public/related_indicators_meta.json    (catalogue)

suppressMessages({
  library(haven)
  library(arrow)
  library(dplyr)
  library(purrr)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

MACRO     <- "~/dev/shared-data/growth-lab/glmacro_master_alldata.parquet"
HS_SRC    <- "notes/literature/hanson-sigman-replication/HansonSigman_source.dta"
OUT_DIR   <- "apps/country-profile/public/related_indicators"
META_PATH <- "apps/country-profile/public/related_indicators_meta.json"

# -- Catalogue ---------------------------------------------------------------
# `source_file` selects which underlying file the `column` comes from.
# `direction` lets the UI flag inverse-signal indicators (FSI, Myers, …).
# Descriptions below lead with the canonical concept and add scale/coverage
# context. The macro_df data-dictionary description (from
# macro_data_dictionary.csv) for each column is captured in `dict_label` so
# the UI can show authoritative provenance alongside the longer explanation.
indicators <- list(
  # --- Worldwide Governance Indicators (1996-2023) ------------------------
  list(tag = "wgi_gee", source_file = "macro", column = "wgi_gee",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Government effectiveness",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Government Effectiveness, Estimate",
       description = "Captures perceptions of public-service quality, civil-service independence from political pressure, and the quality and credibility of policy formulation and implementation. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),
  list(tag = "wgi_rle", source_file = "macro", column = "wgi_rle",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Rule of law",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Rule of Law, Estimate",
       description = "Captures perceptions of contract enforcement, property rights, policing, and the courts, plus the likelihood of crime and violence. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),
  list(tag = "wgi_rqe", source_file = "macro", column = "wgi_rqe",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Regulatory quality",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Regulatory Quality, Estimate",
       description = "Captures perceptions of the government's ability to formulate and implement sound regulations that promote private-sector development. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),
  list(tag = "wgi_cce", source_file = "macro", column = "wgi_cce",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Control of corruption",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Control of Corruption, Estimate",
       description = "Captures perceptions of the extent to which public power is exercised for private gain — petty and grand corruption plus state capture by elites. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),
  list(tag = "wgi_vae", source_file = "macro", column = "wgi_vae",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Voice and accountability",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Voice and Accountability, Estimate",
       description = "Captures perceptions of citizens' ability to participate in selecting their government, plus freedoms of expression, association, and media. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),
  list(tag = "wgi_pve", source_file = "macro", column = "wgi_pve",
       group = "Worldwide Governance Indicators (WGI)",
       label = "Political stability and absence of violence",
       source = "Kaufmann, Kraay & Mastruzzi (World Bank)",
       dict_label = "Political Stability and Absence of Violence/Terrorism, Estimate",
       description = "Captures perceptions of the likelihood that the government will be destabilised or overthrown by unconstitutional or violent means, including politically-motivated violence and terrorism. Standard-normal score, approximately -2.5 to +2.5.",
       direction = "positive"),

  # --- World Bank CPIA (2005-2023, IDA-eligible only) ---------------------
  list(tag = "cpia_pubs", source_file = "macro", column = "wdi_iq_cpa_pubs_xq",
       group = "World Bank CPIA (IDA countries only)",
       label = "Public sector management & institutions (cluster avg)",
       source = "World Bank CPIA",
       dict_label = "CPIA public sector management and institutions cluster average (1=low to 6=high)",
       description = "Cluster average of the five CPIA public-sector criteria: property rights and rule-based governance; budgetary and financial management; revenue mobilisation efficiency; quality of public administration; transparency, accountability and corruption. IDA-eligible (low-income) countries only.",
       direction = "positive"),
  list(tag = "cpia_irai", source_file = "macro", column = "wdi_iq_cpa_irai_xq",
       group = "World Bank CPIA (IDA countries only)",
       label = "IDA Resource Allocation Index (CPIA overall)",
       source = "World Bank CPIA",
       dict_label = "IDA resource allocation index (1=low to 6=high)",
       description = "The overall CPIA composite: average of 16 criteria across economic management, structural policies, social inclusion/equity, and public-sector management. IDA uses it to allocate concessional lending. IDA-eligible countries only.",
       direction = "positive"),

  # --- Bertelsmann Transformation Index (biennial, 2006-2022) -------------
  list(tag = "bti_st", source_file = "macro", column = "qog_bti_st",
       group = "Bertelsmann Transformation Index (BTI)",
       label = "Stateness",
       source = "Bertelsmann Stiftung",
       dict_label = "Stateness",
       description = "BTI composite of monopoly on use of force, state identity, freedom from religious-dogma interference, and basic administration. 1 (low) to 10 (high). Developing and transitioning countries only.",
       direction = "positive"),
  list(tag = "bti_rol", source_file = "macro", column = "qog_bti_rol",
       group = "Bertelsmann Transformation Index (BTI)",
       label = "Rule of law",
       source = "Bertelsmann Stiftung",
       dict_label = "Rule of Law",
       description = "BTI sub-index of separation of powers, judicial independence, prosecution of office abuse, and civil rights. 1 (low) to 10 (high).",
       direction = "positive"),
  list(tag = "bti_gp", source_file = "macro", column = "qog_bti_gp",
       group = "Bertelsmann Transformation Index (BTI)",
       label = "Governance performance (management index)",
       source = "Bertelsmann Stiftung",
       dict_label = "Governance Performance",
       description = "BTI Management Index: steering capability, resource efficiency, consensus-building, and international cooperation. 1 (low) to 10 (high).",
       direction = "positive"),
  list(tag = "bti_ba", source_file = "macro", column = "qog_bti_ba",
       group = "Bertelsmann Transformation Index (BTI)",
       label = "Basic administration",
       source = "Bertelsmann Stiftung",
       dict_label = "Basic Administration",
       description = "BTI sub-component of stateness — whether functioning administrative structures exist throughout the country to provide basic public services. 1 (low) to 10 (high).",
       direction = "positive"),
  list(tag = "bti_muf", source_file = "macro", column = "qog_bti_muf",
       group = "Bertelsmann Transformation Index (BTI)",
       label = "Monopoly on use of force",
       source = "Bertelsmann Stiftung",
       dict_label = "Monopoly on the Use of Force",
       description = "BTI sub-component of stateness — degree to which the state's monopoly on legitimate violence is established nation-wide. 1 (low) to 10 (high).",
       direction = "positive"),

  # --- Cross-source composites --------------------------------------------
  list(tag = "ti_cpi", source_file = "macro", column = "qog_ti_cpi",
       group = "Cross-source composites",
       label = "Corruption Perceptions Index",
       source = "Transparency International",
       dict_label = "Corruption Perceptions Index",
       description = "Composite of expert and business surveys on perceived public-sector corruption. Pre-2012 the scale was 0–10; from 2012 onwards 0–100 (higher = cleaner). The 2011/2012 jump is an instrument change, not a behavioural change.",
       direction = "positive"),
  list(tag = "icrg_qog", source_file = "macro", column = "qog_icrg_qog",
       group = "Cross-source composites",
       label = "ICRG quality of government composite",
       source = "PRS Group ICRG via QoG Institute",
       dict_label = "ICRG Indicator of Quality of Government",
       description = "Mean of three PRS International Country Risk Guide sub-indicators — corruption, law and order, and bureaucratic quality — rescaled 0–1 (higher = better). Deepest panel of any QoG composite: 1984 onwards, >5,000 country-years.",
       direction = "positive"),

  # --- H&S replication only (1960-2015) -----------------------------------
  list(tag = "qs_impar", source_file = "hs", column = "qs_impar",
       group = "Other capacity indicators",
       label = "Impartial public administration (Rothstein & Teorell)",
       source = "QoG Institute expert survey, Rothstein & Teorell (2008)",
       dict_label = "Impartial Public Administration",
       description = "Expert assessment of whether public officials apply the same procedures to similar cases regardless of who is involved. Cross-sectional QoG survey, ~50 countries, single round c. 2008.",
       direction = "positive"),
  list(tag = "hendrix_rl", source_file = "hs", column = "hendrix_rl",
       group = "Other capacity indicators",
       label = "Rational-legal state capacity (Hendrix 2010)",
       source = "Hendrix (2010), via H&S replication archive",
       dict_label = "Rational-Legal dimension of state capacity (Hendrix)",
       description = "Factor-analytic index combining bureaucratic quality and tax-composition measures to capture the rational-legal (Weberian) dimension of state capacity.",
       direction = "positive"),
  list(tag = "lnMyers", source_file = "hs", column = "lnMyers",
       group = "Other capacity indicators",
       label = "Myers age-heaping index (log)",
       source = "Lee & Zhang (2017), via H&S replication archive",
       dict_label = "log(Myers Index)",
       description = "Log of the Myers blended index of age heaping in national censuses. High values = citizens reporting ages ending in 0 or 5 = the state has little reason to know exact ages = LESS information capacity. Inverse signal.",
       direction = "negative"),
  list(tag = "ffp_publicserv", source_file = "hs", column = "Public_Services",
       group = "Other capacity indicators",
       label = "Public services indicator (FSI)",
       source = "Fund for Peace Fragile States Index, via H&S replication",
       dict_label = "Public Services Delivery score (inverted)",
       description = "FSI sub-component rating the state's failure to deliver basic public goods — water, sanitation, electricity, transport, education, health. Higher = worse delivery. Inverse signal.",
       direction = "negative"),
  list(tag = "ffp_fsi", source_file = "hs", column = "ffp_fsi",
       group = "Other capacity indicators",
       label = "Fragile States Index",
       source = "Fund for Peace, via H&S replication",
       dict_label = "Fragile States Index",
       description = "Aggregate fragility score across 12 social, economic, and political indicators (range ~18–115). Higher = more fragile. Inverse signal.",
       direction = "negative")
)

# Default pick — longest coverage and conceptually closest to the H&S aggregate.
DEFAULT_TAG <- "icrg_qog"

# -- Load --------------------------------------------------------------------
macro_cols <- unname(sapply(Filter(\(i) i$source_file == "macro", indicators),
                            \(i) i$column))
hs_cols    <- unname(sapply(Filter(\(i) i$source_file == "hs",    indicators),
                            \(i) i$column))

message("Loading macro_df (", length(macro_cols), " columns) ...")
m <- read_parquet(MACRO, col_select = c("countrycodeiso", "year", macro_cols)) |>
  rename(iso3 = countrycodeiso) |>
  mutate(year = as.integer(year)) |>
  filter(!is.na(iso3))

message("Loading H&S replication (", length(hs_cols), " columns) ...")
h <- read_dta(HS_SRC) |>
  select(iso3, year, all_of(hs_cols)) |>
  mutate(year = as.integer(year)) |>
  filter(!is.na(iso3))

target_isos <- fromJSON("apps/country-profile/public/countries.json")$iso3

merged <- full_join(m, h, by = c("iso3", "year")) |>
  filter(iso3 %in% target_isos) |>
  arrange(iso3, year)

# -- Per-country JSON files --------------------------------------------------
dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)
old <- list.files(OUT_DIR, pattern = "\\.json$", full.names = TRUE)
if (length(old) > 0) file.remove(old)

col_for_tag <- setNames(
  sapply(indicators, \(i) i$column),
  sapply(indicators, \(i) i$tag)
)

written <- 0
for (iso in sort(unique(merged$iso3))) {
  ci <- merged |> filter(iso3 == iso)
  series <- list()
  for (tag in names(col_for_tag)) {
    col <- col_for_tag[[tag]]
    if (!col %in% names(ci)) next
    vals <- ci[[col]]
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
build_item <- function(i) {
  list(
    tag         = unbox(i$tag),
    label       = unbox(i$label),
    source      = unbox(i$source),
    dict_label  = unbox(i$dict_label),
    description = unbox(i$description),
    group       = unbox(i$group),
    direction   = unbox(i$direction)
  )
}

# Preserve the order of indicators in the catalogue so the dropdown reflects
# the grouping above.
groups_in_order <- unique(sapply(indicators, \(i) i$group))

meta <- list(
  source = unbox(paste(
    "macro_df (glmacro_master_alldata.parquet, Growth Lab) for indicators",
    "with broad coverage; Hanson & Sigman (2021) replication archive",
    "(Harvard Dataverse DOI 10.7910/DVN/IFZXQX) for the five series not in",
    "macro_df."
  )),
  description = unbox(paste(
    "Capacity-adjacent indicators that did NOT enter the Hanson & Sigman",
    "latent factor. Most appeared in their Table 3 as convergent-validity",
    "checks; the rest are governance / quality-of-government indices with",
    "good coverage. The version with the broadest temporal coverage was",
    "selected for each indicator."
  )),
  default     = unbox(DEFAULT_TAG),
  groups      = as.list(groups_in_order),
  indicators  = lapply(indicators, build_item)
)
write_json(meta, META_PATH, auto_unbox = FALSE, pretty = TRUE)
message("Wrote ", written, " per-country files. Meta: ", META_PATH)
