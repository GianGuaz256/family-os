#!/bin/bash

# Family OS Docker Deployment Script
# This script helps deploy and manage the Family OS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if environment file exists
check_env_file() {
    if [ ! -f ".env.production" ]; then
        print_error "Environment file .env.production not found!"
        print_status "Please copy .env.production.example to .env.production and configure your variables."
        exit 1
    fi
}

# Function to build the Docker image
build_image() {
    print_status "Building Family OS Docker image..."
    docker build -t family-os:latest .
    print_success "Docker image built successfully!"
}

# Function to start the application
start_app() {
    check_env_file
    print_status "Starting Family OS application..."
    docker-compose up -d
    print_success "Family OS is starting up!"
    print_status "Application will be available at: http://localhost:3000"
    print_status "Use 'docker-compose logs -f' to view logs"
}

# Function to stop the application
stop_app() {
    print_status "Stopping Family OS application..."
    docker-compose down
    print_success "Family OS stopped!"
}

# Function to restart the application
restart_app() {
    print_status "Restarting Family OS application..."
    docker-compose down
    docker-compose up -d
    print_success "Family OS restarted!"
}

# Function to view logs
view_logs() {
    print_status "Viewing Family OS logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to update the application
update_app() {
    print_status "Updating Family OS application..."
    print_status "Pulling latest code..."
    git pull
    print_status "Rebuilding Docker image..."
    build_image
    print_status "Restarting application..."
    restart_app
    print_success "Family OS updated successfully!"
}

# Function to show application status
show_status() {
    print_status "Family OS Application Status:"
    docker-compose ps
}

# Function to show help
show_help() {
    echo "Family OS Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the application"
    echo "  stop      Stop the application"
    echo "  restart   Restart the application"
    echo "  logs      View application logs"
    echo "  status    Show application status"
    echo "  update    Update application (git pull + rebuild + restart)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the application"
    echo "  $0 logs      # View logs"
    echo "  $0 update    # Update to latest version"
}

# Main script logic
case "$1" in
    "build")
        build_image
        ;;
    "start")
        start_app
        ;;
    "stop")
        stop_app
        ;;
    "restart")
        restart_app
        ;;
    "logs")
        view_logs
        ;;
    "status")
        show_status
        ;;
    "update")
        update_app
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        print_error "No command specified!"
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 