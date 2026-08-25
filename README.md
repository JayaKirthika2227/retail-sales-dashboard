# retail-sales-dashboard
A retail sales analysis dashboard that will dynamically change the values according to the filter, with the product velocity and the dead stock filter.
# Retail Sales & Velocity Analytics Deliverable
**Six-Month Commercial Performance, Assortment Velocity & Inventory Action Plan**

An end-to-end, reproducible retail analytics deliverable built from `Product Sales Analysis.xlsx` (8,843 product-location records). Every metric traces 100% back to the source spreadsheet with zero data fabrication.

---

## 📋 Executive Overview & Highlights

* **Commercial Volume**: **$7,712,364.96 Net Sales** ($8,574,582.76 Gross Sales) across **268,741 units** and **228,144 orders**.
* **Profitability**: Healthy **46.30% Gross Profit Margin** ($3,570,633.28 gross profit).
* **Store Concentration**: **Location B** is the core commercial engine (**78.55% share**, $6.06M); **Location A** provides stable baseline volume (**20.67%**, $1.59M); **Location C** severely underperforms (**0.78%**, $60.1k across 670 SKUs).
* **Category Drivers**: **Flower** (39.39%, $3.04M), **Vape** (24.77%, $1.91M), and **Pre-Roll** (16.47%, $1.27M) generate 80%+ of revenue.
* **Pareto Concentration**: Top 20% of SKUs (1,071 items) drive **59.40% of sales**; top 10 vendors account for **40.58% ($3.13M)** of revenue.
* **Dead Stock Capital Exposure**: 1,230 SKUs (bottom 10% selling $\le 1-2$ units in 6 months) tie up **$40,413.52 in trapped COGS**.
* **Root-Cause Anomaly Solved**: The Accessories department's negative margin (-13.8%) was traced to a single data-entry error in SKU `Series-A-0189` ($17,612.50 recorded COGS vs $382.30 sales across Loc A/B). Correcting this restores the department to a healthy +35% margin.

---

## 🛠️ Required Packages & Environment Setup

### Python Environment
* **Python Version**: Python 3.9+ (Recommended: 3.10+)

Install all required dependencies with a single command:
```bash
pip install pandas numpy openpyxl matplotlib seaborn python-docx reportlab nbformat nbclient jupyter
```

### Dependency Manifest

| Package | Version Used | Purpose |
| :--- | :--- | :--- |
| **`pandas`** | `2.3.3` | Data cleaning, aggregations, and velocity calculations |
| **`numpy`** | `1.26.4` | Vector mathematics and ratio outlier handling |
| **`openpyxl`** | `3.1.5` | Excel workbook ingestion & dynamic `.xlsx` generation |
| **`matplotlib`** | `3.10.8` | High-resolution chart generation and visual evidence |
| **`seaborn`** | `0.13.2` | Statistical styling for Pareto and distribution charts |
| **`python-docx`** | `1.2.0` | 1-page executive brief generation (`.docx`) |
| **`reportlab`** | `5.0.1` | 1-page executive brief PDF compilation (`.pdf`) |
| **`nbformat` / `nbclient`** | `5.10.4` / `0.10.4` | Top-to-bottom Jupyter notebook construction & execution |

### Web Dashboard Libraries (Zero Install)
The interactive dashboard uses client-side CDNs (automatically loaded in browser):
* **`Chart.js`** (`v4.4.1`) — Interactive HTML5 Canvas visualizations
* **`PapaParse`** (`v5.4.1`) — In-memory client-side CSV parsing engine

---

## 🚀 How to Run the Deliverables

### 1. Launch the Interactive Web Dashboard
Run the built-in HTTP server from the `dashboard/` directory:
```powershell
cd "D:\Projects\AI Analysis\dashboard"
python -m http.server 8080 --bind 127.0.0.1
```
Open your browser and navigate to:  
👉 **`http://localhost:8080`** *(or `http://127.0.0.1:8080`)*

**Dashboard Capabilities**:
* Filter dynamically by **Store Location** (A, B, C), **Parent Category**, **Vendor**, and **Velocity Tier**.
* Real-time search by item name or category.
* Live-updating KPI cards (Sales, Margin %, Units, Dead Stock $).
* Interactive Chart.js charts with tooltips and responsive resizing.
* Sortable table view with color-coded tier badges and pagination.
* One-click **"Export Filtered CSV"** download button.

---

### 2. View or Rerun the Jupyter Notebook (`analysis.ipynb`)
The notebook [`analysis.ipynb`](analysis.ipynb) is pre-executed top-to-bottom with all cell outputs, markdown rules, tables, and charts visible.

