# 3P Inventory Automation

Playwright automation for 3P Item Creation End-to-End flow.

---

## Project Overview

This automation validates the complete 3P Item Creation process across multiple systems:

```text
Create Item API
    ↓
Oracle Master Tables
    ↓
CFA Kafka Message
    ↓
RMS Item Location
    ↓
RDS 3P Tables
    ↓
Elasticsearch (makrosoh)
```

---

# Prerequisites

## Software

* Node.js 20+
* Playwright
* Oracle Instant Client
* VS Code / IntelliJ

Install dependencies:

```bash
npm install
npx playwright install
```

---

# VPN Requirements

## Phase 1

No VPN required

Used for:

* Create Item API
* Oracle Master Validation

---

## Phase 2A

Tencent VPN required

Used for:

* Kafka UI
* CFA Message Production

---

## Phase 2B

GlobalProtect VPN required

Used for:

* RMS132.ITEM_LOC
* RMS132.ITEM_LOC_CFA_EXT

---

## Phase 3

GlobalProtect VPN required

Used for:

* MAKRO_ITEM_CREATE_3P
* MAKRO_ES_SIM_SOH_3P

---

## Phase 4

Tencent VPN required

Used for:

* Elasticsearch
* Kibana API

---

# Environment Variables

Create `.env`

```env
# Create Item API

CLIENT_ID=
CLIENT_SECRET=

# Kafka

KAFKA_UI_URL=
KAFKA_UI_USERNAME=
KAFKA_UI_PASSWORD=

# RMS Oracle

DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_SERVICE=

# 3P RDS

RDS_3P_DB_USER=
RDS_3P_DB_PASSWORD=
RDS_3P_DB_HOST=
RDS_3P_DB_PORT=
RDS_3P_DB_SERVICE=

# Elasticsearch

ES_BASE_URL=
ES_USERNAME=
ES_PASSWORD=
```

---

# Test Execution

## Phase 1

Create Item

```bash
npx playwright test tests/3p-item-creation/tc1-item-creation.spec.ts --project=chromium
```

Expected:

* Create Item API success
* Context file generated

Output:

```text
.run-state/tc1-context.json
```

---

## Phase 2A

Produce CFA Kafka Message

```bash
npx playwright test tests/3p-item-creation/tc1-phase2-cfa.spec.ts --project=chromium
```

Expected:

* Kafka message produced successfully

---

## Phase 2B

Validate RMS Tables

```bash
npx playwright test tests/3p-item-creation/tc1-phase2b-validate-cfa-db.spec.ts --project=chromium
```

Expected:

* RMS132.ITEM_LOC created
* RMS132.ITEM_LOC_CFA_EXT created

---

## Phase 3

Validate 3P RDS

```bash
npx playwright test tests/3p-item-creation/tc1-phase3-rds-validation.spec.ts --project=chromium
```

Expected:

* MAKRO_ITEM_CREATE_3P exists
* MAKRO_ES_SIM_SOH_3P exists

---

## Phase 4

Validate Elasticsearch

```bash
npx playwright test tests/3p-item-creation/tc1-phase4-elasticsearch-validation.spec.ts --project=chromium
```

Expected:

* Item exists in makrosoh
* Location 4000 exists
* Elasticsearch validation success

---

# Context File

Phase 1 generates:

```text
.run-state/tc1-context.json
```

Example:

```json
{
  "itemRequestNumber": "N1781201268314",
  "itemNumber": "669714",
  "loc": "809",
  "groupId": 150,
  "number11": 4000,
  "kafkaTopic": "erp.bcp.cfa"
}
```

This file is used by:

* Phase 2A
* Phase 2B
* Phase 3
* Phase 4

---

# Reports

Open latest Playwright report:

```bash
npx playwright show-report
```

---

# Current Test Coverage

## TC1 - 3P Item Creation

Coverage:

* Create Item API
* Oracle Validation
* CFA Kafka Flow
* RMS Validation
* RDS Validation
* Elasticsearch Validation

Status:

```text
PASS
```
