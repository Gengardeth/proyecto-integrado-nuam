# 🔌 API Endpoints - NUAM

Documentación completa de los endpoints de la API REST del sistema NUAM.

**Base URL**: `http://localhost:8000/api/v1/`

**Autenticación**: JWT Bearer Token (excepto login)

---

## 📑 Índice

1. [Autenticación](#autenticación)
2. [Calificaciones Tributarias](#calificaciones-tributarias)
3. [Carga Masiva](#carga-masiva)
4. [Reportes](#reportes)
5. [Auditoría](#auditoría)
6. [Emisores](#emisores)
7. [Instrumentos](#instrumentos)
8. [Health Check](#health-check)

---

## Autenticación

### Login

Obtener tokens de acceso JWT.

```http
POST /api/v1/auth/login/
```

**Request Body**:
```json
{
  "username": "analista",
  "password": "analista123"
}
```

**Response** (200 OK):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "analista",
    "email": "analista@example.com",
    "rol": "ANALISTA",
    "is_active": true
  }
}
```

**Errores**:
- `400 Bad Request`: Credenciales inválidas
- `401 Unauthorized`: Usuario inactivo

---

### Logout

Cerrar sesión (opcional - frontend puede solo borrar tokens).

```http
POST /api/v1/auth/logout/
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "detail": "Logout exitoso"
}
```

---

### Refresh Token

Renovar token de acceso cuando expira.

```http
POST /api/v1/auth/refresh/
```

**Request Body**:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores**:
- `401 Unauthorized`: Refresh token inválido o expirado

---

### Usuario Actual

Obtener información del usuario autenticado.

```http
GET /api/v1/auth/me/
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-here",
  "username": "analista",
  "email": "analista@example.com",
  "rol": "ANALISTA",
  "is_active": true,
  "created_at": "2025-11-01T10:00:00Z"
}
```

---

## Calificaciones Tributarias

> **Permisos**:
> - `ADMIN`: Lectura y escritura completa (CREATE, READ, UPDATE, DELETE)
> - `ANALISTA`: Solo lectura (READ)
> - `AUDITOR`: Solo lectura (READ)

### Listar Calificaciones

Obtener lista de calificaciones con paginación y filtros.

```http
GET /api/v1/tax-ratings/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int): Número de página (default: 1)
- `page_size` (int): Tamaño de página (default: 10, max: 100)
- `rating` (string): Filtrar por rating (AAA, AA, A, BBB, BB, B, CCC, CC, C, D)
- `outlook` (string): Filtrar por outlook (STABLE, POSITIVE, NEGATIVE)
- `instrument` (uuid): Filtrar por ID de instrumento
- `issuer` (uuid): Filtrar por ID de emisor
- `fecha_desde` (date): Fecha de vigencia desde (YYYY-MM-DD)
- `fecha_hasta` (date): Fecha de vigencia hasta (YYYY-MM-DD)
- `search` (string): Búsqueda por nombre de instrumento/emisor

**Ejemplo**:
```http
GET /api/v1/tax-ratings/?rating=AAA&page=1&page_size=20
```

**Response** (200 OK):
```json
{
  "count": 45,
  "next": "http://localhost:8000/api/v1/tax-ratings/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-1",
      "instrument": {
        "id": "uuid-inst",
        "codigo": "INST001",
        "nombre": "Bono Corporativo XYZ",
        "tipo": "BONO",
        "emisor": {
          "id": "uuid-emit",
          "codigo": "EMIT001",
          "nombre": "Corporación XYZ",
          "pais": "Chile",
          "sector": "Financiero"
        }
      },
      "rating": "AAA",
      "outlook": "STABLE",
      "fecha_vigencia": "2025-01-15",
      "fecha_revision": "2025-07-15",
      "comentarios": "Calificación ratificada tras revisión anual.",
      "created_by": {
        "id": "uuid-user",
        "username": "analista"
      },
      "created_at": "2025-11-15T14:30:00Z",
      "updated_at": "2025-11-15T14:30:00Z"
    }
  ]
}
```

**Permisos**: `IsAuthenticated`

---

### Crear Calificación

Crear una nueva calificación tributaria.

```http
POST /api/v1/tax-ratings/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "instrument": "uuid-instrument",
  "rating": "AA",
  "outlook": "POSITIVE",
  "fecha_vigencia": "2025-12-01",
  "fecha_revision": "2026-06-01",
  "comentarios": "Mejora en indicadores financieros."
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-nuevo",
  "instrument": { ... },
  "rating": "AA",
  "outlook": "POSITIVE",
  "fecha_vigencia": "2025-12-01",
  "fecha_revision": "2026-06-01",
  "comentarios": "Mejora en indicadores financieros.",
  "created_by": { ... },
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T10:00:00Z"
}
```

**Errores**:
- `400 Bad Request`: Validación fallida
  ```json
  {
    "rating": ["Este campo es requerido."],
    "fecha_vigencia": ["La fecha de vigencia no puede ser pasada."]
  }
  ```
- `403 Forbidden`: Sin permisos (requiere rol ADMIN)
- `404 Not Found`: Instrumento no existe

**Permisos**: `TaxRatingPermission` (requiere rol ADMIN)

---

### Obtener Calificación

Detalle de una calificación específica.

```http
GET /api/v1/tax-ratings/{id}/
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "instrument": { ... },
  "rating": "AAA",
  "outlook": "STABLE",
  "fecha_vigencia": "2025-01-15",
  "fecha_revision": "2025-07-15",
  "comentarios": "...",
  "created_by": { ... },
  "created_at": "2025-11-15T14:30:00Z",
  "updated_at": "2025-11-15T14:30:00Z"
}
```

**Errores**:
- `404 Not Found`: Calificación no existe

**Permisos**: `IsAuthenticated`

---

### Actualizar Calificación

Actualizar una calificación existente (PUT completo o PATCH parcial).

```http
PUT /api/v1/tax-ratings/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (PUT - todos los campos):
```json
{
  "instrument": "uuid-instrument",
  "rating": "AA",
  "outlook": "NEGATIVE",
  "fecha_vigencia": "2025-12-01",
  "fecha_revision": "2026-06-01",
  "comentarios": "Actualización de rating."
}
```

**Request Body** (PATCH - campos parciales):
```json
{
  "rating": "A",
  "outlook": "STABLE"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "instrument": { ... },
  "rating": "A",
  "outlook": "STABLE",
  ...
}
```

**Errores**:
- `400 Bad Request`: Validación fallida
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Calificación no existe

**Permisos**: `IsAnalistaOrAbove`

---

### Eliminar Calificación

Eliminar una calificación (soft delete).

```http
DELETE /api/v1/tax-ratings/{id}/
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Errores**:
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Calificación no existe

**Permisos**: `IsAnalistaOrAbove`

---

### Estadísticas de Calificaciones

Obtener estadísticas agregadas.

```http
GET /api/v1/tax-ratings/estadisticas/
Authorization: Bearer <access_token>
```

**Query Parameters** (todos opcionales):
- `fecha_desde` (date): YYYY-MM-DD
- `fecha_hasta` (date): YYYY-MM-DD
- `issuer` (uuid): Filtrar por emisor

**Response** (200 OK):
```json
{
  "total_calificaciones": 245,
  "por_rating": {
    "AAA": 15,
    "AA": 32,
    "A": 58,
    "BBB": 67,
    "BB": 45,
    "B": 18,
    "CCC": 7,
    "CC": 2,
    "C": 1,
    "D": 0
  },
  "por_outlook": {
    "STABLE": 180,
    "POSITIVE": 45,
    "NEGATIVE": 20
  },
  "ultimas_calificaciones": [
    {
      "id": "uuid",
      "instrument": { ... },
      "rating": "AA",
      "fecha_vigencia": "2025-11-15",
      "created_at": "2025-11-17T10:00:00Z"
    }
  ]
}
```

**Permisos**: `IsAuthenticated`

---

## Carga Masiva

### Listar Cargas

Obtener historial de cargas masivas.

```http
GET /api/v1/bulk-uploads/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int)
- `page_size` (int)
- `estado` (string): PENDIENTE, PROCESANDO, COMPLETADO, ERROR

**Response** (200 OK):
```json
{
  "count": 12,
  "results": [
    {
      "id": "uuid-1",
      "archivo": "/media/uploads/ratings_2025_11_17.csv",
      "estado": "COMPLETADO",
      "total_filas": 50,
      "exitosas": 45,
      "fallidas": 5,
      "created_by": {
        "id": "uuid-user",
        "username": "analista"
      },
      "created_at": "2025-11-17T09:00:00Z",
      "procesado_at": "2025-11-17T09:05:00Z"
    }
  ]
}
```

**Permisos**: `IsAnalistaOrAbove`

---

### Subir Archivo

Subir archivo UTF-8 para carga masiva.

```http
POST /api/v1/bulk-uploads/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
archivo: <file>  (UTF-8 .txt o .tsv)
```

**Formato Esperado (con pipes)**:
```
issuer_codigo|instrument_codigo|rating|valid_from|valid_to|status|risk_level|comments
ISSUER001|INST001|AAA|2025-01-01|2025-12-31|VIGENTE|BAJO|Calificación positiva
ISSUER002|INST002|BB|2025-01-15||VIGENTE|ALTO|Sin fecha de vencimiento
```

**Response** (201 Created):
```json
{
  "id": 1,
  "archivo": "/media/bulk_uploads/2025/11/17/ejemplo.txt",
  "tipo": "UTF8",
  "estado": "PENDIENTE",
  "total_filas": 0,
  "filas_ok": 0,
  "filas_error": 0,
  "usuario_username": "admin",
  "created_at": "2025-11-17T10:00:00Z"
}
```

**Errores**:
- `400 Bad Request`: Archivo no válido
  ```json
  {
    "archivo": ["Solo se permiten archivos CSV y XLSX."]
  }
  ```
- `403 Forbidden`: Sin permisos

**Permisos**: `IsAnalistaOrAbove`

---

### Procesar Carga

Iniciar procesamiento de archivo subido.

```http
POST /api/v1/bulk-uploads/{id}/procesar/
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "estado": "COMPLETADO",
  "total_filas": 50,
  "exitosas": 45,
  "fallidas": 5,
  "procesado_at": "2025-11-17T10:05:00Z"
}
```

**Errores**:
- `400 Bad Request`: Estado no permite procesar
  ```json
  {
    "detail": "La carga ya fue procesada."
  }
  ```
- `404 Not Found`: Carga no existe

**Permisos**: `IsAnalistaOrAbove`

---

### Items de Carga

Obtener detalle de items procesados (éxitos y errores).

```http
GET /api/v1/bulk-uploads/{id}/items/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `estado` (string): PENDIENTE, EXITOSO, ERROR

**Response** (200 OK):
```json
{
  "count": 50,
  "results": [
    {
      "id": "uuid-item-1",
      "fila": 2,
      "datos": {
        "codigo_instrumento": "INST001",
        "rating": "AAA",
        "outlook": "STABLE"
      },
      "estado": "EXITOSO",
      "errores": null,
      "rating_creado": "uuid-rating"
    },
    {
      "id": "uuid-item-2",
      "fila": 3,
      "datos": {
        "codigo_instrumento": "INST999",
        "rating": "INVALID"
      },
      "estado": "ERROR",
      "errores": "Instrumento no encontrado. Rating inválido.",
      "rating_creado": null
    }
  ]
}
```

**Permisos**: `IsAnalistaOrAbove`

---

## Reportes

### Estadísticas con Filtros

Obtener estadísticas detalladas para reportes.

```http
GET /api/v1/reports/estadisticas/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `fecha_desde` (date)
- `fecha_hasta` (date)
- `issuer` (uuid)
- `rating` (string)
- `outlook` (string)

**Response** (200 OK):
```json
{
  "total_calificaciones": 120,
  "por_rating": { ... },
  "por_outlook": { ... },
  "por_emisor": [
    {
      "emisor": "Corporación ABC",
      "total": 15,
      "rating_promedio": "AA"
    }
  ],
  "timeline": [
    {
      "fecha": "2025-11",
      "total": 25
    }
  ]
}
```

**Permisos**: `IsAnalistaOrAbove`

---

### Exportar CSV

Exportar calificaciones a CSV con filtros.

```http
GET /api/v1/reports/exportar_csv/
Authorization: Bearer <access_token>
```

**Query Parameters**: (mismos que estadísticas)

**Response** (200 OK):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="calificaciones_2025_11_17.csv"

ID,Instrumento,Emisor,Rating,Outlook,Fecha Vigencia,Comentarios
uuid-1,INST001,Corporación XYZ,AAA,STABLE,2025-11-15,"..."
...
```

**Permisos**: `IsAnalistaOrAbove`

---

### Exportar PDF

Exportar reporte visual en PDF con gráficos.

```http
GET /api/v1/reports/exportar_pdf/
Authorization: Bearer <access_token>
```

**Query Parameters**: (mismos que estadísticas)

**Response** (200 OK):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="reporte_calificaciones_2025_11_17.pdf"

[Binary PDF Content]
```

**Contenido PDF**:
- Header con logo y fecha
- Tabla de calificaciones filtradas
- Gráfico de torta: distribución por rating
- Gráfico de barras: distribución por outlook
- Footer con paginación

**Permisos**: `IsAnalistaOrAbove`

---

## Auditoría

### Listar Logs de Auditoría

Obtener historial de acciones del sistema.

```http
GET /api/v1/audit-logs/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int)
- `page_size` (int)
- `usuario` (uuid): Filtrar por ID de usuario
- `accion` (string): CREATE, UPDATE, DELETE
- `modelo` (string): TaxRating, BulkUpload, etc.
- `fecha_desde` (datetime): YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS
- `fecha_hasta` (datetime)

**Response** (200 OK):
```json
{
  "count": 523,
  "results": [
    {
      "id": "uuid-log-1",
      "usuario": {
        "id": "uuid-user",
        "username": "analista"
      },
      "accion": "UPDATE",
      "modelo": "TaxRating",
      "objeto_id": "uuid-rating",
      "cambios": {
        "rating": {
          "anterior": "AA",
          "nuevo": "A"
        },
        "outlook": {
          "anterior": "POSITIVE",
          "nuevo": "STABLE"
        }
      },
      "ip_address": "192.168.1.100",
      "timestamp": "2025-11-17T10:30:00Z"
    }
  ]
}
```

**Permisos**: `IsAuditorOrAbove`

---

### Estadísticas de Auditoría

Obtener estadísticas de actividad del sistema.

```http
GET /api/v1/audit-logs/estadisticas/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `fecha_desde` (datetime)
- `fecha_hasta` (datetime)

**Response** (200 OK):
```json
{
  "total_acciones": 523,
  "por_accion": {
    "CREATE": 200,
    "UPDATE": 250,
    "DELETE": 73
  },
  "por_usuario": [
    {
      "usuario": "analista",
      "total": 180
    },
    {
      "usuario": "admin",
      "total": 150
    }
  ],
  "por_modelo": {
    "TaxRating": 400,
    "BulkUpload": 80,
    "Issuer": 30,
    "Instrument": 13
  },
  "timeline_diaria": [
    {
      "fecha": "2025-11-17",
      "total": 45
    }
  ]
}
```

**Permisos**: `IsAuditorOrAbove`

---

## Emisores

### Listar Emisores

```http
GET /api/v1/issuers/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int)
- `page_size` (int)
- `search` (string): Buscar por código o nombre
- `pais` (string)
- `sector` (string)

