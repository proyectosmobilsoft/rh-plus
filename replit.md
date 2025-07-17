# Replit.md - Medical System Management Application

## Overview

This is a full-stack medical practice management application built with modern web technologies. The system focuses on managing occupational health services, including companies, candidates, medical appointments, service orders, and certificate generation. It's designed as a comprehensive solution for medical clinics that provide occupational health services to businesses.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Query (@tanstack/react-query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router for client-side navigation
- **Component Structure**: Modular component architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for fast bundling
- **API Design**: REST-based architecture with /api prefix for all endpoints

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Schema Management**: Centralized schema definitions in shared/schema.ts
- **Migrations**: Drizzle Kit for database migrations
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations

## Key Components

### Data Models
- **Users**: Basic user authentication system with username/password
- **Companies**: Business entities that require occupational health services
- **Candidates**: Individuals applying for positions or requiring medical evaluations
- **Medical Services**: Configurable services offered by the clinic
- **Orders**: Service requests linking companies, candidates, and medical services
- **Appointments**: Scheduled medical consultations
- **Certificates**: Medical certificates generated after evaluations

### Core Modules
1. **Registration System**: Management of companies, candidates, and service providers
2. **Order Management**: Creation and tracking of medical service orders
3. **Clinical Module**: Medical scheduling, consultations, and patient records
4. **Certificate Generation**: Automated certificate creation and management
5. **Security Module**: User management, profiles, and permissions

### External Integrations
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless
- **File Storage**: Configurable document management system
- **PDF Generation**: Certificate and report generation capabilities

## Data Flow

1. **Company Registration**: Businesses register to access occupational health services
2. **Candidate Management**: Individual profiles are created for medical evaluations
3. **Order Creation**: Companies request specific medical services for candidates
4. **Appointment Scheduling**: Medical consultations are scheduled based on orders
5. **Medical Evaluation**: Healthcare providers conduct examinations
6. **Certificate Generation**: Medical certificates are produced based on evaluation results
7. **Record Management**: All data is stored for compliance and historical tracking

## External Dependencies

### Core Dependencies
- React ecosystem (React, React Router, React Query)
- UI Components (Radix UI primitives, Lucide React icons)
- Form handling (React Hook Form, Hookform Resolvers)
- Validation (Zod, Drizzle Zod)
- Database (Drizzle ORM, Neon Database connector)
- Styling (Tailwind CSS, Class Variance Authority)
- Development tools (Vite, TypeScript, ESBuild)

### Development Tools
- Replit integration for cloud development
- Hot module replacement for fast development
- TypeScript for type safety
- ESLint and Prettier (implied by structure)

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot reload
- PostgreSQL database provisioning
- Environment variable management for database connections
- Development server on port 5000

### Production Deployment
- Vite build process for optimized frontend assets
- ESBuild bundling for Node.js backend
- Autoscale deployment target on Replit
- Static asset serving through Express
- Database migrations through Drizzle Kit

### Build Process
1. Frontend assets built with Vite to dist/public
2. Backend bundled with ESBuild to dist/
3. Static files served from public directory
4. Environment-specific configurations

## Changelog

