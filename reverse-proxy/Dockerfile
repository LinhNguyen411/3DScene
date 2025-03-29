# syntax = docker/dockerfile:experimental
FROM nginx:1.19.2-alpine

# tzdata = to be able to set the correct timezone
ARG rundeps="tzdata"

# Install apk dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk update \
    && apk --progress add $rundeps

# Copy nginx config to expose frontend and api
# this is a template file that is processed upon startup via envsubst
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template

COPY docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
