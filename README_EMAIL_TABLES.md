# Configuración de Tablas para Email Masivo

Este documento contiene las instrucciones para crear las tablas necesarias en Supabase para que funcione el sistema de email masivo.

## Tablas Requeridas

### 1. email_templates
```sql
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  contenido_html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. gmail_templates
```sql
CREATE TABLE gmail_templates (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  contenido_html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  tipo_destinatario VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. email_campaigns
```sql
CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  template_id INTEGER,
  asunto_personalizado VARCHAR(500) NOT NULL,
  contenido_personalizado TEXT NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  destinatarios_count INTEGER DEFAULT 0,
  enviados_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. gmail_campaigns
```sql
CREATE TABLE gmail_campaigns (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  template_id INTEGER,
  asunto_personalizado VARCHAR(500) NOT NULL,
  contenido_personalizado TEXT NOT NULL,
  tipo_destinatario VARCHAR(50) NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  destinatarios_count INTEGER DEFAULT 0,
  enviados_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. email_recipients
```sql
CREATE TABLE email_recipients (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  tipo VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. campaign_recipient_selection
```sql
CREATE TABLE campaign_recipient_selection (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  campaign_type VARCHAR(50) NOT NULL,
  selection_type VARCHAR(50) NOT NULL,
  destinatarios_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cómo Crear las Tablas en Supabase

1. Ve a tu proyecto de Supabase
2. Navega a la sección "SQL Editor"
3. Ejecuta cada uno de los comandos CREATE TABLE anteriores
4. Después de crear las tablas, ejecuta el siguiente comando para insertar datos de ejemplo:

```sql
INSERT INTO email_recipients (email, nombre, empresa, tipo) VALUES
('candidato1@ejemplo.com', 'Juan Pérez', 'Empresa A', 'candidato'),
('candidato2@ejemplo.com', 'María García', 'Empresa B', 'candidato'),
('empleador1@ejemplo.com', 'Carlos López', 'Empresa C', 'empleador'),
('empleador2@ejemplo.com', 'Ana Martínez', 'Empresa D', 'empleador')
ON CONFLICT (email) DO NOTHING;
```

## Índices Recomendados

Para mejorar el rendimiento, también puedes crear estos índices:

```sql
CREATE INDEX idx_email_templates_activo ON email_templates(activo);
CREATE INDEX idx_gmail_templates_activo ON gmail_templates(activo);
CREATE INDEX idx_email_campaigns_estado ON email_campaigns(estado);
CREATE INDEX idx_gmail_campaigns_estado ON gmail_campaigns(estado);
CREATE INDEX idx_email_recipients_tipo ON email_recipients(tipo);
CREATE INDEX idx_email_recipients_activo ON email_recipients(activo);
```

## Verificación

Después de crear las tablas, puedes verificar que todo funciona correctamente:

1. Ejecuta el proyecto: `npm run dev`
2. Ve a la página de Email Masivo
3. Abre la consola del navegador para ver los logs de verificación
4. Intenta crear una plantilla usando el botón "Guardar Plantilla"

## Solución de Problemas

Si encuentras errores:

1. **Error de tabla no encontrada**: Asegúrate de que todas las tablas estén creadas correctamente
2. **Error de permisos**: Verifica que las políticas RLS (Row Level Security) estén configuradas correctamente
3. **Error de conexión**: Verifica que las credenciales de Supabase estén correctas en `supabaseClient.ts` 