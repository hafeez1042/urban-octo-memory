# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM build AS api
WORKDIR /app/services/core
EXPOSE 3000
CMD ["node", "dist/server.js"]

FROM nginx:1.27-alpine AS web
COPY --from=build /app/frontend/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
