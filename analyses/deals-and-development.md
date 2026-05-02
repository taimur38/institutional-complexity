# Deals and Development workstream

Mapping V-Dem and Gothenburg QoG indicators to the three analytical
lenses of Pritchett, Sen & Werker (2018, *Deals and Development*,
OUP): the **rents space** (which stakeholder coalitions' policy
bundles are being supplied), the **deals space** (open/closed ×
ordered/disordered), and the **political settlement** (Khan 2010 —
vertical × horizontal power within the ruling coalition).

An earlier iteration of this workstream tried to compress the
rents-space read into a single stakeholder-fit score per country
(magician share, rentier share, etc.). That approach is archived in
`_archive_deals-development_stakeholder-fit.Rmd` — it overreached the
data by collapsing three orthogonal lenses into one number. The
current document treats the three reads as complementary and renders
each separately.

## The framework

Pritchett, Sen & Werker classify firms on two axes — target market
(export vs. domestic) × source of profit (regulatory rents vs. market
competition) — yielding four stakeholder types:

|                     | Export                                   | Domestic                                                       |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **Regulatory rents** | Rentiers (oil, mining, plantations)      | Powerbrokers (telco, banks, power, state-contracted construction) |
| **Market competition** | Magicians (garments, IT/BPO, tourism) | Workhorses (informal SMEs, farms, retail)                       |

Each stakeholder demands a different policy bundle. Reproducing
Table 1.1, p. 22 (an "x" = the stakeholder demands that policy):

|                  | Transp. rules | Common infra | Special. infra | Contract enf. | Subsidies | Exclusivity |
| ---------------- | :-----------: | :----------: | :------------: | :-----------: | :-------: | :---------: |
| **Magicians**    |       x       |       x      |        x       |       x       |     x     |             |
| **Workhorses**   |       x       |       x      |                |       x       |           |             |
| **Rentiers**     |               |              |        x       |       x       |     x     |      x      |
| **Powerbrokers** |               |              |                |               |           |      x      |

Pattern in plain English: magicians want ~the whole liberal bundle minus
exclusivity; powerbrokers want *only* exclusivity (and benefit from murk
on the other axes); workhorses want basic public goods + courts;
rentiers are the partial-reform outlier.

## Working assumption

PSW's matrix describes what each stakeholder *wants*, not what each
country *gets*. The **rents-space** read is built by checking which
demanded policies a country's institutions actually supply — without
committing to a single dominant stakeholder. The **deals space** and
**political settlement** are computed from independent V-Dem
composites and read alongside, not aggregated.

## Indicator mapping

V-Dem tags refer to the raw V-Dem dataset at
`data/shared-data/vdem/vdem.parquet` (codebook in
`vdem_codebook.parquet`). `qog_vdem_*` and `wgi_*` columns are pre-loaded
in `macro_df` via the QoG dataset.

The active panel uses a deliberately small, non-overlapping indicator
set. Earlier iterations included broader baskets (WGI rule-of-law,
WJP indices, neopatrimonial composites, complexity indices); we
trimmed those once it became clear they were either redundant with
their V-Dem analogues or downstream outcomes of the very thing the
axis is meant to measure.

### Axis 1 — Transparent rules
- **v2cltrnslw** — Transparent laws with predictable enforcement
  (V-Dem 0–4 ordinal: are laws clear, well publicised, coherent,
  stable, and enforced predictably).
- **v2clrspct** — Rigorous and impartial public administration (V-Dem
  0–4 ordinal: do public officials apply the law without bias,
  nepotism, or cronyism). Captures the bureaucratic-implementation
  face that `v2cltrnslw` does not.

Dropped: `v2x_rule`, `wgi_rle`, `wgi_rqe`, the WJP indices — all
broadly redundant with the two kept indicators.

### Axis 2 — Common infrastructure
- **v2dlencmps** — Particularistic vs. public-goods spending mix
  (V-Dem 0–4 ordinal; high = public-goods budget mix).
- `wdi_eg_elc_accs_zs` — share of population with electricity access.
- `wdi_sh_h2o_basw_zs` — share of population with basic drinking
  water access.

Dropped: secondary enrolment, PWT human capital, transport-infra
quality — these move us toward human capital / specialized infra
rather than universal physical-network supply.

### Axis 3 — Specialized infrastructure
No V-Dem proxy. Outcome-side indicators only:
- `wdi_lp_lpi_infr_xq` — Logistics Performance Index (infrastructure).
- `wdi_is_shp_gcnw_xq` — Liner Shipping Connectivity Index.
- `wdi_gb_xpd_rsdv_gd_zs` — R&D as % of GDP.
- `wdi_tx_val_tech_mf_zs` — high-tech exports (% manufactured exports).

Dropped: `atl_sitc_eci`, `atl_sitc_coi` — these are downstream
*outcomes* of specialized institutional support and would risk
circularity in sanity checks. Coverage on the kept WDI indicators is
patchier than on the V-Dem axes.

