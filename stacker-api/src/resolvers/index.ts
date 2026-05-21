import { Queries } from './queries';
import { AuthMutations } from './mutations/auth';
import { ContentMutations } from './mutations/content';
import { AdminMutations } from './mutations/admin';

export const resolvers = {
  Query: { ...Queries },
  Mutation: { ...AuthMutations, ...ContentMutations, ...AdminMutations },
};
