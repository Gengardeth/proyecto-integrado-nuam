# 🚀 Guía de Instalación y Configuración - Proyecto NUAM

**Sistema de Calificación Fiscal de Instrumentos Financieros**

Esta guía te permitirá configurar y ejecutar el proyecto desde cero en cualquier dispositivo.

---

## 📋 Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación de Herramientas Base](#instalación-de-herramientas-base)
3. [Configuración de PostgreSQL](#configuración-de-postgresql)
4. [Configuración del Proyecto](#configuración-del-proyecto)
5. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
6. [Verificación del Sistema](#verificación-del-sistema)
7. [Datos de Prueba](#datos-de-prueba)
8. [Solución de Problemas](#solución-de-problemas)

---

## 1. Requisitos del Sistema

### Sistema Operativo
- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+)

### Hardware Mínimo
- **RAM**: 8GB (recomendado 16GB)
- **Disco**: 10GB libres
- **Procesador**: Intel i5 o equivalente

---

## 2. Instalación de Herramientas Base

### 2.1 Python 3.13

#### Windows
1. Descargar desde: https://www.python.org/downloads/
2. **IMPORTANTE**: Marcar "Add Python to PATH" durante instalación
3. Verificar instalación:
```powershell
python --version
# Debe mostrar: Python 3.13.x
```

#### macOS/Linux
```bash
# macOS (con Homebrew)
brew install python@3.13

# Linux
sudo apt update
sudo apt install python3.13 python3.13-venv python3-pip
```

### 2.2 Node.js 20 LTS

#### Windows/macOS
1. Descargar desde: https://nodejs.org/
2. Instalar versión LTS (20.x)
3. Verificar:
```bash
node --version  # v20.x.x
npm --version   # 10.x.x
```

#### Linux
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.3 PostgreSQL 16

#### Windows
1. Descargar desde: https://www.postgresql.org/download/windows/
2. Durante instalación:
   - **Puerto**: 5432 (dejar por defecto)
   - **Password**: Anotar contraseña del usuario `postgres`
   - **Locale**: Spanish_Spain.UTF-8 o Default
3. Instalar pgAdmin 4 (incluido en instalador)

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux
```bash
sudo apt install postgresql-16 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.4 Git

#### Windows
Descargar desde: https://git-scm.com/download/win

#### macOS/Linux
```bash
# macOS
brew install git

# Linux
sudo apt install git
```

---

## 3. Configuración de PostgreSQL

### 3.1 Abrir pgAdmin 4

1. Buscar "pgAdmin 4" en el menú inicio
2. Se abrirá en el navegador (http://localhost:5050 o similar)
3. Introducir la **Master Password** (la que configuraste en instalación)

### 3.2 Conectar al Servidor PostgreSQL

1. En el panel izquierdo, expandir **Servers**
2. Click en **PostgreSQL 16**
3. Introducir la **contraseña del usuario postgres**
4. Debería aparecer conectado (icono verde)

### 3.3 Crear Base de Datos

**Opción A: Desde pgAdmin (Interfaz Gráfica)**

1. Click derecho en **Databases** → **Create** → **Database**
2. En la pestaña "General":
   - **Database**: `proyecto_nuam`
   - **Owner**: `postgres`
3. Click **Save**

**Opción B: Desde terminal SQL**

1. En pgAdmin, click derecho en **PostgreSQL 16** → **Query Tool**
2. Ejecutar:
```sql
CREATE DATABASE proyecto_nuam
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Spain.1252'
    LC_CTYPE = 'Spanish_Spain.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
```

### 3.4 Crear Usuario de Aplicación (Opcional pero Recomendado)

```sql
-- Crear usuario
CREATE USER nuam_user WITH PASSWORD 'nuam_password_123';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE proyecto_nuam TO nuam_user;

-- Cambiar owner de la base de datos
ALTER DATABASE proyecto_nuam OWNER TO nuam_user;
```

### 3.5 Verificar Configuración

En pgAdmin, Query Tool sobre `proyecto_nuam`:
```sql
SELECT version();
-- Debe mostrar PostgreSQL 16.x
```

---

## 4. Configuración del Proyecto

### 4.1 Clonar el Repositorio

```bash
# Navegar a la carpeta deseada
cd C:\Users\TuUsuario\Proyectos  # Windows
# o
cd ~/Proyectos  # macOS/Linux

# Clonar
git clone https://github.com/Gengardeth/proyecto-integrado-nuam.git
cd proyecto-integrado-nuam
```

### 4.2 Configurar Variables de Entorno

1. Copiar el archivo de ejemplo:
```bash
# Windows PowerShell
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

2. Editar `.env` con un editor de texto (VS Code, Notepad++, etc.):
```env
# Django
DEBUG=True
SECRET_KEY=tu-clave-secreta-aleatoria-muy-larga-y-segura
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=proyecto_nuam
POSTGRES_USER=nuam_user
POSTGRES_PASSWORD=nuam_password_123
DATABASE_URL=postgresql://nuam_user:nuam_password_123@localhost:5432/proyecto_nuam

# Frontend
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

**⚠️ IMPORTANTE**: Cambia `SECRET_KEY` por una cadena aleatoria. Puedes generarla en Python:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4.3 Configurar Backend (Django)

#### 4.3.1 Crear entorno virtual

```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

**Nota**: Si ves `(venv)` al inicio de tu terminal, está activado correctamente.

#### 4.3.2 Instalar dependencias Python

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Dependencias instaladas**:
- Django 5.2.8
- djangorestframework 3.16.1
- djangorestframework-simplejwt 5.3.1
- psycopg2-binary 2.9.11
- django-cors-headers 4.9.0
- python-dotenv 1.2.1
- gunicorn 23.0.0
- openpyxl 3.1.5
- reportlab 4.4.4
- pillow 12.0.0

#### 4.3.3 Aplicar migraciones

```bash
python manage.py migrate
```

**Salida esperada**: Debe crear ~20 tablas sin errores.

#### 4.3.4 Crear superusuario

```bash
python manage.py createsuperuser
```

Introducir:
- **Username**: `admin`
- **Email**: `admin@nuam.com`
- **Password**: (mínimo 8 caracteres)
- **Confirmar password**

#### 4.3.5 Cargar datos de prueba (Opcional)

```bash
python manage.py seed_users
```

Esto crea usuarios de prueba:
- **admin** / admin123 (Administrador)
- **analista** / analista123 (Analista)
- **auditor** / auditor123 (Auditor)

### 4.4 Configurar Frontend (React)

#### 4.4.1 Navegar a carpeta frontend

```bash
cd frontend
```

#### 4.4.2 Instalar dependencias Node

```bash
npm install
```

**Dependencias principales instaladas**:
- react 18.3.1
- react-router-dom 7.1.1
- vite 7.2.2
- axios 1.7.9
- chart.js 4.5.1
- vitest 2.1.9

**Tiempo estimado**: 2-3 minutos

#### 4.4.3 Volver a la raíz del proyecto

```bash
cd ..
```

---

## 5. Ejecutar la Aplicación

### 5.1 Verificar que PostgreSQL está corriendo

**pgAdmin debe estar abierto y conectado** al servidor PostgreSQL 16.

### 5.2 Iniciar Backend (Terminal 1)

```bash
# Activar entorno virtual si no está activado
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Iniciar servidor Django
python manage.py runserver
```

**Salida esperada**:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**URLs disponibles**:
- API: http://127.0.0.1:8000/api/v1/
- Admin Django: http://127.0.0.1:8000/admin/

### 5.3 Iniciar Frontend (Terminal 2 - Nueva terminal)

```bash
cd frontend
npm run dev
```

**Salida esperada**:
```
VITE v7.2.2  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Frontend disponible en**: http://localhost:5173/

---

## 6. Verificación del Sistema

### 6.1 Verificar Backend

1. Abrir: http://127.0.0.1:8000/admin/
2. Login con credenciales de superusuario
3. Debe mostrar panel de administración Django

**API Health Check**:
```bash
curl http://127.0.0.1:8000/api/v1/health/
```

### 6.2 Verificar Frontend

1. Abrir: http://localhost:5173/
2. Debe mostrar pantalla de Login
3. Ingresar con:
   - **Usuario**: admin
   - **Contraseña**: (la que creaste)
4. Debe redirigir al Dashboard

### 6.3 Verificar Conexión Frontend ↔ Backend

En el Dashboard, deberías ver:
- KPIs (Total Calificaciones, Emisores, etc.)
- Gráficos (si hay datos)
- Menú lateral con todas las opciones

### 6.4 Ejecutar Tests

**Frontend**:
```bash
cd frontend
npm run test
```

**Salida esperada**: 77 tests pasando

**Backend**:
```bash
python manage.py test cuentas parametros
```

---

## 7. Datos de Prueba

### 7.1 Crear Emisores (Issuers)

1. Login en la aplicación
2. Ir a **Emisores** en el menú
3. Click **Nuevo Emisor**
4. Llenar:
   - **Código**: ABC
   - **Nombre**: ABC Corporation
   - **RUT**: 12345678-9
   - **Activo**: Sí
5. Guardar

Crear al menos 3 emisores.

### 7.2 Crear Instrumentos

1. Ir a **Instrumentos**
2. Click **Nuevo Instrumento**
3. Llenar:
   - **Código**: BOND001
   - **Nombre**: Bono Corporativo
   - **Tipo**: BONO
   - **Activo**: Sí
4. Guardar

### 7.3 Crear Calificaciones

1. Ir a **Calificaciones**
2. Click **Nueva Calificación**
3. Llenar:
   - **Emisor**: Seleccionar uno creado
   - **Instrumento**: Seleccionar uno creado
   - **Rating**: AAA
   - **Outlook**: STABLE
   - **Fecha**: Hoy
   - **Fuente**: Manual
4. Guardar

Crear al menos 10 calificaciones para ver gráficos en el Dashboard.

### 7.4 Probar Carga Masiva

1. Crear archivo CSV: `calificaciones_prueba.csv`
```csv
emisor_codigo,instrumento_codigo,rating,outlook,fecha,fuente
ABC,BOND001,AAA,STABLE,2025-11-17,Bloomberg
XYZ,BOND002,AA,POSITIVE,2025-11-17,S&P
DEF,STOCK001,A,NEGATIVE,2025-11-16,Fitch
```

2. Ir a **Carga Masiva**
3. Subir archivo
4. Click **Procesar**
5. Ver resultados en la pestaña **Items**

---

## 8. Solución de Problemas

### Problema: "command not found: python"

**Solución**:
- Windows: Usar `python` o `py`
- macOS/Linux: Usar `python3`

### Problema: "pip: command not found"

**Solución**:
```bash
# Windows
python -m pip install --upgrade pip

# macOS/Linux
python3 -m pip install --upgrade pip
```

### Problema: "FATAL: password authentication failed for user"

**Solución**:
1. Verificar credenciales en `.env`
2. Verificar que PostgreSQL está corriendo (pgAdmin conectado)
3. Verificar que la base de datos existe:
```bash
# En pgAdmin Query Tool
\l  -- Listar bases de datos
```

### Problema: "Port 8000 is already in use"

**Solución**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <numero_proceso> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Problema: "Cannot find module 'react'"

**Solución**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Network Error" en frontend al hacer login

**Solución**:
1. Verificar que backend está corriendo en http://127.0.0.1:8000
2. Verificar `VITE_API_URL` en `.env` del proyecto (no en frontend/.env)
3. Verificar CORS en Django:
```bash
# En settings.py debe estar:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Problema: Tests fallan con error de PostgreSQL

**Solución**:
Django crea una base de datos temporal para tests. Asegurarse de que el usuario tiene permisos:
```sql
-- En pgAdmin
ALTER USER nuam_user CREATEDB;
```

### Problema: Gráficos no se muestran en Dashboard

**Solución**:
- Crear al menos 5 calificaciones con diferentes ratings
- Refrescar la página (F5)
- Verificar consola del navegador (F12) por errores

---

## 📚 Estructura del Proyecto

```
proyecto-integrado-nuam/
├── backend/
│   ├── Nuam/              # Configuración Django
│   ├── calificacionfiscal/  # App principal
│   ├── cuentas/           # Autenticación
│   ├── parametros/        # Emisores e Instrumentos
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # API calls
│   │   └── router/        # Rutas
│   └── package.json
├── docs/                  # Documentación del proyecto
├── .env                   # Variables de entorno (crear desde .env.example)
├── requirements.txt       # Dependencias Python
├── docker-compose.yml     # Para deploy con Docker
└── README.md
```

---

## 🎯 Credenciales por Defecto

### Admin Django
- URL: http://127.0.0.1:8000/admin/
- Usuario: `admin`
- Password: (la que creaste con createsuperuser)

### Aplicación Web
- URL: http://localhost:5173/
- **Admin**: admin / admin123
- **Analista**: analista / analista123
- **Auditor**: auditor / auditor123

⚠️ **Cambiar en producción**

---

## 📖 Documentación Adicional

- **Docker**: Ver `DOCKER_GUIDE.md` para deploy con contenedores
- **Testing**: Ver `docs/TESTING.md` para guía de tests
- **API**: Ver `docs/API_DOCUMENTATION.md` para endpoints

---

## 🆘 Soporte

Si encuentras problemas no listados aquí:

1. Revisar logs del backend (terminal donde corre `runserver`)
2. Revisar consola del navegador (F12 → Console)
3. Verificar que todas las herramientas están instaladas con las versiones correctas
4. Crear issue en el repositorio de GitHub

---

## ✅ Checklist de Verificación Final

- [ ] Python 3.13 instalado y en PATH
- [ ] Node.js 20 instalado
- [ ] PostgreSQL 16 instalado y corriendo
- [ ] pgAdmin conectado a PostgreSQL
- [ ] Base de datos `proyecto_nuam` creada
- [ ] Repositorio clonado
- [ ] Archivo `.env` configurado
- [ ] Entorno virtual Python creado y activado
- [ ] Dependencias Python instaladas (`pip install -r requirements.txt`)
- [ ] Migraciones aplicadas (`python manage.py migrate`)
- [ ] Superusuario creado
- [ ] Dependencias Node instaladas (`npm install` en frontend)
- [ ] Backend corriendo en http://127.0.0.1:8000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Login funciona correctamente
- [ ] Dashboard muestra información

---

**¡Listo para usar!** 🎉

Si todos los pasos se completaron correctamente, el sistema está funcionando y puedes empezar a utilizarlo.
