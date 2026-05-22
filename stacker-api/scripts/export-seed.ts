/**
 * Exports sample data (authors, books, reviews) to a JSON seed file.
 *
 * Usage: yarn seed:export
 *
 * This reads the current database and writes:
 *   prisma/seed-data/sample-data.json
 *
 * Commit the updated JSON file so that `yarn prisma db seed` can reproduce the content.
 */

import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import prisma from '../src/context/prisma';

interface ExportedAuthor {
  name: string;
  bio: string | null;
  books: ExportedBook[];
}

interface ExportedBook {
  title: string;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  reviews: ExportedReview[];
}

interface ExportedReview {
  rating: number;
  text: string | null;
  userEmail: string; // Reference by email instead of ID
}

interface ExportedSeedData {
  exportedAt: string;
  authors: ExportedAuthor[];
}

async function main() {
  const seedDataDir = join(__dirname, '..', 'prisma', 'seed-data');
  mkdirSync(seedDataDir, { recursive: true });

  // Build user ID → email map for portable references
  const users = await prisma.users.findMany({ select: { id: true, email: true } });
  const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

  // Fetch all authors with their books and reviews
  const authors = await prisma.authors.findMany({
    include: {
      books: {
        include: {
          reviews: { orderBy: { created_at: 'asc' } },
        },
        orderBy: { title: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const exportedAuthors: ExportedAuthor[] = authors.map((a) => ({
    name: a.name,
    bio: a.bio || null,
    books: a.books.map((b) => ({
      title: b.title,
      genre: b.genre || null,
      description: b.description || null,
      coverUrl: b.cover_url || null,
      reviews: b.reviews.map((r) => ({
        rating: r.rating,
        text: r.text || null,
        userEmail: userEmailMap.get(r.user_id) ?? 'unknown',
      })),
    })),
  }));

  const seedData: ExportedSeedData = {
    exportedAt: new Date().toISOString(),
    authors: exportedAuthors,
  };

  const outPath = join(seedDataDir, 'sample-data.json');
  writeFileSync(outPath, JSON.stringify(seedData, null, 2) + '\n');

  const totalBooks = exportedAuthors.reduce((sum, a) => sum + a.books.length, 0);
  const totalReviews = exportedAuthors.reduce(
    (sum, a) => sum + a.books.reduce((bs, b) => bs + b.reviews.length, 0),
    0
  );

  console.log(`Seed data exported to ${outPath}`);
  console.log(`  ${exportedAuthors.length} authors, ${totalBooks} books, ${totalReviews} reviews`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
