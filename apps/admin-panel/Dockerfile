FROM node:lts AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
COPY apps/admin-panel/package.json ./apps/admin-panel/
COPY packages/planetary-engine/package*.json ./packages/planetary-engine/
RUN npm ci --workspace admin-panel --workspace @planetary-hours/planetary-engine

COPY apps/admin-panel ./apps/admin-panel
COPY packages ./packages
RUN npm run build --workspace admin-panel

FROM nginx:alpine AS runtime

COPY apps/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin-panel/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
