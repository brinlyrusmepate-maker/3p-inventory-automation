import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { executeQuery } from '../helpers/oracle';

test('DB Connection Test', async () => {
  const result = await executeQuery(`
    SELECT COUNT(*) CNT
    FROM MAKRO_STG_ITEM_HEADER
  `);

  console.log(result);

  expect(result).toBeTruthy();
});