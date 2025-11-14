# ✅ Checklist de Verificación del Sistema
## Procedimientos Manuales de Testing y Validación

Use este checklist para verificar que el backend está completamente funcional.

## ✅ Verificación Básica

### Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres -d proyecto_nuam

# Verificar que la BD existe
\l
```

### Entorno Virtual
```bash
# Verificar que .venv está activado (prompt debe mostrar .venv)
pip list | grep -i django
```

### Migraciones
```bash
# Verificar que todas las migraciones se aplicaron
python manage.py showmigrations
# Todas deben tener [X] antes

# Si algo está pendiente
python manage.py migrate
```

---

## ✅ Verificación de Modelos

### En Django Shell
```bash
python manage.py shell
```

```python
# Usuarios
from cuentas.models import Usuario
Usuario.objects.all().count()  # Debe ser ≥ 1

# Issuers
from parametros.models import Issuer
Issuer.objects.all().count()  # Puede ser 0

# Instruments
from parametros.models import Instrument
Instrument.objects.all().count()  # Puede ser 0

# TaxRatings
from calificacionfiscal.models import TaxRating
TaxRating.objects.all().count()  # Puede ser 0

# AuditLog
from cuentas.audit_models import AuditLog
AuditLog.objects.all().count()  # Puede ser > 0 si hay cambios

# Salir
exit()
```

---

## ✅ Verificación de Usuarios Demo

```bash
python manage.py seed_users
```

Debe crear 3 usuarios:
- admin / admin123
- analista / analista123
- auditor / auditor123

---

## ✅ Verificación de Servidor

```bash
python manage.py runserver 0.0.0.0:8000
```

El servidor debe iniciar sin errores. Debes ver:
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CONTROL-C.
```

---

## ✅ Verificación de Endpoints

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

Esperado:
```json
{"status":"ok","message":"API NUAM en funcionamiento"}
```

### Listado de Roles
```bash
curl http://localhost:8000/api/v1/roles
```

Esperado:
```json
[
  {"key":"ADMIN","label":"Administrador"},
  {"key":"ANALISTA","label":"Analista"},
  {"key":"AUDITOR","label":"Auditor"}
]
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Esperado (con cookie de sesión):
```json
{
  "detail":"Login exitoso",
  "user":{
    "id":1,
    "username":"admin",
    "email":"admin@nuam.cl",
    "rol":"ADMIN",
    "is_active":true
  }
}
```

### Usuario Actual (requiere autenticación)
```bash
curl http://localhost:8000/api/v1/auth/me \
  -b "sessionid=YOUR_SESSION_ID"
```

### Listar Issuers (requiere autenticación)
```bash
curl http://localhost:8000/api/v1/issuers \
  -b "sessionid=YOUR_SESSION_ID"
```

Esperado:
```json
{
  "count":0,
  "next":null,
  "previous":null,
  "results":[]
}
```

### Listar Instruments
```bash
curl http://localhost:8000/api/v1/instruments \
  -b "sessionid=YOUR_SESSION_ID"
```

### Listar TaxRatings
```bash
curl http://localhost:8000/api/v1/tax-ratings \
  -b "sessionid=YOUR_SESSION_ID"
```

### Listar AuditLogs
```bash
curl http://localhost:8000/api/v1/audit-logs \
  -b "sessionid=YOUR_SESSION_ID"
```

### Resumen de Auditoría
```bash
curl http://localhost:8000/api/v1/audit-logs/resumen/ \
  -b "sessionid=YOUR_SESSION_ID"
```

---

## ✅ Verificación del Admin

1. Ve a: http://localhost:8000/admin/
2. Login con: admin / admin123
3. Verifica que puedas ver:
   - [x] Usuarios (Cuentas)
   - [x] AuditLogs (Cuentas)
   - [x] Issuers (Parametros)
   - [x] Instruments (Parametros)
   - [x] TaxRatings (Calificacionfiscal)

---

## ✅ Verificación de Signals

### Crear un Issuer mediante API

```bash
curl -X POST http://localhost:8000/api/v1/issuers \
  -H "Content-Type: application/json" \
  -b "sessionid=YOUR_SESSION_ID" \
  -d '{
    "codigo":"ISS001",
    "nombre":"Banco Test",
    "rut":"12345678-K",
    "razon_social":"Banco Test S.A."
  }'
```

### Verificar que se registró en AuditLog

```bash
python manage.py shell
```

```python
from cuentas.audit_models import AuditLog
logs = AuditLog.objects.filter(modelo='Issuer').order_by('-creado_en')
for log in logs[:3]:
    print(f"{log.accion} - {log.descripcion} - {log.usuario}")
```

Debe haber un CREATE para Issuer.

---

## ✅ Verificación de Permisos

### Test: Admin puede acceder a todo
```bash
# Login como admin
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# Crear Issuer
curl -X POST http://localhost:8000/api/v1/issuers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{...}'

# Debe funcionar (201 Created)
```

---

## ✅ Verificación de Estructura

```bash
# Verificar que todos los archivos existen
ls cuentas/
ls parametros/
ls calificacionfiscal/
ls Nuam/
ls -la .env
ls -la requirements.txt
ls -la SPRINT1_SUMMARY.md
ls -la DEVELOPER_SETUP.md
ls -la ROADMAP.md
```

---

## ✅ Verificación de Dependencias

```bash
pip show django
pip show djangorestframework
pip show django-cors-headers
pip show psycopg2-binary
```

Todos deben estar instalados con versiones correctas.

---

## ✅ Checklist Final

- [ ] PostgreSQL corriendo
- [ ] .venv activado
- [ ] Migraciones aplicadas
- [ ] Usuarios demo creados
- [ ] Servidor inicia sin errores
- [ ] Health check funciona
- [ ] Login funciona
- [ ] Listar endpoints funcionan
- [ ] Admin accesible
- [ ] Audit logs se registran
- [ ] Documentación presente
- [ ] requirements.txt actualizado

---

## 🚀 ¡Listo para Desarrollo!

Si todo pasa la verificación, el backend está completamente funcional y listo para:
1. Continuar con Sprint 2 (Carga masiva + Reportes)
2. Implementar tests
3. Desarrollar frontend

---

## Troubleshooting

### Error: Connection refused (PostgreSQL)
```bash
# Verificar que PostgreSQL está corriendo
# Windows: Services → PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Error: password authentication failed
```bash
# Verifica las credenciales en .env
# Recrea el usuario en PostgreSQL
```

### Error: ModuleNotFoundError
```bash
# Reinstala requirements.txt
pip install -r requirements.txt --force-reinstall
```

### Error: No migrations to apply
```bash
# Aplicar migraciones
python manage.py migrate
```

### Error: port 8000 already in use
```bash
# Cambiar puerto
python manage.py runserver 8001
```

---

**Última actualización:** 12 de noviembre de 2025
