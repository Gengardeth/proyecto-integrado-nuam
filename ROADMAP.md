# 🗺️ ROADMAP - Plan de Desarrollo (Sprints 2, 3, 4)
## Cronograma Detallado de Implementación Futuras

## Sprint 2: Carga Masiva + Reportes (2 semanas)

### Carga Masiva de Datos

#### Modelos
- [ ] Crear modelo `BulkUpload`:
  - archivo (FileField)
  - tipo (CSV/XLSX)
  - usuario (ForeignKey Usuario)
  - estado (PENDIENTE/PROCESANDO/COMPLETADO/ERROR)
  - total_filas, filas_ok, filas_error
  - resumen_errores (JSONField)
  - fecha_inicio, fecha_fin
  - timestamps

- [ ] Crear modelo `BulkUploadItem`:
  - bulk_upload (ForeignKey BulkUpload)
  - numero_fila
  - estado (OK/ERROR)
  - mensaje_error (CharField)
  - datos (JSONField)

#### Backend
- [ ] Crear parser CSV/XLSX:
  - Validar estructura
  - Validar datos por fila
  - Reportar errores sin parar

- [ ] Endpoint `POST /bulk-uploads`:
  - Aceptar archivo
  - Validación básica
  - Crear registro de carga

- [ ] Endpoint `GET /bulk-uploads/{id}`:
  - Estado de carga
  - Resumen (total, ok, errores)
  - Porcentaje de avance

- [ ] Endpoint `GET /bulk-uploads/{id}/items`:
  - Listar items con estado
  - Filtrar por error
  - Paginar

- [ ] Comando management para procesar cargas:
  - Procesar filas
  - Crear/actualizar objetos
  - Registrar errores en AuditLog

#### Tests
- [ ] Test: upload válido
- [ ] Test: upload con errores
- [ ] Test: reintentar carga fallida

### Reportes y Exportaciones

#### Backend
- [ ] Endpoint `GET /reports/summary`:
  - Filtros: fecha_desde, fecha_hasta, issuer, instrument
  - Retorna: JSON con estadísticas

- [ ] Endpoint `GET /reports/summary.csv`:
  - CSV exportable

- [ ] Endpoint `GET /reports/summary.pdf`:
  - PDF con formato básico (reportlab)

#### Estadísticas
- Total de calificaciones
- Por rating (conteo)
- Por outlook
- Por issuer (top 10)
- Por fecha (gráficos)

#### Tests
- [ ] Test: reporte JSON
- [ ] Test: exportación CSV
- [ ] Test: exportación PDF
- [ ] Test: filtros

### Tareas
- [ ] Instalar: openpyxl, pandas, reportlab
- [ ] Agregar a requirements.txt
- [ ] Documentar endpoints en README
- [ ] Tests unitarios + integración

---

## Sprint 3: Frontend React + Vite (2 semanas)

### Estructura Base

- [ ] Crear proyecto React con Vite (ya existe, optimizar)
- [ ] Instalar dependencias:
  - react-router-dom (rutas)
  - axios (HTTP client)
  - zustand o context (estado global)
  - tailwindcss o bootstrap (estilos)
  - react-table o react-query (tablas)

### Componentes

#### Autenticación
- [ ] LoginPage:
  - Formulario (username, password)
  - Submit a /api/v1/auth/login
  - Guardar token en localStorage
  - Redirect a /dashboard si autenticado

- [ ] PrivateRoute:
  - HOC para proteger rutas
  - Redirect a /login si no autenticado

#### Layout
- [ ] Navbar:
  - Logo NUAM
  - Menú de navegación
  - Dropdown usuario (Logout)
  - Rol actual

- [ ] Sidebar (opcional):
  - Menú colapsable
  - Enlaces a principales vistas

#### Dashboard
- [ ] KPIs:
  - Total calificaciones
  - Últimas cargas
  - Errores recientes
  - Estadísticas por rating

- [ ] Gráficos (recharts o chart.js):
  - Calificaciones por rating
  - Tendencia de fechas
  - Top issuers

#### CRUDs

**Issuers (Emisores)**
- [ ] ListPage:
  - Tabla con paginación
  - Búsqueda
  - Botones: Nuevo, Editar, Eliminar, Activos

- [ ] FormPage:
  - Campos: codigo, nombre, razon_social, rut, activo
  - Validaciones
  - Submit a POST/PUT

**Instruments (Instrumentos)**
- [ ] ListPage
- [ ] FormPage

**TaxRatings (Calificaciones)**
- [ ] ListPage:
  - Tabla con filtros (issuer, instrument, rating, fecha)
  - Paginación
  - Ordenamiento

- [ ] FormPage:
  - Campos: issuer, instrument, rating, fecha_rating, outlook, etc.
  - Select dinámicos de issuers/instruments

- [ ] DetailPage:
  - Ver detalles
  - Historial de auditoría

#### Carga Masiva
- [ ] UploadPage:
  - Drag & drop para archivo
  - Progress bar
  - Resultado (errores tabulados)
  - Botón descargar errores

