#!/bin/bash

# Ghost AI Assistant - Installation Script
# This script sets up Ghost AI Assistant for new users

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                Ghost AI Assistant Installer                │"
    echo "│              Personal AI for Limitless Recordings           │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="18.0.0"

        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js $NODE_VERSION found ✓"
        else
            print_error "Node.js version $NODE_VERSION is too old. Requires v18+"
            echo "Please install Node.js 18 or higher from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js is not installed"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
}

# Install npm dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed ✓"
}

# Build the project
build_project() {
    print_status "Building Ghost AI Assistant..."
    npm run build
    print_success "Build completed ✓"
}

# Create environment files
setup_environment() {
    print_status "Setting up environment files..."

    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file ✓"
        print_warning "Please edit .env and add your Limitless API key"
        echo "Get your API key from: https://www.limitless.ai/developers"
    else
        print_warning ".env file already exists"
    fi

    if [ ! -f .env.vaults ]; then
        cp .env.vaults.example .env.vaults
        print_success "Created .env.vaults file ✓"
        print_warning "Please edit .env.vaults and add your Obsidian vault paths"
    else
        print_warning ".env.vaults file already exists"
    fi
}

# Create Ghost vault directory
create_ghost_vault() {
    print_status "Creating Ghost AI vault directory..."

    if [ ! -d "Ghost AI Vault" ]; then
        mkdir -p "Ghost AI Vault/🎙️ Recordings"
        mkdir -p "Ghost AI Vault/👥 Contacts"
        mkdir -p "Ghost AI Vault/💡 Insights"
        mkdir -p "Ghost AI Vault/📋 Projects"
        mkdir -p "Ghost AI Vault/🎯 Daily"
        print_success "Ghost AI vault structure created ✓"
    else
        print_warning "Ghost AI vault already exists"
    fi
}

# Test the installation
test_installation() {
    print_status "Testing installation..."

    # Test build
    if npm run build > /dev/null 2>&1; then
        print_success "Build test passed ✓"
    else
        print_error "Build test failed"
        exit 1
    fi

    # Test CLI
    if npm run dev -- --help > /dev/null 2>&1; then
        print_success "CLI test passed ✓"
    else
        print_error "CLI test failed"
        exit 1
    fi

    print_success "All tests passed ✓"
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Edit .env and add your Limitless API key"
    echo "2. Edit .env.vaults and add your Obsidian vault paths"
    echo "3. Test the connection:"
    echo "   npm run dev -- recent --days 1"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "• See all commands: npm run dev -- --help"
    echo "• Setup Obsidian: npm run dev -- obsidian setup"
    echo "• Import recordings: npm run dev -- obsidian import recent"
    echo "• Search vaults: npm run dev -- vaults list"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "• Complete setup: docs/SETUP_GUIDE.md"
    echo "• Command reference: docs/GHOST_COMMANDS.md"
    echo ""
}

# Main installation process
main() {
    print_header

    echo "This installer will set up Ghost AI Assistant on your system."
    echo ""
    read -p "Do you want to continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi

    check_nodejs
    install_dependencies
    build_project
    setup_environment
    create_ghost_vault
    test_installation
    show_next_steps
}

# Run main function
main "$@"