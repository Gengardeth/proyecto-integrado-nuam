# 🏗 Arquitectura del Sistema NUAM

## Resumen Ejecutivo

Sistema web full-stack con arquitectura Cliente-Servidor, siguiendo el patrón **REST API** con autenticación JWT y control de acceso basado en roles (RBAC).

---

## Stack Tecnológico

### Backend
- **Framework**: Django 5.2.8 (Python 3.13)
- **API**: Django REST Framework 3.16.1
- **Database**: PostgreSQL 16
- **ORM**: Django ORM
- **Auth**: JWT (djangorestframework-simplejwt 5.4.0)
- **Server**: Gunicorn 23.0.0
- **Storage**: Sistema de archivos local + S3 (opcional)
- **Reports**: ReportLab 4.4.4 (PDF) + OpenPyXL 3.1.5 (Excel)

### Frontend
- **Framework**: React 18.3.1
- **State Management**: Context API (AuthContext)
- **Router**: React Router 7.1.1
- **HTTP Client**: Axios 1.7.9
- **Build Tool**: Vite 7.2.2
- **UI Components**: CSS Modules + Material-inspired
- **Charts**: Chart.js 4.5.1
- **Testing**: Vitest 2.1.9

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Alpine)
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Version Control**: Git

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │   Pages    │  │ Components │  │  Services (Axios)  │   │
│  │ (Dashboard)│  │  (Sidebar) │  │   (API Clients)    │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
│         │               │                  │                │
│         └───────────────┴──────────────────┘                │
│                         │                                    │
│                         ▼                                    │
│              Context API (AuthContext)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                      HTTP/HTTPS (REST)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              NGINX (Reverse Proxy + Static Files)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Django + Gunicorn)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │   Views    │  │Serializers │  │     Models         │   │
│  │ (ViewSets) │  │(Validation)│  │  (TaxRating, etc)  │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
│         │               │                  │                │
│         └───────────────┴──────────────────┘                │
│                         │                                    │
│         ┌───────────────┴───────────────┐                   │
│         ▼                               ▼                   │
│  ┌──────────────┐              ┌────────────────┐          │
│  │ Permissions  │              │  Middleware    │          │
│  │   (RBAC)     │              │ (Auth, Audit)  │          │
│  └──────────────┘              └────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL 16 (Database)                   │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │  TaxRating   │   Usuario    │  BulkUpload         │    │
│  │  Issuer      │   AuditLog   │  BulkUploadItem     │    │
│  │  Instrument  │              │                      │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Capas de la Aplicación

### 1. Frontend Layer (React)

#### Estructura
```
src/
├── pages/              # Vistas principales (Dashboard, Calificaciones)
├── components/         # Componentes reutilizables (Sidebar, Table)
├── services/           # Clientes API (ratingsService, reportsService)
├── context/            # Estado global (AuthContext)
├── router/             # Configuración de rutas
├── hooks/              # Custom hooks (useAuth, useAPI)
└── utils/              # Utilidades (formatDate, handleError)
```

#### Flujo de Datos
```
User Interaction → Component → Service (Axios) → Backend API
                       ↑                              │
                       └──────── Response ───────────┘
```

#### Autenticación
- **Token Storage**: `localStorage.getItem('accessToken')`
- **Interceptor**: Axios intercepta requests para añadir `Authorization: Bearer <token>`
- **Refresh**: Renovación automática al expirar (usando `refreshToken`)
- **Context**: `AuthContext` mantiene estado de usuario y funciones login/logout

---

### 2. Backend Layer (Django)