### Axis 4 — Contract enforcement
We confirmed via the V-Dem codebook that `v2xcl_prpty` aggregates
only the men's and women's property-rights indicators
(`v2clprptym`, `v2clprptyw`) — it does not include the judicial
battery. The judicial vars feed `v2x_jucon` / `v2x_rule` instead.
So property rights and the judicial battery are non-redundant and
both are kept:
- **v2xcl_prpty** — Property rights composite.
- **v2juncind** / **v2juhcind** — Lower / high court independence.
- **v2juhccomp** — Government compliance with high-court rulings.
- **v2jucorrdc** — Judicial bribery (high = less, no flip needed).
- **v2juaccnt** — Judicial accountability for misconduct.

### Axis 5 — Subsidies / clientelism
- **v2xnp_client** — Clientelism Index (V-Dem Bayesian composite).
- **v2dlencmps** (flipped) — particularistic-vs-public-goods spending
  mix; flipped so high = particularistic.

Dropped: `v2psprlnks` and `v2elvotbuy` are *inputs* to `v2xnp_client`,
so keeping them as separate axis components would double-count. The
flipped `v2dlencmps` is orthogonal to the composite (it's about
fiscal spending mix, not political relationships) and keeps a fiscal
face on the axis.

### Axis 6 — Exclusivity / barriers to entry
Deliberate scope choice: market-side exclusivity only.
- `qog_fi_reg` (flipped) — Fraser regulation index; flipped so high =
  more restrictive regulation.
- `qog_bti_mo` (flipped) — BTI organisation of market and competition;
  flipped so high = a more captured / less competitive market.

Dropped: `v2x_neopat`, `v2psparban`, `v2psoppaut`, `v2regsupgroups`.
This is a deliberate scope choice: PSW's exclusivity-as-rent is an
*economic*-exclusivity concept (regulatory barriers to entry,
licensing, market capture), which is what `qog_fi_reg` and
`qog_bti_mo` measure. The political face — party bans, opposition
autonomy, neopatrimonial rule — belongs to the political-settlement
side of the framework (drawn from Khan 2010), not to a stakeholder's
demand bundle, and would muddle the institutional-supply read.

## Deals-space indicators (partial — only openness)

PSW's deals-space concepts are not well-served by V-Dem. We report
what we can on openness with explicit caveats and **omit the order
axis entirely** — V-Dem has no indicator of whether deals survive
political shifts, only proxies for current rule-of-law quality.

**Openness** — action-based vs identity-based access to state-firm
deals. Two indicators:
- `v2clrspct` — rigorous and impartial public administration
  (codebook explicitly cites "nepotism, cronyism, discrimination" as
  the failure mode). High = action-based access.
- `v2dlencmps` — particularistic vs public-goods spending mix. High =
  public-goods (action-based fiscal allocation).

Dropped from earlier drafts: political-openness indicators
(`v2psoppaut`, `v2psparban`) are about who can run for office, not
who can do business with the state — they belong to settlement.
Petty corruption (`v2excrptps`) is conceptually ambiguous: it can
mean "anyone with money can transact" (open and disordered) rather
than "closed identity-based dealing", so we don't commit to a sign.

**Order** — would-be measures (`v2juhccomp`, `v2juhcind`,
`v2exrescon`) capture *current* executive discipline, not
inter-temporal durability of state-firm commitments. PSW's "ordered"
deal is one that survives political shifts; V-Dem doesn't measure
that. Use PRS ICRG contract-viability or ICSID arbitration data if
this dimension matters.

## Political-settlement indicators (vertical × horizontal)

V-Dem operationalises both axes cleanly. Three indicators per axis,
all reverse-coded so high = concentration:

**Horizontal — concentration among political groups** (high = ONE
dominant group with institutional control):
- `v2psoppaut` — opposition parties autonomy (flipped)
- `v2lgoppart` — legislature opposition oversight (flipped)
- `v2x_jucon` — judicial constraints on executive (flipped)

**Vertical — elite-mass concentration** (high = elite monopoly,
mass voice negligible):
- `v2pepwrses` — power distributed by socioeconomic position (flipped)
- `v2xeg_eqaccess` — equal access to power across groups (flipped)
- `v2cseeorgs` — CSO entry and exit, low gov control = mass voice (flipped)

The 2×2 yields four types: dominant party (high horizontal, high
vertical), vulnerable authoritarian coalition (high horizontal, low
vertical), weak dominant party (low horizontal, high vertical),
competitive clientelist (low/low).

## Country profiles

Six-to-twelve focus countries chosen to span the four political-
settlement quadrants, the four deals-space quadrants, and a range
of rents-space stakeholder satisfactions. Current set:
USA, DEU, CHN, VNM, KHM, BDI, SAU, BGD, RWA, IND, RUS, MEX.

## Resource rents as context

Total natural resource rents (% GDP), `wdi_ny_gdp_totl_rt_zs`, is
included as context for interpreting the rents-space read but is
*not* folded into any of the three composites. Latest non-NA value
since 2010 per country (so Eritrea uses 2011 data, Venezuela 2014).
