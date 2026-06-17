import { test, expect } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';

/**
 * TC1 Phase 2A — CFA Kafka Produce
 *
 * VPN Required:
 *   Tencent VPN
 *
 * Run:
 *   npx playwright test tests/3p-item-creation/tc1-phase2a-produce-cfa.spec.ts --project=chromium
 */

test.describe.serial('TC1 Phase 2A - CFA Kafka Produce', () => {
  test('Produce CFA Kafka message', async ({ page }) => {
    test.setTimeout(300000);

    // Step 1: Read Context
    console.log('Step 1: Read Context');

    const context = JSON.parse(
      fs.readFileSync('.run-state/tc1-context.json', 'utf-8')
    );

    const itemNumber = context.itemNumber;
    const loc = context.loc;
    const groupId = context.groupId;
    const number11 = context.number11;
    const kafkaTopic = context.kafkaTopic;

    expect(itemNumber).toBeTruthy();
    expect(loc).toBeTruthy();
    expect(groupId).toBeTruthy();
    expect(number11).toBeTruthy();
    expect(kafkaTopic).toBeTruthy();

    console.log(
      'Context =',
      JSON.stringify(context, null, 2)
    );

    // Kafka Key
    const kafkaKey = `${itemNumber}_${number11}`;

    // Kafka Payload
    const kafkaPayload = {
      type: 'ItemLocCFA',
      item: String(itemNumber),
      loc: String(loc),
      groupId: Number(groupId),
      number_11: Number(number11),
      created_id: '3px',
    };

    console.log('Kafka Key =', kafkaKey);
    console.log(
      'Kafka Payload =',
      JSON.stringify(kafkaPayload, null, 2)
    );

    // Step 2: Login Kafka UI
    console.log('Step 2: Login Kafka UI');

    const kafkaBaseUrl = process.env.KAFKA_UI_URL!.replace(
      '/login',
      ''
    );

    await page.goto(`${kafkaBaseUrl}/login`, {
      waitUntil: 'domcontentloaded',
    });

    await page
      .getByPlaceholder('Enter your username')
      .fill(process.env.KAFKA_UI_USERNAME!);

    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.KAFKA_UI_PASSWORD!);

    await page
      .getByRole('button', { name: 'Log in' })
      .click();

    await page.waitForTimeout(5000);

    console.log(
      'After Login URL =',
      page.url()
    );

    // Step 3: Open Topic
    console.log('Step 3: Open Kafka Topic');

    const topicUrl =
      `${kafkaBaseUrl}/ui/clusters/tencent-qa/all-topics/${kafkaTopic}/messages?mode=LATEST&limit=100`;

    console.log('Topic URL =', topicUrl);

    await page.goto(topicUrl, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(5000);

    console.log(
      'Current URL =',
      page.url()
    );

    // Step 4: Produce Kafka Message
    console.log('Step 4: Produce Kafka Message');

    const produceButtons =
      page.getByRole('button', {
        name: 'Produce Message',
      });

    console.log(
      'Produce button count =',
      await produceButtons.count()
    );

    await produceButtons
      .first()
      .click({ force: true });

    await page.waitForTimeout(3000);

    const textareas =
      page.locator('textarea');

    console.log(
      'Textarea count after popup =',
      await textareas.count()
    );

    await expect(
      textareas.nth(1)
    ).toBeVisible();

    await expect(
      textareas.nth(2)
    ).toBeVisible();

    // Key
    await textareas
      .nth(1)
      .fill(kafkaKey);

    // Value
    await textareas
      .nth(2)
      .fill(
        JSON.stringify(
          kafkaPayload,
          null,
          2
        )
      );

    // Headers must be empty
    if ((await textareas.count()) > 3) {
      await textareas.nth(3).fill('');
    }

    await produceButtons.last().click();

    console.log(
      'Kafka message produced successfully'
    );

    await page.waitForTimeout(5000);

    console.log(
      'TC1 Phase 2A Completed Successfully'
    );
  });
});