#### Estructura de Apps
```
backend/
├── Nuam/                   # Configuración principal
│   ├── settings.py         # Configuración Django
│   ├── urls.py             # Routing principal
│   └── wsgi.py             # WSGI entry point
│
├── calificacionfiscal/     # App principal
│   ├── models.py           # TaxRating, BulkUpload, BulkUploadItem
│   ├── views.py            # ViewSets para API
│   ├── serializers.py      # Validación y transformación
│   ├── permissions.py      # Control de acceso
│   ├── reports.py          # Generación de PDF
│   └── utils.py            # Funciones auxiliares
│
├── cuentas/                # Autenticación
│   ├── models.py           # Usuario custom
│   ├── views.py            # Login, logout, me
│   ├── audit_models.py     # AuditLog
│   └── audit_middleware.py # Logging automático
│
└── parametros/             # Catálogos
    ├── models.py           # Issuer, Instrument
    └── views.py            # CRUD básico
```

#### Permisos (RBAC)

```python
# calificacionfiscal/permissions.py

IsAdministrador        # Todos los permisos
IsAnalistaOrAbove      # CRUD + Reports + BulkUpload
IsAuditorOrAbove       # Solo lectura + Auditoría
```

**Matriz de Permisos**:

| Acción | Administrador | Analista | Auditor |
|--------|---------------|----------|---------|
| Ver Calificaciones | ✅ | ✅ | ✅ |
| Crear/Editar Calificaciones | ✅ | ✅ | ❌ |
| Eliminar Calificaciones | ✅ | ✅ | ❌ |
| Carga Masiva | ✅ | ✅ | ❌ |
| Exportar Reportes | ✅ | ✅ | ❌ |
| Ver Auditoría | ✅ | ✅ | ✅ |
| Gestionar Usuarios | ✅ | ❌ | ❌ |

---

### 3. Database Layer (PostgreSQL)

#### Modelo de Datos Principal

```sql
-- Usuarios
Usuario {
    id: UUID PK
    username: VARCHAR(150) UNIQUE
    email: EMAIL
    rol: VARCHAR(20) [ADMINISTRADOR, ANALISTA, AUDITOR]
    is_active: BOOLEAN
    created_at: TIMESTAMP
}

-- Emisores
Issuer {
    id: UUID PK
    codigo: VARCHAR(20) UNIQUE
    nombre: VARCHAR(255)
    pais: VARCHAR(100)
    sector: VARCHAR(100)
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
}

-- Instrumentos
Instrument {
    id: UUID PK
    codigo: VARCHAR(50) UNIQUE
    nombre: VARCHAR(255)
    tipo: VARCHAR(50) [BONO, ACCION, DERIVADO]
    emisor_id: UUID FK → Issuer
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
}

-- Calificaciones
TaxRating {
    id: UUID PK
    instrument_id: UUID FK → Instrument
    rating: VARCHAR(10) [AAA, AA, A, BBB, BB, B, CCC, CC, C, D]
    outlook: VARCHAR(10) [STABLE, POSITIVE, NEGATIVE]
    fecha_vigencia: DATE
    fecha_revision: DATE
    comentarios: TEXT
    created_by_id: UUID FK → Usuario
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
}

-- Cargas Masivas
BulkUpload {
    id: UUID PK
    archivo: FILE
    estado: VARCHAR(20) [PENDIENTE, PROCESANDO, COMPLETADO, ERROR]
    total_filas: INT
    exitosas: INT
    fallidas: INT
    created_by_id: UUID FK → Usuario
    created_at: TIMESTAMP
}

BulkUploadItem {
    id: UUID PK
    bulk_upload_id: UUID FK → BulkUpload
    fila: INT
    datos: JSON
    estado: VARCHAR(20) [PENDIENTE, EXITOSO, ERROR]
    errores: TEXT
}

-- Auditoría
AuditLog {
    id: UUID PK
    usuario_id: UUID FK → Usuario
    accion: VARCHAR(20) [CREATE, UPDATE, DELETE]
    modelo: VARCHAR(100)
    objeto_id: UUID
    cambios: JSON
    ip_address: INET
    timestamp: TIMESTAMP
}
```

