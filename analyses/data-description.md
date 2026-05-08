# Data description

This document describes the institutional / governance datasets used across
the institutional-complexity project. Macro-economic series (PWT, WDI value
added, employment, exports) are documented elsewhere; this doc focuses on the
two main institutional sources: V-Dem and the Quality of Governance (QoG)
bundle inside the macro dataset.

## V-Dem (Varieties of Democracy)

V-Dem organises variables by a two-letter topic code that follows the `v2`
prefix.

### Topic-coded raw indicators (`v2XX*`)

| Prefix | Domain |
|---|---|
| `v2el` | **Elections** — EMB autonomy, voter registry, vote buying, intimidation, turnout, suffrage |
| `v2ps` | **Political parties** — barriers to formation, cohesion, opposition autonomy, institutionalization |
| `v2cl` | **Civil liberties** — physical integrity, movement, property, forced labor, religion, rule of law |
| `v2ju` | **Judiciary** — high/lower court independence, compliance, corruption, packing, purges |
| `v2lg` | **Legislature** — oversight, committees, opposition powers, investigative function |
| `v2me` | **Media** — censorship, self-censorship, bias, journalist harassment |
| `v2ex` | **Executive** — appointment powers, bribery, embezzlement, constitutional respect |
| `v2dl` | **Deliberation** — quality of elite justification, consultation, common-good framing |
| `v2cs` | **Civil society** — CSO entry/exit, repression, consultation, women's participation |
| `v2ca` | **Academic & cultural** — academic freedom, mass mobilization, polarization |
| `v2pe` | **Political equality** — power distribution by gender / social group / SES / geography |
| `v2st` | **State capacity** — bureaucratic merit, fiscal capacity, ruler interference |
| `v2sv` | **Sovereignty** — autonomy from foreign control, territorial control |
| `v2sm` | **Social movements & digital** — social media use, shutdowns, disinformation |
| `v2dd` | **Direct democracy** — referendum / plebiscite / initiative provisions and use |
| `v2ed` | **Education** — curriculum centralization, ideology, teacher autonomy |
| `v2re` | **Regime** — support/opposition groups, regime duration, type, end |

### High-level composite indices (`v2x_*`)

- **Five democracy models:** `v2x_polyarchy` (electoral), `v2x_libdem` (liberal), `v2x_partipdem` (participatory), `v2x_delibdem` (deliberative), `v2x_egaldem` (egalitarian)
- **Component indices:** `v2x_liberal`, `v2x_egal`, `v2x_partip`, `v2xdl_delib`
- **Accountability:** `v2x_veracc`, `v2x_horacc`, `v2x_diagacc`, `v2x_accountability`
- **Corruption:** `v2x_corr`, `v2x_execorr`, `v2x_pubcorr`
- **Rights / liberties:** `v2xcl_rol`, `v2x_civlib`, `v2x_clphy`, `v2x_clpol`, `v2x_clpriv`
- **Gender:** `v2x_gender`, `v2x_gencl`, `v2x_gencs`, `v2x_genpp`
- **Elections:** `v2xel_frefair`, `v2x_EDcomp_thick`
- **Regime classification:** `v2x_regime` (4 categories: closed autocracy → liberal democracy)

### Variable types (cross-cut)

- **C** — expert-coded components (raw institutional measures, ~302)
- **D** — derived indices / composites (~169)
- **A** — aggregate structural facts: suffrage %, seat shares, term lengths (~196)
- **E** — external data piggy-backed in: GDP/cap, Polity, Freedom House, population (~61)

For analysis, **C**-types are the building blocks and **D**-types are
ready-made summaries.

## Quality of Governance (QoG)

QoG enters the project through the macro dataset
(`data/shared-data/growth-lab/glmacro_master_alldata.parquet`) under the
`qog_` prefix. Unlike V-Dem, which is a single coding effort, QoG is a
**meta-aggregator** that re-packages many upstream institutional datasets
under one schema. Variable names follow `qog_<source>_<indicator>`.

### Bundled source compilations

| Source code | Full source |
|---|---|
| `wbgi` | World Bank Governance Indicators (WGI) — voice, stability, effectiveness, rule of law, regulatory quality, corruption control |
| `icrg` | ICRG composite Quality of Government index |
| `ti` | Transparency International CPI (with confidence intervals, old and new methodology) |
| `vdem` | V-Dem subsets — corruption, democracy indices, gender empowerment, academic freedom |
| `bti` | Bertelsmann Transformation Index — governance, democracy status, economic performance |
| `fh` | Freedom House — civil liberties, political rights, press freedom |
| `ciri` | CIRI Human Rights Data Project — physical integrity, empowerment rights |
| `p` | Polity IV/V — regime type, durability, combined polity score |
| `wjp` | World Justice Project Rule of Law Index |
| `sgi` | Sustainable Governance Indicators |
| `iiag` | Ibrahim Index of African Governance |
| `oecd` | OECD re-packages — government expenditure structure, FDI, labor, health |
| `eu` | EU / Eurostat — demographics, employment, education, health infrastructure |
| `gpi` | Global Peace Index |
| `rsf` | Reporters Without Borders Press Freedom Index |
| `gcb` | Global Corruption Barometer — citizen-level bribe experience and perception |

### Thematic categories

- **Corruption and control of corruption** — TI CPI, ICRG QoG, WGI corruption, V-Dem corruption subindices, GCB bribery incidence (~20 variables)
- **Rule of law and judiciary** — WJP rule of law (civil, criminal, regulatory enforcement), CIRI judicial independence, WGI rule of law (~25)
- **Democracy and political institutions** — Polity, Freedom House, BMR dichotomous democracy, V-Dem electoral/liberal/egalitarian indices, BTI democracy status, Vanhanen index (~40)
- **Elections and electoral systems** — NELDA, Gallagher-Mitchell electoral system data, IDEA voter turnout, DPI, party-system variables (~50)
- **Government effectiveness and public administration** — WGI government effectiveness, BTI basic administration, SGI governance performance, OECD government production costs (~15)
- **Human rights** — CIRI physical integrity, empowerment index, women's rights subindices, Freedom House civil liberties (~20)
- **Public-sector employment** — WWBI (World Bank public sector employment shares, wage ratios, education composition of public workforce) (~30)
- **Media freedom** — Freedom House press freedom, RSF index, CIRI speech (~10)
- **Political economy and conflict** — UCDP conflict types, Global Peace Index, political terror scale, arms exports/imports (~15)
- **Fiscal and government finance** (OECD/EU subset) — government expenditure by COFOG function, debt, deficit, social expenditure (~40)

### Coverage notes

QoG variables span from the 1940s (Polity) to the mid-2020s, but most
governance-perception indices (TI CPI, WGI, WJP) only start in the
1990s-2000s. Country coverage is near-universal for WGI / Polity / FH but
narrower for the OECD- and EU-specific sub-bundles. The WWBI public
employment variables are limited to developing and emerging economies with
survey data.

### V-Dem vs QoG — when to use which

- Use **V-Dem** directly when you need fine-grained institutional
  components (e.g., judicial independence, EMB autonomy, civil-society
  repression) for variable selection in a PCA, country-space, or trajectory
  analysis. V-Dem gives you the raw expert-coded `C` variables.
- Use **QoG** when you need a single composite index from a recognised
  source (WGI, ICRG, Polity, Freedom House) for cross-source comparison or
  for joining with macro series under one schema. QoG also bundles
  fiscal / public-sector data (OECD, WWBI, EU) that V-Dem does not cover.
