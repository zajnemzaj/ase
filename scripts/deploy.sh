#!/usr/bin/env bash
# Builds the app and copies it to the web server (by default the Pi).
#
#   npm run deploy               # build, show what would change, ask, then copy
#   npm run deploy -- --dry-run  # build and only show what would change
#   npm run deploy -- --yes      # don't ask
#
# Override the target with DEPLOY_HOST, DEPLOY_PORT and DEPLOY_PATH.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-pi@rebegin.ddns.net}"
DEPLOY_PORT="${DEPLOY_PORT:-48627}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/ase}"

dry_run=false
assume_yes=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --yes | -y) assume_yes=true ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

cd "$(dirname "$0")/.."

echo "Building..."
npm run build --silent > /dev/null
# The old pages stay reachable under /legacy
cp -r legacy dist/spa/legacy

# The target folder belongs to root, so rsync runs with sudo on the server.
# Files that aren't in the build are deleted there, except a .git folder.
rsync_args=(
  --recursive --links --times --compress --delete
  --chmod=D755,F644
  --filter='P .git/'
  --rsync-path='sudo rsync'
  -e "ssh -p $DEPLOY_PORT"
  dist/spa/ "$DEPLOY_HOST:$DEPLOY_PATH/"
)

echo "Changes on $DEPLOY_HOST:$DEPLOY_PATH:"
changes="$(rsync --dry-run --itemize-changes "${rsync_args[@]}")"
# Lines starting with "." are files that stay as they are
grep -v '^\.' <<< "$changes" || echo "(none)"

if $dry_run; then
  exit 0
fi
if ! $assume_yes; then
  read -r -p "Deploy these changes? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 1; }
fi

rsync "${rsync_args[@]}"
echo "Deployed to $DEPLOY_HOST:$DEPLOY_PATH"