#### Reportes
- [ ] ReportsPage:
  - Filtros (fecha, issuer, instrument)
  - Botones: Generar, CSV, PDF
  - Vista previa de datos

#### Auditoría
- [ ] AuditPage:
  - Tabla filtrable
  - Filtros: usuario, acción, modelo, fecha
  - Ver detalles (antes/después)

### Estilos
- [ ] Responsive design (mobile-first)
- [ ] Temas de color NUAM
- [ ] Accesibilidad básica (ARIA labels)

### Tests
- [ ] Tests unitarios (Jest)
- [ ] Tests componentes (React Testing Library)
- [ ] E2E básico (Cypress/Selenium)

### Tareas
- [ ] Setup Vite
- [ ] Instalar UI library
- [ ] Setup testing
- [ ] Documentar componentes

---

## Sprint 4: Testing + DevOps + Finalización (2 semanas)

### Testing Backend

#### Unitarias
- [ ] Tests de modelos (validaciones)
- [ ] Tests de serializers
- [ ] Tests de signals (auditoría)

#### Integración
- [ ] Tests DRF (endpoints):
  - Autenticación (401/403)
  - CRUD (200/201/204/400/404)
  - Filtros y búsqueda
  - Paginación

- [ ] Cobertura ≥75%

#### E2E Básico (Selenium)
- [ ] Login
- [ ] Crear Issuer
- [ ] Crear TaxRating
- [ ] Logout

### Testing Frontend

#### Unitarias (Jest + RTL)
- [ ] Componentes (render, eventos)
- [ ] Hooks personalizados
- [ ] Funciones de utilidad

#### Integración
- [ ] Flujos de usuario (login, CRUD)
- [ ] Llamadas HTTP

#### E2E (Cypress)
- [ ] Login completo
- [ ] CRUD flujos
- [ ] Carga masiva
- [ ] Reportes

### DevOps + Despliegue

#### Docker
- [ ] Dockerfile para Django
- [ ] Dockerfile para React
- [ ] docker-compose.yml con:
  - web (Django)
  - db (PostgreSQL)
  - nginx (reverse proxy)
  - redis (opcional)

#### CI/CD (GitHub Actions)
- [ ] Job 1: Lint + Tests
  - Ruff/Black (Python)
  - ESLint (JavaScript)
  - Pytest
  - Jest

- [ ] Job 2: Build Docker
  - Build imagen backend
  - Build imagen frontend
  - Push a registry (DockerHub/ghcr.io)

- [ ] Job 3: Deploy Staging
  - Deploy a servidor staging vía SSH
  - Run smoke tests

- [ ] Job 4: Deploy Producción
  - Solo en main
  - Con aprobación manual
  - Backup BD antes

#### Seguridad
- [ ] ZAP baseline scan
- [ ] OWASP headers en Nginx
- [ ] Rate limiting (django-ratelimit)
- [ ] Variables de entorno seguros
- [ ] HTTPS en producción

#### Backup
- [ ] Script de backup diario de BD
- [ ] Almacenamiento externo (S3/minIO)
- [ ] Script de restauración

### Documentación

- [ ] API docs (Swagger/DRF Spectacular)
- [ ] Guía de despliegue (staging/prod)
- [ ] Troubleshooting común
- [ ] Contribución guidelines
- [ ] CHANGELOG

### Tareas Finales
- [ ] Code review completo
- [ ] Correcciones menores
- [ ] Merge a main
- [ ] Deploy inicial
- [ ] Demo y presentación

---

## Criterios de Aceptación Finales (MVP Completo)

### Backend
- [x] RBAC operativo
- [x] CRUD + auditoría
- [ ] Carga masiva funcional
- [ ] Reportes filtrados
- [ ] Tests ≥75%
- [ ] CI/CD verde
- [ ] Documentación completa

### Frontend
- [ ] Login funcional
- [ ] Todas las vistas accesibles
- [ ] CRUD operativo
- [ ] Carga masiva UI
- [ ] Reportes descargables
- [ ] Auditoría consultable
- [ ] Tests básicos
- [ ] Responsive

### Infraestructura
- [ ] Docker Compose funcional
- [ ] GitHub Actions configurado
- [ ] Staging operativo
- [ ] Backup automático
- [ ] Monitoreo básico

### Seguridad
- [ ] ZAP sin hallazgos críticos
- [ ] HTTPS activo
- [ ] Headers OWASP
- [ ] Rate limiting
- [ ] Datos sensibles no expuestos

---

## Estimación de Esfuerzo

| Sprint | Tareas | Días | Personas |
|--------|--------|------|----------|
| 1 (✓) | Backend base | 10 | 1 |
| 2 | Carga + Reportes | 10 | 1-2 |
| 3 | Frontend | 10 | 1-2 |
| 4 | Tests + DevOps | 10 | 1-2 |
| **Total** | | **40** | **1-2** |

---

## Notas

- Ajustar prioridades según feedback del cliente
- Iterar y refinar tras cada sprint
- Mantener tests al día
- Documentar decisiones técnicas
- Revisar seguridad constantemente

---

**Última actualización:** 12 de noviembre de 2025
