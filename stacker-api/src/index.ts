import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { logger } from './logger';

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
      context: async ({ req }) => createContext(req),
    })
  );

  const port = parseInt(process.env.PORT ?? '4000', 10);
  app.listen(port, () => {
    logger.info({ port }, `Stacker API running on http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start API');
  process.exit(1);
});
