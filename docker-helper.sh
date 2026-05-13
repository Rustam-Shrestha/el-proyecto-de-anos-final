#!/bin/bash
# Docker Compose Helper Script for Mac/Linux
# Usage: ./docker-helper.sh [command] [options]

set -e

COMMAND="${1:-help}"
SERVICE="${2:-}"
COLORS_ENABLED=true

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Color output functions
info() {
    if [ "$COLORS_ENABLED" = true ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo "✅ $1"
    fi
}

warn() {
    if [ "$COLORS_ENABLED" = true ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    else
        echo "⚠️  $1"
    fi
}

error() {
    if [ "$COLORS_ENABLED" = true ]; then
        echo -e "${RED}❌ $1${NC}"
    else
        echo "❌ $1"
    fi
}

header() {
    if [ "$COLORS_ENABLED" = true ]; then
        echo -e "${CYAN}$1${NC}"
    else
        echo "$1"
    fi
}

# Show help
show_help() {
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════════╗
║                    PERN Stack Docker Helper Script                              ║
╚════════════════════════════════════════════════════════════════════════════════╝

USAGE: ./docker-helper.sh [command] [service]

COMMANDS:
  up              Start all services (with optional --build flag)
  down            Stop all services
  logs            View logs for a service (default: all)
  status          Show container status
  build           Rebuild Docker images
  clean           Stop and remove all containers and volumes
  bash            Open bash shell in a service container
  psql            Connect to PostgreSQL database
  redis           Open Redis CLI
  seed            Seed database with initial data
  reset-db        Reset database (destructive)
  help            Show this help message

EXAMPLES:
  ./docker-helper.sh up                    # Start all services
  ./docker-helper.sh up --build            # Start with rebuild
  ./docker-helper.sh logs backend-node     # View backend logs
  ./docker-helper.sh bash backend-node     # Shell into backend
  ./docker-helper.sh psql                  # Connect to database
  ./docker-helper.sh redis                 # Open Redis CLI

SERVICES:
  - postgres        PostgreSQL database
  - redis           Redis cache
  - backend-node    Express.js backend
  - backend-fastapi FastAPI backend
  - frontend        React frontend

EOF
}

# Start services
start_services() {
    if [ "$SERVICE" = "--build" ]; then
        header "🚀 Starting PERN Stack Services (with build)..."
        docker compose up --build -d
    else
        header "🚀 Starting PERN Stack Services..."
        docker compose up -d
    fi
    
    info "Services started!"
    echo ""
    header "Access Applications:"
    echo "  • Frontend:     http://localhost:5173"
    echo "  • Node Backend: http://localhost:4000"
    echo "  • FastAPI:      http://localhost:8080"
    echo "  • Redis:        localhost:6379"
    echo "  • PostgreSQL:   localhost:5432"
}

# Stop services
stop_services() {
    header "⛔ Stopping PERN Stack Services..."
    docker compose down
    info "Services stopped!"
}

# View logs
view_logs() {
    if [ -z "$SERVICE" ]; then
        header "📋 Logs for all services (Ctrl+C to exit):"
        docker compose logs -f
    else
        header "📋 Logs for $SERVICE (Ctrl+C to exit):"
        docker compose logs -f "$SERVICE"
    fi
}

# Show status
show_status() {
    header "📊 Container Status:"
    docker compose ps
    
    echo ""
    header "💾 Docker Volumes:"
    docker volume ls | grep pern
}

# Build images
build_images() {
    header "🔨 Building Docker images..."
    docker compose build
    info "Build complete!"
}

# Clean everything
clean_everything() {
    header "🧹 Cleaning up all containers and volumes..."
    warn "This will DELETE all data!"
    
    read -p "Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        warn "Cancelled"
        return
    fi
    
    docker compose down -v
    info "Cleanup complete!"
}

# Open shell
open_shell() {
    if [ -z "$SERVICE" ]; then
        error "Service not specified. Choose from: postgres, redis, backend-node, backend-fastapi, frontend"
        return 1
    fi
    
    header "🔧 Opening shell in $SERVICE..."
    
    case "$SERVICE" in
        postgres)
            docker compose exec postgres psql -U postgres -d finguard
            ;;
        redis)
            docker compose exec redis redis-cli
            ;;
        *)
            docker compose exec "$SERVICE" sh
            ;;
    esac
}

# Connect to database
connect_db() {
    header "🗄️  Connecting to PostgreSQL..."
    docker compose exec postgres psql -U postgres -d finguard
}

# Open Redis
open_redis() {
    header "📍 Opening Redis CLI..."
    docker compose exec redis redis-cli
}

# Seed database
seed_db() {
    header "🌱 Seeding database..."
    docker compose exec backend-node npm run seed
    info "Database seeded!"
}

# Reset database
reset_db() {
    header "⚠️  Resetting database (DESTRUCTIVE)..."
    
    read -p "Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        warn "Cancelled"
        return
    fi
    
    docker compose down -v
    header "Restarting services..."
    docker compose up -d
    info "Database reset complete!"
}

# Main switch
case "$COMMAND" in
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    logs)
        view_logs
        ;;
    status)
        show_status
        ;;
    build)
        build_images
        ;;
    clean)
        clean_everything
        ;;
    bash)
        open_shell
        ;;
    psql)
        connect_db
        ;;
    redis)
        open_redis
        ;;
    seed)
        seed_db
        ;;
    reset-db)
        reset_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
