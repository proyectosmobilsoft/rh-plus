# RH Plus — Conexiones del proyecto para subir a servidor

Este documento resume **qué conexiones ya tiene** el proyecto y **qué conexiones le faltan o hay que ajustar** antes de publicarlo en un servidor.

## Lo que SÍ tiene conectado

### 1) Frontend (Vite + React)
- Build de frontend con salida en `dist/`:
  - `npm run build`
  - `npm run preview`
- Configuración SPA ya contemplada para IIS en `web.config` (rewrite de rutas a `index.html`).

### 2) Supabase (conexión principal de datos)
- Cliente Supabase en `client/src/services/supabaseClient.ts`.
- Usa variables de entorno:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Gran parte de módulos consumen Supabase directo (servicios en `client/src/services/*`).

### 3) Edge Functions de Supabase
- Existe función `issue-jwt` (`supabase/functions/issue-jwt/index.ts`) para emisión de token.
- Existe función `send-email` (`supabase/functions/send-email/index.ts`) para envío SMTP (Gmail).
- Desde frontend se llama `issue-jwt` usando:  
  `VITE_SUPABASE_URL/functions/v1/issue-jwt`.

### 4) Conexiones HTTP externas usadas
- WhatsApp por enlace web (`https://wa.me/...`) en módulos de QR/candidatos.
- Mailgun (opcional) en `emailService` cuando hay claves configuradas.

### 5) API REST relativa `/api/...` (cliente preparado)
- El frontend llama muchos endpoints REST (`/api/auth/...`, `/api/empresa/...`, `/api/perfiles/...`, `/api/menu-...`, etc.).
- También hay servicios que usan base `"/api"` (`templatesService`) y uno con base fija local (`api.ts`).

## Lo que NO tiene (o falta ajustar para servidor)

### 1) Backend REST del proyecto en este repo
- No existe carpeta `server/` ni implementación backend visible para soportar todos los `fetch('/api/...')`.
- Para producción debes:
  1. desplegar un backend que atienda esos endpoints, o
  2. migrar esas rutas a Supabase/Edge Functions.

### 2) URL fija local en API
- `client/src/services/api.ts` tiene:
  - `API_URL = "http://localhost:5001/api/"`
- En servidor esto fallará si no existe ese host/puerto. Debe moverse a variable de entorno.

### 3) Proxy de desarrollo desactivado
- En `vite.config.ts` el proxy `/api` está comentado.
- En producción esto no importa, pero en desarrollo local puede romper llamadas si backend corre aparte.

### 4) Pruebas/lint de pipeline
- En `package.json` no hay scripts de `test` ni `lint`.
- Solo existe `check` (TypeScript) y build.

## Variables de entorno que debes definir

## Frontend (Vite)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_APP_URL` o `VITE_APP_URL` (usado para URLs públicas en correos/QR)
- Opcionales según módulo:
  - `VITE_EMAIL_USER`
  - `VITE_EMAIL_PASSWORD`
  - `VITE_EMAIL_APP_PASSWORD`
  - `VITE_SENDGRID_API_KEY`
  - `VITE_MAILGUN_API_KEY`
  - `VITE_MAILGUN_DOMAIN`
  - `VITE_WHATSAPP_TOKEN`
  - `VITE_GMAIL_USER`

## Supabase Edge Functions (secrets)
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Recomendación mínima antes de subir al servidor

1. Resolver estrategia de `/api` (backend real o migración completa a Supabase).
2. Quitar `http://localhost:5001/api/` y pasar a variable de entorno.
3. Configurar variables/secrets en entorno productivo.
4. Ejecutar `npm run check` y `npm run build`.
5. Publicar `dist/` en tu servidor web (IIS/Nginx/Apache) con rewrite SPA activo.
