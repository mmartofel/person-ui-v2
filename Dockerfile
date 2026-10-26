# The production image: the Vite build served by an unprivileged nginx (port 8080). Configured at container start
# by environment variables (README "Deploy"), so one image runs in every environment.

FROM node:24.22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.30-alpine
# Only these variables are substituted in the templates; nginx's own $uri, $host... stay as they are.
ENV NGINX_ENVSUBST_FILTER="^(API_UPSTREAM|OIDC_ORIGIN)$"
USER root
RUN rm /etc/nginx/conf.d/default.conf
USER 101
COPY docker/templates/ /etc/nginx/templates/
COPY --chmod=755 docker/10-ui-runtime-config.envsh /docker-entrypoint.d/
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 8080
