ARG NODE_VERSION=12.19
ARG NGINX_VERSION=1.19.3

### STAGE 1: Build the AngularJS app ###

FROM node:${NODE_VERSION} as build-stage

WORKDIR /app

COPY package.json /app/

RUN npm install

COPY . .

# Production mode build
RUN npm run build:dev

### STAGE 2: Add Nginx for hosting the AngularJS app ###

FROM nginx:${NGINX_VERSION} as production-stage

# Removes the default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy the bundle
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx entrypoint scripts
COPY scripts/nginx-entrypoints /docker-entrypoint.d

# Copy the default nginx.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
