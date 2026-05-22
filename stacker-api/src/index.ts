import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { logger } from './logger';
import prisma from './context/prisma';

/** Delete expired password reset and email verification tokens. */
async function cleanupExpiredTokens() {
  try {
    const { count: resetCount } = await prisma.users.updateMany({
      where: {
        password_reset_expires_at: { lt: new Date() },
        password_reset_token: { not: null },
      },
      data: { password_reset_token: null, password_reset_expires_at: null },
    });
    const { count: verifyCount } = await prisma.users.updateMany({
      where: {
        email_verification_expires_at: { lt: new Date() },
        email_verification_token: { not: null },
      },
      data: { email_verification_token: null, email_verification_expires_at: null },
    });
    if (resetCount > 0 || verifyCount > 0) {
      logger.info({ resetCount, verifyCount }, 'Cleaned up expired tokens');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to clean up expired tokens');
  }
}

async function main() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req as unknown as express.Request),
    }) as unknown as express.RequestHandler
  );

  const port = parseInt(process.env.PORT ?? '4000', 10);
  const httpServer = app.listen(port, () => {
    logger.info({ port }, `Stacker API running on http://localhost:${port}/graphql`);

    // Clean up expired tokens on startup and every hour
    cleanupExpiredTokens();
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
  });

  // Graceful shutdown — ensures the port is freed when the process is killed
  function shutdown() {
    logger.info('Shutting down...');
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 3000); // force exit after 3s
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error(err, 'Failed to start API');
  process.exit(1);
});
