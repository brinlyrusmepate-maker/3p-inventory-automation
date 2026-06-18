import axios from 'axios';
import 'dotenv/config';

export async function searchMakrosohByItem(itemNumber: string) {
  const response = await axios.post(
    `${process.env.ES_BASE_URL}/internal/search/es`,
    {
      params: {
        index: 'makrosoh',
        body: {
          size: 100,
          query: {
            term: {
              item: itemNumber,
            },
          },
        },
      },
    },
    {
      auth: {
        username: process.env.ES_USERNAME!,
        password: process.env.ES_PASSWORD!,
      },
      headers: {
        'Content-Type': 'application/json',
        'kbn-xsrf': 'true',
      },
      timeout: 30000,
    }
  );

  return response.data;
}