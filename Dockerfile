FROM nginx:1.21.6-alpine

MAINTAINER David Ouagne <david.ouagne@phast.fr>

ENV TZ=Europe/Paris

EXPOSE 443

## Copy default nginx config
COPY ./nginx/default.conf /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## Copy the artifacts in dist folder to default nginx public folder
COPY ./dist/cds-access-smart-app /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
