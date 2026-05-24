import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/prerequisites', 'getting-started/local-setup', 'getting-started/project-structure'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/overview', 'api/context', 'api/authentication', 'api/permissions', 'api/graphql-schema', 'api/resolvers'],
    },
    {
      type: 'category',
      label: 'UI',
      items: ['ui/overview', 'ui/routing', 'ui/components', 'ui/forms'],
    },
    {
      type: 'category',
      label: 'Database',
      items: ['database/schema', 'database/migrations', 'database/seeding'],
    },
    'testing',
    'environment',
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/docker', 'deployment/ci-cd', 'deployment/versioning'],
    },
  ],
};
export default sidebars;
