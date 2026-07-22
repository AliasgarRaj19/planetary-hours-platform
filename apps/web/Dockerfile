FROM node:lts-alpine AS build

WORKDIR /app/apps/web

ARG VITE_ANDROID_APK_URL
ENV VITE_ANDROID_APK_URL=$VITE_ANDROID_APK_URL

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web ./
COPY packages /app/packages
RUN npm run build

FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
