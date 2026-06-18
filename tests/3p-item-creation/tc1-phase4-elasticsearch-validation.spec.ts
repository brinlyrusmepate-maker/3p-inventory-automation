import { test, expect } from '@playwright/test';
import fs from 'fs';
import { searchMakrosohByItem } from '../../helpers/elasticsearch';

test.describe.serial('TC1 Phase 4 - Elasticsearch Validation', () => {
  test('Validate item exists in makrosoh', async () => {
    test.setTimeout(120000);

    console.log('Step 1: Read context');

    const context = JSON.parse(
      fs.readFileSync('.run-state/tc1-context.json', 'utf-8')
    );

    const itemNumber = context.itemNumber;
    const number11 = context.number11;

    expect(itemNumber).toBeTruthy();
    expect(number11).toBeTruthy();

    console.log('Item =', itemNumber);
    console.log('Location =', number11);

    console.log('Step 2: Query Elasticsearch');

    const result = await searchMakrosohByItem(String(itemNumber));

    console.log(
      'ES Result =',
      JSON.stringify(result, null, 2)
    );

    const hits = result.rawResponse.hits.hits;

    expect(hits.length).toBeGreaterThan(0);

    const source = hits[0]._source;

    expect(String(source.item)).toBe(String(itemNumber));

    console.log('Item Validation Success');

    console.log('Step 3: Validate Location');

    const locationFound = source.loclist.find(
      (loc: any) => Number(loc.loc) === Number(number11)
    );

    expect(locationFound).toBeTruthy();

    console.log(
      'Location Found =',
      JSON.stringify(locationFound, null, 2)
    );

    console.log('Location Validation Success');

    console.log('TC1 Phase 4 Completed Successfully');
  });
});