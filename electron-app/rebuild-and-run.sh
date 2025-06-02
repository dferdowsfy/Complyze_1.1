#!/bin/bash

echo "🔨 Building Complyze Desktop Agent..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Launching app..."
    npm start
else
    echo "❌ Build failed!"
    exit 1
fi 