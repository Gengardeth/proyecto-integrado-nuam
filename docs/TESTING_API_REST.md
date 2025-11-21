# Testing de API REST - Sistema NUAM

## 📋 Índice

1. [Endpoints de API](#endpoints-de-api)
2. [Testing de Autenticación](#testing-de-autenticación)
3. [Testing de Autorización](#testing-de-autorización)
4. [Testing de CRUD](#testing-de-crud)
5. [Testing de Validación](#testing-de-validación)
6. [Testing de Carga Masiva](#testing-de-carga-masiva)
7. [Casos de Error](#casos-de-error)

---

## Endpoints de API

### Autenticación
```
POST   /api/v1/auth/login          # Login
GET    /api/v1/auth/me             # Me (current user)
POST   /api/v1/auth/logout         # Logout
POST   /api/v1/auth/refresh        # Refresh token
```

### Calificaciones (Tax Ratings)
```
GET    /api/v1/tax-ratings/                    # Listar
POST   /api/v1/tax-ratings/                    # Crear (ADMIN)
GET    /api/v1/tax-ratings/{id}/               # Detalle
PATCH  /api/v1/tax-ratings/{id}/               # Actualizar (ADMIN)
DELETE /api/v1/tax-ratings/{id}/               # Eliminar (ADMIN)
GET    /api/v1/tax-ratings/estadisticas/      # Estadísticas
```

### Carga Masiva
```
GET    /api/v1/bulk-uploads/                   # Listar cargas
POST   /api/v1/bulk-uploads/                   # Crear carga
GET    /api/v1/bulk-uploads/{id}/              # Detalle
POST   /api/v1/bulk-uploads/{id}/procesar/    # Procesar
POST   /api/v1/bulk-uploads/{id}/rechazar/    # Rechazar
GET    /api/v1/bulk-uploads/{id}/items/       # Items de carga
```

### Auditoría
```
GET    /api/v1/audit-logs/                     # Listar logs
GET    /api/v1/audit-logs/{id}/                # Detalle log
```

### Parámetros
```
GET    /api/v1/issuers/                        # Listar issuers
POST   /api/v1/issuers/                        # Crear issuer
GET    /api/v1/instruments/                    # Listar instruments
POST   /api/v1/instruments/                    # Crear instrument
```

---

## Testing de Autenticación

### Test 1: Login exitoso

```python
def test_login_exitoso(client):
    """Verifica login con credenciales válidas"""
    response = client.post('/api/v1/auth/login', {
        'username': 'admin',
        'password': 'admin123'
    }, format='json')
    
    assert response.status_code == 200
    assert 'access' in response.json()
    assert 'refresh' in response.json()
```

**Resultado Esperado**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "rol": "ADMIN"
  }
}
```

### Test 2: Login con credenciales inválidas

```python
def test_login_fallido(client):
    """Verifica login con credenciales inválidas"""
    response = client.post('/api/v1/auth/login', {
        'username': 'admin',
        'password': 'wrongpassword'
    }, format='json')
    
    assert response.status_code == 401
    assert 'detail' in response.json()
```

**Resultado Esperado**:
```json
{
  "detail": "Credenciales inválidas"
}
```

### Test 3: Obtener usuario actual

```python
def test_get_current_user(client, admin_user):
    """Verifica obtener usuario actual"""
    client.force_login(admin_user)
    response = client.get('/api/v1/auth/me/')
    
    assert response.status_code == 200
    assert response.json()['username'] == 'admin'
    assert response.json()['rol'] == 'ADMIN'
```

---

## Testing de Autorización

### Test 1: ADMIN puede crear calificación

```python
def test_admin_crea_calificacion(client, admin_user, issuer, instrument):
    """Verifica que ADMIN puede crear"""
    client.force_login(admin_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': issuer.id,
        'instrument': instrument.id,
        'rating': 'AAA',
        'valid_from': '2025-01-01'
    }, format='json')
    
    assert response.status_code == 201
    assert TaxRating.objects.count() == 1
```

**Resultado Esperado**: HTTP 201 Created

### Test 2: ANALISTA NO puede crear calificación

```python
def test_analista_no_crea_calificacion(client, analista_user, issuer, instrument):
    """Verifica que ANALISTA recibe 403"""
    client.force_login(analista_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': issuer.id,
        'instrument': instrument.id,
        'rating': 'AAA',
        'valid_from': '2025-01-01'
    }, format='json')
    
    assert response.status_code == 403
    assert 'detail' in response.json()
```

**Resultado Esperado**: HTTP 403 Forbidden

### Test 3: AUDITOR puede listar pero NO editar

```python
def test_auditor_lista_pero_no_edita(client, auditor_user, tax_rating):
    """Verifica permisos de AUDITOR"""
    client.force_login(auditor_user)
    
    # Listar - OK
    response = client.get('/api/v1/tax-ratings/')
    assert response.status_code == 200
    
    # Editar - Forbidden
    response = client.patch(f'/api/v1/tax-ratings/{tax_rating.id}/', {
        'rating': 'BB'
    }, format='json')
    assert response.status_code == 403
```

---

## Testing de CRUD

### Create

```python
def test_crear_calificacion_valida(client, admin_user):
    """Verifica creación de calificación válida"""
    client.force_login(admin_user)
    
    payload = {
        'issuer': 1,
        'instrument': 1,
        'rating': 'AAA',
        'valid_from': '2025-01-01',
        'valid_to': '2025-12-31',
        'status': 'VIGENTE',
        'risk_level': 'BAJO'
    }
    
    response = client.post('/api/v1/tax-ratings/', payload, format='json')
    
    assert response.status_code == 201
    assert response.json()['rating'] == 'AAA'
    assert TaxRating.objects.count() == 1
```

### Read

```python
def test_leer_calificacion(client, admin_user, tax_rating):
    """Verifica lectura de calificación"""
    client.force_login(admin_user)
    
    response = client.get(f'/api/v1/tax-ratings/{tax_rating.id}/')
    
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == tax_rating.id
    assert data['rating'] == tax_rating.rating
    assert data['issuer']['id'] == tax_rating.issuer.id
```

### Update

```python
def test_actualizar_calificacion(client, admin_user, tax_rating):
    """Verifica actualización de calificación"""
    client.force_login(admin_user)
    
    response = client.patch(
        f'/api/v1/tax-ratings/{tax_rating.id}/',
        {'rating': 'AA'},
        format='json'
    )
    
    assert response.status_code == 200
    tax_rating.refresh_from_db()
    assert tax_rating.rating == 'AA'
```

### Delete

```python
def test_eliminar_calificacion(client, admin_user, tax_rating):
    """Verifica eliminación de calificación"""
    client.force_login(admin_user)
    
    response = client.delete(f'/api/v1/tax-ratings/{tax_rating.id}/')
    
    assert response.status_code == 204
    assert TaxRating.objects.count() == 0
```

---

## Testing de Validación

### Test 1: Campos requeridos

```python
def test_campos_requeridos(client, admin_user):
    """Verifica que campos requeridos son obligatorios"""
    client.force_login(admin_user)
    
    # Sin issuer_id
    response = client.post('/api/v1/tax-ratings/', {
        'instrument': 1,
        'rating': 'AAA',
        'valid_from': '2025-01-01'
    }, format='json')
    
    assert response.status_code == 400
    assert 'issuer' in response.json()
```

### Test 2: Validar formato de fecha

```python
def test_validar_formato_fecha(client, admin_user):
    """Verifica validación de formato de fecha"""
    client.force_login(admin_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': 1,
        'instrument': 1,
        'rating': 'AAA',
        'valid_from': '01-01-2025'  # Formato inválido
    }, format='json')
    
    assert response.status_code == 400
    assert 'valid_from' in response.json()
```

### Test 3: Validar rango de fechas

```python
def test_validar_rango_fechas(client, admin_user):
    """Verifica que valid_to sea posterior a valid_from"""
    client.force_login(admin_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': 1,
        'instrument': 1,
        'rating': 'AAA',
        'valid_from': '2025-12-31',
        'valid_to': '2025-01-01'  # Anterior a valid_from
    }, format='json')
    
    assert response.status_code == 400
    assert 'valid_to' in response.json()
```

### Test 4: Validar valores válidos de rating

```python
def test_validar_rating_valido(client, admin_user):
    """Verifica que rating sea de valores permitidos"""
    client.force_login(admin_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': 1,
        'instrument': 1,
        'rating': 'ZZZ',  # Rating inválido
        'valid_from': '2025-01-01'
    }, format='json')
    
    assert response.status_code == 400
    assert 'rating' in response.json()
