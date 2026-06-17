import { test, expect } from '@playwright/test';
import 'dotenv/config';

test('Kafka Login', async ({ page }) => {
  await page.goto(process.env.KAFKA_UI_URL!);

  await page
    .getByPlaceholder('Enter your username')
    .fill(process.env.KAFKA_UI_USERNAME!);

  await page
    .getByPlaceholder('Enter your password')
    .fill(process.env.KAFKA_UI_PASSWORD!);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForTimeout(3000);

  await expect(page).toHaveURL(/.*kafka-ui.*/);
});