* **Open Interactively**:
  ```powershell
  jupyter lab analysis.ipynb
  ```
  *(or open directly inside VS Code / Cursor / Jupyter Notebook)*
* **Re-execute Top-to-Bottom via CLI**:
  ```powershell
  jupyter nbconvert --to notebook --execute "analysis.ipynb" --output "analysis.ipynb"
  ```

---

### 3. Open the Self-Contained Excel Workbooks
* **[`Product_Sales_Analysis_Complete.xlsx`](Product_Sales_Analysis_Complete.xlsx)**: 7-sheet master workbook containing raw table (`tblSales`), clean formula table (`tblCleanSales`), velocity module (`tblVelocity`), 7 Pivot summary tables, merchandising action matrix (`tblActionMatrix`), dashboard with embedded native charts, and documentation notes.
* **[`Retail_Analytics_Interactive_Dashboard.xlsx`](Retail_Analytics_Interactive_Dashboard.xlsx)**: Interactive Excel dashboard with Data Validation dropdown filters (`D5`, `G5`, `J5`) and dynamic `SUMIFS`/`COUNTIFS` formulas.

---

## 📁 Repository Deliverable Manifest

```
├── dashboard/
│   ├── index.html                           # Modern glassmorphism dashboard UI
│   ├── styles.css                           # Dark/Light design system
│   ├── app.js                               # Real-time filtering, math & Chart.js logic
│   └── item_velocity.csv                    # Shared velocity data backend
├── visuals/
│   ├── chart1_revenue_margin_by_category.png# Category Sales vs. Margin %
│   ├── chart2_pareto_revenue_concentration.png# Pareto Lorenz Curve (SKUs vs Vendors)
│   ├── chart3_velocity_tier_distribution.png# SKU Share vs. Revenue Share by Tier
│   ├── chart4_location_store_performance.png# Store Share & Margin Health
│   └── chart5_margin_vs_velocity_quadrant.png# Strategic Action 2D Matrix
├── analysis.ipynb                           # Single Source of Truth Jupyter Notebook
├── Product_Sales_Analysis_Complete.xlsx     # 7-Sheet Master Excel Analytics File
├── Retail_Analytics_Interactive_Dashboard.xlsx # Dynamic Formula-Driven Excel Dashboard
├── executive_summary.pdf                    # 1-Page Decision-Grade Executive Brief
├── executive_summary.docx                   # Editable 1-Page Executive Brief
├── item_velocity.csv                        # Unified 8,843-row clean data contract
├── ai_work_log.md                           # AI Audit Trail & Reconciliation Checkpoints
├── Product Sales Analysis.xlsx              # Original anonymized source spreadsheet
└── README.md                                # Project documentation & run guide
```

---

## 🧠 Algorithms & Analytical Methodologies

1. **Category-Relative Quantile Ranking Algorithm**: Normalizes sales velocity within each product's parent category ($\text{Rank}(Q_i) / N_{\text{category}}$) to prevent high-volume categories from biasing low-volume categories.
2. **Decision Tree Inventory Segmentation**: Classifies catalog into **Fast Mover** (top 25%), **Medium Mover** (25%–75%), **Slow Mover** (10%–30%), and **Dead Stock** (bottom 10% / $\le 1-2$ units over 6 months).
3. **Pareto Cumulative Distribution Algorithm**: Quantifies catalog and vendor dependency curves.
4. **Robust Outlier Normalization**: Recalculates gross margin rates as $(\text{Net Sales} - \text{COGS})/\text{Net Sales}$ for positive sales to eliminate division-by-near-zero distortions.
5. **Multi-Attribute 2D Quadrant Decision Matrix**: Maps velocity and profitability into 6 operational retail actions (**Protect**, **Reprice**, **Promote**, **Clear**, **Rebalance**, **Investigate**).

---

## ⚠️ Data Limitations & Replenishment Governance

The dataset represents a fixed 6-month snapshot with two operational limitations:
1. **No Timestamps**: Demand recency, decay, and seasonality cannot be tracked directly.
2. **No On-Hand Inventory**: True sell-through rates and Days-of-Inventory (DOI) cannot be calculated without distinguishing zero demand from stockouts.

**Next Data Request**: (1) POS timestamped receipt stream, (2) Daily store-level on-hand & safety stock feeds, and (3) Supplier lead times/MOQs to operationalize automated Reorder Point (ROP) purchasing.
