import { test, expect } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';
import { execute3PRdsQuery } from '../../helpers/oracle-3p-rds';

async function waitForDbResult(
  query: () => Promise<any[]>,
  timeoutMs = 300000
) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const result = await query();

    if (result.length > 0) {
      return result;
    }

    console.log('DB result not found yet, retry in 10s...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  return [];
}

/**
 * TC1 Phase 3 — RDS 3P Validation
 *
 * VPN Required:
 *   GlobalProtect / RDS VPN
 *
 * Run:
 *   npx playwright test tests/3p-item-creation/tc1-phase3-rds-validation.spec.ts --project=chromium
 */

test.describe.serial('TC1 Phase 3 - RDS 3P Validation', () => {
  test('Validate ORACLE_MASTER 3P RDS tables', async () => {
    test.setTimeout(480000);

    console.log('Step 1: Read context');

    const context = JSON.parse(
      fs.readFileSync('.run-state/tc1-context.json', 'utf-8')
    );

    const itemNumber = context.itemNumber;
    const number11 = context.number11;

    expect(itemNumber).toBeTruthy();
    expect(number11).toBeTruthy();

    console.log('Context =', JSON.stringify(context, null, 2));

    const whoami = await execute3PRdsQuery(`
      SELECT
        USER AS CURRENT_USER,
        SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS CURRENT_SCHEMA,
        SYS_CONTEXT('USERENV','SERVICE_NAME') AS SERVICE_NAME
      FROM DUAL
    `);

    console.log('3P RDS WHOAMI =', whoami);

    // Step 2: Validate MAKRO_ITEM_CREATE_3P
    console.log('Step 2: Validate MAKRO_ITEM_CREATE_3P');

    const itemCreateResult = await waitForDbResult(() =>
      execute3PRdsQuery(`
        SELECT *
        FROM MAKRO_ITEM_CREATE_3P
        WHERE ITEM = '${itemNumber}'
      `)
    );

    console.log('MAKRO_ITEM_CREATE_3P Result =', itemCreateResult);

    expect(itemCreateResult.length).toBeGreaterThan(0);
    expect(String(itemCreateResult[0].ITEM)).toBe(String(itemNumber));

    const itemCreateLoc4000 = itemCreateResult.find(
      (row: any) => Number(row.LOC) === Number(number11)
    );

    expect(itemCreateLoc4000).toBeTruthy();

    console.log('MAKRO_ITEM_CREATE_3P Validation Success');

    // Step 3: Validate MAKRO_ES_SIM_SOH_3P
    console.log('Step 3: Validate MAKRO_ES_SIM_SOH_3P');

    const soh3pResult = await waitForDbResult(() =>
      execute3PRdsQuery(`
        SELECT *
        FROM MAKRO_ES_SIM_SOH_3P
        WHERE ITEM = '${itemNumber}'
      `)
    );

    console.log('MAKRO_ES_SIM_SOH_3P Result =', soh3pResult);

    expect(soh3pResult.length).toBeGreaterThan(0);

    const sohLoc4000 = soh3pResult.find(
      (row: any) => Number(row.LOC) === Number(number11)
    );

    expect(sohLoc4000).toBeTruthy();
    expect(String(sohLoc4000.ITEM)).toBe(String(itemNumber));
    expect(Number(sohLoc4000.LOC)).toBe(Number(number11));

    console.log('MAKRO_ES_SIM_SOH_3P Validation Success');
    console.log('TC1 Phase 3 Completed Successfully');
  });
});