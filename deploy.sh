#!/bin/bash

# Exit on any error
set -e

echo "🏗️  Building Docker images..."

# Try to build the images
if docker-compose build; then
    echo "✅ Build successful!"
    
    echo "🔄 Stopping and removing existing containers..."
    docker-compose down
    
    echo "🚀 Starting new containers..."
    docker-compose up -d --force-recreate
    
    echo "📝 Showing logs..."
    docker-compose logs -f
else
    echo "❌ Build failed! Containers were not updated."
    exit 1
fi