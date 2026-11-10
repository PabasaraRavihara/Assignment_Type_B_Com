import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Raw employee list provided by user (ticked=True + 63rd craftsman)
raw_ticked_craftsmen = [
    (1, "Workshop", "Mr. A.D CHANDANA", "1299"),
    (2, "Workshop", "Mr. A.G.ANURA", "1018"),
    (4, "Workshop", "Mr. A.G.SURESH SANDANUWAN", "1211"),
    (5, "Workshop", "Mr. A.M.A.MANOJ SAMPATH", "536"),
    (6, "Workshop", "Mr. A.M.N.PRADEEP KUMARA", "893"),
    (7, "Workshop", "Mr. B.A.JANAKA PRASANNA", "318"),
    (8, "Workshop", "Mr. B.A.JEEWAN MADHURANGA", "1170"),
    (9, "Workshop", "Mr. B.A.KASUN CHAMILANTHA", "22"),
    (10, "Workshop", "Mr. B.A.SAJEEWAN SUBHASH", "489"),
    (11, "Workshop", "Mr. B.A.SAMEERA IRESHANA", "30"),
    (12, "Workshop", "Mr. D.A.RAMESH MADHUSANKA", "795"),
    (13, "Workshop", "Mr. D.G.SACHINDU MADURANGA", "1302"),
    (14, "Workshop", "Mr. D.SURESH PRIYANTHA", "24"),
    (16, "Workshop", "Ms. G.G.MALKI NISANSALA", "338"),
    (18, "Workshop", "Mr. G.W.AJITH GUNATHILAKA", "1256"),
    (19, "Workshop", "Mr. H.A.SAMAN SUSANTHA", "39"),
    (20, "Workshop", "Mr. H.A.SUMEER MANJULA", "1253"),
    (21, "Workshop", "Mr. H.B.SUDHEERA CHAMILA", "615"),
    (22, "Workshop", "Mr. H.G. RASIKA RANJAN", "1194"),
    (23, "Workshop", "Mr. H.KETHAKA BAWANTHA", "1017"),
    (24, "Workshop", "Ms. H.P.SHANIKA JEEWAMALI", "600"),
    (25, "Workshop", "Mr. H.W.AKILA MADUSHAN", "1031"),
    (26, "Workshop", "Mr. I.A.C.SHRIYAN THUSHARA", "1104"),
    (28, "Workshop", "Mr. K.A.PRASANNA P.KUMARA", "847"),
    (29, "Workshop", "Mr. K.G.A.KANEESH AMILA", "449"),
    (30, "Workshop", "Mr. K.G.A.SITHMINA D WEERARATHANE", "26"),
    (31, "Workshop", "Mr. K.HARSHA NALIN", "27"),
    (32, "Workshop", "Mr. K.L.A.SACHIRA KAVINDA", "1033"),
    (33, "Workshop", "Mr. K.L.A.SANJULA MADUSHAN", "1032"),
    (34, "Workshop", "Mr. K.PRADEEP KUMARA", "35"),
    (36, "Workshop", "Mr. K.W.KAVINDA MADHUSHANKA", "1088"),
    (38, "Workshop", "Mr. L.A.GAYAN PRIYANKARA", "20"),
    (40, "Workshop", "Mr. L.EGODAGE SAMANSIRI", "1212"),
    (41, "Workshop", "Mr. L.MELAN OMESH PRASANNA", "836"),
    (43, "Workshop", "Mr. L.W.MAHINDA", "956"),
    (44, "Workshop", "Mr. M.A.A.SRILAL", "1081"),
    (45, "Workshop", "Mr. M.A.JAYANATH", "1203"),
    (46, "Workshop", "Mr. M.A.RUSHAN PRADEEP KUMAR", "1094"),
    (47, "Workshop", "Mr. M.B.MADHUSHA DILSHAN", "1102"),
    (48, "Workshop", "Mr. M.W.G.DILIP PRASANNA", "1167"),
    (49, "Workshop", "Mr. N.B.SHAMAL", "576"),
    (50, "Workshop", "Mr. P.A.RUWAN", "491"),
    (51, "Workshop", "Mr. P.OSHAN YASITHA", "505"),
    (52, "Workshop", "Mr. P.USHAN", "44"),
    (54, "Workshop", "Mr. R.G.HARINDU THEJANA", "650"),
    (55, "Workshop", "Mr. R.M.PRADEEP SANJEEWA", "460"),
    (56, "Workshop", "Mr. S.A.HASITHA MADUSHAN", "193"),
    (58, "Workshop", "Mr. T.A.HARSHA MANJULA", "1057"),
    (59, "Workshop", "Mr. T.M.ASOKA RANJITH", "1055"),
    (61, "Workshop", "Mr. U.A.INDIKA PRIYADARSHANA", "1024"),
    (64, "Workshop", "Mr. W.B.G. DINESH", "1188"),
    (65, "Workshop", "Mr. W.B.SUMESH SANKA", "1019"),
    (67, "Workshop", "Mr. W.SUPUN DANUSHKA", "28"),
    (68, "Workshop", "Mr. W.THUSHARA MAHESH", "23"),
    (69, "Workshop", "Ms.T.DIANI WASANA", "207"),
    (70, "Workshop", "AMILA", ""),
    (71, "Workshop", "ATHULA", ""),
    (72, "Workshop", "ASANKA", ""),
    (73, "Workshop", "MANULA", ""),
    (74, "Workshop", "SRIJAYALATH", ""),
    (75, "Workshop", "SACHINDU", ""),
    (76, "Workshop", "SUMITH", ""),
    (77, "Workshop", "WATAWANA", ""),
]

