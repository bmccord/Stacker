/**
 * Resets the admin user's local dev password.
 *
 * Prompts for a new password, then:
 *   1. Updates the database
 *   2. Updates the .env file
 *   3. Pushes to Doppler
 *
 * Usage:
 *   yarn reset-password
 */

import 'dotenv/config';
import { createInterface } from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import bcrypt from 'bcrypt';
import prisma from '../src/context/prisma';

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.error('SEED_ADMIN_EMAIL must be set in .env');
    process.exit(1);
  }

  const password = await prompt('New password: ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  // 1. Update database
  const user = await prisma.users.findFirst({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: hash },
  });
  console.log(`\u2714 Database updated for ${email}`);

  // 2. Update .env file
  const envPath = join(__dirname, '..', '.env');
  let envContent = readFileSync(envPath, 'utf8');
  if (envContent.match(/^SEED_ADMIN_PASSWORD=.*/m)) {
    envContent = envContent.replace(/^SEED_ADMIN_PASSWORD=.*/m, `SEED_ADMIN_PASSWORD="${password}"`);
  } else {
    envContent += `\nSEED_ADMIN_PASSWORD="${password}"\n`;
  }
  writeFileSync(envPath, envContent);
  console.log('\u2714 .env updated');

  // 3. Push to Doppler
  try {
    execSync(`doppler secrets set API_SEED_ADMIN_PASSWORD="${password}" --project stacker --config "$(doppler configs --project stacker --json 2>/dev/null | python3 -c "import json,sys,os; username=os.popen('whoami').read().strip().lower(); configs=json.load(sys.stdin); print(next(c['name'] for c in configs if c['name']==f'local_{username}'))")" 2>/dev/null`, {
      stdio: 'pipe',
    });
    console.log('\u2714 Doppler updated');
  } catch {
    console.log('\u26a0 Doppler update skipped (not configured or not authenticated)');
  }

  console.log('\nPassword reset complete.');
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
