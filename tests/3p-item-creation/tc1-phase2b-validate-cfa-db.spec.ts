import { test, expect } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';
import { executeQuery } from '../../helpers/oracle';

// TC1 Phase 2B — CFA DB Validation
/**
 * Connect VPN Global Protect before running this test
 * 
 * TC1 Phase 2B — CFA DB Validation
 * 1. Read Context
 * 2. Validate RMS132.ITEM_LOC
 * 3. Validate RMS132.ITEM_LOC_CFA_EXT
 * 
 * Run Phase 1 first:
 *   npx playwright test tests/3p-item-creation/tc1-item-creation.spec.ts --project=chromium
 *
 * Then run Phase 2B:
 *   npx playwright test tests/3p-item-creation/tc1-phase2b-validate-cfa-db.spec.ts --project=chromium  
**/

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

test.describe.serial('TC1 Phase 2B - CFA DB Validation', () => {
  test('Validate DB5 and DB6 after Kafka message', async () => {
    test.setTimeout(480000);

    console.log('Step 1: Read context');

    const context = JSON.parse(
      fs.readFileSync('.run-state/tc1-context.json', 'utf-8')
    );

    const itemNumber = context.itemNumber;
    const loc = context.loc;
    const groupId = context.groupId;

    console.log(
      'Context =',
      JSON.stringify(context, null, 2)
    );

    // DB5
    console.log('Step 2: Validate RMS132.ITEM_LOC');

    const db5Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM RMS132.ITEM_LOC
        WHERE ITEM = '${itemNumber}'
          AND LOC = ${loc}
      `)
    );

    console.log('DB5 Result =', db5Result);

    expect(db5Result.length).toBeGreaterThan(0);

    expect(String(db5Result[0].ITEM)).toBe(
      String(itemNumber)
    );

    expect(Number(db5Result[0].LOC)).toBe(
      Number(loc)
    );

    console.log('DB5 Validation Success');

    // DB6
    console.log(
      'Step 3: Validate RMS132.ITEM_LOC_CFA_EXT'
    );

    const db6Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM RMS132.ITEM_LOC_CFA_EXT
        WHERE ITEM = '${itemNumber}'
          AND LOC = ${loc}
          AND GROUP_ID = ${groupId}
      `)
    );

    console.log('DB6 Result =', db6Result);

    expect(db6Result.length).toBeGreaterThan(0);

    expect(String(db6Result[0].ITEM)).toBe(
      String(itemNumber)
    );

    expect(Number(db6Result[0].LOC)).toBe(
      Number(loc)
    );

    expect(Number(db6Result[0].GROUP_ID)).toBe(
      Number(groupId)
    );

    console.log('DB6 Validation Success');

    console.log(
      'TC1 Phase 2B Completed Successfully'
    );
  });
});