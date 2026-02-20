FROM nginx:alpine

RUN apk add --no-cache bash curl iproute2

WORKDIR /workspace

# Default nginx config serving /workspace
RUN echo 'server { listen 3000; root /workspace; index index.html; }' \
    > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
