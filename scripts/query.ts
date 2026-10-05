/** Run one SQL statement against D1 and print the rows.  Usage: npx tsx scripts/query.ts "SELECT * FROM settings" */
import { config } from 'dotenv';
import { d1Query } from '../src/server/db/d1';

config({ path: '.env.local' });

d1Query(process.argv[2] ?? 'SELECT 1')
  .then((rows) => console.log(JSON.stringify(rows, null, 1)))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
