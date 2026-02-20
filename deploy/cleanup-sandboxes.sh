#!/bin/bash
# Cleanup stale sandbox containers
# Run via cron: */30 * * * * /opt/appmake/deploy/cleanup-sandboxes.sh

MAX_AGE_SECONDS=7200  # 2 hours

now=$(date +%s)

docker ps --filter "label=appmake.sandbox" --format '{{.ID}} {{.CreatedAt}}' | while read id created; do
  created_ts=$(date -d "$created" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$created" +%s 2>/dev/null)
  if [ -n "$created_ts" ]; then
    age=$((now - created_ts))
    if [ "$age" -gt "$MAX_AGE_SECONDS" ]; then
      echo "Removing stale sandbox container: $id (age: ${age}s)"
      docker stop "$id" && docker rm "$id"
    fi
  fi
done

echo "Sandbox cleanup complete at $(date)"
