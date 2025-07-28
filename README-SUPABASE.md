# RH Compensamos - Migración a Supabase

## Estado de la Migración

✅ **Proyecto Supabase creado** - `rh-compensamos`
✅ **Esquema de base de datos migrado** - Todas las tablas creadas
✅ **RLS habilitado** - Seguridad a nivel de fila configurada
✅ **Cliente Supabase configurado** - Frontend actualizado
✅ **Contexto de autenticación actualizado** - Usando Supabase Auth

## Configuración del Proyecto

### Variables de Entorno

Crear archivo `.env.local` en la carpeta `client/`:

```env
VITE_SUPABASE_URL=https://vlmeifyldcgfmhppynir.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbWVpZnlsZGNnZm1ocHB5bmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODQwNDUsImV4cCI6MjA2OTA2MDA0NX0.8MtUi9I_evcJYvB3tXGCKsXDpUX7V13T_DDfBbRvvu8
```

### Instalación y Ejecución

1. **Instalar dependencias:**
```bash
cd rh-compensamos
npm install
```

2. **Ejecutar en desarrollo:**
```bash
npm run dev
```

3. **Construir para producción:**
```bash
npm run build
```

## Estructura de la Base de Datos

### Tablas Principales

- **users** - Usuarios administradores del sistema
- **perfiles** - Roles y permisos del sistema
- **empresas** - Empresas clientes del sistema
- **candidatos** - Candidatos y aspirantes
- **clientes** - Clientes del sistema
- **analistas** - Analistas que procesan órdenes
- **ordenes** - Órdenes de contratación
- **tipos_candidatos** - Tipos de candidatos disponibles
- **documentos_tipo** - Tipos de documentos requeridos
- **candidatos_documentos** - Documentos subidos por candidatos

### Tablas de Sistema

- **system_views** - Vistas del sistema
- **view_actions** - Acciones disponibles por vista
- **profile_view_permissions** - Permisos de vista por perfil
- **profile_action_permissions** - Permisos de acción por perfil
- **menu_nodes** - Nodos del menú
- **menu_permissions** - Permisos del menú
- **menu_actions** - Acciones del menú

### Tablas de Seguimiento

- **ordenes_historial** - Historial de cambios de estado
- **notificaciones** - Notificaciones enviadas
- **alertas** - Alertas del sistema
- **metricas** - Métricas de rendimiento
- **password_reset_tokens** - Tokens de recuperación

## Funcionalidades Migradas

### ✅ Autenticación
- Login unificado con Supabase Auth
- Registro de usuarios
- Recuperación de contraseña
- Gestión de sesiones

### ✅ Gestión de Datos
- CRUD de candidatos
- CRUD de empresas
- CRUD de órdenes
- CRUD de analistas
- Gestión de documentos

### ✅ Seguridad
- Row Level Security (RLS) habilitado
- Permisos por perfil
- Autenticación JWT

## Próximos Pasos

### 🔄 Pendiente de Migrar

1. **Edge Functions**
   - Migrar API routes a Edge Functions
   - Funciones para lógica de negocio compleja

2. **Storage**
   - Configurar buckets para documentos
   - Gestión de archivos

3. **Real-time**
   - Notificaciones en tiempo real
   - Actualizaciones automáticas

4. **RLS Policies**
   - Configurar políticas de seguridad específicas
   - Permisos granulares por usuario

### 🚀 Mejoras Futuras

1. **Performance**
   - Caché con React Query
   - Optimización de consultas

2. **UX/UI**
   - Componentes optimizados
   - Mejor experiencia de usuario

3. **Testing**
   - Tests unitarios
   - Tests de integración

## Comandos Útiles

### Desarrollo
```bash
# Ejecutar en desarrollo
npm run dev

# Verificar tipos TypeScript
npm run check

# Construir proyecto
npm run build
```

### Base de Datos
```bash
# Aplicar migraciones
npm run db:push

# Ver estado de la base de datos
npx drizzle-kit studio
```

## Credenciales de Prueba

### Empresa
- Email: empresa1@ejemplo.com
- Password: empresa123

### Candidato
- Email: candidato1@ejemplo.com
- Password: candidato123

### Administrador
- Email: admin@compensamos.com
- Username: admin
- Password: admin123

## Soporte

Para soporte técnico o preguntas sobre la migración, contactar al equipo de desarrollo.

---

**Proyecto Supabase:** `rh-compensamos`  
**URL:** https://vlmeifyldcgfmhppynir.supabase.co  
**Estado:** ✅ Migración Inicial Completada 