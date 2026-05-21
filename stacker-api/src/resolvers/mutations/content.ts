import { GraphQLContext } from '../../context';
import { requirePermission, validateRequired, validateMaxLength, validateRange } from '../helpers';

export const ContentMutations = {
  // ── Books ──────────────────────────────────────────────────────────────

  upsertBook: async (_: unknown, { input }: { input: { id?: string; title: string; authorId: string; genre?: string; description?: string; coverUrl?: string } }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'books.manage');
    validateRequired(input.title, 'Title');
    validateMaxLength(input.title, 300, 'Title');
    validateRequired(input.authorId, 'Author');

    if (input.id) {
      const book = await ctx.prisma.books.update({
        where: { id: input.id },
        data: {
          title: input.title,
          author_id: input.authorId,
          genre: input.genre ?? null,
          description: input.description ?? null,
          cover_url: input.coverUrl ?? null,
        },
        include: { authors: true, reviews: true },
      });
      ctx.log.info({ bookId: input.id }, 'Updated book');
      return mapBook(book);
    }

    const book = await ctx.prisma.books.create({
      data: {
        title: input.title,
        author_id: input.authorId,
        genre: input.genre ?? null,
        description: input.description ?? null,
        cover_url: input.coverUrl ?? null,
      },
      include: { authors: true, reviews: true },
    });
    ctx.log.info({ bookId: book.id }, 'Created book');
    return mapBook(book);
  },

  deleteBook: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'books.manage');
    await ctx.prisma.books.delete({ where: { id } });
    ctx.log.info({ bookId: id }, 'Deleted book');
    return true;
  },

  // ── Authors ────────────────────────────────────────────────────────────

  upsertAuthor: async (_: unknown, { input }: { input: { id?: string; name: string; bio?: string } }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'authors.manage');
    validateRequired(input.name, 'Name');
    validateMaxLength(input.name, 200, 'Name');

    if (input.id) {
      const author = await ctx.prisma.authors.update({
        where: { id: input.id },
        data: { name: input.name, bio: input.bio ?? null },
        include: { _count: { select: { books: true } } },
      });
      ctx.log.info({ authorId: input.id }, 'Updated author');
      return mapAuthor(author);
    }

    const author = await ctx.prisma.authors.create({
      data: { name: input.name, bio: input.bio ?? null },
      include: { _count: { select: { books: true } } },
    });
    ctx.log.info({ authorId: author.id }, 'Created author');
    return mapAuthor(author);
  },

  deleteAuthor: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'authors.manage');
    await ctx.prisma.authors.delete({ where: { id } });
    ctx.log.info({ authorId: id }, 'Deleted author');
    return true;
  },

  // ── Reviews ────────────────────────────────────────────────────────────

  upsertReview: async (_: unknown, { input }: { input: { id?: string; bookId: string; rating: number; text?: string } }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'reviews.manage');
    validateRequired(input.bookId, 'Book');
    validateRange(input.rating, 1, 5, 'Rating');

    if (input.id) {
      const review = await ctx.prisma.reviews.update({
        where: { id: input.id },
        data: { rating: input.rating, text: input.text ?? null },
        include: { users: true },
      });
      ctx.log.info({ reviewId: input.id }, 'Updated review');
      return mapReview(review);
    }

    const review = await ctx.prisma.reviews.create({
      data: {
        book_id: input.bookId,
        user_id: ctx.userId!,
        rating: input.rating,
        text: input.text ?? null,
      },
      include: { users: true },
    });
    ctx.log.info({ reviewId: review.id }, 'Created review');
    return mapReview(review);
  },

  deleteReview: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'reviews.manage');
    await ctx.prisma.reviews.delete({ where: { id } });
    ctx.log.info({ reviewId: id }, 'Deleted review');
    return true;
  },
};

// ── Mappers ────────────────────────────────────────────────────────────────

type BookWithRelations = { id: string; title: string; author_id: string; genre: string | null; description: string | null; cover_url: string | null; created_at: Date; authors: { id: string; name: string; bio: string | null; created_at: Date; updated_at: Date }; reviews: { rating: number }[] };

function mapBook(b: BookWithRelations) {
  const ratings = b.reviews.map((r) => r.rating);
  const avg = ratings.length > 0 ? ratings.reduce((a, c) => a + c, 0) / ratings.length : null;
  return {
    id: b.id,
    title: b.title,
    authorId: b.author_id,
    author: { id: b.authors.id, name: b.authors.name, bio: b.authors.bio, bookCount: 0, createdAt: b.authors.created_at.toISOString() },
    genre: b.genre,
    description: b.description,
    coverUrl: b.cover_url,
    averageRating: avg,
    reviewCount: b.reviews.length,
    createdAt: b.created_at.toISOString(),
  };
}

type AuthorWithCount = { id: string; name: string; bio: string | null; created_at: Date; _count: { books: number } };

function mapAuthor(a: AuthorWithCount) {
  return {
    id: a.id,
    name: a.name,
    bio: a.bio,
    bookCount: a._count.books,
    createdAt: a.created_at.toISOString(),
  };
}

type ReviewWithUser = { id: string; book_id: string; user_id: string; rating: number; text: string | null; created_at: Date; users: { first_name: string | null; last_name: string | null } };

function mapReview(r: ReviewWithUser) {
  const name = [r.users.first_name, r.users.last_name].filter(Boolean).join(' ') || 'Anonymous';
  return {
    id: r.id,
    bookId: r.book_id,
    userId: r.user_id,
    userName: name,
    rating: r.rating,
    text: r.text,
    createdAt: r.created_at.toISOString(),
  };
}
