"""
Permisos personalizados basados en roles (RBAC).
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios ADMIN.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.rol == 'ADMIN'


class IsAdminOrAnalyst(permissions.BasePermission):
    """
    Permiso que permite acceso a ADMIN y ANALYST.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.rol in ['ADMIN', 'ANALISTA']


class IsAuthenticatedWithRole(permissions.BasePermission):
    """
    Permiso base para usuarios autenticados con rol.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'rol')


class TaxRatingPermission(permissions.BasePermission):
    """
    Permiso personalizado para TaxRating según el rol:
    - ADMIN: full CRUD
    - ANALISTA: CRUD (create, read, update, delete)
    - AUDITOR: solo lectura
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # ADMIN puede todo
        if user.rol == 'ADMIN':
            return True
        
        # ANALISTA puede CRUD
        if user.rol == 'ANALISTA':
            return True
        
        # AUDITOR solo puede leer
        if user.rol == 'AUDITOR':
            return request.method in permissions.SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Permiso a nivel de objeto."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # ADMIN puede todo
        if user.rol == 'ADMIN':
            return True
        
        # ANALISTA puede modificar sus propias calificaciones
        if user.rol == 'ANALISTA':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Puede editar/eliminar solo las que creó
            return obj.analista == user
        
        # AUDITOR solo lectura
        if user.rol == 'AUDITOR':
            return request.method in permissions.SAFE_METHODS
        
        return False


class BulkUploadPermission(permissions.BasePermission):
    """
    Permiso para cargas masivas:
    - ADMIN y ANALISTA: pueden subir archivos
    - AUDITOR: solo lectura
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user = request.user
        
        if user.rol in ['ADMIN', 'ANALISTA']:
            return True
        
        if user.rol == 'AUDITOR':
            return request.method in permissions.SAFE_METHODS
        
        return False


class UserManagementPermission(permissions.BasePermission):
    """
    Solo ADMIN puede gestionar usuarios.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Solo ADMIN puede gestionar usuarios
        if view.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return request.user.rol == 'ADMIN'
        
        # Perfil propio accesible para todos
        if view.action == 'me':
            return True
        
        return False


class AuditLogPermission(permissions.BasePermission):
    """
    Permiso para logs de auditoría:
    - ADMIN: full access
    - AUDITOR: solo lectura
    - ANALISTA: puede ver sus propias acciones
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # Solo lectura para todos
        if request.method not in permissions.SAFE_METHODS:
            return False
        
        return user.rol in ['ADMIN', 'AUDITOR', 'ANALISTA']


class ReportPermission(permissions.BasePermission):
    """
    ADMIN y ANALISTA pueden generar reportes.
    AUDITOR solo puede ver.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.rol in ['ADMIN', 'ANALISTA', 'AUDITOR']
