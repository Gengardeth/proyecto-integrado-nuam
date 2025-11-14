# Sistema de Calificaciones Tributarias NUAM — Guía Completa de Setup

## Descripción General

Proyecto Django + React (Vite) que gestiona calificaciones tributarias para contribuyentes. La API expone endpoints RESTful con autenticación por token, y el frontend proporciona una interfaz intuitiva para CRUD.

---

## BACKEND (Django)

### Requisitos

- Python 3.8+
- PostgreSQL 12+ (o SQLite para desarrollo)
- pip + virtualenv

### Instalación del Backend

1. **Crear entorno virtual:**
```bash
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Migraciones:**
```bash
python manage.py migrate
```

4. **Crear superusuario (usuario admin):**
```bash
python manage.py createsuperuser
```
Ejemplo:
```
Username: admin
Email: admin@example.com
Password: (tu contraseña)
```

5. **Crear datos de prueba (datos de base):**
```bash
python manage.py shell
```
En el shell interactivo:
```python
from parametros.models import TipoParametro, Parametro
from calificacionfiscal.models import Contribuyente

# Crear tipo de parámetro "Estados"
tipo_estado = TipoParametro.objects.create(nombre="Estado")

# Crear estados (parámetros)
Parametro.objects.create(tipo=tipo_estado, codigo="ACT", nombre="Activo", activo=True)
Parametro.objects.create(tipo=tipo_estado, codigo="INA", nombre="Inactivo", activo=True)
Parametro.objects.create(tipo=tipo_estado, codigo="PEN", nombre="Pendiente", activo=True)

# Crear contribuyentes de prueba
Contribuyente.objects.create(rut="12345678-9", razon_social="Empresa A", giro="Comercio")
Contribuyente.objects.create(rut="98765432-1", razon_social="Empresa B", giro="Servicios")

exit()
```

6. **Crear token para usuario admin (importante para frontend):**
```bash
python manage.py shell
```
```python
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")
```
Guarda este token — lo usarás para testear.

7. **Ejecutar servidor:**
```bash
python manage.py runserver
```
Estará en `http://127.0.0.1:8000`

### Verificación del Backend

Abre en navegador:
- `http://127.0.0.1:8000/admin/` — Admin panel (usuario: admin, contraseña: la que creaste)
- `http://127.0.0.1:8000/api/` — Lista de endpoints DRF
- `http://127.0.0.1:8000/api/calificaciones/` — Endpoint de calificaciones (sin autenticación, GET permite)

---

## FRONTEND (React + Vite)

### Requisitos

- Node.js v16+
- npm o yarn

### Instalación del Frontend

1. **Navega a la carpeta del frontend:**
```bash
cd frontend\frontend
```

2. **Instala dependencias:**
```bash
npm install
```

3. **Inicia servidor de desarrollo:**
```bash
npm run dev
```
Estará en `http://localhost:5173`

---

## Flujo de Uso Completo

### 1. Abre dos terminales

**Terminal 1 (Backend):**
```bash
# Desde la raíz del proyecto
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd frontend\frontend
npm run dev
```

### 2. Accede a la aplicación

Abre navegador en: `http://localhost:5173`

Verás una pantalla de login.

### 3. Inicia sesión

- **Usuario:** admin (o el que creaste)
- **Contraseña:** (la que pusiste)

### 4. Dashboard de Calificaciones

Una vez dentro:
- **Crear:** Selecciona Contribuyente, Estado, Puntaje y presiona "Crear"
- **Editar:** Haz clic en "Editar" en una calificación
- **Eliminar:** Presiona "Eliminar" para borrar
- **Cerrar sesión:** Botón arriba a la derecha

---

## Estructura de Archivos Clave