**Response** (200 OK):
```json
{
  "count": 35,
  "results": [
    {
      "id": "uuid-1",
      "codigo": "EMIT001",
      "nombre": "Corporación XYZ",
      "pais": "Chile",
      "sector": "Financiero",
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ]
}
```

**Permisos**: `IsAuthenticated`

---

### Crear Emisor

```http
POST /api/v1/issuers/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "codigo": "EMIT002",
  "nombre": "Empresa ABC S.A.",
  "pais": "Argentina",
  "sector": "Retail"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-nuevo",
  "codigo": "EMIT002",
  "nombre": "Empresa ABC S.A.",
  "pais": "Argentina",
  "sector": "Retail",
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T10:00:00Z"
}
```

**Errores**:
- `400 Bad Request`: Código duplicado
  ```json
  {
    "codigo": ["Ya existe un emisor con este código."]
  }
  ```

**Permisos**: `IsAnalistaOrAbove`

---

### Obtener/Actualizar/Eliminar Emisor

Similar a Calificaciones:
- `GET /api/v1/issuers/{id}/`
- `PUT/PATCH /api/v1/issuers/{id}/`
- `DELETE /api/v1/issuers/{id}/`

**Permisos**:
- GET: `IsAuthenticated`
- PUT/PATCH/DELETE: `IsAnalistaOrAbove`

