import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';
import { Queries } from '../../src/resolvers/queries';
import { ContentMutations } from '../../src/resolvers/mutations/content';

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Authors', () => {
  describe('queries', () => {
    it('lists all authors', async () => {
      const ctx = makeTestContext('admin');
      const authors = await Queries.authors(null, {}, ctx);
      expect(authors).toHaveLength(2);
      expect(authors.map((a: { name: string }) => a.name)).toContain('J.R.R. Tolkien');
      expect(authors.map((a: { name: string }) => a.name)).toContain('George Orwell');
    });

    it('returns author with book count', async () => {
      const ctx = makeTestContext('admin');
      const author = await Queries.author(null, { id: C.AUTHOR_TOLKIEN_ID }, ctx);
      expect(author).not.toBeNull();
      expect(author!.name).toBe('J.R.R. Tolkien');
      expect(author!.bookCount).toBe(1);
    });

    it('returns null for non-existent author', async () => {
      const ctx = makeTestContext('admin');
      const author = await Queries.author(null, { id: 'does-not-exist' }, ctx);
      expect(author).toBeNull();
    });
  });

  describe('mutations', () => {
    it('creates a new author', async () => {
      const ctx = makeTestContext('admin');
      const author = await ContentMutations.upsertAuthor(null, {
        input: { name: 'Jane Austen', bio: 'English novelist.' },
      }, ctx);
      expect(author.name).toBe('Jane Austen');
      expect(author.bio).toBe('English novelist.');

      // Clean up
      await testPrisma.authors.delete({ where: { id: author.id } });
    });

    it('updates an existing author', async () => {
      const ctx = makeTestContext('admin');
      const author = await ContentMutations.upsertAuthor(null, {
        input: { id: C.AUTHOR_ORWELL_ID, name: 'George Orwell (Updated)', bio: 'Updated bio.' },
      }, ctx);
      expect(author.name).toBe('George Orwell (Updated)');

      // Restore
      await testPrisma.authors.update({
        where: { id: C.AUTHOR_ORWELL_ID },
        data: { name: 'George Orwell', bio: 'English novelist and essayist.' },
      });
    });

    it('rejects create without authors.manage permission', async () => {
      const ctx = makeTestContext('member');
      await expect(
        ContentMutations.upsertAuthor(null, { input: { name: 'Blocked' } }, ctx)
      ).rejects.toThrow('Access denied');
    });

    it('validates name is required', async () => {
      const ctx = makeTestContext('admin');
      await expect(
        ContentMutations.upsertAuthor(null, { input: { name: '' } }, ctx)
      ).rejects.toThrow('Name is required');
    });

    it('validates name max length', async () => {
      const ctx = makeTestContext('admin');
      await expect(
        ContentMutations.upsertAuthor(null, { input: { name: 'x'.repeat(201) } }, ctx)
      ).rejects.toThrow('200');
    });

    it('deletes an author', async () => {
      const ctx = makeTestContext('admin');
      const created = await testPrisma.authors.create({ data: { name: 'To Delete' } });
      const result = await ContentMutations.deleteAuthor(null, { id: created.id }, ctx);
      expect(result).toBe(true);
    });
  });
});
