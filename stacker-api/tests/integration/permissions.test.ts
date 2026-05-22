import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';
import { Queries } from '../../src/resolvers/queries';
import { ContentMutations } from '../../src/resolvers/mutations/content';
import { AdminMutations } from '../../src/resolvers/mutations/admin';

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Permission enforcement', () => {
  describe('unauthenticated users', () => {
    const ctx = () => makeTestContext('unauthenticated');

    it('can list books (public)', async () => {
      const books = await Queries.books(null, {}, ctx());
      expect(books.length).toBeGreaterThanOrEqual(0);
    });

    it('can list authors (public)', async () => {
      const authors = await Queries.authors(null, {}, ctx());
      expect(authors.length).toBeGreaterThanOrEqual(0);
    });

    it('cannot manage books', async () => {
      await expect(
        ContentMutations.upsertBook(null, {
          input: { title: 'X', authorId: C.AUTHOR_TOLKIEN_ID },
        }, ctx())
      ).rejects.toThrow('Not authenticated');
    });

    it('cannot manage authors', async () => {
      await expect(
        ContentMutations.upsertAuthor(null, { input: { name: 'X' } }, ctx())
      ).rejects.toThrow('Not authenticated');
    });

    it('cannot manage reviews', async () => {
      await expect(
        ContentMutations.upsertReview(null, {
          input: { bookId: C.BOOK_HOBBIT_ID, rating: 5 },
        }, ctx())
      ).rejects.toThrow('Not authenticated');
    });

    it('cannot list users', async () => {
      await expect(
        Queries.users(null, {}, ctx())
      ).rejects.toThrow('Not authenticated');
    });

    it('cannot manage groups', async () => {
      await expect(
        AdminMutations.createGroup(null, { input: { name: 'X', permissions: [] } }, ctx())
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('member (limited permissions)', () => {
    const ctx = () => makeTestContext('member');

    it('cannot manage books', async () => {
      await expect(
        ContentMutations.upsertBook(null, {
          input: { title: 'X', authorId: C.AUTHOR_TOLKIEN_ID },
        }, ctx())
      ).rejects.toThrow('Access denied');
    });

    it('cannot manage authors', async () => {
      await expect(
        ContentMutations.upsertAuthor(null, { input: { name: 'X' } }, ctx())
      ).rejects.toThrow('Access denied');
    });

    it('can manage reviews', async () => {
      const review = await ContentMutations.upsertReview(null, {
        input: { bookId: C.BOOK_HOBBIT_ID, rating: 4 },
      }, ctx());
      expect(review.rating).toBe(4);

      // Clean up
      await testPrisma.reviews.delete({ where: { id: review.id } });
    });

    it('cannot manage users', async () => {
      await expect(
        Queries.users(null, {}, ctx())
      ).rejects.toThrow('Access denied');
    });

    it('cannot manage groups', async () => {
      await expect(
        AdminMutations.createGroup(null, { input: { name: 'X', permissions: [] } }, ctx())
      ).rejects.toThrow('Access denied');
    });
  });

  describe('editor (content permissions)', () => {
    const ctx = () => makeTestContext('editor');

    it('can manage books', async () => {
      const book = await ContentMutations.upsertBook(null, {
        input: { title: 'Editor Book', authorId: C.AUTHOR_TOLKIEN_ID },
      }, ctx());
      expect(book.title).toBe('Editor Book');

      await testPrisma.books.delete({ where: { id: book.id } });
    });

    it('can manage authors', async () => {
      const author = await ContentMutations.upsertAuthor(null, {
        input: { name: 'Editor Author' },
      }, ctx());
      expect(author.name).toBe('Editor Author');

      await testPrisma.authors.delete({ where: { id: author.id } });
    });

    it('cannot manage reviews', async () => {
      await expect(
        ContentMutations.upsertReview(null, {
          input: { bookId: C.BOOK_HOBBIT_ID, rating: 5 },
        }, ctx())
      ).rejects.toThrow('Access denied');
    });

    it('cannot manage users', async () => {
      await expect(
        AdminMutations.inviteUser(null, { email: 'x@test.com', groupIds: [] }, ctx())
      ).rejects.toThrow('Access denied');
    });
  });

  describe('admin (all permissions)', () => {
    const ctx = () => makeTestContext('admin');

    it('can manage books', async () => {
      const book = await ContentMutations.upsertBook(null, {
        input: { title: 'Admin Book', authorId: C.AUTHOR_TOLKIEN_ID },
      }, ctx());
      expect(book.title).toBe('Admin Book');

      await testPrisma.books.delete({ where: { id: book.id } });
    });

    it('can manage users', async () => {
      const users = await Queries.users(null, {}, ctx());
      expect(users.length).toBeGreaterThan(0);
    });

    it('can manage groups', async () => {
      const groups = await Queries.groups(null, {}, ctx());
      expect(groups.length).toBeGreaterThan(0);
    });
  });
});
