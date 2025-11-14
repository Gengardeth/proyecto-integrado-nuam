# 👨‍💻 Guía de Setup para Desarrolladores
## Paso a Paso para Configurar el Entorno Local

## 1. Requisitos Previos

- Python 3.10+
- PostgreSQL 14+ (o ejecutar con Docker)
- Node.js 18+ (para frontend, opcional por ahora)
- Git
- PowerShell (Windows) o Bash (macOS/Linux)

## 2. Clonar Repositorio

```bash
git clone https://github.com/Gengardeth/proyecto-integrado-nuam.git
cd proyecto-integrado-nuam
```

## 3. Crear Entorno Virtual

### Windows (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### macOS/Linux (Bash)
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 4. Instalar Dependencias

```bash
pip install -r requirements.txt
```

Si es la primera vez:
```bash
pip install django==5.2.8 djangorestframework==3.16.1 django-cors-headers==4.9.0 psycopg2-binary==2.9.11 python-dotenv==1.2.1
pip freeze > requirements.txt
```

## 5. Configurar Variables de Entorno

Copia `.env.example` a `.env` y edita con tus valores:

```bash
cp .env.example .env
```

Edita `.env` y configura especialmente:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `SECRET_KEY` (genera uno nuevo para producción)

## 6. Base de Datos

### Opción A: PostgreSQL Local

Asegúrate de que PostgreSQL está corriendo y crea la BD:

```bash
# En PostgreSQL CLI
CREATE DATABASE proyecto_nuam;
CREATE USER postgres WITH PASSWORD 'tu-password';
ALTER ROLE postgres SET client_encoding TO 'utf8';
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET default_transaction_deferrable TO off;
ALTER ROLE postgres SET default_transaction_read_only TO off;
ALTER ROLE postgres CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE proyecto_nuam TO postgres;
```

### Opción B: Docker (PostgreSQL + pgAdmin)

```bash
docker run -d \
  --name postgres-nuam \
  -e POSTGRES_DB=proyecto_nuam \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  postgres:14-alpine
```

## 7. Aplicar Migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

## 8. Crear Usuarios Demo

```bash
python manage.py seed_users
```

Usuarios creados:
- admin / admin123
- analista / analista123
- auditor / auditor123

## 9. Crear Superusuario (opcional)

```bash
python manage.py createsuperuser
```

## 10. Ejecutar Servidor

```bash
python manage.py runserver 0.0.0.0:8000
```

Accede a:
- API: http://localhost:8000/api/v1/
- Admin: http://localhost:8000/admin/
- Health: http://localhost:8000/api/v1/health

## 11. Probar Endpoints

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Listar Issuers
```bash
curl http://localhost:8000/api/v1/issuers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 12. Estructura de Código

```
proyecto-integrado-nuam/
├── cuentas/           # Autenticación, usuarios, roles, auditoría
├── parametros/        # Catálogos (Issuer, Instrument)
├── calificacionfiscal/# Calificaciones tributarias
├── Nuam/              # Configuración del proyecto
├── static/            # Archivos estáticos
├── templates/         # Templates HTML
├── manage.py          # CLI de Django
├── requirements.txt   # Dependencias
├── .env.example       # Variables de entorno (copiar a .env)
└── README.md          # Documentación
```

## 13. Comandos Útiles

```bash
# Crear app nueva
python manage.py startapp nombre_app

# Migraciones
python manage.py makemigrations
python manage.py migrate
python manage.py migrate --fake-initial

# Datos demo
python manage.py seed_users

# Shell interactivo
python manage.py shell

# Admin
python manage.py createsuperuser

# Colectar estáticos
python manage.py collectstatic

# Limpiar BD (cuidado)
python manage.py flush
```

## 14. Debugging

### Ver Variables de Entorno
```python
# En Django shell
from django.conf import settings
print(settings.DATABASES)
```

### Ver Logs de Auditoría
```python
# En Django shell o admin
from cuentas.audit_models import AuditLog
AuditLog.objects.all().order_by('-creado_en')[:10]
```

### Desactivar CSRF (solo desarrollo)
En settings.py, comentar o remover CsrfViewMiddleware si es necesario.

## 15. Git Workflow

```bash
# Crear rama para feature
git checkout -b feature/nombre-feature

# Commits
git add .
git commit -m "Descripción clara del cambio"

# Push
git push origin feature/nombre-feature

# Pull request en GitHub
```

## 16. Próximos Pasos

1. Familiarizarse con la estructura del código
2. Revisar `SPRINT1_SUMMARY.md` para el estado actual
3. Leer comentarios en modelos y views
4. Experimentar con endpoints en Postman/curl
5. Revisar admin de Django

## 17. Soporte

Para problemas:
1. Revisa el README.md
2. Consulta los comentarios en el código
3. Revisa los logs de Django (console)
4. Pregunta al equipo en el repositorio

---

¡Listo para desarrollar! 🚀
