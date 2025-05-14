#!/bin/sh
# Exit if errors in variables
set -eu

# envsubst '${FRONTEND_PORT_INTERNAL} ${API_PORT_INTERNAL} ${MAILHOG_PORT_INTERNAL} ${FLOWER_PORT_INTERNAL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
envsubst '${FRONTEND_PORT_INTERNAL} ${API_PORT_INTERNAL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"
