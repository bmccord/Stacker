---
sidebar_position: 1
---

# Prerequisites

Before setting up Stacker locally, install the following.

## Required

### Node.js 24+

Stacker uses modern Node features and Prisma 7 requires Node 22+. We recommend Node 24 (LTS).

- **macOS:** `brew install node` or download from [nodejs.org](https://nodejs.org)
- **Windows:** Download the LTS installer from [nodejs.org](https://nodejs.org), or use [nvm-windows](https://github.com/coreybutler/nvm-windows): `nvm install lts && nvm use lts`
- **Linux:** Use [nvm](https://github.com/nvm-sh/nvm): `nvm install --lts && nvm use --lts`

Verify: `node --version` (should be 24.x or higher)

### Yarn 4

Yarn 4 is managed via Corepack, which ships with Node. Enable it once:

```bash
corepack enable
```

You do **not** install Yarn globally. The repo includes a `.yarnrc.yml` that pins the exact version, and Corepack downloads it automatically when you run `yarn` inside the repo.

Verify (after cloning): `yarn --version` (should be 4.x)

### Docker

Docker is needed to run MariaDB locally and for integration tests.

- **macOS:** Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- **Windows:** Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) (requires WSL 2)
- **Linux:** `sudo apt install docker.io docker-compose-plugin && sudo usermod -aG docker $USER`

Verify: `docker --version` and `docker run hello-world`

## Optional

### Doppler CLI

[Doppler](https://doppler.com) centralizes environment variables for team development. Stacker works without it (secrets are generated locally), but Doppler is recommended for teams.

- **macOS:** `brew install dopplerhq/cli/doppler`
- **Windows:** `winget install doppler`
- **Linux:** See [Doppler install guide](https://docs.doppler.com/docs/install-cli)

Verify: `doppler --version`

### IDE

**WebStorm / IntelliJ** — The repo includes run configurations in `.idea/runConfigurations/` for API, UI, tests, and compound configurations. Recommended plugins: **Prisma**, **Tailwind CSS**.

**VS Code** — Install these extensions: **Prisma** (`Prisma.prisma`), **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`), **ESLint** (`dbaeumer.vscode-eslint`), **GraphQL** (`GraphQL.vscode-graphql`).
