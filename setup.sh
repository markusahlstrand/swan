#!/bin/bash

# Swan Development Setup Script
# This script helps you get started with Swan development

set -e

echo "🦢 Swan Development Setup"
echo "========================="

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to v18 or higher."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v)
echo "✅ pnpm $PNPM_VERSION"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Build all packages
echo ""
echo "Building all packages..."
pnpm build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev          - Start all projects in development mode"
echo "  pnpm build        - Build all packages"
echo "  pnpm clean        - Clean build artifacts"
echo ""
echo "Individual project commands:"
echo "  pnpm --filter swan dev       - Start VitePress site"
echo "  pnpm --filter swan-vscode dev - Watch VS Code extension"
echo ""
echo "🚀 Happy coding!"