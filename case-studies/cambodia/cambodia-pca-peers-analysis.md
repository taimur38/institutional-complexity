# Cambodia in PCA space: a peer-by-peer breakdown

This note unpacks Cambodia's position in the V-Dem PC1–PC2 space relative to its
mainland Southeast Asian neighbours: Vietnam (VNM), Laos (LAO), Thailand (THA),
and Myanmar (MMR). The methodology mirrors the Egypt vs Pakistan exercise:
for each pair, we project each country's standardized V-Dem feature vector onto
PC1 or PC2, and decompose the gap between two countries into per-feature
contributions `(z_KHM - z_peer) × loading_PCk`. The features with the largest
absolute contributions are the substantive drivers of the pairwise gap.

For scale: across the full sample, **SD(PC1) ≈ 9.08** and **SD(PC2) ≈ 3.63**.
A 1-unit move on PC2 is meaningfully larger relative to the typical variation
than a 1-unit move on PC1.

## PC scores for the five countries

| Country | PC1 | PC2 |
|---|---:|---:|
| Myanmar (MMR) | **−17.7** | +0.51 |
| Cambodia (KHM) | −10.4 | **+0.49** |
| Laos (LAO) | −9.57 | **−6.90** |
| Vietnam (VNM) | −6.11 | **−7.51** |
| Thailand (THA) | −0.97 | +1.76 |

All five sit in the autocratic half of PC1, but the spread is wide: Myanmar
under junta rule is the most extreme on PC1, Thailand is nearly neutral, and
Cambodia / Laos / Vietnam form a middle cluster. **PC2 is where the cluster
splits sharply.** Vietnam and Laos sit deep on the "managed-state" pole;
Cambodia sits near zero; Thailand and Myanmar sit slightly positive.

Recall the PC2 axis from the main analysis: **negative PC2 = high
state-administrative capacity (cyber, regulation), more equally delivered
services, suppressed offline mobilization; positive PC2 = open contestation,
mobilization, polarization, political violence**.

---

## Cambodia vs Vietnam

- **PC1 gap (KHM − VNM): −4.27** — Cambodia is *more* autocratic on PC1.
- **PC2 gap: +8.00** — Cambodia is dramatically *more contested / less
  state-managed* on PC2.

### What's pulling Cambodia below Vietnam on PC1

Vietnam, despite being a single-party state, **scores higher on
institutional-process features** that PC1 picks up:

| Feature | KHM (z) | VNM (z) | Read |
|---|---:|---:|---|
| Election irregularities (cleaner = higher) | −1.05 | +1.06 | Vietnam's tightly controlled elections register fewer irregularities |
| EMB capacity | −0.92 | +1.38 | Vietnamese election body more capable |
| Legislature questions officials | −1.64 | +0.50 | Vietnam's National Assembly does more practical oversight |
| Freedom from political killings | −1.98 | −0.16 | Cambodia far worse on extrajudicial violence |
| Executive bribery | −1.69 | +0.33 | Cambodia much more corrupt |
| Executive oversight | −1.30 | +0.52 | Vietnam's party-state has internal oversight |
| CSO consultation | −1.88 | −0.08 | Vietnam consults civil society more (still constrained) |