print(f"Total Verified Craftsmen: {len(raw_ticked_craftsmen)}")

wb = openpyxl.Workbook()
wb.remove(wb.active)

# Color Palette - Professional Gold & Slate Theme
gold_primary = "B8860B"       # Dark golden rod
gold_light = "FFF8DC"         # Cornsilk / light gold
slate_dark = "1E293B"         # Slate dark 900
slate_header = "334155"       # Slate 700
header_font_color = "FFFFFF"
border_color = "CBD5E1"
card_fill = "F8FAFC"

font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
font_subtitle = Font(name="Calibri", size=11, italic=True, color="FFFFFF")
font_section = Font(name="Calibri", size=13, bold=True, color=slate_dark)
font_header = Font(name="Calibri", size=11, bold=True, color=header_font_color)
font_bold = Font(name="Calibri", size=11, bold=True, color=slate_dark)
font_regular = Font(name="Calibri", size=11, color="000000")
font_kpi_num = Font(name="Calibri", size=18, bold=True, color=gold_primary)
font_kpi_label = Font(name="Calibri", size=10, bold=True, color="64748B")

fill_title = PatternFill(start_color=slate_dark, end_color=slate_dark, fill_type="solid")
fill_header = PatternFill(start_color=slate_header, end_color=slate_header, fill_type="solid")
fill_light_gold = PatternFill(start_color=gold_light, end_color=gold_light, fill_type="solid")
fill_kpi = PatternFill(start_color=card_fill, end_color=card_fill, fill_type="solid")
fill_zebra = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

thin_border = Border(
    left=Side(style='thin', color=border_color),
    right=Side(style='thin', color=border_color),
    top=Side(style='thin', color=border_color),
    bottom=Side(style='thin', color=border_color)
)

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

# ==========================================
# 1. OPERATION MASTER SHEET
# ==========================================
ws_op = wb.create_sheet(title="Operation_Master")
ws_op.views.sheetView[0].showGridLines = True

ws_op.merge_cells("A1:G1")
ws_op["A1"] = "ASHADI JEWELLERS — OPERATIONS & WORK STUDY MASTER"
ws_op["A1"].font = font_title
ws_op["A1"].fill = fill_title
ws_op["A1"].alignment = align_center

headers_op = ["Operation ID", "Operation Name", "Department", "Required Skill Tier", "Default Allowance %", "Standard Workstation", "NVQ Level"]
for col_num, h in enumerate(headers_op, 1):
    c = ws_op.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

ops_data = [
    ("OP-01", "Gold Melting & Ingot Casting", "Foundry / Prep", "Grade C", 0.18, "Induction Crucible Station", "NVQ L2"),
    ("OP-02", "Wire & Sheet Rolling / Sizing", "Prep", "Grade C", 0.18, "Rolling Mill & Drawbench", "NVQ L2"),
    ("OP-03", "Blank Sawing & Piercing", "Benchwork", "Grade B", 0.19, "Jeweller's Bench & Saw Frame", "NVQ L3"),
    ("OP-04", "Mandrel Ring & Bangle Forming", "Benchwork", "Grade B", 0.19, "Forming Mandrel & Mallet", "NVQ L3"),
    ("OP-05", "Precision Micro-Torch Soldering", "Benchwork", "Grade B", 0.19, "Hydro-Flux Micro Soldering", "NVQ L3"),
    ("OP-06", "Hand Filigree & Detailed Wirework", "Benchwork", "Grade A", 0.20, "Master Filigree Bench", "NVQ L4/5"),
    ("OP-07", "Bench Filing & Precision Emery Finishing", "Benchwork", "Grade B", 0.19, "Jeweller's Peg & Needle Files", "NVQ L3"),
    ("OP-08", "Micro-Prong & Pavé Gem Setting", "Stone Setting", "Grade A", 0.205, "Stereomicroscope Setting Rig", "NVQ L4/5"),
    ("OP-09", "Bezel & Channel Gem Setting", "Stone Setting", "Grade A", 0.20, "Optivisor / Setting Bench", "NVQ L4"),
    ("OP-10", "Magnetic Tumbler & Ultrasonic Degrease", "Finishing", "Grade C", 0.18, "Tumbler & Degreasing Bath", "NVQ L2"),
    ("OP-11", "High-Lustre Rouge Mop Polishing", "Finishing", "Grade C", 0.19, "Dual-Spindle Polishing Lathe", "NVQ L2"),
    ("OP-12", "Hallmarking & Final Quality Inspection", "Quality Assurance", "Grade C", 0.18, "Laser Marker & Scales", "NVQ L3"),
]

for row_idx, row in enumerate(ops_data, 4):
    for col_idx, val in enumerate(row, 1):
        c = ws_op.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_regular
        c.border = thin_border
        if col_idx in [1, 4, 7]:
            c.alignment = align_center
        elif col_idx == 5:
            c.alignment = align_right
            c.number_format = "0.0%"
        else:
            c.alignment = align_left
        if row_idx % 2 == 1:
            c.fill = fill_zebra

# ==========================================
# 2. DESIGN SMT ROUTING SHEET
# ==========================================
ws_routing = wb.create_sheet(title="Design_SMT_Routing")
ws_routing.views.sheetView[0].showGridLines = True

