import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { seedTestData } from './setup/seed';
import { resetDatabase } from './setup/truncate';
import { Queries } from '../../src/resolvers/queries';
import { ContentMutations } from '../../src/resolvers/mutations/content';
import * as C from './setup/constants';

describe('Books', () => {
  beforeAll(async () => {
    await resetDatabase(testPrisma);
    await seedTestData(testPrisma);
  });

  beforeEach(async () => {
    // Clean up reviews between tests (books/authors persist from seed)
    await testPrisma.reviews.deleteMany({});
  });

  describe('queries', () => {
    it('returns all books', async () => {
      const ctx = makeTestContext('admin');
      const books = await Queries.books(null, {}, ctx);
      expect(books).toHaveLength(2);
      expect(books.map((b: { title: string }) => b.title)).toContain('The Hobbit');
      expect(books.map((b: { title: string }) => b.title)).toContain('1984');
    });

    it('filters books by genre', async () => {
      const ctx = makeTestContext('admin');
      const books = await Queries.books(null, { genre: 'Fantasy' }, ctx);
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('The Hobbit');
    });

    it('returns a single book by id', async () => {
      const ctx = makeTestContext('admin');
      const book = await Queries.book(null, { id: C.BOOK_HOBBIT_ID }, ctx);
      expect(book).not.toBeNull();
      expect(book!.title).toBe('The Hobbit');
      expect(book!.author.name).toBe('J.R.R. Tolkien');
    });

    it('returns null for non-existent book', async () => {
      const ctx = makeTestContext('admin');
      const book = await Queries.book(null, { id: 'does-not-exist' }, ctx);
      expect(book).toBeNull();
    });
  });

  describe('mutations', () => {
    it('creates a new book', async () => {
      const ctx = makeTestContext('admin');
      const book = await ContentMutations.upsertBook(null, {
        input: { title: 'Animal Farm', authorId: C.AUTHOR_ORWELL_ID, genre: 'Satire' },
      }, ctx);
      expect(book.title).toBe('Animal Farm');
      expect(book.genre).toBe('Satire');

      // Clean up
      await testPrisma.books.delete({ where: { id: book.id } });
    });

    it('updates an existing book', async () => {
      const ctx = makeTestContext('admin');
      const book = await ContentMutations.upsertBook(null, {
        input: { id: C.BOOK_HOBBIT_ID, title: 'The Hobbit (Updated)', authorId: C.AUTHOR_TOLKIEN_ID },
      }, ctx);
      expect(book.title).toBe('The Hobbit (Updated)');

      // Restore original title
      await testPrisma.books.update({ where: { id: C.BOOK_HOBBIT_ID }, data: { title: 'The Hobbit' } });
    });

    it('rejects upsert without books.manage permission', async () => {
      const ctx = makeTestContext('member');
      await expect(
        ContentMutations.upsertBook(null, {
          input: { title: 'Blocked', authorId: C.AUTHOR_ORWELL_ID },
        }, ctx)
      ).rejects.toThrow('Access denied');
    });

    it('deletes a book', async () => {
      const ctx = makeTestContext('admin');
      const created = await testPrisma.books.create({
        data: { title: 'To Delete', author_id: C.AUTHOR_TOLKIEN_ID },
      });
      const result = await ContentMutations.deleteBook(null, { id: created.id }, ctx);
      expect(result).toBe(true);

      const found = await testPrisma.books.findUnique({ where: { id: created.id } });
      expect(found).toBeNull();
    });
  });
});
