FROM node:lts AS build

WORKDIR /app

ARG VITE_ANDROID_APK_URL
ENV VITE_ANDROID_APK_URL=$VITE_ANDROID_APK_URL

COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/planetary-engine/package*.json ./packages/planetary-engine/
RUN npm ci --workspace planetary-hours-website --workspace @planetary-hours/planetary-engine

COPY apps/web ./apps/web
COPY packages ./packages
RUN npm run build --workspace planetary-hours-website

FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
