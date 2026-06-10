import { test, expect, request } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';

test.describe.serial('3P Item Creation', () => {
  test('TC1 - Create Item Success via API', async () => {
    const apiContext = await request.newContext();

    // Step 1: Get Auth Token
    console.log('Before Auth');

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

    console.log('After Auth');
    console.log('Auth Status =', authResponse.status());

    expect(authResponse.status()).toBe(200);

    const authBody = await authResponse.json();
    const accessToken = authBody.accessToken;

    expect(accessToken).toBeTruthy();

    console.log('Get Auth Success');

    // Step 2: Read create item payload
    const payload = JSON.parse(
      fs.readFileSync(
        'tests/3p-item-creation/test-data/create-item.json',
        'utf-8'
      )
    );

    // Step 3: Generate unique ItemRequestNumber and Barcode
    const uniqueNo = Date.now().toString();

    payload.Item.ItemRequestNumber = `N${uniqueNo}`;
    payload.Item.Barcodes[0].Barcode = uniqueNo;

    console.log('New ItemRequestNumber =', payload.Item.ItemRequestNumber);
    console.log('New Barcode =', payload.Item.Barcodes[0].Barcode);

    // Step 4: Create Item API
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
    expect(createItemBody.returnCode).toBe(true);
    expect(createItemBody.returnMessage).toContain(
      payload.Item.ItemRequestNumber
    );
    expect(createItemBody.returnMessage).toContain('sent to Kafka Topic');
    expect(createItemBody.timestamp).toBeTruthy();

    console.log('Create Item API Success');
  });
});