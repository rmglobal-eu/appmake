#!/bin/bash
# Build all sandbox Docker images

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../src/lib/sandbox/templates"

echo "Building sandbox images..."

echo "  -> appmake-sandbox-node"
docker build -t appmake-sandbox-node -f "$TEMPLATES_DIR/node.Dockerfile" "$TEMPLATES_DIR"

echo "  -> appmake-sandbox-python"
docker build -t appmake-sandbox-python -f "$TEMPLATES_DIR/python.Dockerfile" "$TEMPLATES_DIR"

echo "  -> appmake-sandbox-static"
docker build -t appmake-sandbox-static -f "$TEMPLATES_DIR/static.Dockerfile" "$TEMPLATES_DIR"

echo ""
echo "All sandbox images built successfully!"
docker images | grep appmake-sandbox
