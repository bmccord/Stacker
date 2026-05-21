# syntax=docker/dockerfile:1
FROM node:24-alpine

RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY prisma.config.ts ./
COPY prisma/ ./prisma/
COPY tsconfig.json tsconfig.seed.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

RUN yarn run generate
RUN yarn run build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
