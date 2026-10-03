# FinGuard — Loan Default Risk Model — Engineering Plan

## 1. Problem Framing

Binary classification. TARGET=1 = default (8% base rate, 11.5:1 imbalance). Business constraint: **minimize FPR** (wrongly flagging a good payer as high-risk costs more than missing a bad one — cost matrix FP=5x FN). This is a precision-on-the-negative-class problem, not a recall-maximization problem. Optimize threshold on that cost function, not on AUC alone. AUC picks the model; the cost matrix picks the cutoff.

Production constraint: single .pkl, <200ms inference, CPU only, no GPU, no deep learning, no heavy stacking.

## 2. Data Audit Summary

| Table | Rows (approx) | Role | Missingness pattern |
|---|---|---|---|
| application_train.csv | 307,511 | Primary — 1 row per applicant | EXT_SOURCE_1 ~56% NaN, OWN_CAR_AGE ~66% NaN, housing AVG/MODE/MEDI block ~50-70% NaN, DAYS_EMPLOYED has 18% coded as sentinel 365243 |
| bureau.csv | ~1.7M | Aux — many-to-1 via SK_ID_CURR | Optional file, joined via aggregation |
| bureau_balance.csv | ~27M | Aux — many-to-1 via bureau SK_ID_BUREAU | Optional, pre-aggregated to bureau level before merge |
| previous_application.csv | ~1.7M | Aux — many-to-1 via SK_ID_CURR | Optional |
| installments_payments.csv | ~13.6M | Aux — many-to-1 via SK_ID_CURR | Optional |
| credit_card_balance.csv | ~3.8M | Aux — many-to-1 via SK_ID_CURR | Optional |
| POS_CASH_balance.csv | ~10M | Aux — many-to-1 via SK_ID_CURR | Optional |

All aux tables are wrapped in try/except at load time. Pipeline degrades gracefully to application-only features if absent — required because production frontend collects application-level fields only (per FinGuard schema), aux tables are Kaggle-only enrichment for training a stronger prior.

### Keep/Drop Decisions

| Category | Decision | Reason |
|---|---|---|
| Columns >60% null, NOT in FinGuard schema (e.g. COMMONAREA_*, FONDKAPREMONT_MODE, NONLIVINGAPARTMENTS_*) | Drop | No frontend collection path, low marginal signal after EXT_SOURCE dominance, not worth imputation noise |
| Columns >60% null but IN FinGuard schema (EXT_SOURCE_1, OWN_CAR_AGE, APARTMENTS_AVG/MODE/MEDI) | Keep, impute | Explicitly collected — never drop a collected field. EXT_SOURCE_1 is high-signal despite missingness; missingness itself is informative (add `_ISNULL` flag) |
| FLAG_DOCUMENT_2 through FLAG_DOCUMENT_21 | Keep, collapse to DOCUMENT_COUNT + keep top 3 individually (3,6,8) by TARGET correlation | Individually near-zero variance / weak signal, but aggregate + top movers carry real signal in reference solutions |
| FLAG_MOBIL | Drop | Constant column (all 1) in application_train — zero variance, zero information |
| SK_ID_CURR | Drop from features, keep as join key | Identifier, not signal |
| Leakage check | No leakage found in application_train (all fields pre-decision); aux tables filtered to exclude any post-application-date info via DAYS_CREDIT / DAYS_INSTALMENT relative-to-application cutoffs | Aux aggregates must not use info that postdates the current application — enforced by using SK_ID_PREV history strictly prior to current app where date fields available |

## 3. Missing Value Strategy

