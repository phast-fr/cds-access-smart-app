FROM nginx:1.23.1-alpine

MAINTAINER David Ouagne <david.ouagne@phast.fr>

ENV TZ=Europe/Paris
ENV CLIENT_ID_PRESCRIPTION=""
ENV CLIENT_ID_FORMULARY=""
ENV CLIENT_ID_DISPENSE=""
ENV CLIENT_ID_CQL_EDITOR=""
ENV CIO_DC_CREDENTIAL=""
ENV TIO_CREDENTIAL=""
ENV CQL_LIBRARY_CREDENTIAL=""
ENV OVERRIDE_ISS=false
ENV OVERRIDDEN_ISS=""

EXPOSE 443

## Copy default nginx config
COPY ./nginx/default.conf /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## Copy the artifacts in dist folder to default nginx public folder
COPY ./dist/cds-access-smart-app /usr/share/nginx/html

#CMD ["nginx", "-g", "daemon off;"]
CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
