import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = openpyxl.load_workbook("Ashadi_Jewellers_Labour_Costing_System.xlsx")

# Palettes
NAVY = "0A192F"
GOLD = "D4AF37"
GOLD_LIGHT = "FFF9E6"
HEADER_GRAY = "1E293B"
BORDER_THIN = Side(border_style="thin", color="CBD5E1")
cell_border = Border(left=BORDER_THIN, right=BORDER_THIN, top=BORDER_THIN, bottom=BORDER_THIN)
header_border = Border(left=BORDER_THIN, right=BORDER_THIN, top=BORDER_THIN, bottom=BORDER_THIN)

font_title = Font(name="Calibri", size=15, bold=True, color="FFFFFF")
font_sub = Font(name="Calibri", size=10, italic=True, color="E2E8F0")
font_sec = Font(name="Calibri", size=12, bold=True, color="0A192F")
font_tbl_hdr = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
font_data = Font(name="Calibri", size=10, color="000000")
font_bold = Font(name="Calibri", size=10, bold=True, color="000000")

fill_title = PatternFill(start_color="0A192F", end_color="0A192F", fill_type="solid")
fill_hdr_navy = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
fill_hdr_gold = PatternFill(start_color="D4AF37", end_color="D4AF37", fill_type="solid")
fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
fill_kpi = PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid")

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

# -------------------------------------------------------------
# 1. ADD SHEET: Executive_Monthly_Report
# -------------------------------------------------------------
if "Executive_Monthly_Report" in wb.sheetnames:
    del wb["Executive_Monthly_Report"]

ws_rep = wb.create_sheet("Executive_Monthly_Report", 1)
ws_rep.views.sheetView[0].showGridLines = True

# Title banner
ws_rep.merge_cells("A1:J1")
ws_rep["A1"] = "ASHADI JEWELLERS — EXECUTIVE MONTH-END LABOUR COST & PRODUCTION REPORT"
ws_rep["A1"].font = font_title
ws_rep["A1"].fill = fill_title
ws_rep["A1"].alignment = align_center
ws_rep.row_dimensions[1].height = 36

ws_rep.merge_cells("A2:J2")
ws_rep["A2"] = "Management Audit for Managing Director / Owner • Reporting Month: November 2026 (26 Working Days • 63 Active Benches)"
ws_rep["A2"].font = font_sub
ws_rep["A2"].fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
ws_rep["A2"].alignment = align_center
ws_rep.row_dimensions[2].height = 20

# Section 1: Executive KPI Cards
ws_rep["B4"] = "EXECUTIVE MONTHLY KPI SNAPSHOT"
ws_rep["B4"].font = font_sec

kpis = [
    ("Gross Plant Capacity", 19656.0, "hrs", "63 benches × 26 days × 12h"),
    ("Craftsmen Leaves Deducted", 192.0, "hrs", "Approved employee absences"),
    ("Net Available Shift Hours", 19464.0, "hrs", "Gross hours minus leaves"),
    ("Assumed (Est.) Hours Budgeted", 2820.0, "hrs", "Standard SMT order budgets"),
    ("Actual Working Hours Logged", 3190.0, "hrs", "Shopfloor clock time recorded"),
    ("Net Hours Variance", 370.0, "hrs (+13.1%)", "Over-budget time gap"),
    ("Total Monthly Direct Labour Cost", 2184350.0, "LKR", "SMT piece-rate + bonuses"),
    ("Average Gold Scrap Loss", 3.12, "%", "Target ceiling: < 3.5%")
]

row = 5
for label, val, unit, desc in kpis:
    ws_rep.cell(row=row, column=2, value=label).font = font_bold
    ws_rep.cell(row=row, column=2).fill = fill_kpi
    ws_rep.cell(row=row, column=2).border = cell_border
    
    c_val = ws_rep.cell(row=row, column=3, value=val)
    c_val.font = Font(name="Calibri", size=11, bold=True, color="0A192F")
    c_val.alignment = align_right
    c_val.fill = fill_kpi
    c_val.border = cell_border
    if unit == "LKR":
        c_val.number_format = "Rs. #,##0.00"
    elif unit == "%":
        c_val.number_format = "0.00\"%\""
    elif "hrs" in unit:
        c_val.number_format = "#,##0.0"

    c_unit = ws_rep.cell(row=row, column=4, value=unit)
    c_unit.font = font_data
    c_unit.alignment = align_left
    c_unit.border = cell_border

    c_desc = ws_rep.cell(row=row, column=5, value=desc)
    c_desc.font = Font(name="Calibri", size=9, italic=True, color="64748B")
    c_desc.border = cell_border
    row += 1

# Section 2: 4-Channel Attribution Matrix
row += 2
ws_rep.cell(row=row, column=2, value="THE 4-CHANNEL PRODUCTION & COST ATTRIBUTION MATRIX").font = font_sec
row += 1

ch_headers = [
    "Demand Channel Code", "Channel / Destination Description", "Monthly Orders", 
    "Finished Pieces", "Assumed (Est.) Hrs", "Actual Hours Taken", "Hours Variance (+/-)", 
    "Direct Labour Value (LKR)", "Gold Scrap %"
]
for col_idx, h in enumerate(ch_headers, 2):
    c = ws_rep.cell(row=row, column=col_idx, value=h)
    c.font = font_tbl_hdr
    c.fill = fill_hdr_navy
    c.alignment = align_center
    c.border = header_border
ws_rep.row_dimensions[row].height = 24

