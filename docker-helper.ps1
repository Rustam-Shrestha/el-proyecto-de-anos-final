#!/usr/bin/env pwsh
# Docker Compose Helper Script for Windows PowerShell
# Usage: .\docker-helper.ps1 [command] [options]

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",
    
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════════════════════════╗
║                    PERN Stack Docker Helper Script                              ║
╚════════════════════════════════════════════════════════════════════════════════╝

USAGE: .\docker-helper.ps1 [command] [options]

COMMANDS:
  up              Start all services (with optional build)
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
  .\docker-helper.ps1 up                    # Start all services
  .\docker-helper.ps1 up --build            # Start with rebuild
  .\docker-helper.ps1 logs backend-node     # View backend logs
  .\docker-helper.ps1 bash backend-node     # Shell into backend
  .\docker-helper.ps1 psql                  # Connect to database
  .\docker-helper.ps1 redis                 # Open Redis CLI

SERVICES:
  - postgres        PostgreSQL database
  - redis           Redis cache
  - backend-node    Express.js backend
  - backend-fastapi FastAPI backend
  - frontend        React frontend

"@
}

function Start-Services {
    param(
        [switch]$Build
    )
    
    Write-Host "🚀 Starting PERN Stack Services..." -ForegroundColor Green
    
    if ($Build) {
        Write-Host "Building images..." -ForegroundColor Cyan
        docker compose up --build -d
    } else {
        docker compose up -d
    }
    
    Write-Host "`n✅ Services started!" -ForegroundColor Green
    Write-Host "`nAccess Applications:
  • Frontend:     http://localhost:5173
  • Node Backend: http://localhost:4000
    • FastAPI:      http://localhost:8080
  • Redis:        localhost:6379
  • PostgreSQL:   localhost:5432
"
}

function Stop-Services {
    Write-Host "⛔ Stopping PERN Stack Services..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✅ Services stopped!" -ForegroundColor Green
}

function View-Logs {
    param([string]$Service)
    
    if ($Service) {
        Write-Host "📋 Logs for $Service (Ctrl+C to exit):" -ForegroundColor Cyan
        docker compose logs -f $Service
    } else {
        Write-Host "📋 Logs for all services (Ctrl+C to exit):" -ForegroundColor Cyan
        docker compose logs -f
    }
}

function Show-Status {
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker compose ps
    
    Write-Host "`n💾 Docker Volumes:" -ForegroundColor Cyan
    docker volume ls | Select-String "pern"
}

function Build-Images {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
    docker compose build
    Write-Host "✅ Build complete!" -ForegroundColor Green
}

function Clean-Everything {
    Write-Host "🧹 Cleaning up all containers and volumes..." -ForegroundColor Yellow
    Write-Host "⚠️  This will DELETE all data!" -ForegroundColor Red
    
    $confirm = Read-Host "Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
        return
    }
    
    docker compose down -v
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
}

function Open-Shell {
    param([string]$Service)
    
    if (-not $Service) {
        Write-Host "❌ Service not specified. Choose from: postgres, redis, backend-node, backend-fastapi, frontend" -ForegroundColor Red
        return
    }
    
    Write-Host "🔧 Opening shell in $Service..." -ForegroundColor Cyan
    
    switch ($Service) {
        "postgres" {
            docker compose exec postgres psql -U postgres -d finguard
        }
        "redis" {
            docker compose exec redis redis-cli
        }
        default {
            docker compose exec $Service sh
        }
    }
}

function Connect-Database {
    Write-Host "🗄️  Connecting to PostgreSQL..." -ForegroundColor Cyan
    docker compose exec postgres psql -U postgres -d finguard
}

function Open-Redis {
    Write-Host "📍 Opening Redis CLI..." -ForegroundColor Cyan
    docker compose exec redis redis-cli
}

function Seed-Database {
    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    docker compose exec backend-node npm run seed
    Write-Host "✅ Database seeded!" -ForegroundColor Green
}

function Reset-Database {
    Write-Host "⚠️  Resetting database (DESTRUCTIVE)..." -ForegroundColor Red
    
    $confirm = Read-Host "Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
        return
    }
    
    docker compose down -v
    Write-Host "Restarting services..." -ForegroundColor Cyan
    docker compose up -d
    Write-Host "✅ Database reset complete!" -ForegroundColor Green
}

# Main switch
switch ($Command.ToLower()) {
    "up" {
        Start-Services -Build:($Args -contains "--build")
    }
    "down" {
        Stop-Services
    }
    "logs" {
        View-Logs -Service $Args[0]
    }
    "status" {
        Show-Status
    }
    "build" {
        Build-Images
    }
    "clean" {
        Clean-Everything
    }
    "bash" {
        Open-Shell -Service $Args[0]
    }
    "psql" {
        Connect-Database
    }
    "redis" {
        Open-Redis
    }
    "seed" {
        Seed-Database
    }
    "reset-db" {
        Reset-Database
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
