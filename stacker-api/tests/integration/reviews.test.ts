import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';
import { ContentMutations } from '../../src/resolvers/mutations/content';
import { Queries } from '../../src/resolvers/queries';

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Reviews', () => {
  beforeEach(async () => {
    await testPrisma.reviews.deleteMany({});
  });

  describe('mutations', () => {
    it('creates a review', async () => {
      const ctx = makeTestContext('member');
      const review = await ContentMutations.upsertReview(null, {
        input: { bookId: C.BOOK_HOBBIT_ID, rating: 5, text: 'Wonderful!' },
      }, ctx);
      expect(review.rating).toBe(5);
      expect(review.text).toBe('Wonderful!');
      expect(review.bookId).toBe(C.BOOK_HOBBIT_ID);
      expect(review.userId).toBe(C.MEMBER_USER_ID);
    });

    it('updates a review', async () => {
      const ctx = makeTestContext('member');
      const created = await ContentMutations.upsertReview(null, {
        input: { bookId: C.BOOK_HOBBIT_ID, rating: 4 },
      }, ctx);

      const updated = await ContentMutations.upsertReview(null, {
        input: { id: created.id, bookId: C.BOOK_HOBBIT_ID, rating: 3, text: 'Changed my mind.' },
      }, ctx);
      expect(updated.rating).toBe(3);
      expect(updated.text).toBe('Changed my mind.');
    });

    it('validates rating range (1-5)', async () => {
      const ctx = makeTestContext('member');
      await expect(
        ContentMutations.upsertReview(null, {
          input: { bookId: C.BOOK_HOBBIT_ID, rating: 0 },
        }, ctx)
      ).rejects.toThrow('must be between 1 and 5');

      await expect(
        ContentMutations.upsertReview(null, {
          input: { bookId: C.BOOK_HOBBIT_ID, rating: 6 },
        }, ctx)
      ).rejects.toThrow('must be between 1 and 5');
    });

    it('rejects without reviews.manage permission', async () => {
      const ctx = makeTestContext('editor');
      await expect(
        ContentMutations.upsertReview(null, {
          input: { bookId: C.BOOK_HOBBIT_ID, rating: 5 },
        }, ctx)
      ).rejects.toThrow('Access denied');
    });

    it('deletes a review', async () => {
      const ctx = makeTestContext('member');
      const created = await ContentMutations.upsertReview(null, {
        input: { bookId: C.BOOK_1984_ID, rating: 4 },
      }, ctx);

      const result = await ContentMutations.deleteReview(null, { id: created.id }, ctx);
      expect(result).toBe(true);

      const found = await testPrisma.reviews.findUnique({ where: { id: created.id } });
      expect(found).toBeNull();
    });
  });

  describe('queries', () => {
    it('returns reviews for a book', async () => {
      // Seed a review
      await testPrisma.reviews.create({
        data: { book_id: C.BOOK_HOBBIT_ID, user_id: C.MEMBER_USER_ID, rating: 5, text: 'Great!' },
      });

      const ctx = makeTestContext('admin');
      const reviews = await Queries.bookReviews(null, { bookId: C.BOOK_HOBBIT_ID }, ctx);
      expect(reviews).toHaveLength(1);
      expect(reviews[0].rating).toBe(5);
      expect(reviews[0].userName).toBe('Member User');
    });

    it('returns empty array for book with no reviews', async () => {
      const ctx = makeTestContext('admin');
      const reviews = await Queries.bookReviews(null, { bookId: C.BOOK_1984_ID }, ctx);
      expect(reviews).toHaveLength(0);
    });
  });
});
