import { test, expect } from '@playwright/test';

test.describe('3P Item Creation', () => {
  test('TC1 - Verify Item Creation', async () => {
    const item = '300001';
    const location = '809';

    console.log(`Item=${item}`);
    console.log(`Location=${location}`);

    expect(item).toBeTruthy();
    expect(location).toBeTruthy();
  });
});