import { Link } from 'react-router-dom';
import { Library, Code, Shield, Layers, Terminal, TestTube, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <Code className="h-6 w-6" />,
    title: 'GraphQL + React',
    description: 'Apollo Server 4, Express, Prisma 7 on the backend. React 19, Vite, Apollo Client, shadcn/ui on the frontend.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Auth & Permissions',
    description: 'Custom JWT authentication with bcrypt, role-based permission groups, and route-level access control.',
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: 'Production-Ready',
    description: 'Docker containers, CI/CD with GitHub Actions, multi-tier deployment (dev, test, prod), and structured logging.',
  },
  {
    icon: <Terminal className="h-6 w-6" />,
    title: 'Developer Experience',
    description: 'One-command setup, Husky git hooks, Doppler env management, hot reload, and port conflict handling.',
  },
  {
    icon: <TestTube className="h-6 w-6" />,
    title: 'Full Test Suite',
    description: 'Unit tests (Vitest), integration tests with Docker MariaDB, and end-to-end tests with Playwright.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Library className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">Stacker</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A production-ready GraphQL + React starter kit built with modern TypeScript.
            Clone it, run one command, and start building.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/sign-in">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://github.com/bmccord/Stacker" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need to get started</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="border rounded-xl p-6 bg-white shadow-sm">
                <div className="text-primary mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example App */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Included: Bookshelf App</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            The starter kit includes a fully functional bookshelf application demonstrating
            all the patterns — books, authors, reviews, user management, and permission groups.
            Use it as a reference or rip it out and build your own.
          </p>
          <Button asChild variant="outline">
            <Link to="/sign-in">
              Try the Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Get started in 3 commands</h2>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm leading-relaxed">
            <div className="text-gray-400"># Clone and set up</div>
            <div>git clone https://github.com/bmccord/Stacker.git</div>
            <div>cd Stacker && cd stacker-api && yarn install && cd ../stacker-ui && yarn install && cd ..</div>
            <div>yarn init-env</div>
            <div className="mt-4 text-gray-400"># Start developing</div>
            <div>cd stacker-api && yarn dev</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        Built with TypeScript, React, GraphQL, and Prisma.
      </footer>
    </div>
  );
}