ch_data = [
    ("EXTERNAL_SHOP", "External Retail Jewellers (Swarna, Rathna, Lalitha B2B)", 12, 462, 987.0, 1148.4, 161.4, 742680.0, 3.42),
    ("OWN_SHOWROOM", "Ashadi Branch Showrooms (Colombo, Kandy, Kurunegala)", 14, 502, 1071.6, 1244.1, 172.5, 851896.0, 3.18),
    ("FACTORY_STOCK", "Central Factory Buffer Stock (Plain rings, chains)", 6, 264, 479.4, 510.4, 31.0, 349496.0, 2.65),
    ("OWNER_SPECIAL", "Owner & Chairman VIP Private Bespoke Commissions", 4, 92, 282.0, 287.1, 5.1, 240278.0, 3.25)
]

for item in ch_data:
    row += 1
    for c_idx, val in enumerate(item, 2):
        c = ws_rep.cell(row=row, column=c_idx, value=val)
        c.font = font_data
        c.border = cell_border
        if c_idx == 2:
            c.font = font_bold
        elif c_idx in [4, 5]:
            c.alignment = align_center
            c.number_format = "#,##0"
        elif c_idx in [6, 7, 8]:
            c.alignment = align_right
            c.number_format = "#,##0.0"
        elif c_idx == 9:
            c.alignment = align_right
            c.font = font_bold
            c.number_format = "Rs. #,##0.00"
        elif c_idx == 10:
            c.alignment = align_center
            c.number_format = "0.00\"%\""

# -------------------------------------------------------------
# 2. ADD SHEET: Craftsmen_Leaves
# -------------------------------------------------------------
if "Craftsmen_Leaves" in wb.sheetnames:
    del wb["Craftsmen_Leaves"]

ws_lv = wb.create_sheet("Craftsmen_Leaves", 6)
ws_lv.views.sheetView[0].showGridLines = True

ws_lv.merge_cells("A1:I1")
ws_lv["A1"] = "ASHADI JEWELLERS — CRAFTSMAN ATTENDANCE & DAILY LEAVE REGISTER"
ws_lv["A1"].font = font_title
ws_lv["A1"].fill = fill_title
ws_lv["A1"].alignment = align_center
ws_lv.row_dimensions[1].height = 36

ws_lv.merge_cells("A2:I2")
ws_lv["A2"] = "Dynamic Plant Capacity Deduction Log • Subtracts Absences from Daily 756h Gross Benchmark"
ws_lv["A2"].font = font_sub
ws_lv["A2"].fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
ws_lv["A2"].alignment = align_center

lv_headers = [
    "Date", "Leave ID", "Craftsman ID", "Craftsman Name", "Employ No.", 
    "Leave Category", "Hours Deducted", "Reason / Description", "Approval Status"
]

row = 4
for col_idx, h in enumerate(lv_headers, 2):
    c = ws_lv.cell(row=row, column=col_idx, value=h)
    c.font = font_tbl_hdr
    c.fill = fill_hdr_navy
    c.alignment = align_center
    c.border = header_border
ws_lv.row_dimensions[row].height = 24

sample_leaves = [
    ("2026-11-06", "LV-001", "C005", "Mr. B.A.CHAMINDA KUMARA", "1283", "Full Day Leave (12h)", 12.0, "Approved Casual Leave - Family function", "Approved"),
    ("2026-11-06", "LV-002", "C011", "Mr. D.M.S.P.DISSANAYAKE", "1282", "Medical Leave (12h)", 12.0, "Optometry medical checkup & eye rest", "Approved"),
    ("2026-11-06", "LV-003", "C020", "Mr. J.M.S.JAYASINGHE", "1247", "Half Day Leave (6h)", 6.0, "Half day banking / personal administration", "Approved"),
    ("2026-11-02", "LV-004", "C003", "Mr. A.G.SURESH SANDANUWAN", "1268", "Full Day Leave (12h)", 12.0, "Personal leave", "Approved"),
    ("2026-11-03", "LV-005", "C018", "Mr. H.R.M.R.S.B.HERATH", "1256", "Medical Leave (12h)", 12.0, "Sick leave - fever", "Approved"),
    ("2026-11-04", "LV-006", "C032", "Mr. L.G.B.SAMPATH", "1298", "Full Day Leave (12h)", 12.0, "Religious observance", "Approved"),
    ("2026-11-05", "LV-007", "C049", "Mr. S.P.S.WIJEWARDANE", "1258", "Full Day Leave (12h)", 12.0, "Family event", "Approved")
]

for item in sample_leaves:
    row += 1
    for c_idx, val in enumerate(item, 2):
        c = ws_lv.cell(row=row, column=c_idx, value=val)
        c.font = font_data
        c.border = cell_border
        if c_idx == 2:
            c.alignment = align_center
        elif c_idx in [3, 4, 6]:
            c.alignment = align_center
        elif c_idx == 8:
            c.alignment = align_right
            c.font = font_bold
            c.number_format = "#,##0.0\" hrs\""
        elif c_idx == 10:
            c.alignment = align_center
            c.font = font_bold

# Set column widths for new sheets
for sheet in [ws_rep, ws_lv]:
    for col in sheet.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.row in [1, 2]:
                continue
            val_str = str(cell.value or "")
            max_len = max(max_len, len(val_str))
        sheet.column_dimensions[col_letter].width = max(max_len + 4, 14)

wb.save("Ashadi_Jewellers_Labour_Costing_System.xlsx")
print("Successfully added Executive_Monthly_Report and Craftsmen_Leaves sheets to Excel!")
