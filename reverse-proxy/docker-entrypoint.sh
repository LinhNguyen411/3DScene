#!/bin/sh
# Exit if errors in variables
set -eu

if [ ! -f /etc/nginx/certs/cert.pem ] || [ ! -f /etc/nginx/certs/key.pem ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -nodes \
        -out /etc/nginx/certs/cert.pem \
        -keyout /etc/nginx/certs/key.pem \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=localhost"
fi

# envsubst '${FRONTEND_PORT_INTERNAL} ${API_PORT_INTERNAL} ${MAILHOG_PORT_INTERNAL} ${FLOWER_PORT_INTERNAL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
envsubst '${FRONTEND_PORT_INTERNAL} ${API_PORT_INTERNAL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"
