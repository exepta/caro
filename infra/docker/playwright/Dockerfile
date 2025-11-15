FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /work

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY apps/web/package.json apps/web/pnpm-lock.yaml ./apps/web/

COPY apps/web/angular.json ./apps/web/
COPY apps/web/tsconfig*.json ./apps/web/

WORKDIR /work/apps/web
RUN pnpm install

WORKDIR /work
COPY apps/web ./apps/web

WORKDIR /work/apps/web
CMD ["pnpm", "playwright", "test", "-c", "playwright.config.ts"]