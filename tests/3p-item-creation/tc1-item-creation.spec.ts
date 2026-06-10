import { test, expect, request } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';
import { executeQuery } from '../../helpers/oracle';

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

test.describe.serial('3P Item Creation', () => {
  test('TC1 - Create Item Success via API', async () => {
    test.setTimeout(420000);

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

    console.log('DB1 Validation Success');

    // Step 7: Validate DB2 - makro_item_header_report
    console.log('Step 7: Validate DB2 - makro_item_header_report');

    const db2Result = await waitForDbResult(() =>
      executeQuery(`
        SELECT *
        FROM makro_item_header_report
        WHERE ITEM_REQ_NO = '${payload.Item.ItemRequestNumber}'
      `)
    );

    console.log('DB2 Result =', db2Result);

    expect(db2Result.length).toBeGreaterThan(0);

    console.log('DB2 Validation Success');

    // Step 8: Validate DB3
    // TODO

    // Step 9: Validate DB4
    // TODO

    // Step 10: Call CFA Kafka
    // TODO

    // Step 11: Validate DB5
    // TODO

    // Step 12: Validate RDS
    // TODO

    // Step 13: Validate Elasticsearch
    // TODO
  });
});