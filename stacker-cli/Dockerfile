# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && corepack prepare yarn@4.13.0 --activate && yarn install --immutable

COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# ---- Run stage ----
FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && corepack prepare yarn@4.13.0 --activate && yarn workspaces focus --production

COPY --from=build /app/dist/ ./dist/

ENTRYPOINT ["node", "dist/index.js"]