#### Índices Principales
```sql
CREATE INDEX idx_taxrating_instrument ON TaxRating(instrument_id);
CREATE INDEX idx_taxrating_created_by ON TaxRating(created_by_id);
CREATE INDEX idx_instrument_emisor ON Instrument(emisor_id);
CREATE INDEX idx_auditlog_usuario ON AuditLog(usuario_id);
CREATE INDEX idx_auditlog_timestamp ON AuditLog(timestamp DESC);
CREATE INDEX idx_bulkupload_created_by ON BulkUpload(created_by_id);
```

---

## Flujos de Datos Principales

### 1. Autenticación (Login)

```
┌──────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│Client│         │ Frontend │         │ Backend │         │ Database │
└──┬───┘         └────┬─────┘         └────┬────┘         └────┬─────┘
   │                  │                     │                   │
   │  POST /login     │                     │                   │
   ├─────────────────>│  POST /api/v1/auth/login/              │
   │                  ├────────────────────>│  SELECT * FROM    │
   │                  │                     │  Usuario WHERE    │
   │                  │                     │  username=?       │
   │                  │                     ├──────────────────>│
   │                  │                     │                   │
   │                  │                     │<──────────────────┤
   │                  │                     │ Usuario data      │
   │                  │                     │                   │
   │                  │                     │ Verify password   │
   │                  │                     │ Generate JWT      │
   │                  │                     │                   │
   │                  │<────────────────────┤                   │
   │                  │ {access, refresh,   │                   │
   │                  │  user_info}         │                   │
   │<─────────────────┤                     │                   │
   │ Store tokens     │                     │                   │
   │ in localStorage  │                     │                   │
```

### 2. CRUD Calificación

```
┌──────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│Client│         │ Frontend │         │ Backend │         │ Database │
└──┬───┘         └────┬─────┘         └────┬────┘         └────┬─────┘
   │                  │                     │                   │
   │  Crear Rating    │                     │                   │
   ├─────────────────>│  POST /api/v1/tax-ratings/             │
   │                  │  Headers:           │                   │
   │                  │  Authorization:     │                   │
   │                  │  Bearer <token>     │                   │
   │                  ├────────────────────>│                   │
   │                  │                     │ Verify JWT        │
   │                  │                     │ Check Permission  │
   │                  │                     │ (IsAnalistaOrAbove)
   │                  │                     │                   │
   │                  │                     │ Validate data     │
   │                  │                     │ (Serializer)      │
   │                  │                     │                   │
   │                  │                     │ INSERT INTO       │
   │                  │                     │ TaxRating         │
   │                  │                     ├──────────────────>│
   │                  │                     │<──────────────────┤
   │                  │                     │                   │
   │                  │                     │ Log to AuditLog   │
   │                  │                     ├──────────────────>│
   │                  │                     │                   │
   │                  │<────────────────────┤                   │
   │                  │ 201 Created         │                   │
   │<─────────────────┤ {id, rating, ...}  │                   │
```

### 3. Carga Masiva

```
┌──────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│Client│         │ Frontend │         │ Backend │         │ Database │
└──┬───┘         └────┬─────┘         └────┬────┘         └────┬─────┘
   │                  │                     │                   │
   │  Upload CSV      │                     │                   │
   ├─────────────────>│  POST /api/v1/bulk-uploads/            │
   │                  │  FormData: file     │                   │
   │                  ├────────────────────>│                   │
   │                  │                     │ Save file         │
   │                  │                     │ CREATE BulkUpload │
   │                  │                     ├──────────────────>│
   │                  │                     │<──────────────────┤
   │                  │<────────────────────┤                   │
   │                  │ {id, estado:        │                   │
   │                  │  PENDIENTE}         │                   │
   │<─────────────────┤                     │                   │
   │                  │                     │                   │
   │  Procesar        │                     │                   │
   ├─────────────────>│  POST /api/v1/bulk-uploads/{id}/procesar/
   │                  ├────────────────────>│                   │
   │                  │                     │ Read CSV          │
   │                  │                     │ Parse rows        │
   │                  │                     │ FOR each row:     │
   │                  │                     │   Validate        │
   │                  │                     │   IF valid:       │
   │                  │                     │     INSERT Rating │
   │                  │                     │   ELSE:           │
   │                  │                     │     Log error     │
   │                  │                     ├──────────────────>│
   │                  │                     │<──────────────────┤
   │                  │                     │                   │
   │                  │<────────────────────┤                   │
   │                  │ {exitosas: 45,      │                   │
   │                  │  fallidas: 5}       │                   │
   │<─────────────────┤                     │                   │
```

