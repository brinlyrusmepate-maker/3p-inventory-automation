import { test, expect, request } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';
import { executeQuery } from '../../helpers/oracle';

// TC1 Phase 1: Create Item and validate RMS item creation flow
//
// Step 1: Get Token
// Step 2: Create Item API
// Step 3: Validate API Response
// Step 4: Validate DB1 - MAKRO_STG_ITEM_HEADER
// Step 5: Validate DB2 - MAKRO_ITEM_HEADER_REPORT
// Step 6: Validate DB3 - RMS132.ITEM_MASTER
// Step 7: Validate DB4 - RMS132.UDA_ITEM_FF
// Step 8: Validate DB5 - RMS132.ITEM_LOC
// Step 9: Save context for Phase 2

async function waitForDbResult(query: () => Promise<any[]>, timeoutMs = 300000) {
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

test.describe.serial('TC1 Phase 1 - 3P Item Creation', () => {
  test('Create item and validate DB1 to DB5', async () => {
    test.setTimeout(480000);

    const apiContext = await request.newContext();

    // Step 1: Get Auth Token
    console.log('Step 1: Get Auth Token');

    const authResponse = await apiContext.post(process.env.AUTH_URL!, {
      headers: {
        appid: process.env.APP_ID!,
        application: process.env.APPLICATION!,
        clientid: process.env.CLIENT_ID!,
        appsecret: process.env.APP_SECRET!,
        granttype: process.env.GRANT_TYPE!,
      },
      timeout: 10000,
    });

    expect(authResponse.status()).toBe(200);

    const authBody = await authResponse.json();
    const accessToken = authBody.accessToken;

    expect(accessToken).toBeTruthy();

    console.log('Get Auth Success');

    // Step 2: Read create item payload
    console.log('Step 2: Read create item payload');

    const payload = JSON.parse(
      fs.readFileSync(
        'tests/3p-item-creation/test-data/create-item.json',
        'utf-8'
      )
    );

    // Step 3: Generate unique ItemRequestNumber and Barcode
    console.log('Step 3: Generate unique ItemRequestNumber and Barcode');

    const uniqueNo = Date.now().toString();

    payload.Item.ItemRequestNumber = `N${uniqueNo}`;
    payload.Item.Barcodes[0].Barcode = uniqueNo;

    console.log('New ItemRequestNumber =', payload.Item.ItemRequestNumber);
    console.log('New Barcode =', payload.Item.Barcodes[0].Barcode);

    // Step 4: Create Item API
    console.log('Step 4: Create Item API');

    const createItemResponse = await apiContext.post(
      'https://erp-item.mango-qa.siammakro.cloud/item-creation/api/createItem',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        data: payload,
        timeout: 30000,
      }
    );

    console.log('Create Item Status =', createItemResponse.status());

    expect(createItemResponse.status()).toBe(200);

    const createItemBody = await createItemResponse.json();

    console.log(
      'Create Item Response =',
      JSON.stringify(createItemBody, null, 2)
    );

    // Step 5: Validate API Response
    console.log('Step 5: Validate API Response');

    expect(createItemBody.returnCode).toBe(true);
    expect(createItemBody.returnMessage).toContain(
      payload.Item.ItemRequestNumber
    );
    expect(createItemBody.returnMessage).toContain('sent to Kafka Topic');
    expect(createItemBody.timestamp).toBeTruthy();

    console.log('Create Item API Success');

    // Step 6: Validate DB1 - MAKRO_STG_ITEM_HEADER
    console.log('Step 6: Validate DB1 - MAKRO_STG_ITEM_HEADER');

    const db1Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM MAKRO_STG_ITEM_HEADER
        WHERE ITEM_REQUEST_NUMBER = '${payload.Item.ItemRequestNumber}'
      `)
    );

    console.log('DB1 Result =', db1Result);

    expect(db1Result.length).toBeGreaterThan(0);
    expect(db1Result[0].ITEM_REQUEST_NUMBER).toBe(
      payload.Item.ItemRequestNumber
    );
    expect(db1Result[0].MESSAGE_EVENT_TYPE).toBe('CREATE_ITEM');

    console.log('DB1 Validation Success');

    // Step 7: Validate DB2 - MAKRO_ITEM_HEADER_REPORT
    console.log('Step 7: Validate DB2 - MAKRO_ITEM_HEADER_REPORT');

    const db2Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM makro_item_header_report
        WHERE ITEM_REQ_NO = '${payload.Item.ItemRequestNumber}'
      `)
    );

    console.log('DB2 Result =', db2Result);

    expect(db2Result.length).toBeGreaterThan(0);
    expect(db2Result[0].ITEM_REQ_NO).toBe(payload.Item.ItemRequestNumber);
    expect(db2Result[0].ITEM).toBeTruthy();

    const itemNumber = db2Result[0].ITEM;

    console.log('DB2 Validation Success');
    console.log('Created Item Number =', itemNumber);

    // Step 8: Validate DB3 - RMS132.ITEM_MASTER
    console.log('Step 8: Validate DB3 - RMS132.ITEM_MASTER');

    const db3Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM RMS132.ITEM_MASTER
        WHERE ITEM = '${itemNumber}'
      `)
    );

    console.log('DB3 Result =', db3Result);

    expect(db3Result.length).toBeGreaterThan(0);
    expect(String(db3Result[0].ITEM)).toBe(String(itemNumber));

    console.log('DB3 Validation Success');

    // Step 9: Validate DB4 - RMS132.UDA_ITEM_FF
    console.log('Step 9: Validate DB4 - RMS132.UDA_ITEM_FF');

    const db4Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM RMS132.UDA_ITEM_FF
        WHERE ITEM = '${itemNumber}'
      `)
    );

    console.log('DB4 Result =', db4Result);

    expect(db4Result.length).toBeGreaterThan(0);

    const uda8001 = db4Result.find(
      (row: any) => Number(row.UDA_ID) === 8001
    );

    expect(uda8001).toBeTruthy();
    expect(String(uda8001.ITEM)).toBe(String(itemNumber));
    expect(String(uda8001.UDA_TEXT)).toContain('3P');

    console.log('DB4 Validation Success');

    // Step 10: Validate DB5 - RMS132.ITEM_LOC
    console.log('Step 10: Validate DB5 - RMS132.ITEM_LOC');

    const loc = '809';

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
    expect(String(db5Result[0].ITEM)).toBe(String(itemNumber));
    expect(Number(db5Result[0].LOC)).toBe(Number(loc));

    console.log('DB5 Validation Success');

    // Step 11: Save context for Phase 2 - CFA Kafka
    console.log('Step 11: Save context for Phase 2');

    const context = {
      itemRequestNumber: payload.Item.ItemRequestNumber,
      itemNumber,
      loc,
      groupId: 150,
      kafkaTopic: 'erp.bcp.cfa',
    };

    fs.mkdirSync('.run-state', { recursive: true });

    fs.writeFileSync(
      '.run-state/tc1-context.json',
      JSON.stringify(context, null, 2)
    );

    console.log('Saved context =', JSON.stringify(context, null, 2));
    console.log('TC1 Phase 1 Completed Successfully');
  });
});