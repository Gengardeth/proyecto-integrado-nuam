#  NUAM  Sistema de Calificaciones Tributarias

Sistema web completo para gestionar calificaciones fiscales de instrumentos financieros con carga masiva, reportes, auditoría y control de acceso por roles.

> **Estado:**  **Sprint 4 Completado** | Testing + DevOps  
> **Última Actualización:** 17 de noviembre de 2025  
> **Branch Actual:** `el-Gonzalo-probando-weas`

---

##  Inicio Rápido

**Primera vez con el proyecto?**  Lee la **[Guía de Instalación Completa (SETUP_GUIDE.md)](SETUP_GUIDE.md)**

**Ya tienes todo instalado?**  [Ir a Ejecución](#ejecución-rápida)

---

##  Características

### Gestión de Calificaciones
-  CRUD completo de calificaciones tributarias
-  Asociación con Emisores e Instrumentos
-  Ratings: AAA, AA, A, BBB, BB, B, CCC, CC, C, D
-  Outlook: STABLE, POSITIVE, NEGATIVE
-  Historial de cambios

### Carga Masiva
-  Upload de archivos CSV/XLSX
-  Validación por filas con feedback detallado
-  Procesamiento asíncrono
-  Reporte de éxitos y errores por item

### Reportes y Exportación
-  Filtros avanzados (fecha, emisor, rating, etc.)
-  Estadísticas agregadas
-  Exportación a CSV
-  Exportación a PDF con gráficos

### Auditoría
-  Log de todas las operaciones CREATE/UPDATE/DELETE
-  Timeline visual de acciones
-  Filtros por fecha, usuario, acción
-  Estadísticas de actividad

### Dashboard
-  KPIs en tiempo real
-  Gráficos con Chart.js (Pie, Bar)
-  Últimas calificaciones
-  Distribución por rating

### Seguridad
-  Autenticación JWT
-  Control de acceso por roles (RBAC)
-  CORS configurado
-  Protección CSRF
-  Validaciones en backend y frontend

---

##  Stack Tecnológico

### Backend
- **Framework**: Django 5.2.8 + Django REST Framework 3.16.1
- **Database**: PostgreSQL 16
- **Auth**: JWT (djangorestframework-simplejwt)
- **Server**: Gunicorn 23.0.0
- **Reports**: ReportLab 4.4.4 + OpenPyXL 3.1.5

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.2.2
- **Router**: React Router 7.1.1
- **HTTP Client**: Axios 1.7.9
- **Charts**: Chart.js 4.5.1
- **Testing**: Vitest 2.1.9

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Alpine)
- **CI/CD**: GitHub Actions
- **Testing**: 77 tests frontend pasando

---

##  Ejecución Rápida

### Requisitos Previos
- Python 3.13
- Node.js 20 LTS
- PostgreSQL 16
- Git

### 1. Backend

```bash
# Activar entorno virtual
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Ejecutar servidor
python manage.py runserver
```

**Backend disponible en**: http://127.0.0.1:8000

### 2. Frontend

```bash
cd frontend
npm run dev
```

**Frontend disponible en**: http://localhost:5173

---

##  Usuarios Demo

| Usuario | Password | Rol | Permisos |
|---------|----------|-----|----------|
| admin | admin123 | Administrador | Todos |
| analista | analista123 | Analista | CRUD ratings, reportes, carga masiva |
| auditor | auditor123 | Auditor | Solo lectura + auditoría |

---

##  Estructura del Proyecto

```
proyecto-integrado-nuam/
 backend/
    Nuam/                    # Configuración Django
    calificacionfiscal/      # App principal (TaxRating, BulkUpload)
    cuentas/                 # Autenticación y usuarios
    parametros/              # Catálogos (Issuer, Instrument)
    manage.py
 frontend/
    src/
       components/          # Componentes reutilizables
       pages/               # Dashboard, Calificaciones, etc.
       services/            # API calls (6 servicios modulares)
       router/              # Configuración de rutas
       context/             # AuthContext
    package.json
 docs/                        # Documentación del proyecto
 .github/workflows/           # CI/CD GitHub Actions
 Dockerfile                   # Backend container
 docker-compose.yml           # Orquestación completa
 requirements.txt             # Dependencias Python
 SETUP_GUIDE.md              #  Guía de instalación paso a paso
 README.md                    # Este archivo
```

