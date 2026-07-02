#!/usr/bin/env bash
#
# split-to-new-repo.sh — copy the native Android app + design docs out of
# genesis-cycle-guide into a fresh standalone repo (e.g. FORZA-Industries/genesyx-android),
# WITHOUT touching this repo. Run locally where you have push rights to the new repo.
#
# Usage:
#   scripts/split-to-new-repo.sh git@github.com:FORZA-Industries/genesyx-android.git [branch]
#   scripts/split-to-new-repo.sh https://github.com/FORZA-Industries/genesyx-android.git main
#
# Prereqs: the target repo already exists on GitHub (create it empty/private first),
# and your local git is authenticated to push to it.

set -euo pipefail

TARGET_REMOTE="${1:?Usage: split-to-new-repo.sh <git-remote-url> [branch]}"
BRANCH="${2:-main}"

SRC_ROOT="$(git rev-parse --show-toplevel)"
STAGE="$(mktemp -d)"

echo "→ Staging native app + docs from $SRC_ROOT"
mkdir -p "$STAGE/docs"
cp -R "$SRC_ROOT/android" "$STAGE/android"
cp -R "$SRC_ROOT/docs/." "$STAGE/docs/"
cp "$SRC_ROOT/ARCHITECTURE.md" "$STAGE/ARCHITECTURE.md"

# Top-level README pointing at the Android project + docs.
cat > "$STAGE/README.md" <<'EOF'
# Genesyx — Native Android (Kotlin + Jetpack Compose)

Native rebuild of the Genesyx fertility-prep app. Split out of `genesis-cycle-guide`
so it evolves independently of the live web app.

- App project: [`android/`](android/) — open this folder in Android Studio.
- Design / architecture source of truth: [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`docs/`](docs/).

See [`android/README.md`](android/README.md) for build + Supabase setup.
EOF

cd "$STAGE"
git init -q
git checkout -q -b "$BRANCH"
git add -A
git commit -q -m "Genesyx native Android app + design docs (split from genesis-cycle-guide)"
git remote add origin "$TARGET_REMOTE"

echo "→ Pushing to $TARGET_REMOTE ($BRANCH)"
git push -u origin "$BRANCH"

echo "✓ Done. New repo populated at $TARGET_REMOTE ($BRANCH)."
echo "  Staging copy left at: $STAGE (safe to delete)."
