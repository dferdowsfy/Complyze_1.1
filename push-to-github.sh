#!/bin/bash

echo "🚀 Pushing Complyze Dashboard UI Updates to GitHub..."
echo "Repository: https://github.com/dferdowsfy/Complyze_1.1.git"
echo ""

# Check current git status
echo "📋 Checking current git status..."
git status

echo ""
echo "📦 Checking what's ready to push..."
git log --oneline -5

echo ""
echo "🔄 Pushing to GitHub repository..."

# Push to the main branch
git push origin main

echo ""
echo "✅ Push completed! Check your repository at:"
echo "https://github.com/dferdowsfy/Complyze_1.1"
echo ""
echo "🎉 Your beautiful dashboard UI updates are now live on GitHub!" 