ws_routing.merge_cells("A1:H1")
ws_routing["A1"] = "ASHADI JEWELLERS — DESIGN SMT WORK STUDY ROUTING"
ws_routing["A1"].font = font_title
ws_routing["A1"].fill = fill_title
ws_routing["A1"].alignment = align_center

headers_routing = [
    "Design Code", "Sequence", "Operation ID", "Operation Name", 
    "Observed Time (OT min)", "Performance Rating (%)", "Allowance %", "Standard Time (ST min)"
]
for col_num, h in enumerate(headers_routing, 1):
    c = ws_routing.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

routings_data = [
    ("RNG-SMP-01", 10, "OP-01", "Gold Melting & Ingot Casting", 4.0, 100, 0.18),
    ("RNG-SMP-01", 20, "OP-02", "Wire & Sheet Rolling / Sizing", 6.0, 100, 0.18),
    ("RNG-SMP-01", 30, "OP-04", "Mandrel Ring & Bangle Forming", 10.0, 105, 0.19),
    ("RNG-SMP-01", 40, "OP-05", "Precision Micro-Torch Soldering", 5.0, 100, 0.19),
    ("RNG-SMP-01", 50, "OP-07", "Bench Filing & Precision Emery Finishing", 8.0, 100, 0.19),
    ("RNG-SMP-01", 60, "OP-11", "High-Lustre Rouge Mop Polishing", 5.0, 100, 0.19),

    ("RNG-DET-02", 10, "OP-01", "Gold Melting & Ingot Casting", 5.0, 100, 0.18),
    ("RNG-DET-02", 20, "OP-02", "Wire & Sheet Rolling / Sizing", 8.0, 100, 0.18),
    ("RNG-DET-02", 30, "OP-03", "Blank Sawing & Piercing", 15.0, 105, 0.19),
    ("RNG-DET-02", 40, "OP-04", "Mandrel Ring & Bangle Forming", 18.0, 100, 0.19),
    ("RNG-DET-02", 50, "OP-05", "Precision Micro-Torch Soldering", 12.0, 100, 0.19),
    ("RNG-DET-02", 60, "OP-06", "Hand Filigree & Detailed Wirework", 22.0, 105, 0.20),
    ("RNG-DET-02", 70, "OP-07", "Bench Filing & Precision Emery Finishing", 16.0, 95, 0.19),
    ("RNG-DET-02", 80, "OP-11", "High-Lustre Rouge Mop Polishing", 8.0, 100, 0.19),

    ("BRC-DET-01", 10, "OP-01", "Gold Melting & Ingot Casting", 8.0, 100, 0.18),
    ("BRC-DET-01", 20, "OP-02", "Wire & Sheet Rolling / Sizing", 12.0, 100, 0.18),
    ("BRC-DET-01", 30, "OP-04", "Mandrel Ring & Bangle Forming", 25.0, 105, 0.19),
    ("BRC-DET-01", 40, "OP-05", "Precision Micro-Torch Soldering", 18.0, 100, 0.19),
    ("BRC-DET-01", 50, "OP-06", "Hand Filigree & Detailed Wirework", 45.0, 110, 0.20),
    ("BRC-DET-01", 60, "OP-07", "Bench Filing & Precision Emery Finishing", 24.0, 100, 0.19),
    ("BRC-DET-01", 70, "OP-11", "High-Lustre Rouge Mop Polishing", 14.0, 100, 0.19),

    ("NCK-GLD-01", 10, "OP-01", "Gold Melting & Ingot Casting", 10.0, 100, 0.18),
    ("NCK-GLD-01", 20, "OP-02", "Wire & Sheet Rolling / Sizing", 15.0, 100, 0.18),
    ("NCK-GLD-01", 30, "OP-03", "Blank Sawing & Piercing", 30.0, 105, 0.19),
    ("NCK-GLD-01", 40, "OP-04", "Mandrel Ring & Bangle Forming", 20.0, 100, 0.19),
    ("NCK-GLD-01", 50, "OP-05", "Precision Micro-Torch Soldering", 35.0, 100, 0.19),
    ("NCK-GLD-01", 60, "OP-06", "Hand Filigree & Detailed Wirework", 55.0, 105, 0.20),
    ("NCK-GLD-01", 70, "OP-07", "Bench Filing & Precision Emery Finishing", 25.0, 95, 0.19),
    ("NCK-GLD-01", 80, "OP-11", "High-Lustre Rouge Mop Polishing", 12.0, 100, 0.19),

    ("RNG-SOL-03", 10, "OP-01", "Gold Melting & Ingot Casting", 4.0, 100, 0.18),
    ("RNG-SOL-03", 20, "OP-02", "Wire & Sheet Rolling / Sizing", 6.0, 100, 0.18),
    ("RNG-SOL-03", 30, "OP-04", "Mandrel Ring & Bangle Forming", 15.0, 105, 0.19),
    ("RNG-SOL-03", 40, "OP-05", "Precision Micro-Torch Soldering", 10.0, 100, 0.19),
    ("RNG-SOL-03", 50, "OP-08", "Micro-Prong & Pavé Gem Setting", 42.0, 110, 0.205),
    ("RNG-SOL-03", 60, "OP-07", "Bench Filing & Precision Emery Finishing", 16.0, 100, 0.19),
    ("RNG-SOL-03", 70, "OP-11", "High-Lustre Rouge Mop Polishing", 10.0, 100, 0.19),
]