---

## Instrumentos

### Listar Instrumentos

```http
GET /api/v1/instruments/
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int)
- `page_size` (int)
- `search` (string)
- `tipo` (string): BONO, ACCION, DERIVADO
- `emisor` (uuid)

**Response** (200 OK):
```json
{
  "count": 78,
  "results": [
    {
      "id": "uuid-1",
      "codigo": "INST001",
      "nombre": "Bono Corporativo XYZ 2025",
      "tipo": "BONO",
      "emisor": {
        "id": "uuid-emit",
        "codigo": "EMIT001",
        "nombre": "Corporación XYZ"
      },
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Permisos**: `IsAuthenticated`

---

### Crear Instrumento

```http
POST /api/v1/instruments/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "codigo": "INST002",
  "nombre": "Acción Preferente ABC",
  "tipo": "ACCION",
  "emisor": "uuid-emisor"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-nuevo",
  "codigo": "INST002",
  "nombre": "Acción Preferente ABC",
  "tipo": "ACCION",
  "emisor": { ... },
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T10:00:00Z"
}
```

**Permisos**: `IsAnalistaOrAbove`

---

### Obtener/Actualizar/Eliminar Instrumento

- `GET /api/v1/instruments/{id}/`
- `PUT/PATCH /api/v1/instruments/{id}/`
- `DELETE /api/v1/instruments/{id}/`

**Permisos**:
- GET: `IsAuthenticated`
- PUT/PATCH/DELETE: `IsAnalistaOrAbove`

---

## Health Check

### Verificar Estado del Sistema

```http
GET /api/v1/health/
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2025-11-17T10:00:00Z"
}
```

**Errores**:
- `503 Service Unavailable`: Sistema no disponible
  ```json
  {
    "status": "unhealthy",
    "database": "disconnected",
    "error": "Database connection failed"
  }
  ```

**Permisos**: Público (no requiere autenticación)

---

## Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Request exitoso |
| 201 | Created | Recurso creado |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Validación fallida |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sin permisos |
| 404 | Not Found | Recurso no existe |
| 500 | Internal Server Error | Error del servidor |
| 503 | Service Unavailable | Servicio no disponible |

---

## Autenticación en Requests

**Header Requerido** (excepto `/login` y `/health`):
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con cURL**:
```bash
curl -X GET "http://localhost:8000/api/v1/tax-ratings/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ejemplo con Axios** (JavaScript):
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// Uso
const response = await api.get('tax-ratings/');
```

---

## Rate Limiting

**Límites** (por IP):
- Anónimo: 100 requests/hora
- Autenticado: 1000 requests/hora

**Headers de respuesta**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1700000000
```

---

## Paginación

Todas las listas usan paginación.

**Query Parameters**:
- `page`: Número de página (default: 1)
- `page_size`: Items por página (default: 10, max: 100)

**Estructura de Respuesta**:
```json
{
  "count": 245,
  "next": "http://localhost:8000/api/v1/tax-ratings/?page=3",
  "previous": "http://localhost:8000/api/v1/tax-ratings/?page=1",
  "results": [ ... ]
}
```

---

## Búsqueda y Filtros

**Búsqueda general** (param `search`):
- Busca en múltiples campos
- Case-insensitive
- Soporta búsqueda parcial

**Filtros específicos**:
- Usar nombre exacto del campo
- Soporta comparadores: `__gte`, `__lte`, `__contains`

**Ejemplo**:
```http
GET /api/v1/tax-ratings/?search=XYZ&rating=AAA&fecha_vigencia__gte=2025-01-01
```

---

## Errores Comunes

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solución**: Incluir header `Authorization: Bearer <token>`

---

### 403 Forbidden
```json
{
  "detail": "No tiene permisos para realizar esta acción."
}
```
**Solución**: Usuario no tiene rol adecuado (verificar permisos RBAC)

---

### 400 Bad Request (Validación)
```json
{
  "rating": ["Este campo es requerido."],
  "fecha_vigencia": ["La fecha de vigencia no puede ser pasada."]
}
```
**Solución**: Corregir campos inválidos según mensajes

---

### 404 Not Found
```json
{
  "detail": "No encontrado."
}
```
**Solución**: Verificar ID del recurso

---

## Versionado de API

**Actual**: `v1`

**URL Base**: `/api/v1/`

Cambios futuros usarán `/api/v2/` manteniendo retrocompatibilidad.

---

## Changelog de API

### v1.0.0 (2025-11-17)
- ✅ Endpoints de Autenticación (login, logout, refresh, me)
- ✅ CRUD completo de Calificaciones
- ✅ Carga Masiva (upload, procesar, items)
- ✅ Reportes (estadísticas, CSV, PDF)
- ✅ Auditoría (logs, estadísticas)
- ✅ Catálogos (Emisores, Instrumentos)
- ✅ Health check

---

## Soporte

**Documentación adicional**:
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Instalación
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) - Deploy con Docker

**Issues**: Crear en GitHub para reportar problemas
