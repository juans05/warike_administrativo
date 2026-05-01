# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Warike Administrativo is a pnpm monorepo with one app (`apps/dashboard`) — a Next.js 14 admin panel for restaurant owners and platform admins. The backend is a separate NestJS repo (`huarique_backend`, sibling directory) deployed independently on Railway.

## Commands

All commands run from `apps/dashboard/`:

```bash
pnpm dev        # Start dev server (localhost:3000)
pnpm build      # Production build
pnpm start      # Serve production build (binds 0.0.0.0 for Railway)
pnpm lint       # ESLint via next lint
```

There are no tests configured.

## Architecture

### Monorepo layout
- `apps/dashboard/` — Next.js 14 App Router frontend (the only app)
- `packages/types/` — Shared TypeScript types (carta, bot, restaurant shapes)

### Authentication flow
Auth is fully client-side using `localStorage`. The dashboard layout (`app/(dashboard)/layout.tsx`) acts as a route guard — it reads `token` and `user` from localStorage on mount and redirects to `/login` if missing. After successful login, `accessToken` and `user` (with `role`) are stored.

Only users with `role === 'admin'` or `role === 'business'` can access the dashboard. Role determines sidebar visibility: admins see the platform management section (`/moderacion`, `/comunidad`); business users see restaurant management.

### API client (`lib/api-client.ts`)
Three tiers:
- `fetchWithAuth` — attaches JWT Bearer token from localStorage; used by all authenticated endpoints
- `fetchPublic` — no auth; for public NFC scan pages
- Named API objects: `businessApi`, `adminApi`, `cartaApi`, `botApi`, `publicApi`

All API calls target `NEXT_PUBLIC_API_URL` (must be set in Railway dashboard for production — defaults to `http://localhost:3001`).

### Restaurant context (`context/RestaurantContext.tsx`)
`RestaurantProvider` wraps the entire dashboard layout. It fetches the business user's places via `businessApi.getMyPlaces()` and exposes `activePlaceId` (persisted to localStorage). All dashboard pages consume `useRestaurant()` to get the currently selected place. Business users with no registered places see an onboarding screen instead of the normal dashboard.

### Route groups
- `app/(auth)/login/` — public login page
- `app/(dashboard)/` — protected; guarded by layout
- `app/l/[id]/` — public NFC landing page for restaurant customers
- `app/explorar/` — public discovery page

## Backend connection

The backend (`huarique_backend`) is a NestJS app deployed at `https://backendwarike-production.up.railway.app`.

**Critical**: The backend's TypeORM config (`src/config/database.config.ts`) only sets the `schema` when using individual DB params. When `DATABASE_URL` is provided (Railway production), the schema must also be set explicitly — the `wuarike_db` PostgreSQL schema holds all tables (`users`, `places`, `refresh_tokens`, etc.), not the `public` schema.

The backend uses `DB_SCHEMA=wuarike_db` env var; this must be present in Railway's backend service variables alongside `DATABASE_URL`.

## Deployment

Both services deploy to Railway from their respective GitHub repos:
- Frontend: `warike.up.railway.app` — set `NEXT_PUBLIC_API_URL=https://backendwarike-production.up.railway.app`
- Backend: `backendwarike-production.up.railway.app` — set `DB_SCHEMA=wuarike_db`

`NEXT_PUBLIC_*` variables are baked into the Next.js build, so changing them in Railway triggers a required redeploy.

## Code conventions

Follow the principles in `.claude/skill/Arquitectura.md`:
- No hardcoded business data — everything from the API
- Backend: Controller → Service → Repository layering; no business logic in controllers
- No generic variable names (`data`, `obj`, `tmp`)
