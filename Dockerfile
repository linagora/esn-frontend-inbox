ARG NODE_VERSION=12.19
ARG NGINX_VERSION=1.19.3

### STAGE 1: Build the AngularJS app ###

FROM node:${NODE_VERSION} as build-stage

ARG BASE_HREF=/inbox/
ARG APP_GRID_ITEMS="[{ \"name\": \"Calendar\", \"url\": \"/calendar/\" }, { \"name\": \"Contacts\", \"url\": \"/contacts/\" }, { \"name\": \"Inbox\", \"url\": \"/inbox/\" }]"

WORKDIR /app

COPY package.json /app/

RUN npm install -g npm@7.24.2

RUN npm install --legacy-peer-deps

COPY . .

# Production mode build
RUN npm run build:prod

### STAGE 2: Add Nginx for hosting the AngularJS app ###

FROM nginx:${NGINX_VERSION} as production-stage

# Removes the default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy the bundle
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy the default nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx server
CMD ["/bin/bash", "-c", "nginx -g \"daemon off;\""]
