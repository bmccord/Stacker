import { useQuery } from '@apollo/client/react';
import { GET_MY_PERMISSIONS } from '@/graphql/queries';
import { useAuth } from './use-auth';

/**
 * Returns the current user's permission set.
 * Fetches from the API on mount and caches via Apollo.
 */
export function usePermissions(): Set<string> {
  const { isSignedIn } = useAuth();
  const { data } = useQuery<{ myPermissions: string[] }>(GET_MY_PERMISSIONS, {
    skip: !isSignedIn,
  });
  return new Set(data?.myPermissions ?? []);
}
