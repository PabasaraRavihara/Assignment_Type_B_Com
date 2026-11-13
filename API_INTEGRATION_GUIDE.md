# Ashadi Jewellers — Workshop Floor REST API Integration Specification
**Version:** 2.0 • **Document Date:** 2026-11-13  
**Target Audience:** External System Software Engineers, ERP Developers, Showroom POS Integrators  
**Live Production Base URL:** `https://assignmenttypebcom-eight.vercel.app/api`

---

## 1. Executive Integration Overview

The **Ashadi Jewellers Workshop Production & Labour Costing System** exposes a complete, standardized **REST API (JSON over HTTPS)**. Any external enterprise system—such as a Showroom Point-of-Sale (POS), Central ERP (SAP, Oracle, Odoo), Inventory Stock Ledger, or Accounting System (QuickBooks)—can exchange data automatically in real time without human re-entry.

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     COMPANY EXTERNAL SYSTEM     │                 │     ASHADI WORKSHOP SYSTEM      │
│  (Showroom POS / ERP / Stock)   │                 │     (Benches, QR, Kiosk, SMT)   │
└─────────────────────────────────┘                 └─────────────────────────────────┘
                 │                                                   │
                 │ 1. [API Call: POST /api/allocations]              │
                 │ ─── New Order: Pushpa Jewellers #2026110956 ────> │ (Auto-loaded to 
                 │     (Item: 22K Pendant, Target: 2.0g)             │  Morning Fast 63 Sheet)
                 │                                                   │
                 │                                                   │ (Craftsmen Work,
                 │                                                   │  Scans QR at Kiosk)
                 │                                                   │
                 │ 2. [Webhook / API Call: Order Completed]          │
                 │ <── Final Status, Actual Hours, Gold Loss: 3.2% ─ │ (Vault Return Done)
                 ▼                                                   ▼
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│ • Ready for Customer Delivery   │                 │ • Capacity Audit Updated        │
│ • Stock Ledger Deducted 2.19g   │                 │ • Craftsman Efficiency Scored   │
│ • Customer Invoice Generated    │                 │ • Labour Cost Finalized         │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

---

## 2. Authentication & Headers

