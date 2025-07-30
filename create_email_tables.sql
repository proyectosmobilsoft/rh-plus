-- Crear tabla para plantillas de email regulares
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  contenido_html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para plantillas de Gmail
CREATE TABLE IF NOT EXISTS gmail_templates (
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

-- Crear tabla para campañas de email
CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES email_templates(id),
  asunto_personalizado VARCHAR(500) NOT NULL,
  contenido_personalizado TEXT NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  destinatarios_count INTEGER DEFAULT 0,
  enviados_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para campañas de Gmail
CREATE TABLE IF NOT EXISTS gmail_campaigns (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES gmail_templates(id),
  asunto_personalizado VARCHAR(500) NOT NULL,
  contenido_personalizado TEXT NOT NULL,
  tipo_destinatario VARCHAR(50) NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  destinatarios_count INTEGER DEFAULT 0,
  enviados_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para destinatarios de email
CREATE TABLE IF NOT EXISTS email_recipients (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  tipo VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para selección de destinatarios de campañas
CREATE TABLE IF NOT EXISTS campaign_recipient_selection (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  campaign_type VARCHAR(50) NOT NULL,
  selection_type VARCHAR(50) NOT NULL,
  destinatarios_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_email_templates_activo ON email_templates(activo);
CREATE INDEX IF NOT EXISTS idx_gmail_templates_activo ON gmail_templates(activo);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_estado ON email_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_gmail_campaigns_estado ON gmail_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_email_recipients_tipo ON email_recipients(tipo);
CREATE INDEX IF NOT EXISTS idx_email_recipients_activo ON email_recipients(activo);

-- Insertar algunos datos de ejemplo para destinatarios
INSERT INTO email_recipients (email, nombre, empresa, tipo) VALUES
('candidato1@ejemplo.com', 'Juan Pérez', 'Empresa A', 'candidato'),
('candidato2@ejemplo.com', 'María García', 'Empresa B', 'candidato'),
('empleador1@ejemplo.com', 'Carlos López', 'Empresa C', 'empleador'),
('empleador2@ejemplo.com', 'Ana Martínez', 'Empresa D', 'empleador')
ON CONFLICT (email) DO NOTHING; 