---

## Seguridad

### 1. Autenticación JWT

**Token Structure**:
```json
{
  "token_type": "Bearer",
  "exp": 1700000000,
  "iat": 1699900000,
  "jti": "abc123...",
  "user_id": "uuid-here",
  "username": "analista",
  "rol": "ANALISTA"
}
```

**Flujo de Refresh**:
```
1. Access token expira (5 min)
2. Frontend detecta 401 Unauthorized
3. Envía refresh token a /api/v1/auth/refresh/
4. Backend valida refresh token (24h)
5. Retorna nuevo access token
6. Frontend reintenta request original
```

### 2. CORS (Cross-Origin Resource Sharing)

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev
    "http://localhost",       # Docker frontend
]

CORS_ALLOW_CREDENTIALS = True
```

### 3. CSRF Protection

- **REST API**: Excluida de CSRF (usa JWT)
- **Admin Panel**: Protected con CSRF token
- **Configuración**: `@csrf_exempt` en API views

### 4. SQL Injection Protection

- **ORM**: Django ORM previene SQL injection automáticamente
- **Raw Queries**: Siempre usar parámetros: `cursor.execute("SELECT * FROM table WHERE id = %s", [user_id])`

### 5. Validación de Entrada

```python
# serializers.py
class TaxRatingSerializer(serializers.ModelSerializer):
    rating = serializers.ChoiceField(choices=[
        'AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'
    ])
    outlook = serializers.ChoiceField(choices=[
        'STABLE', 'POSITIVE', 'NEGATIVE'
    ])
    
    def validate_fecha_vigencia(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "La fecha de vigencia no puede ser pasada"
            )
        return value
```

---

## Escalabilidad

### Horizontal Scaling
- **Backend**: Múltiples instancias de Gunicorn detrás de Nginx
- **Database**: PostgreSQL con replicación maestro-esclavo
- **Frontend**: Servir estáticos desde CDN

### Caching Strategy
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# views.py
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # 15 minutos
def estadisticas(request):
    ...
```

### Background Tasks
- **Celery**: Procesar cargas masivas en background
- **Redis**: Message broker para Celery

---

## Monitoreo y Logging

### Application Logs
```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/nuam/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Audit Trail
- **Middleware**: `audit_middleware.py` captura todas las mutaciones
- **AuditLog**: Registra usuario, acción, objeto, cambios, IP, timestamp
- **Retención**: 90 días (configurable)

---

## Deployment

### Docker Compose (Producción)

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: proyecto_nuam
      POSTGRES_USER: nuam_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "nuam_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    command: gunicorn Nuam.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - static_volume:/app/static
      - media_volume:/app/media
    environment:
      DATABASE_URL: postgresql://nuam_user:${DB_PASSWORD}@db:5432/proyecto_nuam
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    volumes:
      - frontend_build:/usr/share/nginx/html
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Environment Variables

```bash
# .env
DB_PASSWORD=secure_password_here
SECRET_KEY=django_secret_key_here
DEBUG=False
ALLOWED_HOSTS=nuam.example.com,www.nuam.example.com
CORS_ALLOWED_ORIGINS=https://nuam.example.com
```

---

## Performance Metrics

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| API Response Time (p95) | < 500ms | ~300ms |
| Database Query Time | < 100ms | ~50ms |
| Frontend Load Time | < 2s | ~1.2s |
| Concurrent Users | 100+ | Tested: 50 |
| Tests Execution Time | < 1s | ~800ms |
| Docker Build Time | < 5min | ~3min |

---

## Referencias

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
