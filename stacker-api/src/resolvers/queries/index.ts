import { GraphQLContext } from '../../context';
import { requirePermission } from '../helpers';
import { PERMISSION_GROUPS } from '../../permissions';
import { readLogs, levelLabel } from '../../logger';

export const Queries = {
  // ── Public ──────────────────────────────────────────────────────────────

  books: async (_: unknown, { genre }: { genre?: string }, ctx: GraphQLContext) => {
    const where = genre ? { genre } : {};
    const books = await ctx.prisma.books.findMany({
      where,
      include: { authors: true, reviews: true },
      orderBy: { created_at: 'desc' },
    });
    return books.map(mapBook);
  },

  book: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const book = await ctx.prisma.books.findUnique({
      where: { id },
      include: { authors: true, reviews: true },
    });
    if (!book) return null;
    return mapBook(book);
  },

  authors: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const authors = await ctx.prisma.authors.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    });
    return authors.map((a: typeof authors[number]) => ({
      id: a.id,
      name: a.name,
      bio: a.bio,
      bookCount: a._count.books,
      createdAt: a.created_at.toISOString(),
    }));
  },

  author: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const a = await ctx.prisma.authors.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!a) return null;
    return { id: a.id, name: a.name, bio: a.bio, bookCount: a._count.books, createdAt: a.created_at.toISOString() };
  },

  bookReviews: async (_: unknown, { bookId }: { bookId: string }, ctx: GraphQLContext) => {
    const reviews = await ctx.prisma.reviews.findMany({
      where: { book_id: bookId },
      include: { users: true },
      orderBy: { created_at: 'desc' },
    });
    return reviews.map(mapReview);
  },

  // ── Authenticated ───────────────────────────────────────────────────────

  me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return null;
    const user = await ctx.prisma.users.findUnique({ where: { id: ctx.userId } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: !!user.email_verified_at,
      createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    };
  },

  myPermissions: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return [];
    return Array.from(ctx.permissions);
  },

  dashboardStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const [bookCount, authorCount, reviewCount, userCount] = await Promise.all([
      ctx.prisma.books.count(),
      ctx.prisma.authors.count(),
      ctx.prisma.reviews.count(),
      ctx.prisma.users.count(),
    ]);
    return { bookCount, authorCount, reviewCount, userCount };
  },

  allPermissions: () => PERMISSION_GROUPS,

  // ── Admin ───────────────────────────────────────────────────────────────

  users: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    const users = await ctx.prisma.users.findMany({
      where: { password_hash: { not: null } },
      include: { user_groups: { include: { groups: { include: { permissions: true, _count: { select: { members: true } } } } } } },
      orderBy: { created_at: 'asc' },
    });
    return users.map((u: typeof users[number]) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      emailVerified: !!u.email_verified_at,
      groups: u.user_groups.map((ug: typeof u.user_groups[number]) => ({
        id: ug.groups.id,
        name: ug.groups.name,
        slug: ug.groups.slug,
        description: ug.groups.description,
        isSystem: ug.groups.is_system,
        permissions: ug.groups.permissions.map((p: { permission: string }) => p.permission),
        memberCount: ug.groups._count.members,
      })),
      createdAt: u.created_at.toISOString(),
    }));
  },

  groups: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    const groups = await ctx.prisma.groups.findMany({
      include: { permissions: true, _count: { select: { members: true } } },
      orderBy: { sort_order: 'asc' },
    });
    return groups.map((g: typeof groups[number]) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      isSystem: g.is_system,
      permissions: g.permissions.map((p: { permission: string }) => p.permission),
      memberCount: g._count.members,
    }));
  },

  group: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    const g = await ctx.prisma.groups.findUnique({
      where: { id },
      include: { permissions: true, _count: { select: { members: true } } },
    });
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      isSystem: g.is_system,
      permissions: g.permissions.map((p: { permission: string }) => p.permission),
      memberCount: g._count.members,
    };
  },

  // ── System ──────────────────────────────────────────────────────────────

  systemLogs: (_: unknown, args: {
    limit?: number;
    offset?: number;
    level?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'settings.manage');

    const { entries, total } = readLogs(args);

    return {
      entries: entries.map((e) => ({
        level: e.level,
        levelLabel: levelLabel(e.level),
        time: typeof e.time === 'number' ? new Date(e.time).toISOString() : e.time,
        msg: e.msg ?? '',
        data: JSON.stringify(
          Object.fromEntries(
            Object.entries(e).filter(([k]) => !['level', 'time', 'msg', 'pid', 'hostname'].includes(k))
          )
        ),
      })),
      total,
    };
  },

  systemLogLevel: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requirePermission(ctx, 'settings.manage');
    return process.env.LOG_LEVEL ?? 'info';
  },

  apiVersion: () => process.env.APP_VERSION ?? 'dev',
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapBook(b: { id: string; title: string; author_id: string; genre: string | null; description: string | null; cover_url: string | null; created_at: Date; authors: { id: string; name: string; bio: string | null; created_at: Date }; reviews: { rating: number }[] }) {
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

function mapReview(r: { id: string; book_id: string; user_id: string; rating: number; text: string | null; created_at: Date; users: { first_name: string | null; last_name: string | null } }) {
  const name = [r.users.first_name, r.users.last_name].filter(Boolean).join(' ') || 'Anonymous';
  return { id: r.id, bookId: r.book_id, userId: r.user_id, userName: name, rating: r.rating, text: r.text, createdAt: r.created_at.toISOString() };
}
