# 📚 Índice de Documentación - NUAM

Navegación completa de toda la documentación del proyecto.

---

## 🚀 Inicio Rápido

### Para Nuevos Desarrolladores
1. **[README.md](../README.md)** - Comienza aquí para visión general
2. **[SETUP_GUIDE.md](../SETUP_GUIDE.md)** - ⭐ Instalación paso a paso (OBLIGATORIO)
3. **[DOCKER_GUIDE.md](../DOCKER_GUIDE.md)** - Alternativa con Docker

### Para Usuarios del Sistema
- **Login**: http://localhost:5173
- **Usuarios Demo**: Ver [README.md](../README.md#-usuarios-demo)
- **API**: http://localhost:8000/api/v1/

---

## 📖 Documentación Principal

### Guías de Usuario

| Documento | Descripción | Cuándo Usar |
|-----------|-------------|-------------|
| **[README.md](../README.md)** | Visión general del proyecto | Primera lectura |
| **[SETUP_GUIDE.md](../SETUP_GUIDE.md)** | Instalación completa | Setup en nuevo dispositivo |
| **[DOCKER_GUIDE.md](../DOCKER_GUIDE.md)** | Deploy con Docker | Deploy rápido o producción |

---

## 🏗 Documentación Técnica

### Arquitectura y Diseño

| Documento | Descripción | Contenido |
|-----------|-------------|-----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Arquitectura del sistema | Stack, capas, flujos de datos, diagramas |
| **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** | Documentación API REST | 30+ endpoints con ejemplos |
| **[TESTING.md](./TESTING.md)** | Guía de testing | 77 tests frontend, 40+ backend |

**Ideal para**:
- Entender cómo funciona el sistema
- Integrar con la API
- Escribir nuevos tests
- Debuggear problemas

---

## 📊 Estado del Proyecto

| Documento | Descripción | Última Actualización |
|-----------|-------------|---------------------|
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | Estado actual | 17 Nov 2025 |
| **[ROADMAP.md](./ROADMAP.md)** | Futuras mejoras | 17 Nov 2025 |

**Ideal para**:
- Presentaciones académicas
- Reportes de progreso
- Planificación de futuras mejoras

---

## 📅 Resúmenes de Sprints

Directorio: **[docs/sprints/](./sprints/)**

| Sprint | Descripción | Estado |
|--------|-------------|--------|
| **[SPRINT1_COMPLETE.md](./sprints/SPRINT1_COMPLETE.md)** | Backend Core (Django + API) | ✅ Completado |
| **[SPRINT2_COMPLETE.md](./sprints/SPRINT2_COMPLETE.md)** | Funcionalidades Avanzadas | ✅ Completado |
| **[SPRINT3_COMPLETE.md](./sprints/SPRINT3_COMPLETE.md)** | Frontend Completo (React) | ✅ Completado |
| **[SPRINT4_COMPLETE.md](./sprints/SPRINT4_COMPLETE.md)** | Testing & DevOps | ✅ Completado |
| **[SPRINTS_RESUMEN.md](./sprints/SPRINTS_RESUMEN.md)** | Resumen de todos los sprints | ✅ Completado |

**Ideal para**:
- Revisar historia del proyecto
- Entender decisiones técnicas
- Documentación académica

---

## 🎯 Guía de Navegación por Rol

### 👨‍💻 Soy Desarrollador Frontend

**Lee primero**:
1. [README.md](../README.md) - Visión general
2. [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Instalar backend
3. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Endpoints disponibles
4. [TESTING.md](./TESTING.md) - Tests con Vitest

**Ubicación del código**:
- `frontend/src/pages/` - Páginas
- `frontend/src/components/` - Componentes
- `frontend/src/services/` - Clientes API
- `frontend/src/__tests__/` - Tests

---

### 👨‍💻 Soy Desarrollador Backend

**Lee primero**:
1. [README.md](../README.md) - Visión general
2. [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Instalar PostgreSQL
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Modelos y arquitectura
4. [TESTING.md](./TESTING.md) - Tests con Django

**Ubicación del código**:
- `calificacionfiscal/` - App principal
- `cuentas/` - Autenticación
- `parametros/` - Catálogos
- `*/tests.py` - Tests

---

### 🔧 Soy DevOps/Infraestructura

**Lee primero**:
1. [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) - Deploy con Docker
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Stack tecnológico
3. `.github/workflows/ci-cd.yml` - Pipeline CI/CD

**Archivos clave**:
- `Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container
- `docker-compose.yml` - Orquestación
- `nginx.conf` - Configuración Nginx

---

### 🎓 Soy Profesor/Evaluador

**Lee primero**:
1. [README.md](../README.md) - Resumen ejecutivo
2. [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Estado y métricas
3. [SPRINTS_RESUMEN.md](./sprints/SPRINTS_RESUMEN.md) - Historia del proyecto
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - Diseño técnico

**Para evaluación**:
- **Funcionalidad**: [README.md](../README.md#-características)
- **Testing**: [TESTING.md](./TESTING.md) (77 tests pasando)
- **Documentación**: Este índice
- **Deploy**: [DOCKER_GUIDE.md](../DOCKER_GUIDE.md)

---

### 👤 Soy Usuario Final

**Lee primero**:
1. [README.md](../README.md#-usuarios-demo) - Usuarios demo
2. [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Cómo instalar

**Acceso**:
- **URL**: http://localhost:5173
- **Usuario**: `analista` / `analista123`
- **Funciones**: Ver [README.md](../README.md#-características)

---

## 🔍 Búsqueda Rápida por Tema

### Instalación y Setup
- **Instalación completa**: [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- **Requisitos**: [SETUP_GUIDE.md > Requisitos](../SETUP_GUIDE.md#1-requisitos-previos)
- **PostgreSQL**: [SETUP_GUIDE.md > PostgreSQL](../SETUP_GUIDE.md#22-crear-base-de-datos)
- **Docker**: [DOCKER_GUIDE.md](../DOCKER_GUIDE.md)
- **Troubleshooting**: [SETUP_GUIDE.md > Troubleshooting](../SETUP_GUIDE.md#troubleshooting)

### API y Backend
- **Endpoints**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **Autenticación**: [API_ENDPOINTS.md > Autenticación](./API_ENDPOINTS.md#autenticación)
- **Permisos**: [ARCHITECTURE.md > Permisos](./ARCHITECTURE.md#permisos-rbac)
- **Modelos**: [ARCHITECTURE.md > Database Layer](./ARCHITECTURE.md#3-database-layer-postgresql)

### Frontend
- **Componentes**: `frontend/src/components/`
- **Servicios API**: `frontend/src/services/`
- **Rutas**: `frontend/src/router/`
- **Context**: `frontend/src/context/AuthContext.jsx`

### Testing
- **Guía completa**: [TESTING.md](./TESTING.md)
- **Tests frontend**: [TESTING.md > Frontend Testing](./TESTING.md#frontend-testing)
- **Tests backend**: [TESTING.md > Backend Testing](./TESTING.md#backend-testing)
- **CI/CD**: [TESTING.md > CI/CD Testing](./TESTING.md#cicd-testing)

### DevOps
- **Docker**: [DOCKER_GUIDE.md](../DOCKER_GUIDE.md)
- **CI/CD**: `.github/workflows/ci-cd.yml`
- **Nginx**: `frontend/nginx.conf`
- **Variables de entorno**: `.env.example`

### Arquitectura
- **Diagrama general**: [ARCHITECTURE.md > Arquitectura General](./ARCHITECTURE.md#arquitectura-general)
- **Stack**: [ARCHITECTURE.md > Stack Tecnológico](./ARCHITECTURE.md#stack-tecnológico)
- **Seguridad**: [ARCHITECTURE.md > Seguridad](./ARCHITECTURE.md#seguridad)
- **Escalabilidad**: [ARCHITECTURE.md > Escalabilidad](./ARCHITECTURE.md#escalabilidad)

---

## 📊 Mapa de Contenidos

```
DOCUMENTACIÓN NUAM
│
├── 🚀 INICIO RÁPIDO
│   ├── README.md (Visión general)
│   ├── SETUP_GUIDE.md (Instalación paso a paso)
│   └── DOCKER_GUIDE.md (Deploy rápido)
│
├── 🏗 TÉCNICA
│   ├── ARCHITECTURE.md (Arquitectura completa)
│   ├── API_ENDPOINTS.md (30+ endpoints)
│   └── TESTING.md (77 tests)
│
├── 📊 GESTIÓN
│   ├── PROJECT_STATUS.md (Estado actual)
│   └── ROADMAP.md (Futuras mejoras)
│
└── 📅 HISTORIA
    └── sprints/
        ├── SPRINT1_COMPLETE.md
        ├── SPRINT2_COMPLETE.md
        ├── SPRINT3_COMPLETE.md
        ├── SPRINT4_COMPLETE.md
        └── SPRINTS_RESUMEN.md
```

---

## 📈 Estadísticas de Documentación

| Métrica | Valor |
|---------|-------|
| Total Documentos | 13 |
| Líneas Totales | 3,000+ |
| Documentos Técnicos | 5 |
| Guías de Usuario | 3 |
| Resúmenes de Sprint | 5 |
| Última Actualización | 17 Nov 2025 |
| Estado | ✅ Completo |

---

## 🆘 Ayuda y Soporte

### ¿Problemas con la instalación?
→ [SETUP_GUIDE.md > Troubleshooting](../SETUP_GUIDE.md#troubleshooting)

### ¿Problemas con Docker?
→ [DOCKER_GUIDE.md > Troubleshooting](../DOCKER_GUIDE.md)

### ¿Dudas sobre la API?
→ [API_ENDPOINTS.md](./API_ENDPOINTS.md)

### ¿Quieres contribuir?
→ [README.md > Contribución](../README.md#-contribución)

### ¿Preguntas generales?
→ Crear issue en GitHub

---

## ✅ Checklist de Lectura Recomendada

### Para empezar (obligatorio)
- [ ] Leer [README.md](../README.md)
- [ ] Seguir [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- [ ] Probar login con usuarios demo
- [ ] Explorar dashboard

### Para desarrollar
- [ ] Estudiar [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ ] Revisar [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- [ ] Leer [TESTING.md](./TESTING.md)
- [ ] Ejecutar tests

### Para presentar
- [ ] Leer [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [ ] Revisar [SPRINTS_RESUMEN.md](./sprints/SPRINTS_RESUMEN.md)
- [ ] Preparar demo en vivo

---

**Última actualización**: 17 de noviembre de 2025  
**Versión**: 1.0.0  
**Proyecto**: NUAM - Sistema de Calificaciones Tributarias