for row_idx, r in enumerate(routings_data, 4):
    for col_idx, val in enumerate(r, 1):
        c = ws_routing.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_regular
        c.border = thin_border
        if col_idx in [1, 2, 3]:
            c.alignment = align_center
        elif col_idx in [5, 6, 7]:
            c.alignment = align_right
            if col_idx == 5:
                c.number_format = "#,##0.0"
            elif col_idx == 6:
                c.number_format = "0"
            elif col_idx == 7:
                c.number_format = "0.0%"
        else:
            c.alignment = align_left
        if row_idx % 2 == 1:
            c.fill = fill_zebra
            
    c_st = ws_routing.cell(row=row_idx, column=8)
    c_st.value = f"=ROUND(E{row_idx}*(F{row_idx}/100)*(1+G{row_idx}), 2)"
    c_st.font = font_bold
    c_st.alignment = align_right
    c_st.border = thin_border
    c_st.number_format = "#,##0.00"

# ==========================================
# 3. DESIGN MASTER SHEET
# ==========================================
ws_design = wb.create_sheet(title="Design_Master")
ws_design.views.sheetView[0].showGridLines = True

ws_design.merge_cells("A1:I1")
ws_design["A1"] = "ASHADI JEWELLERS — JEWELLERY DESIGN MASTER & SMT COSTING"
ws_design["A1"].font = font_title
ws_design["A1"].fill = fill_title
ws_design["A1"].alignment = align_center

headers_design = [
    "Design Code", "Design Name", "Category", "Gold Karat", 
    "Total SMT (min)", "Skill Tier Required", "Std Minute Rate (Rs.)", 
    "Standard Labour Cost (Rs.)", "Allowable Gold Loss %"
]
for col_num, h in enumerate(headers_design, 1):
    c = ws_design.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

designs_data = [
    ("RNG-SMP-01", "Simple Plain Gold Ring", "Ring", "22K", "Grade B", 0.025),
    ("RNG-DET-02", "Detailed Filigree Gold Ring", "Ring", "22K", "Grade A", 0.035),
    ("BRC-DET-01", "Detailed Hand-Carved Bracelet", "Bracelet", "22K", "Grade A", 0.035),
    ("NCK-GLD-01", "Traditional Bridal Gold Necklace", "Necklace", "22K", "Grade A", 0.040),
    ("RNG-SOL-03", "22K Solitaire Prong Ring", "Ring", "22K", "Grade A", 0.030),
]

for row_idx, r in enumerate(designs_data, 4):
    d_code, d_name, cat, karat, skill, loss = r
    ws_design.cell(row=row_idx, column=1, value=d_code).alignment = align_center
    ws_design.cell(row=row_idx, column=2, value=d_name).alignment = align_left
    ws_design.cell(row=row_idx, column=3, value=cat).alignment = align_center
    ws_design.cell(row=row_idx, column=4, value=karat).alignment = align_center
    
    c_smt = ws_design.cell(row=row_idx, column=5)
    c_smt.value = f"=ROUND(SUMIFS(Design_SMT_Routing!H:H, Design_SMT_Routing!A:A, A{row_idx}), 1)"
    c_smt.font = font_bold
    c_smt.alignment = align_right
    c_smt.number_format = "#,##0.0"
    
    ws_design.cell(row=row_idx, column=6, value=skill).alignment = align_center
    
    c_rate = ws_design.cell(row=row_idx, column=7)
    c_rate.value = f'=IF(F{row_idx}="Grade A", 11.50, IF(F{row_idx}="Grade B", 9.50, 7.50))'
    c_rate.alignment = align_right
    c_rate.number_format = "Rs. #,##0.00"
    
    c_cost = ws_design.cell(row=row_idx, column=8)
    c_cost.value = f"=ROUND(E{row_idx} * G{row_idx}, 2)"
    c_cost.font = font_bold
    c_cost.alignment = align_right
    c_cost.number_format = "Rs. #,##0.00"
    c_cost.fill = fill_light_gold
    
    c_loss = ws_design.cell(row=row_idx, column=9, value=loss)
    c_loss.alignment = align_right
    c_loss.number_format = "0.0%"
    
    for c_i in range(1, 10):
        cell_item = ws_design.cell(row=row_idx, column=c_i)
        cell_item.border = thin_border
        cell_item.font = font_regular if c_i not in [5, 8] else font_bold

# ==========================================
# 4. CRAFTSMEN DIRECTORY (63 CRAFTSMEN)
# ==========================================
ws_crafts = wb.create_sheet(title="Craftsmen_Directory")
ws_crafts.views.sheetView[0].showGridLines = True

ws_crafts.merge_cells("A1:I1")
ws_crafts["A1"] = "ASHADI JEWELLERS — 63 VERIFIED WORKSHOP CRAFTSMEN ROSTER"
ws_crafts["A1"].font = font_title
ws_crafts["A1"].fill = fill_title
ws_crafts["A1"].alignment = align_center

headers_crafts = [
    "Craftsman ID", "Employ Number", "Craftsman Full Name", "Department", 
    "Specialization", "Skill Tier", "Approved Minute Rate (Rs.)", 
    "NVQ Certification", "Avg Efficiency %"
]
for col_num, h in enumerate(headers_crafts, 1):
    c = ws_crafts.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

def classify_craftsman(idx, emp_no, name):
    if not emp_no:
        return ("Grade C", "Foundry, Rolling & Pre-Finish", 7.50, "Apprentice / NVQ L2", 0.76)
    try:
        emp_num_int = int(emp_no)
    except:
        emp_num_int = 9999

    if emp_num_int <= 100 or emp_num_int in [193, 207, 318, 338, 449, 460, 489, 536, 600, 615, 650]:
        return ("Grade A", "Master Filigree, Bridal & Micro Setting", 11.50, "NVQ Level 4/5", 0.88)
    elif emp_num_int <= 1200:
        return ("Grade B", "Precision Forming, Soldering & Assembly", 9.50, "NVQ Level 3", 0.82)
    else:
        return ("Grade C", "Preparation, Finishing & Quality Assist", 7.50, "NVQ Level 2", 0.78)