All requests sent to the workshop API should include standard HTTP headers:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <YOUR_API_TOKEN>
```

---

## 3. Core API Endpoints

### 3.1 Work Order Dispatch (Single Item)
Used by the Showroom or Sales Desk to dispatch an incoming client order (e.g. Pushpa Jewellers) directly onto a workshop craftsman's bench.

* **Endpoint:** `POST /api/allocations`
* **Content-Type:** `application/json`

#### Request Payload:
```json
{
  "date": "2026-11-13",
  "workOrder": "2026110956",
  "channel": "EXTERNAL_SHOP",
  "channelName": "Pushpa Jewellers",
  "craftsmanId": "C055",
  "designCode": "PND-22K-01",
  "metalType": "Gold 22K",
  "qtyAllocated": 1,
  "assumedHours": 2.0,
  "goldIssuedGrams": 2.19,
  "dispatchTime": "08:00 AM"
}
```

#### Field Descriptions:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `date` | String | Yes | Dispatch Date in `YYYY-MM-DD` format |
| `workOrder` | String | Yes | Company unique Order/Voucher # (e.g. `2026110956`) |
| `channel` | Enum | Yes | `EXTERNAL_SHOP` \| `OWN_SHOWROOM` \| `FACTORY_STOCK` \| `OWNER_SPECIAL` |
| `channelName` | String | No | Client name e.g. `Pushpa Jewellers`, `Ashadi Flagship` |
| `craftsmanId` | String | Yes | Craftsman Bench ID e.g. `C055` (Maduranga) |
| `designCode` | String | Yes | Master catalogue code e.g. `RNG-SOL-03` |
| `qtyAllocated`| Number | Yes | Total pieces to manufacture |
| `assumedHours`| Number | No | Budgeted hours (defaults to standard SMT / 60) |
| `goldIssuedGrams`| Number | Yes | Exact 22K raw gold/alloy issued to bench (g) |

#### Response (`201 Created`):
```json
{
  "message": "Allocation dispatched successfully",
  "allocation": {
    "id": "AL-1066",
    "workOrder": "2026110956",
    "status": "In Progress",
    "budgetedSMT": 120,
    "assumedHours": 2.0,
    "craftsmanName": "Mr. D.G.SACHINDU MADURANGA",
    "goldIssuedGrams": 2.19,
    "qrData": "WO:2026110956|CID:C055|DATE:2026-11-13|SMT:120m"
  }
}
```

---

### 3.2 Multi-Item Suite / Set Dispatch
Used when an order consists of multiple matching pieces (e.g., a Bridal Set containing 1 Ring + 1 Necklace + 2 Drop Earrings) handled under a single Order ID.

* **Endpoint:** `POST /api/allocations`

#### Request Payload:
```json
{
  "date": "2026-11-13",
  "workOrder": "2026110999",
  "channel": "EXTERNAL_SHOP",
  "channelName": "Pushpa Jewellers",
  "craftsmanId": "C009",
  "isSuite": true,
  "suiteName": "Bridal Suite Set (Ring + Necklace + 2 Earrings)",
  "metalType": "Gold 22K",
  "items": [
    { "designCode": "RNG-SOL-03", "qty": 1, "metalType": "Gold 22K" },
    { "designCode": "NCK-FLR-02", "qty": 1, "metalType": "Gold 22K" },
    { "designCode": "ERR-DRP-01", "qty": 2, "metalType": "Gold 22K" }
  ],
  "goldIssuedGrams": 32.8,
  "dispatchTime": "08:00 AM"
}
```
* **Engine Behavior:** The system automatically aggregates the individual SMT for all pieces and calculates the combined bench hours!

---

### 3.3 Query Live Order Status & Job Progress
Used by the Showroom or Customer Service desk to check the live status of an order on the factory floor.

* **Endpoint:** `GET /api/allocations?workOrder=2026110956`
* **Query Parameters:**
  * `date=YYYY-MM-DD` (Optional: filter by shift date)
  * `status=Completed|In Progress|Paused` (Optional)
  * `craftsmanId=C055` (Optional: filter by bench)

#### Response (`200 OK`):
```json
{
  "total": 1,
  "allocations": [
    {
      "id": "AL-1066",
      "workOrder": "2026110956",
      "date": "2026-11-13",
      "status": "In Progress",
      "channelName": "Pushpa Jewellers",
      "craftsmanId": "C055",
      "craftsmanName": "Mr. D.G.SACHINDU MADURANGA",
      "skillTier": "Grade C",
      "designName": "22K CZ Double Circle Pendant",
      "assumedHours": 2.0,
      "actualHours": null,
      "goldIssuedGrams": 2.19,
      "goldReturnedGrams": null,
      "dispatchTime": "08:00 AM",
      "pausedMinutes": 20,
      "currentKioskState": "PAUSED_TEA_BREAK"
    }
  ]
}
```

---

### 3.4 Job Completion & Gold Vault Check-In
When the craftsman finishes manufacturing and delivers the piece together with the collected scrap filings to the Vault Officer, the external ERP or Vault terminal updates the record.

* **Endpoint:** `PUT /api/allocations/:workOrder` (e.g. `/api/allocations/2026110956`)

#### Request Payload:
```json
{
  "workOrder": "2026110956",
  "status": "Completed",
  "actualHours": 2.1,
  "goldIssuedGrams": 2.19,
  "goldReturnedGrams": 2.12
}
```

#### Response (`200 OK`):
```json
{
  "message": "Allocation updated successfully",
  "allocation": {
    "workOrder": "2026110956",
    "status": "Completed",
    "assumedHours": 2.0,
    "actualHours": 2.1,
    "varianceHours": 0.1,
    "variancePct": 5.0,
    "goldIssuedGrams": 2.19,
    "goldReturnedGrams": 2.12,
    "goldLossPct": 3.20,
    "scrapCeiling": 3.5,
    "ceilingStatus": "WITHIN_ALLOWABLE_CEILING_PASS"
  }
}
```

---

## 4. Master Data APIs (Read-Only)

External systems can sync master data to keep dropdowns and catalog IDs identical across both systems:

### 4.1 Get 63 Workshop Craftsmen Roster
* `GET /api/craftsmen`
* Returns all 63 active benches with `id`, `name`, `empNo`, `skillTier`, `minuteRate`, and `specialization`.

### 4.2 Get Jewellery Design & SMT Standards
* `GET /api/designs`
* Returns standard designs with `code`, `name`, `totalSMT`, `metalType`, and `allowableScrapCeiling`.

### 4.3 Get B2B Client Jewellers Directory
* `GET /api/client-shops`
* Returns active external partner shops (e.g. `Pushpa Jewellers`, `Swarna Jewellers`), contact persons, and contract loss agreements.

---

## 5. Webhook Integration (Optional Event Subscriptions)

If your ERP supports Webhooks, the workshop server can emit an automatic HTTP POST event to your system when key events happen:

| Event Trigger | Event Payload |
| :--- | :--- |
| `workshop.order.dispatched` | `{ event: "DISPATCHED", workOrder: "2026110956", craftsman: "C055", eta: "04:37 PM" }` |
| `workshop.kiosk.break_paused`| `{ event: "PAUSED", workOrder: "2026110956", reason: "TEA_BREAK", time: "10:15 AM" }` |
| `workshop.order.completed` | `{ event: "COMPLETED", workOrder: "2026110956", actualHours: 2.1, goldLossPct: 3.20 }` |

---

## 6. Ready-to-Use Postman Collection

A pre-configured Postman Collection file has been generated and placed in the project repository:
* File Path: `Ashadi_Workshop_REST_API.postman_collection.json`
* To use: Open Postman $\rightarrow$ Click **Import** $\rightarrow$ Drag & drop `Ashadi_Workshop_REST_API.postman_collection.json`.
* Variable `baseUrl` is pre-set to `https://assignmenttypebcom-eight.vercel.app/api`.
