import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { SetContextLink } from '@apollo/client/link/context';
import { env } from './env';

function stripTypename(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripTypename);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => k !== '__typename')
        .map(([k, v]) => [k, stripTypename(v)])
    );
  }
  return value;
}

const omitTypenameLink = new ApolloLink((operation, forward) => {
  if (operation.variables) {
    operation.variables = stripTypename(operation.variables) as Record<string, unknown>;
  }
  return forward(operation);
});

function createClient() {
  const httpLink = new HttpLink({ uri: env('VITE_API_URL') ?? 'http://localhost:4000/graphql' });

  const authLink = new SetContextLink((prevContext) => {
    const token = localStorage.getItem('stacker_token');
    return {
      headers: {
        ...(prevContext.headers),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  return new ApolloClient({
    link: ApolloLink.from([omitTypenameLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

const client = createClient();

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
