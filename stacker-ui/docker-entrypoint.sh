#!/bin/sh
# Generate runtime env config from environment variables.
# Only VITE_* variables are exposed to the browser.
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:4000/graphql}"
};
EOF