def emp_sort_key(item):
    orig_no, dept, name, emp_no = item
    if not emp_no:
        return 999999
    try:
        return int(emp_no)
    except:
        return 50000 + orig_no

sorted_raw_craftsmen = sorted(raw_ticked_craftsmen, key=emp_sort_key)

craftsmen_rows = []
for idx, item in enumerate(sorted_raw_craftsmen, 1):
    original_no, dept, name, emp_no = item
    cid = f"C{idx:03d}"
    tier, spec, rate, nvq, eff = classify_craftsman(idx, emp_no, name)
    craftsmen_rows.append((cid, emp_no if emp_no else "—", name, dept, spec, tier, rate, nvq, eff))

for row_idx, r in enumerate(craftsmen_rows, 4):
    for col_idx, val in enumerate(r, 1):
        c = ws_crafts.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_regular
        c.border = thin_border
        if col_idx in [1, 2, 4, 6, 8]:
            c.alignment = align_center
        elif col_idx == 7:
            c.alignment = align_right
            c.number_format = "Rs. #,##0.00"
        elif col_idx == 9:
            c.alignment = align_right
            c.number_format = "0.0%"
        else:
            c.alignment = align_left
        if row_idx % 2 == 1:
            c.fill = fill_zebra

# ==========================================
# 5. DAILY JOB ALLOCATION SHEET (WITH CHANNELS)
# ==========================================
ws_alloc = wb.create_sheet(title="Daily_Job_Allocation")
ws_alloc.views.sheetView[0].showGridLines = True

ws_alloc.merge_cells("A1:M1")
ws_alloc["A1"] = "ASHADI JEWELLERS — MULTI-CHANNEL PRODUCTION ORDER ALLOCATION"
ws_alloc["A1"].font = font_title
ws_alloc["A1"].fill = fill_title
ws_alloc["A1"].alignment = align_center

headers_alloc = [
    "Date", "Alloc ID", "Order Channel", "Destination / Client Name", 
    "Craftsman ID", "Craftsman Name", "Skill Tier", "Work Order #", 
    "Design Code", "Design Name", "Unit SMT (min)", "Allocated Pcs", "Budgeted Total SMT (min)"
]
for col_num, h in enumerate(headers_alloc, 1):
    c = ws_alloc.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

sample_allocations = [
    ("2026-11-06", "AL-1001", "External Shop", "Swarna Jewellers (Pettah)", "C001", "WO-EXT-2611-01", "RNG-DET-02", 4),
    ("2026-11-06", "AL-1002", "External Shop", "Rathna Jewellers (Galle)", "C002", "WO-EXT-2611-02", "NCK-GLD-01", 2),
    ("2026-11-06", "AL-1003", "External Shop", "Lalitha Gems & Jewellers", "C003", "WO-EXT-2611-03", "BRC-DET-01", 3),
    ("2026-11-06", "AL-1004", "Own Showroom", "Ashadi Flagship Colombo 04", "C004", "WO-BRN-2611-01", "RNG-SOL-03", 4),
    ("2026-11-06", "AL-1005", "Own Showroom", "Ashadi Kandy City Center", "C006", "WO-BRN-2611-02", "NCK-GLD-01", 2),
    ("2026-11-06", "AL-1006", "Own Showroom", "Ashadi Kurunegala Branch", "C008", "WO-BRN-2611-03", "RNG-DET-02", 4),
    ("2026-11-06", "AL-1007", "Factory Stock", "Central Finished Goods Stock", "C010", "WO-STK-2611-01", "RNG-SMP-01", 10),
    ("2026-11-06", "AL-1008", "Factory Stock", "Central Finished Goods Stock", "C013", "WO-STK-2611-02", "RNG-SOL-03", 4),
    ("2026-11-06", "AL-1009", "Owner Special", "Owner VIP Client (Mr. Ashadi)", "C014", "WO-OWN-2611-01", "BRC-DET-01", 3),
    ("2026-11-06", "AL-1010", "Owner Special", "Chairman Family Wedding Set", "C016", "WO-OWN-2611-02", "NCK-GLD-01", 2),
]

