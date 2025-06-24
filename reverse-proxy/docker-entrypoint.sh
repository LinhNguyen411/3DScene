#!/bin/sh
# Exit if errors in variables
set -eu

# Domain name and email for Certbot
DOMAIN="${DOMAIN_NAME}"
EMAIL="${CERTBOT_EMAIL}"

# Check if certificates exist, try to obtain them with Certbot if not
if [ ! -f /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem ] || [ ! -f /etc/letsencrypt/live/"$DOMAIN"/privkey.pem ]; then
    echo "Attempting to obtain Let's Encrypt certificates for $DOMAIN..."
    # Attempt to get certificates
    certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --rsa-key-size 4096 \
        --agree-tos \
        --force-renewal \
        --non-interactive || {
        echo "Certbot failed to obtain certificates. Generating self-signed SSL certificate as fallback..."
        openssl req -x509 -newkey rsa:4096 -nodes \
            -out /etc/nginx/certs/cert.pem \
            -keyout /etc/nginx/certs/key.pem \
            -days 365 \
            -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=$DOMAIN"
    }
else
    echo "Let's Encrypt certificates already exist for $DOMAIN."
fi

# Link Certbot certificates to Nginx expected path if they were obtained
if [ -f /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem ] && [ -f /etc/letsencrypt/live/"$DOMAIN"/privkey.pem ]; then
    echo "Linking Certbot certificates to Nginx path."
    ln -sf /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem /etc/nginx/certs/cert.pem
    ln -sf /etc/letsencrypt/live/"$DOMAIN"/privkey.pem /etc/nginx/certs/key.pem
fi

# Add a cron job for automatic certificate renewal
if ! crontab -l | grep -q "certbot renew"; then
    echo "Adding Certbot renewal cron job."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --nginx") | crontab -
fi


# Substitute environment variables into the Nginx configuration template
envsubst '${FRONTEND_PORT_INTERNAL} ${API_PORT_INTERNAL} ${DOMAIN_NAME}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Nginx configuration generated:"
cat /etc/nginx/nginx.conf

# Execute the main Nginx command
exec "$@"
