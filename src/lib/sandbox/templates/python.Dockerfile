FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    git \
    curl \
    iproute2 \
    procps \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

CMD ["bash"]