```
Changelog:

- January 16, 2025. Implemented dynamic color theme switching system for platform
  * Created comprehensive dynamic theme system with ThemeContext and ThemeSwitcher components
  * Implemented 3 theme variations using colors (lime green #c1d009, turquoise blue #1fb5ca, gray #9d9d9d):
    - Verde → Azul → Gris (original configuration)
    - Gris → Verde → Azul (rotated configuration)
    - Azul → Gris → Verde (alternative configuration)
  * Added animated theme switching with smooth transitions throughout entire interface
  * Integrated ThemeSwitcher button in admin header with hover effects and sparkles animation
  * Enhanced visual experience with multiple animation classes: hover-lift, float, pulse-glow, fade-in-up, bounce-in
  * Theme changes persist across sessions using localStorage
  * All form components, buttons, cards, and interface elements automatically adapt to selected theme
  * Added CSS custom properties for seamless color transitions with 0.3s smooth animations
  * Complete color interchange system allows administrators to dynamically change interface appearance
  * Applied comprehensive brand color system using lime green, turquoise blue, and gray throughout all interfaces
  * Enhanced dashboard with branded StatCards, login animations, and interactive card effects
- January 8, 2025. Complete dynamic permissions management system implemented
  * Created comprehensive dynamic permissions system with automatic detection of all views and actions
  * Added new database schemas: system_views, view_actions, profile_view_permissions, profile_action_permissions
  * Implemented complete backend storage layer with methods for permission management, validation, and bulk operations
  * Added 12 new API routes for permission management: views, actions, permissions, and validation endpoints
  * Created professional permission management UI with checkboxes for view access and toggles for action permissions
  * Configured automatic initialization of 11 system views with 65 total actions across all modules
  * Added granular permission validation at both view and action levels throughout the system
  * Enhanced security module with "Gestión de Permisos" option in the navigation menu
  * System now supports dynamic permission configuration for each user profile with real-time validation
  * Complete permission structure: dashboard, usuarios, perfiles, candidatos, empresas, qr, analistas, ordenes, certificados, maestro, reportes
- January 8, 2025. Single unified login system consolidation completed
  * Consolidated all portal logins (admin, empresa, candidato) into single LoginUnificado entry point
  * Eliminated separate login pages and redirected all portal-specific URLs to unified system
  * Updated all navigation links and references to point to single login at root path (/)
  * Created LoginRedirect component to automatically redirect legacy portal URLs
  * Enhanced AuthContext with comprehensive role-based permissions and dynamic sidebar
  * Implemented MultiSelect component with modern organized display for user profile selection
  * Added automatic form clearing in profile module after successful save operations
  * Fixed visual distortion issues in warehouse and profile selection components
  * Fixed candidato redirection: corrected getDefaultDashboard from /candidatos/perfil to /candidato/perfil
  * Updated candidato API endpoints to support unified session structure (userId instead of candidatoId)
  * Complete system now uses single authentication entry with role-based interface adaptation working for all user types
- January 4, 2025. Complete password recovery system implementation
  * Implemented comprehensive password recovery system with token-based authentication
  * Added passwordResetTokens table schema with expiration and single-use token functionality
  * Created database storage methods for token creation, validation, cleanup, and user lookup
  * Built backend API routes: forgot-password, validate-reset-token, and reset-password
  * Added ForgotPasswordPage component with email input and professional UI design
  * Created ResetPasswordPage with password validation, strength requirements, and confirmation
  * Integrated password recovery into LoginAdmin with "¿Olvidó su contraseña?" link
  * Added secure token generation with 1-hour expiration and automatic cleanup
  * Implemented proper error handling and user feedback for all recovery scenarios
  * Enhanced storage interface with getUserByEmail method for email-based user lookup
  * Complete frontend routing integration in App.tsx for seamless user experience
- January 3, 2025. Enhanced candidate management with approval system and quick send features
  * Added candidate approval/rejection system with notes functionality for hiring decisions
  * Implemented quick send buttons for WhatsApp and Email in candidate list using stored QR configuration
  * Moved approval buttons to dropdown menu for better UI organization after user feedback
  * Added progress percentage display matching candidate portal calculation (based on 10 required fields)
  * Enhanced candidate interface with visual progress bars and completion indicators
  * Created comprehensive approval workflow with notes for tracking hiring requirements and follow-ups
  * Added approval status tracking with color-coded badges and statistics dashboard
  * Integrated database schema changes with notasAprobacion field for storing approval decisions
- June 27, 2025. Menu management system and company visible fields implementation
  * Implemented comprehensive menu management interface with tree view navigation
  * Added visible fields checklist to company form (cargo, salario, celular, correo, fecha_ingreso, direccion, jornada_laboral)
  * Created interactive tree structure for menu configuration with expand/collapse functionality
  * Built permission management form with dynamic action fields (código, nombre, tipo)
  * Added action buttons for menu node management (crear, eliminar, visualizar, vista/nom)
  * Integrated proper form validation and submission handling for menu permissions
  * Menu system includes drag-and-drop preparation for future organization features

- January 2, 2025. Enhanced analistas module with cascading selects and improved forms
  * Created CascadingSelects component with Regional → Zona → Sucursal hierarchy using React/TypeScript
  * Implemented automatic dependency resets when parent level changes (regional change clears zona/sucursal)  
  * Added mock data structure: 7 regionales, 6 zonas, 6 sucursales with hierarchical relationships
  * Only displays options where estado === 1 as per business requirements
  * Updated analista creation form with enhanced fields: cliente asignado, nivel prioridad (1-5 scale), ubicación completa
  * Added comprehensive form validation and real-time feedback for location selection
  * Created test page (/test-cascading) for standalone component verification
  * Fixed SelectItem error by replacing empty string values with meaningful defaults
  * Integrated component into existing analistas workflow with proper state management
- January 1, 2025. Complete Analistas management module implementation
  * Added comprehensive Analistas module with full CRUD operations and advanced management features
  * Implemented new database schema for analistas table with fields: nombre, apellido, email, telefono, regional, clienteAsignado, nivelPrioridad, estado, fechaIngreso
  * Created three main pages: AnalistasPage (listing with advanced filters), CrearAnalistaPage (form creation), EditarAnalistaPage (edit functionality)
  * Added new sidebar menu item "Analistas" with UserCheck icon positioned before "Maestro" section
  * Implemented comprehensive filtering system: search by name/email/regional/client, filter by regional, priority level, and status
  * Added statistics dashboard showing: total analysts, active analysts, high priority analysts, and number of regionals
  * Included Excel export functionality for analyst data with CSV format download
  * Created complete backend API with routes: GET /api/analistas, POST /api/analistas, PUT /api/analistas/:id, DELETE /api/analistas/:id
  * Added validation schema and proper error handling for all analyst operations
  * Implemented sample data with 4 example analysts from different regionals (Bogotá, Medellín, Cali, Barranquilla)
  * Features include: email uniqueness validation, priority levels (alto/medio/bajo), status management (activo/inactivo), regional assignments
  * Full integration with existing authentication and navigation system

- December 30, 2024. Complete enterprise portal implementation
  * Built complete portal de empresas with authentication, dashboard, and candidate management
  * Implemented enterprise-specific candidate creation and isolation (companies only see their own candidates)  
  * Added database schemas for empresas table with business information and NIT
  * Created comprehensive dashboard with candidate statistics and management actions
  * Implemented candidate listing with filtering by status and search functionality
  * Added detailed candidate view pages showing complete information for enterprise review
  * Extended session management to support empresa userType alongside admin and candidato
  * Created API routes for enterprise login, profile management, and candidate operations
  * Added enterprise login access from main admin portal for easy discovery
  * Complete candidate isolation: each empresa only sees candidates they created
  * Portal includes: login, dashboard with stats, create candidates, view candidate list, detailed candidate view
- June 27, 2025. Maestro-detalle system implementation for dynamic candidate document requirements
  * Implemented complete maestro-detalle system allowing companies to configure document requirements by candidate type
  * Added new sidebar section "Maestro" with comprehensive management interface for candidate types and document types
  * Restructured navigation: "Ordenes" simplified to "Expedicion de Orden" and "Certificados" to "Expedicion de Certificados" as single menu items instead of dropdowns
  * Created TiposCandidatosPage with dual-panel interface for managing candidate types (Ingeniero, Diseñador, Contador) and document types (CV, Diploma, Certificaciones, Portafolio)
  * Implemented configuration system allowing administrators to define which documents are required for each candidate type
  * Added complete backend support with new database schemas, storage methods, and API endpoints
  * System now supports flexible document requirements: engineers need CV+Diploma+Certifications, designers need CV+Portfolio, accountants need CV+Diploma+Work Certificate
  * Foundation laid for candidate portal integration where candidates will see different document upload requirements based on their selected type
- June 27, 2025. UI modernization and minimalist design improvements  
  * Updated login page to be more minimalist: removed green logo/shield, changed "Sistema Médico" to "Recursos humanos", "Acceso Administrativo" to "control de seguridad"
  * Eliminated "Portal Candidatos" button from dashboard header for cleaner interface
  * Removed "Clínica" section entirely from sidebar navigation
  * Modernized sidebar design: removed dropdown arrows (▼), increased font sizes, improved typography with font-medium classes
  * Enhanced "Recursos Humanos" title with larger text-2xl font for better hierarchy
  * Applied consistent text sizing: text-base for main menu items, text-sm for submenu items
- June 27, 2025. User interface improvements and page-based forms implementation
  * Removed redundant buttons from profiles page header to eliminate duplication
  * Converted modal-based forms to page-based forms following "empresa afiliadas" style
  * Created separate pages for each user type creation: CrearCandidatoPage, CrearAdministradorPage, CrearCoordinadorPage, CrearAdminGeneralPage
  * Implemented color-coded interface: green for candidatos, red for administradores, blue for coordinadores, purple for administradores generales
  * Added proper navigation with "Volver" buttons and breadcrumb-style headers
  * Fixed authentication issues that were causing slow page loads - temporarily disabled auth checks for development
  * All form pages now use full-page layouts instead of modal dialogs for better user experience
- June 27, 2025. Complete user profiles and security management system implemented
  * Full profiles management system with 4 user types: administrador, candidato, coordinador, administrador_general
  * Candidate creation workflow from profiles: admin creates candidate with cedula/name/email, generates account with email as username and cedula as initial password
  * Administrative user creation system for coordinador and administrador_general types with custom username and temporary password (12345678)
  * Forced password change system for first-time candidate login with security validations and requirements
  * Comprehensive password change page with validation (min 8 chars, uppercase, lowercase, number)
  * Backend routes for creating both candidate and administrative users with proper validation
  * Updated database schema with extended user fields for administrative roles
- June 26, 2025. UI improvements and bug fixes
  * Fixed critical blank screen issue by diagnosing React/Vite configuration problems
  * Successfully changed all blue UI elements to green color scheme
  * Removed "Create Candidate" button from admin candidates page (edit-only mode)
  * Removed "¿No tienes cuenta? Regístrate aquí" text from candidate login
  * Fixed logout button 404 error - now properly redirects to admin login (/)
  * Enhanced DatosPersonalesForm with organized color-coded sections
  * Completed modal redesign for candidate registration with professional layout
- June 26, 2025. Migration from Lovable to Replit completed successfully
  * Dual portal system implemented (admin + candidate self-registration)
  * PostgreSQL database integration configured  
  * Session-based authentication system added
  * Admin login as first view with protected routes
  * Candidate registration, login, and profile management created
  * Dashboard UI cleaned: removed logout button and candidate portal card
  * Simplified authentication with immediate credential validation (admin/admin123)
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```