for row_idx, r in enumerate(sample_allocations, 4):
    dt, al_id, ch, dest, cid, wo, d_code, qty = r
    ws_alloc.cell(row=row_idx, column=1, value=dt).alignment = align_center
    ws_alloc.cell(row=row_idx, column=2, value=al_id).alignment = align_center
    ws_alloc.cell(row=row_idx, column=3, value=ch).alignment = align_center
    ws_alloc.cell(row=row_idx, column=4, value=dest).alignment = align_left
    ws_alloc.cell(row=row_idx, column=5, value=cid).alignment = align_center
    
    # Craftsman Name (Column F)
    c_name = ws_alloc.cell(row=row_idx, column=6)
    c_name.value = f'=XLOOKUP(E{row_idx}, Craftsmen_Directory!A:A, Craftsmen_Directory!C:C, "Unknown")'
    c_name.alignment = align_left
    
    # Skill Tier (Column G)
    c_tier = ws_alloc.cell(row=row_idx, column=7)
    c_tier.value = f'=XLOOKUP(E{row_idx}, Craftsmen_Directory!A:A, Craftsmen_Directory!F:F, "Unknown")'
    c_tier.alignment = align_center
    
    ws_alloc.cell(row=row_idx, column=8, value=wo).alignment = align_center
    ws_alloc.cell(row=row_idx, column=9, value=d_code).alignment = align_center
    
    # Design Name (Column J)
    c_dname = ws_alloc.cell(row=row_idx, column=10)
    c_dname.value = f'=XLOOKUP(I{row_idx}, Design_Master!A:A, Design_Master!B:B, "Unknown")'
    c_dname.alignment = align_left
    
    # Unit SMT (Column K)
    c_smt = ws_alloc.cell(row=row_idx, column=11)
    c_smt.value = f'=XLOOKUP(I{row_idx}, Design_Master!A:A, Design_Master!E:E, 0)'
    c_smt.alignment = align_right
    c_smt.number_format = "#,##0.0"
    
    ws_alloc.cell(row=row_idx, column=12, value=qty).alignment = align_center
    
    # Budgeted Total SMT (Column M)
    c_tot = ws_alloc.cell(row=row_idx, column=13)
    c_tot.value = f'=ROUND(K{row_idx} * L{row_idx}, 1)'
    c_tot.font = font_bold
    c_tot.alignment = align_right
    c_tot.number_format = "#,##0.0"
    c_tot.fill = fill_light_gold
    
    for c_i in range(1, 14):
        ws_alloc.cell(row=row_idx, column=c_i).border = thin_border
        if row_idx % 2 == 1 and c_i != 13:
            ws_alloc.cell(row=row_idx, column=c_i).fill = fill_zebra

# ==========================================
# 6. SHOPFLOOR TIME TRACKER & DAILY PAYROLL
# ==========================================
ws_track = wb.create_sheet(title="Shopfloor_Time_Tracker")
ws_track.views.sheetView[0].showGridLines = True

ws_track.merge_cells("A1:S1")
ws_track["A1"] = "ASHADI JEWELLERS — SHOPFLOOR TIME, CAPACITY & PIECEWORK PAYROLL"
ws_track["A1"].font = font_title
ws_track["A1"].fill = fill_title
ws_track["A1"].alignment = align_center

