/**
 * Creates (or resets the password of) an admin account.
 * Usage: npm run admin:create -- <email> "<Name>" [password]
 * Without a password, a strong random one is generated and printed once.
 */
import { config } from 'dotenv';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { d1Raw } from '../src/server/db/d1';

config({ path: '.env.local' });
const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

async function main() {
  const [email, name = 'WOW Admin', given] = process.argv.slice(2);
  if (!email?.includes('@')) {
    console.error('Usage: npm run admin:create -- <email> "<Name>" [password]');
    process.exit(1);
  }
  const password = given ?? randomBytes(12).toString('base64url');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const salt = randomBytes(16);
  const hash = `scrypt$${salt.toString('base64')}$${(await scrypt(password, salt, 64)).toString('base64')}`;
  await d1Raw(
    `INSERT INTO admins (email, name, password_hash) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`,
    [email.toLowerCase(), name, hash],
  );
  console.log(`✓ Admin ready: ${email.toLowerCase()}`);
  if (!given) console.log(`  Temporary password: ${password}\n  Change it after signing in (Admin → Account).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
