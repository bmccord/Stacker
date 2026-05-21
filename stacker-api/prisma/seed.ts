/**
 * Seed script — creates default groups, admin user, and sample data.
 * Idempotent: skips if data already exists.
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import type { PrismaClient } from '../src/generated/prisma/client';
import prismaModule from '../src/context/prisma';
import { seedDefaultGroups } from '../src/permissions';

async function main() {
  const prisma = prismaModule;

  // Seed default permission groups
  console.log('Seeding permission groups...');
  await seedDefaultGroups(prisma);

  // Seed admin user
  const email = process.env.SEED_ADMIN_EMAIL;
  if (email) {
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
    const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
    const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'User';
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.users.findUnique({ where: { email } });
    if (!existing) {
      const user = await prisma.users.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          email_verified_at: new Date(),
        },
      });

      // Add to Administrators group
      const adminGroup = await prisma.groups.findUnique({ where: { slug: 'administrators' } });
      if (adminGroup) {
        await prisma.user_groups.create({ data: { user_id: user.id, group_id: adminGroup.id } });
      }

      console.log(`Admin user seeded: ${email}`);
    } else {
      // Update password in case it changed
      await prisma.users.update({
        where: { id: existing.id },
        data: { password_hash: passwordHash, first_name: firstName, last_name: lastName },
      });
      console.log(`Admin user updated: ${email}`);
    }
  }

  // Seed sample data (skip if books already exist)
  const bookCount = await prisma.books.count();
  if (bookCount > 0) {
    console.log('Sample data already exists — skipping.');
    return;
  }

  console.log('Seeding sample data...');

  // Authors
  const authors = await Promise.all([
    prisma.authors.create({ data: { name: 'J.R.R. Tolkien', bio: 'English writer and philologist, best known for The Hobbit and The Lord of the Rings.' } }),
    prisma.authors.create({ data: { name: 'George Orwell', bio: 'English novelist and essayist, known for 1984 and Animal Farm.' } }),
    prisma.authors.create({ data: { name: 'Jane Austen', bio: 'English novelist known for her keen social observations and wit.' } }),
    prisma.authors.create({ data: { name: 'Frank Herbert', bio: 'American science fiction author, best known for the Dune series.' } }),
    prisma.authors.create({ data: { name: 'Harper Lee', bio: 'American novelist widely known for To Kill a Mockingbird.' } }),
  ]);

  // Books
  await Promise.all([
    prisma.books.create({ data: { title: 'The Hobbit', author_id: authors[0].id, genre: 'Fantasy', description: 'A hobbit named Bilbo Baggins embarks on an unexpected adventure with a wizard and thirteen dwarves.' } }),
    prisma.books.create({ data: { title: 'The Lord of the Rings', author_id: authors[0].id, genre: 'Fantasy', description: 'An epic tale of friendship, courage, and the battle between good and evil in Middle-earth.' } }),
    prisma.books.create({ data: { title: '1984', author_id: authors[1].id, genre: 'Dystopian', description: 'A chilling prophecy about a totalitarian regime that controls every aspect of life.' } }),
    prisma.books.create({ data: { title: 'Animal Farm', author_id: authors[1].id, genre: 'Satire', description: 'A farm is taken over by its overworked, mistreated animals in a satirical allegory.' } }),
    prisma.books.create({ data: { title: 'Pride and Prejudice', author_id: authors[2].id, genre: 'Romance', description: 'The story of Elizabeth Bennet and her complicated relationship with the proud Mr. Darcy.' } }),
    prisma.books.create({ data: { title: 'Sense and Sensibility', author_id: authors[2].id, genre: 'Romance', description: 'Two sisters navigate love, heartbreak, and societal expectations in Georgian-era England.' } }),
    prisma.books.create({ data: { title: 'Dune', author_id: authors[3].id, genre: 'Science Fiction', description: 'A young nobleman becomes embroiled in the politics and ecology of a desert planet.' } }),
    prisma.books.create({ data: { title: 'To Kill a Mockingbird', author_id: authors[4].id, genre: 'Literary Fiction', description: 'A young girl in the American South witnesses her father defend a Black man accused of a terrible crime.' } }),
  ]);

  console.log('Sample data seeded: 5 authors, 8 books.');
}

main()
  .finally(() => prismaModule.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