Vietnam offsets some of this with **stronger party restrictions** (party ban
z = −3.10 vs Cambodia's −0.82) and tighter social-media control. But the
dominant story is that **Cambodia's institutions function less even within
its narrow autocratic envelope** — corruption, killings, and weak parliamentary
oversight are the main drivers of the PC1 gap.

### What's pushing Cambodia above Vietnam on PC2

| Feature | KHM (z) | VNM (z) | Loading | Contribution |
|---|---:|---:|---:|---:|
| Party hate speech (online) | −1.67 | +1.27 | −0.127 | +0.374 |
| Party cyber-security capacity | +0.46 | +2.80 | −0.118 | +0.274 |
| Party ban | −0.82 | −3.10 | +0.113 | +0.258 |
| Elite use of social media for offline action | +1.46 | −0.35 | +0.138 | +0.249 |
| Executive bribery | −1.69 | +0.33 | −0.114 | +0.231 |
| Educational equality | −1.25 | +0.29 | −0.147 | +0.226 |
| Government cyber-security capacity | −0.67 | +0.93 | −0.135 | +0.217 |
| Election vote buying | −1.23 | +0.63 | −0.113 | +0.209 |

This is the classic PC2 contrast in textbook form. Vietnam is a **prototypical
managed state**: very high cyber-security capacity, more equal education
provision, less open vote-buying, and tight political-party control. Cambodia
**fails to deliver the managed-state package** — weak cyber capacity, unequal
education, blatant vote-buying — but its politics simultaneously have **more
elite-driven mobilization and party-level polarization** that Vietnam has
flattened.

---

## Cambodia vs Laos

- **PC1 gap (KHM − LAO): −0.81** — essentially identical on the
  liberal-democracy axis.
- **PC2 gap: +7.39** — large.

### Cambodia and Laos on PC1 (small net gap, opposing details)

Cambodia is *worse* on judicial and legislative process features (lower-court
independence z = −1.51 vs Laos's +0.85; legislature investigates z = −1.73 vs
+0.21; high-court independence z = −1.55 vs +0.40). Laos is worse on party
restriction (party ban z = −3.02 vs Cambodia's −0.82) and on government
social-media alternatives. **The two countries' autocracies have different
internal architecture but land in the same neighbourhood on PC1.**

### What's pushing Cambodia above Laos on PC2

| Feature | KHM (z) | LAO (z) | Loading | Contribution |
|---|---:|---:|---:|---:|
| Elite use of social media for offline action | +1.46 | −1.91 | +0.138 | +0.464 |
| Online media fractionalization | −0.26 | +2.28 | −0.158 | +0.401 |
| Party hate speech | −1.67 | +1.41 | −0.127 | +0.391 |
| CSO anti-system movements | −0.14 | −1.99 | +0.178 | +0.327 |
| Average people using social media for offline action | +0.02 | −2.28 | +0.127 | +0.293 |
| Party ban | −0.82 | −3.02 | +0.113 | +0.249 |
| Political polarization (party-camp) | +0.51 | −1.14 | +0.145 | +0.240 |
| Vote buying | −1.23 | +0.90 | −0.113 | +0.240 |

Laos is the **most thoroughly managed state in this set**: top of the sample
on online-media fractionalization, near top on online hate speech and online
suppression, very low on visible elite or popular mobilization, party ban
near the floor. Cambodia has **noticeably more space for both elite and
ordinary political activity online and offline** — even though both regimes
are autocratic, Laos is the more uniformly suppressed.

---

## Cambodia vs Thailand

- **PC1 gap (KHM − THA): −9.41** — Cambodia is much more autocratic.
- **PC2 gap: −1.27** — small; Thailand is slightly more contested.

### Drivers of the PC1 gap (Cambodia far more autocratic)

This is a textbook liberal-democracy comparison. Thailand outperforms Cambodia
on legislative oversight (z = +0.92 vs −1.73), parliamentary questioning of
officials (+1.25 vs −1.64), executive oversight (+1.15 vs −1.30), high-court
compliance (+1.06 vs −1.41), legislative opposition (+1.26 vs −1.04),
free-and-fair elections (+0.48 vs −1.27), and critical media (+0.62 vs −1.14).
**Thailand's hybrid democracy still delivers core liberal-democracy
infrastructure that Cambodia's CPP-dominated system has dismantled.**

### PC2 stays close (with offsetting forces)

The PC2 gap is small but the underlying drivers are large and offsetting:

| Feature | KHM (z) | THA (z) | Loading | Contribution |
|---|---:|---:|---:|---:|
| Polarization of society (online) | +1.11 | −1.61 | −0.173 | −0.470 |
| CSO anti-system movements | −0.14 | +1.13 | +0.178 | −0.226 |
| Mobilization for democracy | −0.99 | +0.02 | +0.159 | −0.160 |
| Elite use of social media for offline action | +1.46 | +0.28 | +0.138 | +0.162 |
| Subnational civil-liberties unevenness | −0.25 | −1.68 | −0.120 | −0.173 |
| Educational equality | −1.25 | +0.09 | −0.147 | +0.196 |

Thailand has **more anti-system CSO mobilization, more democratic mobilization,
and uneven civil liberties across regions** (the deep-south insurgency, the
North/Bangkok divide). These pull Thailand's PC2 up. Cambodia has **more
elite-driven online polarization and lower educational equality** — also
pushing up on PC2 in the social-conflict direction. The two effects roughly
cancel: Cambodia and Thailand end up close on PC2 but for *very different
reasons*. Thailand's PC2 score reflects active street politics; Cambodia's
reflects elite-driven online polarization in a tightly held party system.

---

## Cambodia vs Myanmar

- **PC1 gap (KHM − MMR): +7.28** — Cambodia is *less* autocratic on PC1.
- **PC2 gap: −0.02** — virtually identical, but the resemblance is misleading.

### Drivers of the PC1 gap (Cambodia less autocratic than post-coup Myanmar)

| Feature | KHM (z) | MMR (z) |
|---|---:|---:|
| Lower chamber legislates in practice | +0.27 | −2.80 |
| Government social-media shutdowns | +0.15 | −2.31 |
| Government internet shutdowns | −0.05 | −2.38 |
| State ownership of economy | +0.80 | −1.51 |
| Particularistic vs. public goods | −0.32 | −2.88 |
| Government online-content regulation approach | +0.18 | −2.16 |
| Freedom of domestic movement (men) | −0.47 | −2.20 |
| Election violence | +0.24 | −1.73 |

These are all "the junta is doing junta things" features. Myanmar's
post-2021 military regime has **dissolved the legislature, repeatedly
shut down social media and the internet, abandoned public-goods provision,
and restricted domestic movement**. Cambodia's CPP regime — for all its
authoritarian character — preserves the formal trappings of legislature,
internet access, and movement.

### PC2 is identical for opposite reasons

This is the most striking finding. Cambodia and Myanmar sit at almost
the same point on PC2, but the underlying composition is completely
different:

| Feature | KHM (z) | MMR (z) | Loading | Contribution |
|---|---:|---:|---:|---:|
| Elite use of social media for offline action | +1.46 | −1.95 | +0.138 | +0.470 |
| Political violence | −0.04 | +2.45 | +0.172 | −0.430 |
| Polarization of society (online) | +1.11 | −1.25 | −0.173 | −0.407 |
| CSO anti-system movements | −0.14 | +2.11 | +0.178 | −0.402 |
| State authority over territory | −0.21 | −3.29 | −0.107 | −0.330 |
| Online media fractionalization | −0.26 | +1.59 | −0.158 | +0.292 |
| Political polarization (party-camp) | +0.51 | +2.32 | +0.145 | −0.262 |
| Mobilization for democracy | −0.99 | +0.36 | +0.159 | −0.214 |

**Myanmar's middle-of-PC2 score is the result of a tug-of-war.** Active civil
war drives violence, anti-system CSO, mobilization, and territorial loss into
the stratosphere — these are all PC2-positive. But the junta has simultaneously
shut down elite mobilization and social-media discourse — pulling PC2 negative.
The two effects cancel.

**Cambodia's middle-of-PC2 score is the result of a quiet equilibrium.** Mid
levels of elite-driven online polarization, low political violence, intact
state territorial control, and managed civil society. Nothing extreme in
either direction.

PC2 alone cannot distinguish "managed soft-authoritarian" Cambodia from
"collapsing state amid civil war" Myanmar — they look the same on this axis.
Higher PCs would be needed to separate them.

---

## Synthesis: where does Cambodia sit?

Three facts about Cambodia's PC position emerge from these pairwise breakdowns:

1. **Cambodia is the closest neighbour to Laos on PC1** but sits 7 units to
   Laos's right on PC2. Both are deeply autocratic, but Laos has built a
   more uniformly managed state; Cambodia's autocracy is **looser, with
   visible elite-led online polarization and weaker administrative delivery**.

2. **Cambodia underperforms Vietnam on the institutional-process features
   PC1 picks up** — corruption, executive oversight, election integrity,
   judicial independence — but its political space is more open in the
   sense PC2 measures: more elite mobilization, more party polarization,
   weaker cyber capacity. Vietnam's autocracy is **competent and managed**;
   Cambodia's is **personalist and noisier**.

3. **Cambodia and Myanmar both sit near zero on PC2 for opposite reasons.**
   Myanmar is a country in active civil war whose mobilized resistance and
   state collapse cancel out the junta's suppression. Cambodia is a quiet
   single-party regime whose lack of state-management capacity is offset by
   its lack of large-scale mobilization. PC2 is doing real work on most of
   the sample but cannot distinguish these very different cases.

If the goal is to characterize Cambodia's institutional position relative to
neighbours: **Cambodia is autocratic-loose**, distinct from Laos and Vietnam's
autocratic-managed style, and from Myanmar's autocratic-collapsed regime.
On PC1 Cambodia underperforms its neighbours' institutional infrastructure;
on PC2 it sits between the managed-state pole (LAO, VNM) and the contested-
state pole (THA), pulled toward the latter mainly by elite-driven online
polarization rather than by mass mobilization.

## Cambodia's institutional peers (data-driven)

The geographic peer set was a stipulation. Once we have the PCA in hand we
can ask the data: **which countries does Cambodia actually resemble
institutionally?** We compute Euclidean distance from Cambodia to every other
country in the first K principal components (which weights each PC by its
variance), and examine the top of the ranking under several K values.

Variance explained by the first few PCs:

| K | Cumulative variance |
|---:|---:|
| 2 | 51.7% |
| 5 | 61.2% |
| 10 | 69.0% |
| 20 | 77.8% |

### Top 10 institutional peers (using first 10 PCs, ≈69% of variance)

| Rank | ISO3 | Country | Distance | PC1 | PC2 |
|---:|---|---|---:|---:|---:|
| 1 | BDI | Burundi | 5.48 | −10.8 | +1.67 |
| 2 | EGY | Egypt | 7.63 | −9.68 | −2.65 |
| 3 | ETH | Ethiopia | 7.81 | −7.46 | +0.31 |
| 4 | ZWE | Zimbabwe | 8.16 | −6.82 | +1.81 |
| 5 | COG | Republic of the Congo | 8.22 | −8.89 | +1.54 |
| 6 | DJI | Djibouti | 8.27 | −8.41 | −1.40 |
| 7 | RUS | Russia | 8.40 | −11.0 | −3.23 |
| 8 | UGA | Uganda | 8.59 | −6.66 | +0.74 |
| 9 | UZB | Uzbekistan | 8.63 | −8.94 | −4.58 |
| 10 | KAZ | Kazakhstan | 8.74 | −6.08 | −3.54 |

### Robustness across choices of K

| Peer | K=2 rank | K=5 rank | K=10 rank | K=20 rank |
|---|---:|---:|---:|---:|
| Burundi (BDI) | **1** | **1** | **1** | **1** |
| Egypt (EGY) | 11 | 4 | 2 | 7 |
| Republic of the Congo (COG) | 5 | 6 | 5 | 2 |
| Zimbabwe (ZWE) | — | 10 | 4 | 3 |
| Uganda (UGA) | 14 | — | 8 | 4 |
| Djibouti (DJI) | 9 | 11 | 6 | 5 |
| Iran (IRN) | 3 | 2 | 14 | 14 |
| Bahrain (BHR) | 4 | 3 | — | — |
| Eswatini (SWZ) | 2 | 8 | — | — |

**Burundi is Cambodia's institutional twin under every choice of K** — robust
to changes in how much variance you choose to keep. The broader peer set is
remarkably consistent across K: a mix of **sub-Saharan competitive autocracies**
(Burundi, Republic of the Congo, Zimbabwe, Uganda, Djibouti, Ethiopia) with
**Middle Eastern monarchies / theocratic autocracies** (Iran, Bahrain) and
**Egypt + post-Soviet personalist autocracies** (Russia, Uzbekistan,
Kazakhstan) at the next ring.

### Where do the geographic peers rank?

Vietnam, Laos, Thailand, and Myanmar are not in the institutional top tier:

| Geographic peer | K=2 rank | K=5 rank | K=10 rank | K=20 rank |
|---|---:|---:|---:|---:|
| Laos (LAO) | 48 | 41 | **27** | 24 |
| Vietnam (VNM) | 62 | 51 | 33 | **19** |
| Myanmar (MMR) | 47 | 37 | 34 | 45 |
| Thailand (THA) | 66 | 55 | 51 | 43 |

Even at K=20 — pulling in 78% of the total variance — none of Cambodia's
mainland Southeast Asian neighbours crack the top 15. **Cambodia is
institutionally a sub-Saharan competitive autocracy and a Gulf-style
personalist state, not a Mekong managed-party state.**

### Why the geographic peers diverge

The peer-by-peer breakdown above already showed why:

- **Vietnam and Laos** sit deep in the "managed-state" pole of PC2 — Cambodia
  fails to deliver the administrative-capacity package that defines them.
- **Thailand** is much closer to neutral on PC1 — Cambodia is far more
  autocratic.
- **Myanmar** is far more extreme on PC1 (post-coup junta) and has a very
  different PC2 composition (active civil war).

Burundi, by contrast, matches Cambodia on the *combination* of PC1 (~−10:
heavily autocratic) and PC2 (~+1.7: slight contestation, weak managed-state
features) — and presumably on the higher PCs too, since it stays at rank 1
through K=20. Both have hereditary-leaning personalist regimes (Hun family,
Ndayishimiye/CNDD-FDD), weak administrative state, controlled but not
suppressed civil-society space, low political-violence levels relative to
their PC1 position, and middling territorial control.

### What this implies

If the question is "what countries should Cambodia be benchmarked against
when thinking about institutional reform, fiscal capacity, or service
delivery?", **the geographic answer is misleading.** The institutional peer
set sits in sub-Saharan Africa and the Middle East. This has implications
for which historical reform trajectories are informative, which donor
modalities are likely to translate, and which outcome benchmarks are
realistic.

## Caveats

- All comparisons are on a **single-year cross-section**. Myanmar's position
  is heavily shaped by the 2021 coup; Thailand's by the 2014 coup and
  subsequent partial restoration. Time-series analysis would tell a different
  story.
- V-Dem features are highly collinear, so the per-feature decompositions can
  attribute the same underlying institutional pattern to several correlated
  indicators. Read the top-contributor lists as themes rather than precise
  rankings.
- **Choice of K matters.** Using only the first 2 PCs throws out 48% of
  variance and makes peer rankings unstable past the top 4–5. Using all PCs
  recovers the original feature-space distance, which is dominated by
  high-variance indicators. K = 10 is a defensible middle ground (~69%
  variance) but is a judgment call. Burundi being #1 across every K is the
  robust finding; mid-table peers shift more.
- "Geographic peers" is a descriptive choice; ASEAN integration and
  shared post-colonial trajectories are real, but Cambodia, Vietnam, Laos
  arguably share more common history than Cambodia and Myanmar.
- These are descriptive projections. No causal claims about why countries
  occupy the positions they do.
