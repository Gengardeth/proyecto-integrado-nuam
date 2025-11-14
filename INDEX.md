# 📑 Índice y Navegador de Documentación
## Centro de Información del Proyecto NUAM

**Estado:** 🟢 Sprint 1 Completado | Backend API Funcional  
**Última actualización:** 12 de noviembre de 2025

---

## 🎯 Empezar Aquí

### Para Entender el Proyecto (5 min)
1. **[DELIVERABLES.md](DELIVERABLES.md)** - Resumen visual de qué se entrega
2. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Estado actual y puntos destacados

### Para Instalar y Ejecutar (15 min)
1. **[DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)** - Setup paso a paso
2. **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Validación de setup

### Para Ver el Plan Completo (10 min)
1. **[ROADMAP.md](ROADMAP.md)** - Sprints 2-4 (Carga masiva, reportes, frontend, DevOps)

---

## 📚 Documentación Detallada

### 1️⃣ **README.md** (Main)
   - 📖 Guía completa de instalación
   - 🔌 Todos los endpoints documentados
   - 👥 Roles y permisos RBAC
   - 📋 Estado de desarrollo por sprint
   - **Audiencia:** Todos (referencia principal)

### 2️⃣ **PROJECT_STATUS.md**
   - 📊 Métricas y estado actual
   - ✅ Criterios de aceptación cumplidos
   - 🎯 Qué se completó en Sprint 1
   - 🔄 Próximos pasos
   - **Audiencia:** Managers, leads, stakeholders

### 3️⃣ **DELIVERABLES.md**
   - 📦 Qué se entrega (visual)
   - ✨ Resumen de features
   - 🎓 Roles demo
   - 📈 Métricas rápidas
   - **Audiencia:** Todos (resumen ejecutivo)

### 4️⃣ **SPRINT1_SUMMARY.md**
   - 🏗️ Arquitectura técnica detallada
   - 📝 Patrones implementados
   - 🔐 Decisiones de seguridad
   - 💡 Puntos destacados técnicos
   - **Audiencia:** Desarrolladores, arquitectos

### 5️⃣ **DEVELOPER_SETUP.md**
   - 🛠️ Setup completo paso a paso
   - 💻 Comandos para Windows/macOS/Linux
   - 🐳 Opciones: PostgreSQL local o Docker
   - 🔧 Troubleshooting
   - **Audiencia:** Desarrolladores nuevos

### 6️⃣ **ROADMAP.md**
   - 📋 Plan detallado Sprints 2-4
   - ✅ Checklist de tareas
   - 📅 Estimaciones de esfuerzo
   - 🎯 Criterios de aceptación finales
   - **Audiencia:** Planificadores, product owners

### 7️⃣ **VERIFICATION_CHECKLIST.md**
   - ✔️ Testing manual completo
   - 🧪 Comandos de validación
   - 🐛 Troubleshooting detallado
   - 📝 Checklist de verificación
   - **Audiencia:** QA, testers, verificación

### 8️⃣ **COMMIT_SUMMARY.md**
   - 📝 Cambios de este commit
   - 📊 Métricas detalladas
   - 📦 Archivos modificados/creados
   - ✅ Criterios cumplidos
   - **Audiencia:** Revisores de código

### 9️⃣ **PROJECT_STATUS.md** (Duplicado intencional)
   - 🎯 Punto de referencia principal
   - 📌 Siempre consultar para estado

### 🔟 **.env.example**
   - 🔐 Variables de entorno (plantilla)
   - Copiar a `.env` y editar con valores reales
   - **Audiencia:** Desarrolladores

---

## 🗂️ Estructura del Proyecto

```
proyecto-integrado-nuam/
│
├── 📄 Documentación Principal
│   ├── INDEX.md (este archivo)
│   ├── README.md ⭐ EMPEZAR AQUÍ
│   ├── PROJECT_STATUS.md 📊 ESTADO ACTUAL
│   ├── DELIVERABLES.md 📦 QUÉ SE ENTREGA
│   ├── SPRINT1_SUMMARY.md 🏗️ TÉCNICO
│   ├── DEVELOPER_SETUP.md 🛠️ SETUP
│   ├── ROADMAP.md 📋 PLAN
│   ├── VERIFICATION_CHECKLIST.md ✔️ TESTING
│   └── COMMIT_SUMMARY.md 📝 CAMBIOS
│
├── 🔐 Configuración
│   ├── .env.example (copiar a .env)
│   ├── requirements.txt (dependencias)
│   └── manage.py (CLI Django)
│
├── 🎯 Backend Django
│   ├── Nuam/ (configuración proyecto)
│   │   ├── settings.py (DRF, CORS, Audit)
│   │   └── urls.py (rutas /api/v1/)
│   │
│   ├── cuentas/ (Autenticación + RBAC + Auditoría)
│   │   ├── models.py (Usuario, AuditLog)
│   │   ├── views.py (endpoints: login, logout, me, roles, audit)
│   │   ├── serializers.py (UsuarioSerializer, AuditLogSerializer)
│   │   ├── urls.py (rutas auth)
│   │   ├── admin.py (UsuarioAdmin, AuditLogAdmin)
│   │   ├── signals.py (auto-registro auditoría)
│   │   ├── audit_models.py (AuditLog)
│   │   └── management/commands/seed_users.py (usuarios demo)
│   │
│   ├── parametros/ (Catálogos: Issuer, Instrument)
│   │   ├── models.py (Issuer, Instrument, Parametro)
│   │   ├── views.py (IssuersViewSet, InstrumentsViewSet)
│   │   ├── serializers.py (IssuerSerializer, InstrumentSerializer)
│   │   ├── urls.py (rutas catálogos)
│   │   └── admin.py (admin de catálogos)
│   │
│   └── calificacionfiscal/ (Calificaciones Tributarias)
│       ├── models.py (TaxRating + antiguos)
│       ├── views.py (TaxRatingViewSet)
│       ├── serializers.py (TaxRatingSerializer)
│       ├── urls.py (rutas tax-ratings)
│       └── admin.py (TaxRatingAdmin)
│
├── 🎨 Frontend (Pendiente Sprint 3)
│   └── frontend/ (React + Vite)
│
└── 🌐 Static/Templates
    ├── static/ (CSS, JS, etc.)
    └── templates/ (HTML templates)
```

