.PHONY: setup dev web worker lint typecheck test build db-up db-down

setup:
	corepack enable
	pnpm install
	cd apps/worker && uv sync

dev:
	@echo "Run 'make web' and 'make worker' in separate terminals."

web:
	pnpm --filter @thingso/web dev

worker:
	cd apps/worker && uv run python -m thingso_worker

lint:
	pnpm lint
	cd apps/worker && uv run ruff check .

typecheck:
	pnpm typecheck

test:
	pnpm test
	cd apps/worker && uv run pytest

build:
	pnpm build

db-up:
	docker compose up -d postgres

db-down:
	docker compose down
