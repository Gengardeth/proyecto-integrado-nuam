# Guía de Despliegue con Docker

Esta guía explica cómo ejecutar el proyecto NUAM usando Docker y Docker Compose.

## Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM mínimo
- 10GB espacio en disco

## Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd proyecto-integrado-nuam
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y ajustar las siguientes variables críticas:

```env
SECRET_KEY=<generar-clave-secreta-aleatoria>
POSTGRES_PASSWORD=<contraseña-segura>
DEBUG=False
```

### 3. Construir y ejecutar los contenedores

```bash
# Construir las imágenes
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Acceder a la aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000/api/v1/
- **Admin Django**: http://localhost:8000/admin/

**Credenciales por defecto**:
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **Cambiar en producción**

## Comandos Útiles

### Gestión de Contenedores

```bash
# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart backend

# Ver estado de los servicios
docker-compose ps

# Ver logs de un servicio
docker-compose logs -f backend
```

### Gestión de Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Backup de la base de datos
docker-compose exec db pg_dump -U nuam_user proyecto_nuam > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U nuam_user proyecto_nuam < backup.sql
```

### Desarrollo

```bash
# Shell de Django
docker-compose exec backend python manage.py shell

# Ejecutar tests
docker-compose exec backend python manage.py test

# Instalar nueva dependencia Python
docker-compose exec backend pip install <paquete>
# Actualizar requirements.txt y reconstruir imagen
```

### Limpieza

```bash
# Detener y eliminar contenedores, redes
docker-compose down

# Eliminar también volúmenes (⚠️ elimina datos de BD)
docker-compose down -v

# Eliminar imágenes construidas
docker-compose down --rmi all
```

## Arquitectura de Contenedores

```
┌─────────────────────────────────────────────┐
│           Docker Network: nuam_network       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Frontend   │  │   Backend    │        │
│  │   (Nginx)    │←→│   (Django)   │        │
│  │   Port: 80   │  │  Port: 8000  │        │
│  └──────────────┘  └──────┬───────┘        │
│                            │                │
│                            ↓                │
│                    ┌──────────────┐         │
│                    │  PostgreSQL  │         │
│                    │   Port: 5432 │         │
│                    └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

## Volúmenes Persistentes

- `postgres_data`: Datos de PostgreSQL
- `staticfiles`: Archivos estáticos de Django
- `mediafiles`: Archivos subidos por usuarios

## Health Checks

Todos los servicios tienen health checks configurados:

```bash
# Verificar salud de los servicios
docker-compose ps

# Salida esperada:
# SERVICE    STATUS          PORTS
# backend    Up (healthy)    0.0.0.0:8000->8000/tcp
# frontend   Up (healthy)    0.0.0.0:80->80/tcp
# db         Up (healthy)    0.0.0.0:5432->5432/tcp
```

## Solución de Problemas

### Backend no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Verificar conectividad con BD
docker-compose exec backend python manage.py check --database default
```

### Frontend no carga

```bash
# Verificar logs de Nginx
docker-compose logs frontend

# Verificar que el build se completó
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Base de datos no conecta

```bash
# Verificar que PostgreSQL está running
docker-compose exec db pg_isready

# Revisar logs de PostgreSQL
docker-compose logs db
```

## Configuración de Producción

### 1. Configurar HTTPS

Agregar servicio de Certbot a `docker-compose.yml` o usar reverse proxy externo (Nginx/Traefik).

### 2. Ajustar recursos

En `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

### 3. Habilitar logs estructurados

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. Secrets management

Usar Docker Secrets o servicios externos como AWS Secrets Manager.

## CI/CD con GitHub Actions

El proyecto incluye pipeline de CI/CD en `.github/workflows/ci-cd.yml`:

- ✅ Tests automatizados (backend + frontend)
- ✅ Lint y análisis de código
- ✅ Build de imágenes Docker
- ✅ Escaneo de seguridad

## Monitoreo

### Logs centralizados

```bash
# Todos los logs
docker-compose logs -f --tail=100

# Logs de un servicio específico desde timestamp
docker-compose logs -f --since 2024-01-01T00:00:00 backend
```

### Métricas de contenedores

```bash
# Stats en tiempo real
docker stats

# Uso de recursos por servicio
docker-compose top
```

## Mantenimiento

### Actualizar imágenes base

```bash
# Pull últimas imágenes
docker-compose pull

# Reconstruir con imágenes actualizadas
docker-compose build --no-cache
docker-compose up -d
```

### Limpieza periódica

```bash
# Eliminar imágenes no utilizadas
docker image prune -a

# Eliminar volúmenes no utilizados
docker volume prune

# Limpieza completa del sistema
docker system prune -a --volumes
```

## Soporte

Para problemas o preguntas:
- Revisar logs: `docker-compose logs`
- Verificar health: `docker-compose ps`
- Consultar documentación: `docs/`
