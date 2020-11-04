ARG NODE_VERSION=12.19
ARG NGINX_VERSION=1.19.3

### STAGE 1: Build the AngularJS app ###

FROM node:${NODE_VERSION} as build-stage

ARG BASE_HREF=/calendar/
ARG APP_GRID_ITEMS="[{ \"name\": \"Calendar\", \"url\": \"/calendar/\" }, { \"name\": \"Contacts\", \"url\": \"/contacts/\" }, { \"name\": \"Inbox\", \"url\": \"/inbox/\" }]"

WORKDIR /app

COPY package.json /app/

RUN npm install

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

# Copy shell script to container
WORKDIR /usr/share/nginx/html
COPY ./scripts/generate_env.sh .

# Make our shell script executable
RUN chmod +x generate_env.sh

# Start Nginx server
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/generate_env.sh && nginx -g \"daemon off;\""]
