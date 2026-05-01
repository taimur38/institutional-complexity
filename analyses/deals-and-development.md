# Deals and Development workstream

Mapping V-Dem and Gothenburg QoG indicators to the Pritchett–Sen–Werker
(2018, *Deals and Development*, OUP) stakeholder typology, then scoring
countries on how strongly their institutions reflect each stakeholder's
preferred policy bundle.

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
country *gets*. We are deliberately treating realised institutional
outcomes as **revealed bargaining power**: a country whose institutions
score high on transparent rules + contract enforcement + public-goods
spending and low on exclusivity is one where the magician/workhorse
coalition has been winning; a country with the inverse profile is one
where powerbrokers/rentiers have. This is the load-bearing assumption
of the whole exercise; it should be stated explicitly in any write-up.

## Indicator mapping

V-Dem tags refer to the raw V-Dem dataset at
`data/shared-data/vdem/vdem.parquet` (codebook in
`vdem_codebook.parquet`). `qog_vdem_*` and `wgi_*` columns are pre-loaded
in `macro_df` via the QoG dataset.

### Axis 1 — Transparent rules
- **v2cltrnslw** — Transparent laws with predictable enforcement (verbatim match)
- **v2x_rule** — Rule of law index
- **v2clrspct** — Rigorous and impartial public administration
- QoG: `wgi_rqe`, `wgi_rle`, `qog_wjp_regul_enforc`, `qog_wjp_overall`

### Axis 2 — Common infrastructure
V-Dem doesn't really capture infra stocks; one fiscal proxy plus WDI:
- **v2dlencmps** — Particularistic vs. public-goods spending (high = public-goods budget mix)
- WDI: `wdi_eg_elc_accs_zs` (electricity), `wdi_sh_h2o_basw_zs` (water), `wdi_se_sec_enrr` (secondary enrolment), `pwt_hc` (human capital)
- QoG: `qog_wef_qoi` (transport infra quality), `qog_iiag_inf` (Africa only)

### Axis 3 — Specialized infrastructure
No clean V-Dem proxy. Capability/outcome side:
- `wdi_lp_lpi_infr_xq` (logistics infra quality), `wdi_is_shp_gcnw_xq` (port connectivity)
- `wdi_gb_xpd_rsdv_gd_zs` (R&D), `wdi_tx_val_tech_mf_zs` (high-tech exports)
- `atl_sitc_eci`, `atl_sitc_coi` (capability proxies)

### Axis 4 — Contract enforcement
V-Dem judiciary battery is the cleanest fit:
- **v2clprpty** — Property rights
- **v2juncind** / **v2juhcind** — Lower / high court independence
- **v2juhccomp** — Government compliance with high-court rulings
- **v2jucorrdc** — Judicial bribery (reverse-coded)
- **v2juaccnt** — Judicial accountability
- QoG: `qog_wjp_civ_just`, `qog_wjp_cj_ef_enf`, `qog_fi_legprop`, `qog_prp_prp`

### Axis 5 — Subsidies / clientelism
V-Dem is the best-in-class source here:
- **v2xnp_client** — Clientelism Index (raw V-Dem; not loaded as `qog_vdem_*`)
- **v2dlencmps** — Particularistic vs. public-goods spending (reverse-codes "subsidies-as-clientelism")
- **v2psprlnks** — Party linkages (programmatic vs. clientelistic)
- **v2elvotbuy** — Vote buying
- QoG / fiscal: `qog_vdem_excrptps`, `wdi_gc_xpn_trft_zs` (subsidies+transfers, % of expense)

### Axis 6 — Exclusivity / barriers to entry
V-Dem captures the political face; QoG captures the regulatory face:
- **v2x_neopat** — Neopatrimonial Rule (cleanest "powerbroker world" composite)
- **v2regsupgroups** — Regime support groups (useful for *identifying* the dominant stakeholder, not just measuring exclusivity)
- **v2psparban**, **v2psoppaut** — Party ban, opposition autonomy
- QoG: `qog_fi_reg` (Fraser business/credit/labor regulation), `qog_bti_mo` (organisation of market & competition), `wdi_ic_frm_cmpu_zs` (firms competing against unregistered competitors)

## Plan: country-level scoring (design "a")

1. Pull the indicators above into a country-by-indicator matrix for the
   most recent year with broad coverage (likely 2022).
2. Within each of the 6 axes, z-score indicators globally and average
   them into a single 0–1 axis score per country (after rank- or
   percentile-normalising so the average isn't distorted by outliers).
   Reverse-code where higher = worse (e.g. neopatrimonialism, vote
   buying).
3. Build the 6-dim country profile vector and the 4 stakeholder
   preference vectors from Table 1.1 (binary: x → 1, blank → 0).
4. Score each country on cosine similarity to each stakeholder
   preference vector. The 4 similarities are interpretable as "how
   much does country C's institutional bundle look like the world a
   {magician|workhorse|rentier|powerbroker} would build."
5. Optionally renormalise the 4 scores to sum to 1 to read them as a
   stakeholder share — explicit caveat that this is a similarity-based
   approximation, not a direct measure of who actually holds power.
6. Rank countries within each stakeholder type to find archetypal
   examples. Spot-check against PSW's per-country rents-space estimates
   (Liberia, Bangladesh, Cambodia, Ghana, India, Malawi, Malaysia,
   Rwanda, Thailand, Uganda) which are listed in the OUP book chapters.

Output: a country × {magician, workhorse, rentier, powerbroker}
similarity matrix, plus the underlying 6-axis country profile.

## On NMF / archetype analysis (the "design b" alternative)

Both are unsupervised dimension-reduction methods that give more
interpretable factors than PCA when the data is non-negative or you
want a "shares-of-types" interpretation.

- **NMF (non-negative matrix factorisation):** factorise the
  country × axis matrix `M ≈ W × H`, with `W` (country × k) and `H`
  (k × axis) both constrained to be non-negative. Each row of `H` is a
  latent "ideal type" expressed as a non-negative loading on the 6
  axes; each row of `W` is a country's loading on the k types. With
  k = 4 you'd ask: do the four `H` rows resemble PSW's four preference
  vectors? Non-negativity is what makes the factors interpretable as
  additive types rather than the abstract orthogonal axes you get from
  PCA.

- **Archetype analysis (Cutler & Breiman 1994):** finds k extreme
  points ("archetypes") that lie on the convex hull of the data, and
  represents every country as a convex combination of those archetypes
  (weights non-negative, summing to 1). So instead of an institutional
  PCA score, you get a country's mix — e.g. "Bangladesh: 55% magician,
  30% workhorse, 10% rentier, 5% powerbroker." This maps almost
  literally onto the "stakeholder bargaining mix" interpretation
  above. Archetype analysis is more natural than NMF for that
  storyline because the weights are already a probability simplex.

Either is the *unsupervised* version of design (a): instead of
imposing PSW's preference vectors and scoring countries against them,
you let the data tell you which 4 stakeholder profiles best span the
observed institutional space and check whether they coincide with
PSW's. If they do, the typology has empirical support; if they don't,
the deviations are themselves the finding.

For now we'll build (a) first, since the goal is descriptive
country-rating rather than typology validation.
