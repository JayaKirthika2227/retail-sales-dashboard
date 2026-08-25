# AI Work Log & Candidate Submission

**Practical Case:** Product Sales Analysis — Six-Month Business Review and Action Plan  
**Role:** Retail Operations Analytics & Decision Engineering  
**Dataset:** `Product Sales Analysis.xlsx` (8,843 product-location records)  

---

## Candidate Submission Details
* **Candidate Name:** Retail Analytics Candidate
* **AI / Analysis Tools Used:** Antigravity AI Engineering Suite, Gemini 3.7, Python (pandas, numpy, openpyxl, matplotlib, seaborn, python-docx, reportlab, nbclient), Chart.js, PapaParse
* **Files Submitted:**
  1. `executive_summary.pdf` (1-page executive brief)
  2. `executive_summary.docx` (1-page editable Word document)
  3. `analysis.ipynb` (Fully executed single source of truth Jupyter notebook)
  4. `item_velocity.csv` (Standardized clean velocity & tier data backend)
  5. `visuals/` (5 exported high-resolution PNG charts: Category Performance, Pareto Curve, Velocity Distribution, Store Breakdown, Action Matrix)
  6. `dashboard/` (Interactive HTML5/JS assortment command center application)
  7. `ai_work_log.md` (Audit trail & prompt log)
* **Assumptions or Questions:**
  - *Assumption 1 (Snapshot Scope)*: The dataset is a fixed 6-month snapshot with no transaction timestamps and no beginning/ending stock-on-hand balances.
  - *Assumption 2 (Negative Sales)*: Rows with negative net sales (3 rows, -$206.29) reflect customer returns/adjustments; retained for total financial reconciliation and assigned to Dead Stock for replenishment.
  - *Assumption 3 (Margin Outliers)*: Recalculated margin percentage as `(Net Sales - COGS) / Net Sales` for positive sales rows to eliminate extreme division distortions caused by near-zero denominators.

---

## 1. System Prompts & Analytical Directives Used

### Core Directive Prompt
> "Build an end-to-end retail analytics deliverable based on `Product Sales Analysis.xlsx` as two connected artifacts sharing one source of truth without data fabrication. Establish a Jupyter notebook (`analysis.ipynb`) running top-to-bottom with full mathematical traceability, an interactive dashboard application, an executive summary brief (`executive_summary.docx` and `.pdf`), exported PNG charts, and an AI work log."

### Specific Analytical Sub-Prompts
1. **Data Ingestion & Structural Limits Audit**:
   - *"Inspect shape, dtypes, null values, and verify the structural constraints: lack of timestamp (snapshot only, not time series) and lack of inventory-on-hand (cannot compute dynamic sell-through or days-of-inventory)."*
2. **Whitespace & Accounting Anomaly Normalization**:
   - *"Trim categorical strings to merge duplicate parent categories (`Flower ` vs `Flower`, `Beverages ` vs `Beverages`). Audit negative Net Sales rows and extreme margin % outliers caused by near-zero denominators."*
3. **Category-Relative Velocity Tiering**:
   - *"Calculate quantity sold percentile ranks relative to parent categories. Define and justify explicit retail thresholds for Fast Mover, Medium Mover, Slow Mover, and Dead Stock, exporting a clean `item_velocity.csv` data contract."*
4. **Questions Q1–Q5 Formulations**:
   - *"Generate aggregations by Category, Location, Vendor (Q1); compute Pareto SKU and Vendor concentration curves alongside loss-maker audits (Q2); map items to Protect/Reprice/Promote/Reduce/Discontinue/Investigate actions (Q3); articulate missing replenishment data (Q4); and produce 5–8 quantified 30-day action items (Q5)."*
5. **Multi-Artifact Deliverables**:
   - *"Export 5 high-resolution PNG charts (`visuals/`), build a dark/light glassmorphic interactive web dashboard (`dashboard/`), compile 1-page executive brief in DOCX and PDF formats, and document all verification steps."*

---

## 2. Revisions, Discoveries & Refinements Made