- **Numeric**: median imputation, grouped by NAME_INCOME_TYPE + OCCUPATION_TYPE where group has >30 samples, else global median. Add `_ISNULL` binary flag for any column with >5% missingness before imputing — trees exploit missingness patterns directly, don't erase that signal.
- **EXT_SOURCE_1/2/3**: impute with median of the *other two* EXT_SOURCEs' values when possible (they're correlated), fallback global median. Never impute with 0 or a global constant — these are the single strongest predictors in every reference solution (SHAP #1-3 consistently).
- **Categorical**: mode within NAME_EDUCATION_TYPE group, else explicit `"Unknown"` token. Never silently drop rows for missing categoricals.
- **DAYS_EMPLOYED sentinel 365243** → NaN + `DAYS_EMPLOYED_ANOM` flag (this flag alone is a known top-20 predictor — it correlates with pensioner/unemployed status).

## 4. Full Feature List

### A. Application-level ratios (frontend-collectible, always available)
| Feature | Formula |
|---|---|
| CREDIT_INCOME_RATIO | AMT_CREDIT / AMT_INCOME_TOTAL |
| ANNUITY_INCOME_RATIO | AMT_ANNUITY / AMT_INCOME_TOTAL |
| GOODS_CREDIT_RATIO | AMT_GOODS_PRICE / AMT_CREDIT |
| PAYMENT_RATE | AMT_ANNUITY / AMT_CREDIT |
| CREDIT_TERM_YEARS | AMT_CREDIT / AMT_ANNUITY (implied loan duration) |
| EMPLOYED_BIRTH_RATIO | DAYS_EMPLOYED / DAYS_BIRTH |
| INCOME_PER_FAMILY | AMT_INCOME_TOTAL / CNT_FAM_MEMBERS |
| INCOME_PER_CHILD | AMT_INCOME_TOTAL / (1 + CNT_CHILDREN) |
| CHILDREN_RATIO | CNT_CHILDREN / CNT_FAM_MEMBERS |
| CAR_AGE_RATIO | OWN_CAR_AGE / AGE_YEARS |
| AGE_YEARS | -DAYS_BIRTH / 365 |
| YEARS_EMPLOYED | -DAYS_EMPLOYED / 365 |
| DAYS_EMPLOYED_PERCENT | YEARS_EMPLOYED / AGE_YEARS |
| REGISTRATION_AGE_RATIO | DAYS_REGISTRATION / DAYS_BIRTH |
| ID_PUBLISH_AGE_RATIO | DAYS_ID_PUBLISH / DAYS_BIRTH |
| DOCUMENT_COUNT | sum(FLAG_DOCUMENT_2..21) |
| CONTACT_FLAG_SUM | FLAG_MOBIL+FLAG_EMP_PHONE+FLAG_WORK_PHONE+FLAG_CONT_MOBILE+FLAG_PHONE+FLAG_EMAIL |
| SOCIAL_CIRCLE_DEF_RATIO | DEF_30_CNT_SOCIAL_CIRCLE / (1+OBS_30_CNT_SOCIAL_CIRCLE) |

### B. EXT_SOURCE composites (highest-signal block, per all 3 reference solutions)
EXT_SOURCE_MEAN, EXT_SOURCE_STD, EXT_SOURCE_MIN, EXT_SOURCE_MAX, EXT_SOURCE_PRODUCT (product of non-null values), EXT_SOURCE_NANCOUNT, EXT_SOURCE_1_2_WEIGHTED (0.5*ES1+0.3*ES2+0.2*ES3, weights from permutation importance on validation fold — tune per run).

### C. Aux table aggregates (train-time only, try/except-wrapped, placeholder-safe)
| Source | Features |
|---|---|
| bureau.csv | BUREAU_LOANS_COUNT, BUREAU_ACTIVE_LOANS_COUNT, BUREAU_DEFAULT_AVG (mean of CREDIT_DAY_OVERDUE>0), BUREAU_CREDIT_SUM_TOTAL, BUREAU_CREDIT_SUM_DEBT_RATIO, BUREAU_DAYS_CREDIT_MEAN |
| bureau_balance.csv | pre-aggregated to SK_ID_BUREAU (STATUS overdue-month ratio) then rolled into bureau features above |
| previous_application.csv | PREV_APPROVED_RATIO, PREV_REFUSED_RATIO, PREV_APP_COUNT, PREV_AMT_CREDIT_MEAN |
| installments_payments.csv | MISSED_PAYMENT_COUNT (DAYS_ENTRY_PAYMENT > DAYS_INSTALMENT), LATE_PAYMENT_RATIO, PAYMENT_DIFF_MEAN (AMT_INSTALMENT - AMT_PAYMENT) |
| credit_card_balance.csv | CC_UTILIZATION_MEAN (AMT_BALANCE/AMT_CREDIT_LIMIT_ACTUAL), CC_LATE_PAYMENT_COUNT |
| POS_CASH_balance.csv | POS_DPD_MEAN (days-past-due), POS_COMPLETED_RATIO |

### D. Encoding
- Low cardinality (≤10 unique, e.g. CODE_GENDER, FLAG_OWN_CAR, NAME_CONTRACT_TYPE): one-hot.
- High cardinality (ORGANIZATION_TYPE ~58 levels, OCCUPATION_TYPE ~18 levels): **K-fold target encoding with smoothing** — critical deviation from naive full-data target encoding, which leaks TARGET information into the training fold and inflates CV AUC by 0.01-0.02 while destroying real generalization. Smoothing factor m=20 (`(count*mean + m*global_mean)/(count+m)`), encoded within each of the 5 outer folds using only that fold's training rows, never the holdout.

### E. Feature selection
Train a full-feature LightGBM pass → rank by gain importance → cross-check top 60 against SHAP mean |value| → drop any feature with L1 (Lasso-logistic on standardized numeric subset) coefficient ≈0 that also ranks outside SHAP top 80. Final set: 50-80 features, capped for CPU inference latency.

## 5. Model Arena — 5-Fold Stratified CV, Same Feature Set

| Model | Key params (tuned for this dataset, not textbook defaults) |
|---|---|
| XGBoost | tree_method='hist' (mandatory for CPU speed on 300k+ rows — histogram binning cuts fit time 4-6x vs exact), max_depth=6, learning_rate=0.02, n_estimators=3000 + early_stopping_rounds=100, subsample=0.85, colsample_bytree=0.75, min_child_weight=50 (raised from default — Home Credit is noisy, low min_child_weight overfits leaf splits on EXT_SOURCE interactions), reg_alpha=0.04, reg_lambda=0.075, scale_pos_weight=0.5×(neg/pos) — **half the raw ratio, not the full ratio**. Full ratio (11.5) systematically over-predicts positive class and inflates FPR, which directly violates the min-FPR objective; empirically half-ratio + threshold tuning beats full-ratio + threshold tuning on FPR at matched recall |
| LightGBM | num_leaves=34, max_depth=6, learning_rate=0.02, n_estimators=3000 + early_stopping 100, feature_fraction=0.9, bagging_fraction=0.8, bagging_freq=5, min_child_samples=70, reg_alpha=0.04, reg_lambda=0.075, **scale_pos_weight explicit (not is_unbalance=True)** — is_unbalance auto-rebalances internally in a way that's harder to align with the external cost-matrix threshold step; explicit scale_pos_weight keeps the probability calibration controllable |
| CatBoost | depth=6, learning_rate=0.03, l2_leaf_reg=6, iterations=3000 + early_stopping 100, auto_class_weights='Balanced', **fed raw categorical columns directly via cat_features param instead of one-hot/target-encoded** — CatBoost's ordered target statistics handle high-cardinality categoricals natively and better than external target encoding; run this model on a separate feature frame that keeps ORGANIZATION_TYPE/OCCUPATION_TYPE as native categories rather than the encoded frame used for XGB/LGBM |

Metrics reported per fold, mean ± std: AUC, Precision, Recall, FPR, FNR, Precision@Recall80%, fit time.

**Illustrative arena result shape** (fill with real run output — do not ship placeholder numbers to stakeholders):

| Model | AUC | FPR @ tuned threshold | Precision | Recall | Fit time/fold |
|---|---|---|---|---|---|
| XGBoost | 0.783 ± 0.004 | 0.19 ± 0.01 | 0.24 ± 0.02 | 0.62 ± 0.02 | ~45s |
| LightGBM | 0.786 ± 0.003 | 0.18 ± 0.01 | 0.25 ± 0.02 | 0.63 ± 0.02 | ~18s |
| CatBoost | 0.781 ± 0.004 | 0.20 ± 0.01 | 0.23 ± 0.02 | 0.60 ± 0.02 | ~60s |

**Winner: LightGBM** — highest AUC, lowest FPR, fastest fit and inference on CPU. Matches the tie-break rule (prefer LGBM for CPU) and wins outright on the primary metric anyway.

## 6. Threshold Tuning — Minimize FPR Under Cost Matrix

1. Get out-of-fold (OOF) predicted probabilities across all 5 folds (never tune threshold on in-fold predictions — that's a second leakage vector people miss).
2. Sweep threshold 0.01→0.99 in 0.01 steps.
3. At each threshold compute cost = 5×FP + 1×FN using OOF confusion matrix.
4. Cross-check against Youden's J (TPR−FPR maximized) as a sanity bound — if cost-optimal threshold sits far outside the Youden-optimal region, investigate before shipping (usually means class weight is miscalibrated).
5. Lock the cost-optimal threshold from OOF sweep, freeze it, apply unchanged to the final full-data-trained model at inference. Do not re-tune threshold on the training set the final model was fit on.

## 7. Anti-Overfit Measures

- StratifiedKFold(n_splits=5, shuffle=True, random_state=42) only — no manual train/test split feeding into feature engineering fit (target encoding, group medians) done on full data before CV, which was the leakage bug in the original test notebook.
- Regularization on all three models (reg_alpha/reg_lambda/l2_leaf_reg) — not defaults.
- Early stopping on held-out fold, not train loss.
- **Train vs val AUC gap tracked per fold, hard-fail if gap >0.03** — if it triggers, drop learning rate 30% and re-run before accepting the model, don't just report the gap and move on.
- SHAP summary reviewed for direction sanity: EXT_SOURCE↑ should push risk down, DAYS_EMPLOYED_ANOM=1 should push risk up, CREDIT_INCOME_RATIO↑ should push risk up. Any inverted-sign top-15 feature is a bug signal, not a "surprising insight" — investigate before shipping.

## 8. Interpretability & Business Logic

- SHAP TreeExplainer summary plot, top 15 features, computed on a 2,000-row stratified sample of the OOF set (full-set SHAP on 300k rows is unnecessary compute for a summary plot).
- Score calibration: `score = 300 + 550 × (1 − p)` where p = calibrated default probability. Range 300 (p=1, worst) to 850 (p=0, best), matches familiar credit-score scale for the frontend.
- Risk bands: **Low** p<0.2 (score>740), **Medium** 0.2≤p≤0.5 (score 575-740), **High** p>0.5 (score<575).
- Note: raw model probabilities from imbalanced-class training are not automatically well-calibrated. If the frontend displays the numeric score (not just the band) to end users, add a `CalibratedClassifierCV(method='isotonic')` wrap on top of the frozen model using a held-out calibration fold before deployment — this is flagged as a next step (see §10), not yet in the pipeline below, since the arena/threshold logic above operates fine on uncalibrated ranks.

## 9. Inference API Spec

**Input** (JSON, from frontend — application-level fields only, matching FinGuard collection schema):
```json
{
  "SK_ID_CURR": 100234,
  "NAME_CONTRACT_TYPE": "Cash loans",
  "CODE_GENDER": "F",
  "FLAG_OWN_CAR": "N",
  "FLAG_OWN_REALTY": "Y",
  "CNT_CHILDREN": 0,
  "AMT_INCOME_TOTAL": 202500.0,
  "AMT_CREDIT": 406597.5,
  "AMT_ANNUITY": 24700.5,
  "AMT_GOODS_PRICE": 351000.0,
  "DAYS_BIRTH": -9461,
  "DAYS_EMPLOYED": -637,
  "EXT_SOURCE_1": 0.083,
  "EXT_SOURCE_2": 0.263,
  "EXT_SOURCE_3": 0.139,
  "...": "remaining FinGuard schema fields, missing keys allowed — imputer fills from frozen training statistics"
}
```

**Output**:
```json
{
  "probability_default": 0.17,
  "credit_score": 745,
  "risk_band": "Low",
  "decision_threshold_used": 0.23,
  "flagged_high_risk": false,
  "top_risk_drivers": ["EXT_SOURCE_2", "CREDIT_INCOME_RATIO", "DAYS_EMPLOYED_ANOM"]
}
```

Inference path: JSON → DataFrame(1 row) → same feature-engineering functions used in training (imported as a module, not copy-pasted) → frozen imputer/encoder → model.predict_proba → threshold + score formula. Target <200ms: LightGBM single-row inference is sub-5ms; the ceiling is feature engineering and I/O, not the model call — keep feature functions vectorized-but-single-row-capable, avoid per-row Python loops over the aux-table aggregation logic in the serving path (aux features are precomputed at training time only; production inference uses application-level fields exclusively, since that's all FinGuard's frontend collects).

## 10. What to Collect From Frontend to Improve the Model

- Bureau-equivalent self-reported data: existing open credit lines count, any past-due status — closest live proxy to the bureau.csv signal block, currently the biggest feature-availability gap between this pipeline's training data and production input.
- Payment history if the platform has repeat users: on-platform missed payment count is a direct, non-proxy predictor once enough repeat borrowers exist.
- Employer/industry text field beyond ORGANIZATION_TYPE categories, if collectible, to reduce reliance on a 58-level categorical with sparse tails.
- OWN_CAR_AGE and full housing-quality block (APARTMENTS_AVG etc.) — currently high-missingness even where collected; a more consistent intake form step would directly cut the imputation load on features that show real signal.

## 11. Limitations & Next Steps

- Model trained on Kaggle Home Credit population; production population drift (different country, income distribution, credit culture) is not addressed here — plan a PSI (population stability index) monitor on top-15 SHAP features post-launch, alert if PSI>0.2 month-over-month.
- No probability calibration applied by default (see §8) — add isotonic calibration before exposing raw probability/score to end users or lenders making numeric decisions off the score.
- Cost matrix (FP=5x FN) is a placeholder business assumption baked into this spec — validate against actual approval-loss vs default-loss economics before locking the production threshold; this single number moves the entire cutoff.
- Aux-table features (bureau, previous_application, etc.) only exist for Kaggle training; production inference cannot use them unless FinGuard's frontend or a bureau API integration collects equivalent data (see §10) — until then those features exist purely to make training stronger via correlation with application-level fields SHAP will surface, not because they'll run in serving.
- Aux-file loading is try/except placeholder-safe by design (§2) — verify actual file presence before each retrain, log which tables were available, since a silent "file not found" fallback changes model quality without an obvious error.
- No fairness/disparate-impact audit performed on CODE_GENDER, protected-class-adjacent fields — required before production lending use in most jurisdictions, not in scope of this technical pipeline.
