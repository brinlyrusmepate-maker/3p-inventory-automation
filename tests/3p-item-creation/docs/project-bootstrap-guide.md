# Playwright + Oracle Setup Guide

## Step 1 Install Playwright

npm init playwright@latest

## Step 2 Install Oracle Driver

npm install oracledb dotenv

## Step 3 Download Oracle Instant Client

Download:
https://www.oracle.com/database/technologies/instant-client.html

Mac ARM64:
instantclient-basic-macos.arm64-23.26.1.0.0.dmg

## Step 4 Create Oracle Helper

helpers/oracle.ts

## Step 5 Test DB Connection

tests/db-test.spec.ts

npx playwright test tests/db-test.spec.ts --project=chromium

Expected:

[ { CNT: 9687 } ]

1 passed

## Step 6 Create TC1

Get Token
Create Item API

## Step 7 DB Validation

DB1
MAKRO_STG_ITEM_HEADER

DB2
MAKRO_ITEM_HEADER_REPORT

DB3
RMS132.ITEM_MASTER

DB4
RMS132.UDA_ITEM_FF

DB5
RMS132.ITEM_LOC

DB6
RMS132.ITEM_LOC_CFA_EXT

## Step 8 GitHub

git add .
git commit -m "message"
git push origin main