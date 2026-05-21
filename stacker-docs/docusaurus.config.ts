import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Stacker Docs',
  tagline: 'Developer documentation for the Stacker starter kit',
  favicon: 'img/favicon.ico',
  url: 'https://docs.example.com',
  baseUrl: '/',
  organizationName: 'your-org',
  projectName: 'stacker',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    ['classic', {
      docs: { routeBasePath: '/', sidebarPath: './sidebars.ts' },
      blog: false,
      theme: { customCss: './src/css/custom.css' },
    } satisfies Preset.Options],
  ],
  themeConfig: {
    navbar: {
      title: 'Stacker Docs',
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { href: 'https://github.com/your-org/stacker', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Built with Docusaurus.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
