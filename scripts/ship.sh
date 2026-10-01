#!/bin/bash
set -e

# Usage: npm run ship -- "my change description"
# With no description, the branch/commit/PR are named after the changed files.
DESCRIPTION="$1"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

echo "🔄 Syncing main..."
git checkout main
git pull origin main

echo "📦 Staging all changes..."
git add .

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "⚠️  Nothing to commit. Make some changes first."
  exit 1
fi

if [ -z "$DESCRIPTION" ]; then
  # Name it after the changed files: "update Header, Footer, Landing (+4 more)"
  NAMES=$(git diff --cached --name-only \
    | sed 's#.*/##; s/\.[^.]*$//' \
    | grep -vxE 'index|package|package-lock' \
    | awk '!seen[$0]++')
  [ -z "$NAMES" ] && NAMES=$(git diff --cached --name-only | sed 's#.*/##; s/\.[^.]*$//' | awk '!seen[$0]++')
  COUNT=$(echo "$NAMES" | wc -l | tr -d ' ')
  FIRST=$(echo "$NAMES" | head -3 | paste -sd ',' - | sed 's/,/, /g')
  DESCRIPTION="update $FIRST"
  BRANCH_SOURCE="$DESCRIPTION"
  [ "$COUNT" -gt 3 ] && DESCRIPTION="$DESCRIPTION (+$((COUNT - 3)) more)"
fi

# PascalCase -> kebab so "PageShell" becomes "page-shell"
SLUG=$(slugify "$(echo "${BRANCH_SOURCE:-$DESCRIPTION}" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g')")
# Cap the length without cutting a word in half
if [ ${#SLUG} -gt 60 ]; then
  SLUG=$(echo "$SLUG" | cut -c1-61 | sed 's/-[^-]*$//')
fi
BRANCH="mason/$SLUG"

# Never collide with an existing local or remote branch
N=2
while git show-ref --quiet "refs/heads/$BRANCH" || git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; do
  BRANCH="mason/$SLUG-$N"
  N=$((N + 1))
done

echo "🌿 Creating branch: $BRANCH"
git checkout -b "$BRANCH"

echo "💾 Committing: $DESCRIPTION"
git commit -m "$DESCRIPTION"

echo "🚀 Pushing branch..."
git push origin "$BRANCH"

echo "🔗 Opening pull request..."
gh pr create --title "$DESCRIPTION" --body "" --base main --head "$BRANCH"

echo "✅ Done! PR is open and ready for review."