---

## 🎯 Flujo de Trabajo Recomendado

### 👤 Si eres un Desarrollador Nuevo
```
1. Lee DELIVERABLES.md (2 min)
2. Sigue DEVELOPER_SETUP.md (15 min)
3. Ejecuta VERIFICATION_CHECKLIST.md (10 min)
4. Consulta README.md para endpoints
5. Revisa SPRINT1_SUMMARY.md para arquitectura
```

### 👨‍💼 Si eres un Manager/Lead
```
1. Lee DELIVERABLES.md (2 min)
2. Lee PROJECT_STATUS.md (5 min)
3. Consulta ROADMAP.md para timeline
4. Revisa SPRINT1_SUMMARY.md si necesitas detalles técnicos
```

### 👨‍🔬 Si eres Arquitecto/Tech Lead
```
1. Lee SPRINT1_SUMMARY.md (15 min)
2. Revisa PROJECT_STATUS.md (5 min)
3. Consulta ROADMAP.md para próximas decisiones
4. Explora código en cuentas/, parametros/, calificacionfiscal/
```

### 🧪 Si eres QA/Tester
```
1. Sigue DEVELOPER_SETUP.md (15 min)
2. Ejecuta VERIFICATION_CHECKLIST.md completamente (20 min)
3. Usa README.md para probar endpoints (Postman/curl)
4. Documenta hallazgos
```

---

## 📊 Resumen de Sprint 1

| Item | Status | Referencia |
|------|--------|-----------|
| Backend API REST | ✅ | SPRINT1_SUMMARY.md |
| 30+ Endpoints | ✅ | README.md |
| RBAC (3 roles) | ✅ | PROJECT_STATUS.md |
| Auditoría | ✅ | SPRINT1_SUMMARY.md |
| Admin Django | ✅ | DELIVERABLES.md |
| Documentación | ✅ | Este archivo |
| Usuarios Demo | ✅ | DEVELOPER_SETUP.md |
| Tests | ❌ | ROADMAP.md (Sprint 4) |

---

## 🔗 Enlaces Rápidos

### Ejecutar Proyecto
```bash
# Setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# BD
python manage.py migrate
python manage.py seed_users

# Ejecutar
python manage.py runserver 0.0.0.0:8000

# API
http://localhost:8000/api/v1/

# Admin
http://localhost:8000/admin/
```

### Probar Endpoints
```bash
# Health
curl http://localhost:8000/api/v1/health

# Roles
curl http://localhost:8000/api/v1/roles

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 📞 Soporte

### Preguntas Comunes
1. "¿Por dónde empiezo?" → [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)
2. "¿Qué endpoints hay?" → [README.md](README.md)
3. "¿Cómo valido el setup?" → [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)
4. "¿Cuál es el plan futuro?" → [ROADMAP.md](ROADMAP.md)
5. "¿Qué se entrega en Sprint 1?" → [DELIVERABLES.md](DELIVERABLES.md)

### Troubleshooting
- Problemas de instalación → [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md#troubleshooting)
- Problemas de BD → [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md#debugging)
- Problemas de endpoints → [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md#troubleshooting)

---

## 📅 Cronograma

| Sprint | Fechas | Focus |
|--------|--------|-------|
| 1 ✅ | Nov 12 | Backend API REST |
| 2 🔄 | Nov 26 | Carga Masiva + Reportes |
| 3 | Dic 10 | Frontend React |
| 4 | Dic 24 | Tests + DevOps |

---

## 🎓 Recursos Adicionales

### Tecnologías Usadas
- Django 5.2.8 (Backend)
- Django REST Framework 3.16.1 (API)
- PostgreSQL 14+ (Base de datos)
- React 18 + Vite (Frontend - próximo)

### Documentación Oficial
- [Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)

---

## ✅ Checklist de Orientación

- [ ] He leído DELIVERABLES.md (resumen visual)
- [ ] He leído PROJECT_STATUS.md (estado actual)
- [ ] He ejecutado DEVELOPER_SETUP.md (setup local)
- [ ] He validado con VERIFICATION_CHECKLIST.md
- [ ] He explorado los endpoints con curl/Postman
- [ ] He entendido la estructura del código
- [ ] He consultado el admin Django (localhost:8000/admin)
- [ ] Entiendo el plan en ROADMAP.md

---

## 🎉 ¡Listo para Comenzar!

Comienza por [DELIVERABLES.md](DELIVERABLES.md) y luego sigue [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md).

---

**Última actualización:** 12 de noviembre de 2025  
**Sprint:** 1 (Completado)  
**Próximo:** Sprint 2