```
proyecto-integrado-nuam/
├── manage.py
├── requirements.txt
├── Nuam/
│   ├── settings.py          # Configuración Django (CORS, DRF, etc.)
│   ├── urls.py              # Rutas (API endpoints)
│   └── wsgi.py
├── calificacionfiscal/
│   ├── models.py            # Modelos: Contribuyente, CalificacionTributaria
│   ├── serializers.py       # Serializadores DRF
│   ├── api.py               # ViewSets para CRUD
│   └── views.py             # Vistas tradicionales (inicio)
├── parametros/
│   ├── models.py            # TipoParametro, Parametro
│   ├── serializers.py       # ParametroSerializer
│   └── api.py               # ParametroViewSet
├── cuentas/
│   └── models.py            # Modelo Usuario personalizado
├── frontend/
│   ├── package.json
│   └── frontend/
│       ├── vite.config.js   # Proxy /api -> Django
│       ├── index.html
│       └── src/
│           ├── App.jsx      # Componente principal (rutas)
│           ├── Login.jsx    # Formulario login
│           ├── Calificaciones.jsx  # CRUD dashboard
│           ├── api.js       # Funciones API
│           └── App.css      # Estilos
└── db.sqlite3               # Base de datos (desarrollo)
```

---

## Configuración de CORS y Token Auth

Ya está configurado en `Nuam/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'rest_framework.authtoken',
    'corsheaders',
    'rest_framework',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe estar al inicio
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Frontend Vite
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}
```

---

## Endpoints API Disponibles

| Método | URL | Descripción | Requiere Auth |
|--------|-----|-------------|---|
| POST | `/api-token-auth/` | Login (obtener token) | No |
| GET | `/api/calificaciones/` | Listar calificaciones | No* |
| POST | `/api/calificaciones/` | Crear calificación | Sí |
| PUT | `/api/calificaciones/{id}/` | Actualizar calificación | Sí |
| DELETE | `/api/calificaciones/{id}/` | Eliminar calificación | Sí |
| GET | `/api/contribuyentes/` | Listar contribuyentes | No* |
| GET | `/api/parametros/` | Listar parámetros (estados) | No |

*ReadOnly permite GET sin autenticación; POST/PUT/DELETE requieren token.

---

## Añadir Tu Logo

1. **Coloca tu archivo** (ej: `logo.png`) en `frontend/frontend/public/`
2. **Edita `App.jsx`** (línea ~28):
```jsx
<div className="logo-placeholder">
  <img src="/logo.png" alt="Logo NUAM" style={{ height: 50 }} />
</div>
```

---

## Troubleshooting

### "Login failed: 401"
- Verifica que el usuario existe en Django admin
- Asegúrate de que el token está habilitado: `python manage.py migrate`

### CORS errors
- Verifica `CORS_ALLOWED_ORIGINS` incluya `http://localhost:5173`
- Reinicia Django después de cambios en `settings.py`

### "Cannot find module" en React
- Ejecuta `npm install` en `frontend/frontend`
- Verifica que `package.json` incluya `react-router-dom`, `bootstrap`, etc.

### API retorna "404 Not Found"
- Verifica que Django esté corriendo (`python manage.py runserver`)
- Confirma endpoints en `http://127.0.0.1:8000/api/`

### Base de datos con error
- Elimina `db.sqlite3`
- Corre `python manage.py migrate` nuevamente

---

## Próximos Pasos / Mejoras Opcionales

1. **Gráficos:** Añade Chart.js o Recharts a `package.json`
2. **Paginación:** DRF la maneja automáticamente; frontend ya lo soporta
3. **Filtros avanzados:** Añade búsqueda y filtros en `Calificaciones.jsx`
4. **Autenticación OAuth:** Implementa con django-oauth-toolkit
5. **Despliegue:** Usa Heroku, AWS, DigitalOcean o tu servidor
6. **Tests:** Agrega tests unitarios en Django y Jest en React

---

## Comandos Útiles

### Django
```bash
python manage.py makemigrations          # Crear migraciones
python manage.py migrate                 # Aplicar migraciones
python manage.py createsuperuser         # Crear admin
python manage.py shell                   # Shell interactivo
python manage.py runserver               # Servidor desarrollo
```

### Frontend
```bash
npm install                              # Instalar dependencias
npm run dev                              # Servidor desarrollo
npm run build                            # Compilar para producción
npm run lint                             # Linter (ESLint)
npm run preview                          # Preview de build
```

---

## Contacto / Soporte

Para preguntas o problemas, revisa:
- `frontend/frontend/README_FRONTEND.md` — Guía específica del frontend
- `Nuam/settings.py` — Configuración Django
- Consola del navegador (F12) — Errores de red

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0.0
