import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { SetContextLink } from '@apollo/client/link/context';
import { env } from './env';

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
    link: authLink.concat(httpLink),
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
