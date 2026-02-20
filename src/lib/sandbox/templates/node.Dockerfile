FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    curl \
    iproute2 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Keep container running
CMD ["bash"]
