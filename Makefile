.PHONY: build up down logs clean restart status backup restore

# Docker Compose command
DC = docker compose

# Build the application
build:
	$(DC) build --no-cache
	@echo "\n✅ Build completed successfully!"

# Start the application in detached mode
up:
	$(DC) up -d
	@echo "\n🚀 Emprende+ is running at http://localhost:3010"
	@echo "   Use 'make status' to check container status"
	@echo "   Use 'make logs' to view logs"

# Stop the application
down:
	$(DC) down
	@echo "\n🛑 Application stopped"

# Restart the application
restart: down up

# View logs (follow mode)
logs:
	$(DC) logs -f

# View recent logs (last 100 lines)
logs-last:
	$(DC) logs --tail=100

# Check container status
status:
	$(DC) ps
	@echo ""
	@$(DC) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" || true

# Clean up all containers and volumes
clean:
	$(DC) down -v --rmi all --remove-orphans
	@echo "\n🧹 All containers and images removed"

# Backup IndexedDB data from browser
# Note: Data is stored in browser's IndexedDB, not server-side
backup-browser:
	@echo "📦 To backup your data:"
	@echo "   1. Open browser DevTools (F12)"
	@echo "   2. Go to Application tab → Storage → IndexedDB"
	@echo "   3. Right-click 'emprende-plus-db' → Export"
	@echo ""
	@echo "💾 Saved data to your Downloads folder"

# Restore IndexedDB data
restore-browser:
	@echo "🔄 To restore your data:"
	@echo "   1. Open browser DevTools (F12)"
	@echo "   2. Go to Application tab → Storage → IndexedDB"
	@echo "   3. Delete existing 'emprende-plus-db' if it exists"
	@echo "   4. Click 'Import' and select your exported file"
	@echo ""
	@echo "✅ Data restored. Refresh the page."

# Development mode with hot reload
dev:
	docker compose run --rm --service-ports dev-app