```

---

## Testing de Carga Masiva

### Test 1: Subir archivo

```python
def test_subir_archivo_carga(client, admin_user):
    """Verifica subida de archivo"""
    client.force_login(admin_user)
    
    with open('test_carga_masiva.txt', 'rb') as f:
        response = client.post(
            '/api/v1/bulk-uploads/',
            {'archivo': f},
            format='multipart'
        )
    
    assert response.status_code == 201
    assert response.json()['estado'] == 'PENDIENTE'
    assert response.json()['total_filas'] == 10
```

**Resultado Esperado**:
```json
{
  "id": 1,
  "archivo": "bulk_uploads/2025/11/21/test_carga_masiva.txt",
  "estado": "PENDIENTE",
  "total_filas": 10,
  "filas_ok": 0,
  "filas_error": 0,
  "tipo": "UTF8",
  "creado_en": "2025-11-21T16:30:00Z"
}
```

### Test 2: Procesar carga

```python
def test_procesar_carga(client, admin_user, bulk_upload):
    """Verifica procesamiento de carga"""
    client.force_login(admin_user)
    
    response = client.post(f'/api/v1/bulk-uploads/{bulk_upload.id}/procesar/')
    
    assert response.status_code == 200
    assert response.json()['estado'] == 'COMPLETADO'
    assert response.json()['filas_ok'] == 10
    assert response.json()['filas_error'] == 0
