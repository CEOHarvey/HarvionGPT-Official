#!/bin/bash

echo "Setting up HarvionGPT..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init

echo "Setup complete! Don't forget to:"
echo "1. Update .env with your configuration"
echo "2. Set up Gmail OAuth credentials"
echo "3. Configure SMTP settings"
echo "4. Add your AI API key"

