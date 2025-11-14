# 📊 NUAM – Mantenedor de Calificaciones Tributarias
## Sistema Seguro de Gestión de Calificaciones Fiscales

Sistema web seguro y trazable para gestionar calificaciones tributarias, con carga masiva, reportes, auditoría y control de acceso por roles, alineado a normativa chilena básica de protección de datos.

> **Estado:** 🟢 **Sprint 1 Completado** | Backend API REST completamente funcional  
> **Última Actualización:** 12 de noviembre de 2025  
> **Documentación:** Ver [PROJECT_STATUS.md](PROJECT_STATUS.md) para resumen ejecutivo  
> **Próximo:** Sprint 2 (Carga masiva + Reportes)

---

## Tabla de Contenidos

1. [Objetivo](#objetivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Ejecución](#ejecución)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Roles y Permisos (RBAC)](#roles-y-permisos-rbac)
9. [Usuarios Demo](#usuarios-demo)
10. [Documentación de Desarrollo](#documentación-de-desarrollo)
11. [Pruebas](#pruebas)
12. [Despliegue](#despliegue)

---

## Objetivo

Desarrollar una aplicación web que permita:
- Gestionar calificaciones tributarias (crear/editar/eliminar/consultar)
- Cargar datos en bloque (CSV/XLSX) con validaciones
- Emitir reportes y exportaciones (CSV/PDF)
- Auditar todas las acciones
- Control de acceso por roles (Administrador, Analista, Auditor)

---

## Stack Tecnológico

- **Backend:** Python 3.x, Django 5.x, Django REST Framework (DRF), django-cors-headers
- **Frontend:** React 18 + Vite, fetch/axios, React Router
- **Base de Datos:** PostgreSQL 14+
- **Seguridad:** CSRF, CORS, RBAC, OWASP
- **Asíncrono (opcional):** Celery + Redis (para cargas masivas)
- **DevOps:** Docker Compose, Nginx (reverse proxy), GitHub Actions (CI/CD)
- **Pruebas:** pytest + pytest-django, DRF test client, Selenium (E2E), Locust (rendimiento), ZAP baseline (seguridad)

---

### Estructura del Proyecto

```
proyecto-integrado-nuam/
├── Nuam/                          # Configuración del proyecto Django
│   ├── settings.py                # Configuración general
│   ├── urls.py                    # Rutas principales
│   ├── wsgi.py
│   └── asgi.py
├── cuentas/                       # App: Autenticación, usuarios y roles (RBAC)
│   ├── models.py                  # Modelo de Usuario personalizado
│   ├── views.py                   # Endpoints DRF: login, logout, me, roles
│   ├── serializers.py             # Serializer de Usuario
│   ├── urls.py                    # Rutas de autenticación y usuarios
│   ├── admin.py                   # Gestión de usuarios en admin
│   └── management/commands/
│       └── seed_users.py          # Comando para crear usuarios demo
├── calificacionfiscal/            # App: Calificaciones tributarias (TaxRating CRUD)
│   ├── models.py                  # Modelos: Contribuyente, CalificacionTributaria, TaxRating
│   ├── views.py                   # ViewSet DRF: TaxRating CRUD
│   ├── serializers.py             # Serializers para TaxRating
│   ├── urls.py                    # Rutas de TaxRating
│   ├── admin.py                   # Gestión en admin
│   └── migrations/
├── parametros/                    # App: Catálogos (Issuer, Instrument, etc.)
│   ├── models.py                  # Modelos: TipoParametro, Parametro, Issuer, Instrument
│   ├── views.py                   # ViewSets DRF: Issuer, Instrument CRUD
│   ├── serializers.py             # Serializers para Issuer, Instrument
│   ├── urls.py                    # Rutas de catálogos
│   ├── admin.py                   # Gestión en admin
│   └── migrations/
├── frontend/                      # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── static/                        # Archivos estáticos (CSS, JS compilado)
├── templates/                     # Templates HTML (si aplica)
├── manage.py                      # CLI de Django
├── requirements.txt               # Dependencias Python
├── docker-compose.yml             # Orquestación de servicios
└── README.md                      # Este archivo
```

---

## Estado de Desarrollo (Sprint 1)

### ✅ Completado

- [x] Modelo de Usuario personalizado con roles RBAC (Administrador, Analista, Auditor)
- [x] Endpoints de autenticación (login, logout, me, roles)
- [x] Configuración de Django REST Framework y CORS
- [x] Modelos de Issuer (Emisor) e Instrument (Instrumento)
- [x] ViewSets CRUD para Issuer e Instrument
- [x] Modelo TaxRating (Calificación Tributaria) con validaciones
- [x] ViewSet CRUD para TaxRating con filtros y acciones personalizadas
- [x] Registro de modelos en admin de Django
- [x] Migraciones de base de datos
- [x] Serializers y validaciones básicas
- [x] Health check endpoint
- [x] Paginación en listados
- [x] Búsqueda y ordenamiento en endpoints
- [x] Sistema de Auditoría (AuditLog completo):
  - [x] Modelo AuditLog con campos para rastrear cambios
  - [x] Signals para registrar automáticamente CREATE, UPDATE, DELETE
  - [x] Captura de IP y User-Agent
  - [x] Eventos de login/logout
  - [x] ViewSet de consulta con filtros y resumen
  - [x] Registro en admin (solo lectura)

### 🔄 En Desarrollo

- [ ] Carga masiva (CSV/XLSX)
- [ ] Reportes y exportaciones (CSV/PDF)
- [ ] Tests unitarios e integración
- [ ] Frontend React + Vite
- [ ] Autenticación y login frontend
- [ ] Formularios y listados CRUD
- [ ] Protección de endpoints por roles

### 📋 Próximamente

- [ ] Endurecimiento de seguridad (rate limiting, headers)
- [ ] Celery + Redis para cargas asíncronas
- [ ] E2E tests con Selenium
- [ ] Tests de rendimiento con Locust
- [ ] Docker Compose completo
- [ ] CI/CD con GitHub Actions
- [ ] Documentación de API con Swagger

---



- Python 3.10 o superior
- PostgreSQL 14+ (o Docker)
- Node.js 18+ (para frontend)
- pip y virtualenv
- Git

---

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Gengardeth/proyecto-integrado-nuam.git
cd proyecto-integrado-nuam
```

### 2. Crear y activar entorno virtual

```bash
# En Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# En macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependencias del backend

```bash
pip install -r requirements.txt
```

Si no existe `requirements.txt`, ejecuta:
```bash
pip install django==5.2.6 psycopg2-binary djangorestframework django-cors-headers
pip freeze > requirements.txt
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (no commitear):

```env
# Django
SECRET_KEY=django-insecure-vkt7b=4dl+xf1=5_kvi-2j*e03caut*mjy0^^nc!7nb#$@pq3$
DEBUG=True

# Base de datos
DB_ENGINE=django.db.backends.postgresql
DB_NAME=proyecto_nuam
DB_USER=postgres
DB_PASSWORD=Nuam290adminexchange@
DB_HOST=localhost
DB_PORT=5432

# CORS (para desarrollo)
CORS_ALLOW_ALL_ORIGINS=True
```

> **Nota:** En producción, usa `.env` con valores seguros y no lo commits.

### 5. Aplicar migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Crear usuarios demo (RBAC)

```bash
python manage.py seed_users
```

Usuarios creados:
- **admin** / admin123 (Administrador)
- **analista** / analista123 (Analista)
- **auditor** / auditor123 (Auditor)

### 7. Crear superusuario (opcional, para acceso a admin)

```bash
python manage.py createsuperuser
```

### 8. Instalar dependencias del frontend (opcional, si usarás React local)

```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Ejecución

### Backend (Django)

```bash
python manage.py runserver 0.0.0.0:8000
```

La API estará disponible en: `http://localhost:8000/api/v1/`

### Frontend (React + Vite, opcional)

```bash
cd frontend
npm run dev
```

Frontend disponible en: `http://localhost:5173`

### Ambos servicios con Docker Compose (opcional)

```bash
docker-compose up -d
```

---

## Endpoints de la API

**Base:** `http://localhost:8000/api/v1/`

### Health Check
- `GET /health` — Verifica que la API esté en funcionamiento

### Autenticación
- `POST /auth/login` — Login con username/password
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- `POST /auth/logout` — Logout (requiere autenticación)
- `GET /auth/me` — Obtiene datos del usuario actual (requiere autenticación)

### Roles
- `GET /roles` — Listado de roles disponibles

### Usuarios (próximamente)
- `GET /users` — Listado de usuarios
- `POST /users` — Crear usuario
- `GET /users/{id}` — Obtener usuario
- `PUT /users/{id}` — Actualizar usuario
- `DELETE /users/{id}` — Eliminar usuario

### Catálogos
- `GET /issuers` — Listado de emisores
- `POST /issuers` — Crear emisor
- `GET /issuers/{id}` — Obtener emisor
- `PUT /issuers/{id}` — Actualizar emisor
- `DELETE /issuers/{id}` — Eliminar emisor
- `GET /issuers/activos` — Listado de emisores activos

- `GET /instruments` — Listado de instrumentos
- `POST /instruments` — Crear instrumento
- `GET /instruments/{id}` — Obtener instrumento
- `PUT /instruments/{id}` — Actualizar instrumento
- `DELETE /instruments/{id}` — Eliminar instrumento
- `GET /instruments/activos` — Listado de instrumentos activos
- `GET /instruments/por-tipo` — Instrumentos agrupados por tipo

### Calificaciones Tributarias
- `GET /tax-ratings` — Listado de calificaciones (con paginación)
  - Parámetros: `page`, `page_size`, `search`, `ordering`
  - Filtros: `issuer`, `instrument`, `rating`
- `POST /tax-ratings` — Crear calificación
- `GET /tax-ratings/{id}` — Obtener calificación
- `PUT /tax-ratings/{id}` — Actualizar calificación
- `DELETE /tax-ratings/{id}` — Eliminar calificación
- `GET /tax-ratings/ultimas?limit=10` — Últimas N calificaciones
- `GET /tax-ratings/por-issuer?issuer_id=X` — Calificaciones por emisor
- `GET /tax-ratings/por-rango-fecha?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD` — Rango de fechas
- `PATCH /tax-ratings/{id}/cambiar-estado` — Cambiar estado activo/inactivo

### Auditoría
- `GET /audit-logs` — Listado de logs de auditoría (con paginación y filtros)
  - Parámetros: `page`, `page_size`, `search`, `ordering`
- `GET /audit-logs/{id}` — Obtener detalle de un log
- `GET /audit-logs/por-usuario?usuario_id=X` — Logs de un usuario específico
- `GET /audit-logs/por-accion?accion=CREATE|UPDATE|DELETE|LOGIN|LOGOUT|EXPORT|UPLOAD` — Logs por tipo de acción
- `GET /audit-logs/por-modelo?modelo=Issuer|Instrument|TaxRating|Usuario` — Logs por modelo
- `GET /audit-logs/resumen` — Resumen estadístico de auditoría

---

## Roles y Permisos (RBAC)

El sistema implementa control de acceso basado en roles (RBAC) con 3 roles principales:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **ADMIN** | Administrador del sistema | Acceso total a todas las funciones |
| **ANALISTA** | Analista tributario | Ver, editar TaxRating, cargas masivas, reportes |
| **AUDITOR** | Auditor | Solo lectura, consulta de auditoría |

### Métodos de Permisos en el Modelo Usuario

```python
usuario.is_admin          # Verifica si es administrador
usuario.is_analista       # Verifica si es analista
usuario.is_auditor        # Verifica si es auditor
usuario.has_perm_rbac('perm')  # Verifica permiso específico
```

---

## Usuarios Demo

Después de ejecutar `seed_users`, puedes acceder con:

```json
{
  "username": "admin",
  "password": "admin123",
  "rol": "Administrador"
}
```

```json
{
  "username": "analista",
  "password": "analista123",
  "rol": "Analista"
}
```

```json
{
  "username": "auditor",
  "password": "auditor123",
  "rol": "Auditor"
}
```

---

## Documentación de Desarrollo

### Crear Migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### Crear Nuevas Apps

```bash
python manage.py startapp nombre_app
```

### Ejecutar Tests

```bash
pytest
# o con coverage
pytest --cov=.
```

### Linting y Formateo

```bash
flake8 .
black .
```

---

## Pruebas

### Unitarias

```bash
pytest cuentas/tests.py -v
```

### Integración (DRF)

```bash
pytest --tb=short
```

### E2E (Selenium)

```bash
pytest tests/e2e/ -v
```

### Rendimiento (Locust)

```bash
locust -f tests/performance/locustfile.py
```

### Seguridad (ZAP Baseline)

```bash
zaproxy -cmd -quickurl http://localhost:8000 -quickout report.html
```

---

## Despliegue

### Docker Compose (desarrollo)

```bash
docker-compose up -d
docker-compose logs -f
```

### Producción

1. Usar variables de entorno seguras (`.env` no en repo)
2. Configurar `DEBUG=False` en `settings.py`
3. Usar certificado TLS en Nginx
4. Configurar ALLOWED_HOSTS correctamente
5. Backup automático de PostgreSQL
6. CI/CD con GitHub Actions

Consulta `docker-compose.yml` para más detalles.

---

## Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nombre-feature`
2. Commit tus cambios: `git commit -am 'Add feature'`
3. Push a la rama: `git push origin feature/nombre-feature`
4. Abre un Pull Request

---

## Licencia

Ver archivo `LICENSE`.

---

## Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.

---

**Última actualización:** 12 de noviembre de 2025
