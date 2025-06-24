# syntax = docker/dockerfile:experimental
FROM nginx:1.19.2-alpine

# tzdata for timezone, certbot for certificate generation
ARG rundeps="tzdata certbot certbot-nginx"

# Install apk dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk update \
    && apk --progress add $rundeps \
    && rm -rf /var/cache/apk/*

# Create directory for certificates
RUN mkdir -p /etc/nginx/certs

# Copy nginx config template
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /

# Make entrypoint executable
RUN chmod +x /docker-entrypoint.sh

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Entrypoint to handle certificate generation and Nginx startup
ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]