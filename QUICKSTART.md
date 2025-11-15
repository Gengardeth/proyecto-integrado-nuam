# 🚀 Inicio Rápido - Dashboard NUAM

## Comandos para iniciar el proyecto

### 1️⃣ Backend (Django)
```powershell
# Terminal 1 - Activar entorno virtual e iniciar backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py seed_users
python manage.py runserver
```

✅ Backend disponible en: http://localhost:8000

### 2️⃣ Frontend (React)
```powershell
# Terminal 2 - Iniciar frontend
cd frontend
npm install  # Solo la primera vez
npm run dev
```

✅ Frontend disponible en: http://localhost:5173

## 🔐 Usuarios de Prueba

| Usuario   | Contraseña    | Rol      |
|-----------|---------------|----------|
| admin     | admin123      | ADMIN    |
| analista  | analista123   | ANALISTA |
| auditor   | auditor123    | AUDITOR  |

## 📱 Acceso

1. Abre tu navegador en http://localhost:5173
2. Usa las credenciales de arriba para iniciar sesión
3. Serás redirigido al Dashboard

## 🎯 Funcionalidades Disponibles

### Dashboard Principal ✅
- KPIs principales (Total, Vigentes, Vencidos)
- Últimas calificaciones
- Actividad reciente (Admin/Auditor)
- Acciones rápidas

### Navegación 🧭
- **Dashboard** - Vista general del sistema
- **Calificaciones** - Próximamente
- **Reportes** - Próximamente  
- **Carga Masiva** - Próximamente (solo Admin/Analista)
- **Auditoría** - Próximamente (solo Admin/Auditor)

## 🔧 Solución Rápida de Problemas

### Backend no inicia
```powershell
# Verificar que PostgreSQL esté corriendo
# O usar SQLite editando settings.py
```

### Frontend no conecta con Backend
```powershell
# Verificar que el backend esté en http://localhost:8000
# Revisar CORS_ALLOWED_ORIGINS en settings.py
```

### Error de usuarios
```powershell
# Recrear usuarios
python manage.py seed_users
```

## 📚 Documentación

- `SPRINT3_DASHBOARD_README.md` - Documentación completa del Dashboard
- `HOLA_CABROS.md` - Guía completa de Sprints
- `README.md` - Documentación general

---

**¡Listo para desarrollar!** 🎉
