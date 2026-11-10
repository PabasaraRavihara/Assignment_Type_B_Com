# Ashadi Jewellers — Labour Cost & Production Management System

An industrial engineering standard time-based production management and labour costing software platform designed specifically for **Ashadi Jewellers** (Gold Jewellery Manufacturing, Sri Lanka).

## Operational Context
- **Workforce:** 62 verified workshop craftsmen across Grade A (Masters), Grade B (Seniors), and Grade C (Juniors/Assistants).
- **Payment Method:** Standard Time-Based Piece-Rate (STPR) — converting traditional per-piece payments into objective industrial engineering values ($SMT \times R_m$).
- **Working Hours:** Normalises daily variable working hours (~8:00 AM to 8:30 PM span) into objective **Efficiency %** ($\frac{\text{Earned Standard Minutes}}{\text{Actual Working Minutes}}$) with Rs. 450 daily high-performance & quality bonuses.

---

## Deliverables in this Workspace

1. **Excel Production Workbook:**
   - [`Ashadi_Jewellers_Labour_Costing_System.xlsx`](./Ashadi_Jewellers_Labour_Costing_System.xlsx)
   - 7 interconnected sheets: `Management_Dashboard`, `Craftsmen_Directory` (62 verified craftsmen), `Design_Master`, `Operation_Master`, `Design_SMT_Routing`, `Daily_Job_Allocation`, and `Shopfloor_Time_Tracker`.
   - Regenerable at any time via `python build_ashadi_excel.py`.

2. **Full-Stack Web Application:**
   - **Frontend (`/client`):** React 19, Vite, Lucide icons, Dark Gold & Slate executive UI.
   - **Backend (`/server`):** Node.js / Express API with dual-mode data persistence (MongoDB with resilient in-memory/JSON fallback).

---

## Quick Start & Running Locally

### 1. Start Both Backend and Frontend Simultaneously
From the root directory:
```bash
npm.cmd run dev
```

Or run individually:
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm.cmd run dev

# Terminal 2: Frontend App (Port 5173)
cd client
npm.cmd run dev
```

### 2. Available Web System Views
- **Executive Dashboard:** Live factory capacity gauge (27,900 std min), plant efficiency %, total labour value, QA pass rate, and scrap loss %.
- **Craftsmen Roster (62):** Full searchable table of verified workshop employees with Employ Numbers (e.g. 1299, 1018, 536...), skill tiers, minute rates, and NVQ levels.
- **Designs & SMT Master:** Breakdown of operations for rings, bangles, bridal necklaces, and solitaire mountings with standard time calculations.
- **Daily Order Dispatch:** Daily job allocation with live time-budget enforcement (450 – 520 standard min).
- **Time & Piecework Calculator:** Log clock-in, clock-out, breaks, finished pieces, auto-calculating efficiency, piece-rate earnings, and Rs. 450 bonuses.