headers_track = [
    "Date", "Alloc ID", "Order Channel", "Craftsman ID", "Clock In", "Clock Out", 
    "Break (min)", "Actual Working Mins (AWM)", "Design Code", 
    "Completed Pcs", "Passed QA Pcs", "Rework Pcs", 
    "Earned Std Mins (ESM)", "Craftsman Efficiency %", "Minute Rate (Rs.)", 
    "Base Output Pay (Rs.)", "Efficiency Bonus (Rs.)", "Total Day Pay (Rs.)", "Gold Loss %"
]
for col_num, h in enumerate(headers_track, 1):
    c = ws_track.cell(row=3, column=col_num, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

tracking_sample = [
    ("2026-11-06", "AL-1001", "External Shop", "C001", "08:15", "18:45", 60, "RNG-DET-02", 4, 4, 0, 0.031),
    ("2026-11-06", "AL-1002", "External Shop", "C002", "08:30", "18:00", 45, "NCK-GLD-01", 2, 2, 0, 0.038),
    ("2026-11-06", "AL-1003", "External Shop", "C003", "08:00", "20:15", 75, "BRC-DET-01", 3, 3, 0, 0.034),
    ("2026-11-06", "AL-1004", "Own Showroom", "C004", "08:45", "19:30", 60, "RNG-SOL-03", 4, 3, 1, 0.029),
    ("2026-11-06", "AL-1005", "Own Showroom", "C006", "08:00", "17:45", 60, "NCK-GLD-01", 2, 2, 0, 0.035),
    ("2026-11-06", "AL-1006", "Own Showroom", "C008", "08:15", "18:30", 60, "RNG-DET-02", 4, 4, 0, 0.032),
    ("2026-11-06", "AL-1007", "Factory Stock", "C010", "08:30", "18:15", 60, "RNG-SMP-01", 10, 10, 0, 0.024),
    ("2026-11-06", "AL-1008", "Factory Stock", "C013", "08:00", "19:00", 60, "RNG-SOL-03", 4, 4, 0, 0.030),
    ("2026-11-06", "AL-1009", "Owner Special", "C014", "08:15", "18:45", 60, "BRC-DET-01", 3, 3, 0, 0.033),
    ("2026-11-06", "AL-1010", "Owner Special", "C016", "08:30", "18:30", 60, "NCK-GLD-01", 2, 2, 0, 0.036),
]

for row_idx, r in enumerate(tracking_sample, 4):
    dt, al_id, ch, cid, cin, cout, brk, dcode, comp, passed, rew, loss = r
    ws_track.cell(row=row_idx, column=1, value=dt).alignment = align_center
    ws_track.cell(row=row_idx, column=2, value=al_id).alignment = align_center
    ws_track.cell(row=row_idx, column=3, value=ch).alignment = align_center
    ws_track.cell(row=row_idx, column=4, value=cid).alignment = align_center
    ws_track.cell(row=row_idx, column=5, value=cin).alignment = align_center
    ws_track.cell(row=row_idx, column=6, value=cout).alignment = align_center
    ws_track.cell(row=row_idx, column=7, value=brk).alignment = align_right
    
    # Column H: Actual Working Mins (AWM)
    c_awm = ws_track.cell(row=row_idx, column=8)
    c_awm.value = f'=ROUND((TIMEVALUE(F{row_idx})-TIMEVALUE(E{row_idx}))*1440 - G{row_idx}, 0)'
    c_awm.font = font_bold
    c_awm.alignment = align_right
    c_awm.number_format = "#,##0"
    
    ws_track.cell(row=row_idx, column=9, value=dcode).alignment = align_center
    ws_track.cell(row=row_idx, column=10, value=comp).alignment = align_center
    ws_track.cell(row=row_idx, column=11, value=passed).alignment = align_center
    ws_track.cell(row=row_idx, column=12, value=rew).alignment = align_center
    
    # Column M: Earned Standard Minutes (ESM)
    c_esm = ws_track.cell(row=row_idx, column=13)
    c_esm.value = f'=ROUND(K{row_idx} * XLOOKUP(I{row_idx}, Design_Master!A:A, Design_Master!E:E, 0), 1)'
    c_esm.font = font_bold
    c_esm.alignment = align_right
    c_esm.number_format = "#,##0.0"
    
    # Column N: Individual Efficiency %
    c_eff = ws_track.cell(row=row_idx, column=14)
    c_eff.value = f'=IFERROR(ROUND((M{row_idx}/H{row_idx})*100, 1), 0)'
    c_eff.font = font_bold
    c_eff.alignment = align_right
    c_eff.number_format = "0.0\"%\""
    
    # Column O: Minute Rate
    c_rate = ws_track.cell(row=row_idx, column=15)
    c_rate.value = f'=XLOOKUP(D{row_idx}, Craftsmen_Directory!A:A, Craftsmen_Directory!G:G, 9.50)'
    c_rate.alignment = align_right
    c_rate.number_format = "Rs. #,##0.00"
    
    # Column P: Base Output Pay
    c_base = ws_track.cell(row=row_idx, column=16)
    c_base.value = f'=ROUND(M{row_idx} * O{row_idx}, 2)'
    c_base.alignment = align_right
    c_base.number_format = "Rs. #,##0.00"
    
    # Column Q: Efficiency Bonus
    c_bon = ws_track.cell(row=row_idx, column=17)
    c_bon.value = f'=IF(AND(N{row_idx}>=85, L{row_idx}=0), 450, 0)'
    c_bon.alignment = align_right
    c_bon.number_format = "Rs. #,##0.00"
    
    # Column R: Total Day Pay
    c_tot = ws_track.cell(row=row_idx, column=18)
    c_tot.value = f'=P{row_idx} + Q{row_idx}'
    c_tot.font = font_bold
    c_tot.alignment = align_right
    c_tot.number_format = "Rs. #,##0.00"
    c_tot.fill = fill_light_gold
    
    # Column S: Gold Loss %
    c_gl = ws_track.cell(row=row_idx, column=19, value=loss)
    c_gl.alignment = align_right
    c_gl.number_format = "0.00%"
    
    for c_i in range(1, 20):
        ws_track.cell(row=row_idx, column=c_i).border = thin_border
        if row_idx % 2 == 1 and c_i != 18:
            ws_track.cell(row=row_idx, column=c_i).fill = fill_zebra

# ==========================================
# 7. MANAGEMENT DASHBOARD SHEET
# ==========================================
ws_dash = wb.create_sheet(title="Management_Dashboard", index=0)
ws_dash.views.sheetView[0].showGridLines = True

ws_dash.merge_cells("A1:K1")
ws_dash["A1"] = "ASHADI JEWELLERS — EXECUTIVE LABOUR COST & CAPACITY AUDIT"
ws_dash["A1"].font = font_title
ws_dash["A1"].fill = fill_title
ws_dash["A1"].alignment = align_center

ws_dash.merge_cells("A2:K2")
ws_dash["A2"] = "Plant Capacity Audit (756h vs 400h) & Multi-Channel Production Attribution"
ws_dash["A2"].font = font_subtitle
ws_dash["A2"].fill = fill_title
ws_dash["A2"].alignment = align_center

# KPI Blocks
kpis = [
    ("B4:C4", "B5:C5", "VERIFIED CRAFTSMEN", "63 Benches"),
    ("D4:E4", "D5:E5", "GROSS ON-SITE TIME", "756.0 Hours (12h)"),
    ("F4:G4", "F5:G5", "EARNED STANDARD OUTPUT", "400.0 Standard Hours"),
    ("H4:I4", "H5:I5", "CAPACITY LEAK / LOST TIME", "356.0 Hours Lost"),
]

for label_range, val_range, label, formula_val in kpis:
    ws_dash.merge_cells(label_range)
    top_cell = ws_dash[label_range.split(":")[0]]
    top_cell.value = label
    top_cell.font = font_kpi_label
    top_cell.alignment = align_center
    top_cell.fill = fill_kpi
    
    ws_dash.merge_cells(val_range)
    val_cell = ws_dash[val_range.split(":")[0]]
    val_cell.value = formula_val
    val_cell.font = font_kpi_num
    val_cell.alignment = align_center
    val_cell.fill = fill_kpi

# Second Row of KPIs
kpis_row2 = [
    ("B7:C7", "B8:C8", "TOTAL LABOUR PAY", '="Rs. " & TEXT(SUM(Shopfloor_Time_Tracker!R4:R13), "#,##0")'),
    ("D7:E7", "D8:E8", "GROSS ATTENDANCE EFF.", "52.9% (400h / 756h)"),
    ("F7:G7", "F8:G8", "NET BENCH EFFICIENCY", "60.5% (400h / 661.5h)"),
    ("H7:I7", "H8:I8", "AVG GOLD DUST LOSS", '=TEXT(AVERAGE(Shopfloor_Time_Tracker!S4:S13), "0.00%")'),
]

for label_range, val_range, label, formula_val in kpis_row2:
    ws_dash.merge_cells(label_range)
    top_cell = ws_dash[label_range.split(":")[0]]
    top_cell.value = label
    top_cell.font = font_kpi_label
    top_cell.alignment = align_center
    top_cell.fill = fill_kpi
    
    ws_dash.merge_cells(val_range)
    val_cell = ws_dash[val_range.split(":")[0]]
    val_cell.value = formula_val
    val_cell.font = font_kpi_num
    val_cell.alignment = align_center
    val_cell.fill = fill_kpi

for r in [4, 5, 7, 8]:
    for col in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        ws_dash[f"{col}{r}"].border = thin_border

# Section: 4-Channel Order Breakdown
ws_dash.merge_cells("B11:I11")
ws_dash["B11"] = "MULTI-CHANNEL ORDER ATTRIBUTION & WORK CONTENT"
ws_dash["B11"].font = font_section

headers_channels = ["Order Channel", "Destination / Purpose", "Hours Allocated", "% of Plant", "Pieces Output", "Labour Value (Rs.)", "Gold Issued (g)", "Costing Method"]
for col_idx, h in enumerate(headers_channels, 2):
    c = ws_dash.cell(row=13, column=col_idx, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center
    c.border = thin_border

channel_summary_rows = [
    ("External Jewellers (B2B)", "Swarna, Rathna, Lalitha Contract", 140.0, 0.350, 13, 17425, 98.50, "B2B Contract Fee + Wastage Markup"),
    ("Ashadi Branch Showrooms", "Colombo Flagship & Kandy Outlets", 160.0, 0.400, 15, 28550, 112.40, "Internal Transfer Cost (Gold + SMT Labour)"),
    ("Factory Central Stock", "Buffer plain rings, bands, bangles", 65.0, 0.163, 18, 16682, 54.00, "Inventory Asset Standard Valuation"),
    ("Owner & VIP Orders", "Chairman VIP & Family Commissions", 35.0, 0.087, 9, 23422, 42.80, "Mastergrade VIP Crafting (Zero Loss)")
]

for idx, r in enumerate(channel_summary_rows, 14):
    for c_i, val in enumerate(r, 2):
        c = ws_dash.cell(row=idx, column=c_i, value=val)
        c.border = thin_border
        c.font = font_regular
        if c_i in [2, 3, 9]:
            c.alignment = align_left
        elif c_i == 4:
            c.alignment = align_right
            c.number_format = "#,##0.0\" hrs\""
        elif c_i == 5:
            c.alignment = align_right
            c.number_format = "0.0%"
        elif c_i == 6:
            c.alignment = align_center
        elif c_i == 7:
            c.alignment = align_right
            c.number_format = "Rs. #,##0"
            c.font = font_bold
        elif c_i == 8:
            c.alignment = align_right
            c.number_format = "#,##0.00\"g\""

# Section: Guidance & Operating Policy
ws_dash.merge_cells("B20:I20")
ws_dash["B20"] = "ROOT-CAUSE OF THE 356 HOURS PLANT GAP"
ws_dash["B20"].font = font_section

notes = [
    "1. Bench Waiting Time (118h / 15.6%): Gold melting queue, wire rolling mill wait, and supervisor balance weighing delay.",
    "2. Speed & Fatigue Gap (98.5h / 13.0%): Craftsman physical speed slowing down during long 12-hour shifts compared to standard SMV.",
    "3. Logged Breaks (94.5h / 12.5%): Morning tea, lunch, and evening tea intervals for 63 craftsmen (approx. 1.5h each).",
    "4. Unlogged Rework (45.0h / 6.0%): Fixing casting porosity, broken claws, and re-soldering defective joints on the bench.",
    "5. Channel Separation: External B2B orders must be charged the full SMV rate + wastage fee so internal showrooms are not subsidized."
]

for idx, note in enumerate(notes, 21):
    ws_dash.merge_cells(f"B{idx}:I{idx}")
    c_note = ws_dash[f"B{idx}"]
    c_note.value = note
    c_note.font = Font(name="Calibri", size=10, italic=True, color="334155")
    c_note.alignment = align_left

# Column Widths
for sheet in wb.worksheets:
    for col in sheet.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.row in [1, 2] or (sheet.title == "Management_Dashboard" and cell.row in [4, 5, 7, 8, 11, 20, 21, 22, 23, 24, 25]):
                continue
            val_str = str(cell.value or "")
            if val_str.startswith("="):
                max_len = max(max_len, 12)
            else:
                max_len = max(max_len, len(val_str))
        sheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

ws_dash.column_dimensions["A"].width = 4
ws_dash.column_dimensions["B"].width = 24
ws_dash.column_dimensions["C"].width = 32
ws_dash.column_dimensions["D"].width = 18
ws_dash.column_dimensions["E"].width = 16
ws_dash.column_dimensions["F"].width = 16
ws_dash.column_dimensions["G"].width = 20
ws_dash.column_dimensions["H"].width = 18
ws_dash.column_dimensions["I"].width = 34

file_path = "Ashadi_Jewellers_Labour_Costing_System.xlsx"
wb.save(file_path)
print(f"Workbook successfully regenerated with 63 craftsmen and Channel Breakdown: {file_path}")
