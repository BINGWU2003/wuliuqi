#!/usr/bin/env sh
set -eu

APP="${1:-all}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_DIR="${DEPLOY_DIR:-/srv/wuliuqi}"

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

cd "$DEPLOY_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

case "$APP" in
  all)
    compose up -d --build shop admin docs
    ;;
  shop|admin|docs)
    compose up -d --build "$APP"
    ;;
  *)
    echo "Usage: scripts/deploy.sh [all|shop|admin|docs]" >&2
    exit 1
    ;;
esac

compose ps
docker image prune -f
