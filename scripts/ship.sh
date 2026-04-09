#!/bin/bash
set -e

# Usage: npm run ship -- "my change description"
DESCRIPTION="${1:-update}"

# Sanitize description into a branch-friendly slug
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
BRANCH="mason/$SLUG"

echo "🌿 Creating branch: $BRANCH"
git checkout main
git pull origin main
git checkout -b "$BRANCH"

echo "📦 Staging all changes..."
git add .

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "⚠️  Nothing to commit. Make some changes first."
  git checkout main
  git branch -d "$BRANCH"
  exit 1
fi

echo "💾 Committing: $DESCRIPTION"
git commit -m "$DESCRIPTION"

echo "🚀 Pushing branch..."
git push origin "$BRANCH"

echo "🔗 Opening pull request..."
gh pr create --title "$DESCRIPTION" --body "" --base main --head "$BRANCH"

echo "✅ Done! PR is open and ready for review."
