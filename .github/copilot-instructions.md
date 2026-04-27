# Copilot instructions for RH Plus

## Build, type-check, and run
- `npm run dev` — starts Vite dev server (project root is configured to `client/`).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serves the production build.
- `npm run check` — TypeScript type-check (`tsc`).

## Test and lint status
- There is currently no `test` script and no `lint` script in `package.json`.
- Single-test command is not available in the current setup.

## High-level architecture
- This is a frontend-heavy React + TypeScript app (Vite) under `client/src`, using Supabase directly from the browser for data access (`client/src/services/*`).
- App bootstrapping is provider-driven in `client/src/main.tsx`: React Query + Theme + Auth + Loading + Permissions + Colors contexts.
- Routing is centralized in `client/src/App.tsx`, with public routes and protected routes wrapped by `AuthGuard`/`ProtectedRoute`, and authenticated pages rendered inside `Layout` + `DynamicSidebar`.
- Auth/session flow combines local state and Supabase:
  - `AuthContext` + `authService` validate credentials against `gen_usuarios`, load user roles/companies, and populate `userData.acciones`.
  - Session artifacts are stored in `localStorage` (`authToken`, `userData`, `empresaData`).
  - JWT issuance is delegated to Supabase Edge Function `supabase/functions/issue-jwt/index.ts`, with fallback behavior present in auth flow.
- Two Supabase Edge Functions are part of runtime behavior: `issue-jwt` (token issuance) and `send-email` (Gmail-based delivery).

## Key codebase conventions
- **Permissions are two-layered and both layers matter:**
  1. **Sidebar/view visibility** via `vistas_sistema` + `permisos_vista_perfil` (queried by `vistasService`).
  2. **Action-level access** via `gen_modulo_permisos.code` + `gen_roles_modulos.selected_actions_codes`, enforced in `DynamicSidebar` and `Can` checks.
- `DynamicSidebar` uses a strict `pathToActions` map; if a route is missing there, it is hidden by default (`isAllowedPath` returns false when unmapped).
- Permission/action code naming is strict: route/action codes must match across DB records and UI guards (e.g., `vista-*`, `accion-*`).
- Pages that participate in permission/action registration use `useRegisterView` (`vista-{tipo}-{slug}` and `accion-{slug}` generation) backed by `actionsRegistry`.
- Company context is a first-class session concern: `empresaData` is managed in `empresaUtils`, and company changes emit the `empresaSelected` window event.
- Service/hook pattern is consistent in many modules: Supabase operations in `services/*`, then `hooks/*` wrap them with React Query, loading context, toasts, and query invalidation.
- Many modules keep dual route forms (flat and namespaced, e.g. `/usuarios` and `/seguridad/usuarios`); preserve both when extending an existing module’s route set.
