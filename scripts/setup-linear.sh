#!/bin/bash

echo "🚀 Linear Task Creation Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "🔧 Please edit .env file with your Linear credentials:"
    echo "   1. LINEAR_API_KEY - Get from https://linear.app/settings/api"
    echo "   2. LINEAR_TEAM_KEY - Found in your Linear URL"
    echo "   3. LINEAR_PROJECT_ID - Optional project ID"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo "📋 Next steps:"
echo "1. Get your Linear API key from: https://linear.app/settings/api"
echo "2. Find your team key in your Linear URL"
echo "3. Edit .env file with your credentials"
echo "4. Run: node scripts/create-linear-tasks.js"
echo ""
echo "📖 For detailed instructions, see: scripts/README.md" 