#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { GET_BOOKS, GET_AUTHORS } from './queries.js';

function createClient(): GraphQLClient {
  const apiUrl = process.env.STACKER_API_URL;
  const apiKey = process.env.STACKER_API_KEY;

  if (!apiUrl) {
    console.error('Error: STACKER_API_URL is not set. Check your .env file.');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('Error: STACKER_API_KEY is not set. Check your .env file.');
    process.exit(1);
  }

  return new GraphQLClient(apiUrl, {
    headers: {
      'X-Api-Key': apiKey,
    },
  });
}

const program = new Command();

program
  .name('stacker')
  .description('Stacker CLI — data export and seed generation for the Stacker GraphQL API')
  .version('0.1.0')
  .option('--export-books', 'Export all books as JSON')
  .option('--export-authors', 'Export all authors as JSON')
  .option('--seed-data', 'Output seed data (JSON) for demo data');

program.parse();

const opts = program.opts();

async function main() {
  const client = createClient();

  if (opts.exportBooks) {
    console.log('Exporting books...\n');
    const data = await client.request<{ books: unknown[] }>(GET_BOOKS);
    console.log(JSON.stringify(data.books, null, 2));
    return;
  }

  if (opts.exportAuthors) {
    console.log('Exporting authors...\n');
    const data = await client.request<{ authors: unknown[] }>(GET_AUTHORS);
    console.log(JSON.stringify(data.authors, null, 2));
    return;
  }

  if (opts.seedData) {
    console.log('Generating seed data...\n');
    const [booksData, authorsData] = await Promise.all([
      client.request<{ books: unknown[] }>(GET_BOOKS),
      client.request<{ authors: unknown[] }>(GET_AUTHORS),
    ]);

    const seed = {
      exportedAt: new Date().toISOString(),
      authors: authorsData.authors,
      books: booksData.books,
    };

    console.log(JSON.stringify(seed, null, 2));
    return;
  }

  program.help();
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