| Analytical Step | Initial Observation | Discovery / Anomaly Found | AI Revision & Methodological Decision |
| :--- | :--- | :--- | :--- |
| **Category Normalization** | 17 unique parent categories | Trailing whitespace created duplicate entries (e.g. `'Flower '` vs `'Flower'`, `'CBD '` vs `'CBD'`). | Applied vector `.str.strip()` across all text columns, collapsing the catalog to 11 authoritative parent categories. |
| **Margin Outlier Handling** | Margin % column contained values down to -7999.0 (-799,900%) | Near-zero net sales denominators ($0.01 promotional sales against $80 COGS) caused extreme ratio blowouts. | Instituted explicit written rule: Recalculate Margin $ as `Net Sales - COGS` and Margin % as `Margin $ / Net Sales` (for Net Sales > 0). |
| **Dead Stock Root Cause** | Accessories department showed -13.83% net margin | SKU `Series-A-0189` in Location B had $10,250.00 COGS vs $252.51 sales, and in Location A had $7,362.50 COGS vs $129.79 sales. | Identified single-SKU accounting data entry error ($17,612.50 COGS) that single-handedly distorted department profitability; flagged for immediate priority investigation. |
| **Velocity Tiering Definition** | Fixed unit sales cutoff would penalize low-volume high-ticket categories (Concentrates/CBD) | Category unit volumes vary substantially (Beverages median = 48 vs CBD median = 4). | Switched to category-relative percentile ranking: Dead Stock ($\\le 10\\%$ or $\\le 0$ units), Slow ($10-30\\%$), Medium ($30-75\\%$), Fast ($>75\\%$). |
| **Data Gaps Transparency** | Request for replenishment strategy | Dataset lacks stock-on-hand and transaction dates. | Explicitly flagged in notebook, executive brief, and dashboard that replenishment recommendations require real-time POS and ERP on-hand feeds. |

---

## 3. Independent Mathematical & Reconciliation Checkpoints

Every figure in the notebook, executive summary, charts, and dashboard was independently reconciled against the raw spreadsheet:

```
========================================================================================
CHECKPOINT METRIC             RAW SPREADSHEET VALUE       CALCULATED VALUE    AUDIT STATUS
========================================================================================
Total Record Rows             8,843                       8,843               MATCH (100%)
Total Net Sales               $7,712,364.96               $7,712,364.96       MATCH (100%)
Total Gross Sales             $8,574,582.76               $8,574,582.76       MATCH (100%)
Total Cost of Goods (COGS)    $4,141,731.68               $4,141,731.68       MATCH (100%)
Total Margin Dollars          $3,570,633.28               $3,570,633.28       MATCH (100%)
Overall Profit Margin %       46.30%                      46.30%              MATCH (100%)
Total Quantity Sold           268,741 units               268,741 units       MATCH (100%)
Total Order Volume            228,144 orders              228,144 orders      MATCH (100%)
Fast Mover SKUs Count         -                           2,197 (62.89% $)    VERIFIED
Medium Mover SKUs Count       -                           3,388 (33.85% $)    VERIFIED
Slow Mover SKUs Count         -                           2,028 (3.25% $)     VERIFIED
Dead Stock SKUs Count         -                           1,230 ($40.4k COGS) VERIFIED
========================================================================================
```

---

## 4. Deliverable File Manifest

1. **`analysis.ipynb`**: Complete, single-source-of-truth Jupyter notebook executed top-to-bottom with rendered outputs, markdown rationale cells, aggregations, charts, and work log.
2. **`item_velocity.csv`**: Standardized, clean output dataset (8,843 rows) containing category percentiles, margin calculations, and velocity tier tags.
3. **`executive_summary.docx` & `executive_summary.pdf`**: 1-page executive brief summarizing findings, Pareto concentration, inventory actions, and governance limits.
4. **`visuals/`**: 5 high-resolution exported PNG charts:
   - `chart1_revenue_margin_by_category.png`
   - `chart2_pareto_revenue_concentration.png`
   - `chart3_velocity_tier_distribution.png`
   - `chart4_location_store_performance.png`
   - `chart5_margin_vs_velocity_quadrant.png`
5. **`dashboard/`**: Interactive web dashboard (`index.html`, `styles.css`, `app.js`, `item_velocity.csv`) with instant filtering, KPI summary panels, interactive charts, and sortable tables.
6. **`ai_work_log.md`**: This audit record.
