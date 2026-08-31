# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (with backend proxy)
npm run build      # Production build
npm test           # Run tests with Vitest
ng generate component features/<name>/<name>  # Scaffold a new feature component
```

To run a single test file:
```bash
npx vitest run src/app/features/auth/login/login.spec.ts
```

## Architecture

**AppPredicciones** is a world-cup prediction pool app ("Pollamundial") built with Angular 21 standalone components, Tailwind CSS, and Vitest.

### Structure

```
src/app/
├── app.ts / app.routes.ts / app.config.ts   # Root, routes, DI config
├── core/
│   ├── services/auth.ts                     # Auth service (login, logout, token)
│   ├── services/api.service.ts              # All ~50 backend API methods
│   ├── guards/auth.guard.ts                 # Protects private routes
│   ├── interceptors/auth.interceptor.ts     # Attaches Bearer token; handles 401
│   ├── models/usuario.model.ts              # Usuario, LoginResponse interfaces
│   └── utils/error.utils.ts                # extractErrorMessage() — use everywhere
├── features/                               # One folder per route
│   ├── auth/login/                         # Public
│   ├── registro/ forgot-password/ reset-password/
│   ├── inicio/ pronosticar/ final4/ partidos/
│   ├── posiciones/ historial/ grupos/ grupo-detalle/ admin/
└── shared/
    ├── components/nav/bottom-nav.ts        # Bottom navigation bar
    ├── components/alert/                   # Alert overlay (rendered in app.ts)
    └── services/alert.service.ts           # Global alert system
```

### Key Patterns

**API calls:** All go through `ApiService` (`core/services/api.service.ts`). In dev, requests to `/backend/*` are proxied (`proxy.conf.json`) to `https://app2.eclipsoft.com:8443/pollamundial/*`. In production, `environment.ts` sets `apiBase` directly.

**Authentication:** Token stored in `localStorage` under key `token`; user object under key `usuario`. The `authInterceptor` attaches the Bearer token to every request and auto-logouts on 401. `authGuard` (CanActivateFn) protects all routes except login/registro/forgot-password/reset-password.

**Error handling:** Always use `extractErrorMessage(err, fallback)` from `core/utils/error.utils.ts` when catching HTTP errors — it normalizes multiple server response shapes (JSON `message`/`Message`/`error`, XML, plain strings).

**Alerts:** Inject `AlertService` and call `alertService.showAlert(message, type)` (type: `'success'` | `'error'`). Do not use browser `alert()`.

**Standalone components:** No NgModules. Every component declares its own `imports` array. `app.config.ts` bootstraps providers (router, HttpClient with interceptors, ReactiveFormsModule).

**Styling:** Tailwind utility classes with custom CSS variables defined in `styles.css` (e.g. `--primary: #4ade80`, `--bg`, `--card`). Mobile-first; bottom nav for navigation.

**State:** No NgRx. Services return Observables; components subscribe and store results in local properties.

### Adding a New Feature Route

1. Create `src/app/features/<name>/<name>.ts` (standalone component)
2. Add a route to `app.routes.ts` with `canActivate: [authGuard]` if private
3. Inject `ApiService` and `AlertService`; use `extractErrorMessage` in error handlers