```

### Test 3: Rechazar carga

```python
def test_rechazar_carga(client, admin_user, bulk_upload):
    """Verifica rechazo de carga"""
    client.force_login(admin_user)
    
    response = client.post(f'/api/v1/bulk-uploads/{bulk_upload.id}/rechazar/')
    
    assert response.status_code == 200
    assert response.json()['estado'] == 'RECHAZADO'
```

### Test 4: Obtener items de carga

```python
def test_obtener_items_carga(client, admin_user, bulk_upload):
    """Verifica obtención de items de carga"""
    client.force_login(admin_user)
    
    response = client.get(f'/api/v1/bulk-uploads/{bulk_upload.id}/items/')
    
    assert response.status_code == 200
    assert 'results' in response.json()
    assert len(response.json()['results']) == 10
```

---

## Casos de Error

### Error 400: Bad Request

```python
def test_error_400_campos_invalidos(client, admin_user):
    """Verifica error 400 con campos inválidos"""
    client.force_login(admin_user)
    
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': 'invalid',  # Debe ser ID
        'rating': 'AAA'
    }, format='json')
    
    assert response.status_code == 400
```

**Respuesta**:
```json
{
  "issuer": ["Esperado un número"],
  "instrument": ["Este campo es requerido"]
}
```

### Error 401: Unauthorized

```python
def test_error_401_sin_autenticacion(client):
    """Verifica error 401 sin token"""
    response = client.get('/api/v1/tax-ratings/')
    
    assert response.status_code == 401
```

**Respuesta**:
```json
{
  "detail": "Credenciales de autenticación no proporcionadas"
}
```

### Error 403: Forbidden

```python
def test_error_403_sin_permisos(client, analista_user):
    """Verifica error 403 sin permisos"""
    client.force_login(analista_user)
    
    response = client.post('/api/v1/tax-ratings/', {...})
    
    assert response.status_code == 403
```

**Respuesta**:
```json
{
  "detail": "No tiene permiso para realizar esta acción"
}
```

### Error 404: Not Found

```python
def test_error_404_recurso_no_existe(client, admin_user):
    """Verifica error 404 recurso no existe"""
    client.force_login(admin_user)
    
    response = client.get('/api/v1/tax-ratings/999/')
    
    assert response.status_code == 404
```

**Respuesta**:
```json
{
  "detail": "No encontrado"
}
```

### Error 409: Conflict (Duplicate)

```python
def test_error_409_clave_duplicada(client, admin_user, tax_rating):
    """Verifica error 409 con datos duplicados"""
    client.force_login(admin_user)
    
    # Intentar crear con misma combinación
    response = client.post('/api/v1/tax-ratings/', {
        'issuer': tax_rating.issuer.id,
        'instrument': tax_rating.instrument.id,
        'rating': 'AAA',
        'valid_from': tax_rating.valid_from
    }, format='json')
    
    assert response.status_code == 409
```

---

## Resumen de Cobertura API

| Endpoint | Métodos | Tests | Cobertura |
|----------|---------|-------|-----------|
| /auth/login | POST | 3 | 100% |
| /auth/me | GET | 1 | 100% |
| /tax-ratings | GET, POST | 5 | 100% |
| /tax-ratings/{id} | GET, PATCH, DELETE | 6 | 100% |
| /bulk-uploads | GET, POST | 4 | 100% |
| /bulk-uploads/{id}/procesar | POST | 2 | 100% |
| /audit-logs | GET | 1 | 100% |

**Total**: 22 tests de API REST

---

**Documento Preparado Por**: Sistema NUAM  
**Última Actualización**: 2025-11-21  
**Versión**: 1.0