---

##  Documentación

### Para Desarrolladores
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Instalación completa paso a paso
- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Deploy con Docker
- **[SPRINT4_COMPLETE.md](SPRINT4_COMPLETE.md)** - Detalles del último sprint

### Documentación Técnica
- **[docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)** - Endpoints de la API
- **[docs/TESTING.md](docs/TESTING.md)** - Guía de testing
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura del sistema

### Resúmenes Ejecutivos
- **[SPRINTS_RESUMEN.md](SPRINTS_RESUMEN.md)** - Resumen de todos los sprints
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Estado actual del proyecto

---

##  Testing

### Frontend (77 tests)

```bash
cd frontend
npm run test
```

**Cobertura**:
-  ratingsService (14 tests)
-  reportsService (9 tests)
-  bulkUploadsService (14 tests)
-  auditService (9 tests)
-  issuersService (11 tests)
-  instrumentsService (14 tests)
-  Utilities (6 tests)

### Backend

```bash
python manage.py test cuentas parametros
```

### Lint

```bash
# Frontend
npm run lint

# Backend
flake8 .
black --check .
```

---

##  Deploy con Docker

### Inicio rápido

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 2. Build y start
docker-compose up -d

# 3. Acceder
# Frontend: http://localhost
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

Ver **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** para detalles completos.

---

##  Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login/` - Login (obtener token JWT)
- `POST /api/v1/auth/logout/` - Logout
- `GET /api/v1/auth/me/` - Info del usuario actual

### Calificaciones
- `GET /api/v1/tax-ratings/` - Listar calificaciones
- `POST /api/v1/tax-ratings/` - Crear calificación
- `GET /api/v1/tax-ratings/{id}/` - Detalle
- `PUT /api/v1/tax-ratings/{id}/` - Actualizar
- `DELETE /api/v1/tax-ratings/{id}/` - Eliminar
- `GET /api/v1/tax-ratings/estadisticas/` - Estadísticas

### Carga Masiva
- `GET /api/v1/bulk-uploads/` - Listar cargas
- `POST /api/v1/bulk-uploads/` - Subir archivo
- `POST /api/v1/bulk-uploads/{id}/procesar/` - Procesar
- `GET /api/v1/bulk-uploads/{id}/items/` - Items de una carga

### Reportes
- `GET /api/v1/reports/estadisticas/` - Estadísticas con filtros
- `GET /api/v1/reports/exportar_csv/` - Exportar a CSV
- `GET /api/v1/reports/exportar_pdf/` - Exportar a PDF

### Auditoría
- `GET /api/v1/audit-logs/` - Logs de auditoría
- `GET /api/v1/audit-logs/estadisticas/` - Estadísticas de auditoría

### Catálogos
- `GET /api/v1/issuers/` - Emisores
- `GET /api/v1/instruments/` - Instrumentos

---

##  Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Tests Frontend | 77 pasando |
| Tiempo Tests | ~800ms |
| Líneas de Código | ~15,000 |
| Commits | 100+ |
| Sprints Completados | 4 |
| Cobertura Tests | Frontend 100% servicios |
| Docker Images | 3 (db, backend, frontend) |

---

##  Contribución

Este proyecto fue desarrollado como proyecto integrado académico. Para contribuir:

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

##  Licencia

Ver archivo [LICENSE](LICENSE) para detalles.

---

##  Autor

**Proyecto NUAM**  
Proyecto Integrado - Sistema de Calificaciones Tributarias  
Universidad/Institución - 2025

---

##  Soporte

Problemas con la instalación? Ver [SETUP_GUIDE.md](SETUP_GUIDE.md)  
Problemas con Docker? Ver [DOCKER_GUIDE.md](DOCKER_GUIDE.md)  
Otros problemas? Crear issue en GitHub

---

** Proyecto completado y funcional**

El sistema está listo para usar, presentar o desplegar en producción.
