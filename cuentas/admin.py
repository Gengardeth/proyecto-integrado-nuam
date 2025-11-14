from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import Usuario
from .audit_models import AuditLog

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    """Admin customizado para gestionar usuarios con roles RBAC"""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol_badge', 'activo_badge', 'date_joined')
    list_filter = ('rol', 'activo', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    readonly_fields = ('date_joined', 'last_login', 'permisos_display')
    
    fieldsets = (
        ('Información de Usuario', {
            'fields': ('username', 'password', 'email', 'first_name', 'last_name')
        }),
        ('Rol y Permisos RBAC', {
            'fields': ('rol', 'permisos_display', 'activo', 'descripcion'),
        }),
        ('Permisos Django', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Información Temporal', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',)
        }),
    )

    def rol_badge(self, obj):
        """Muestra el rol con colores"""
        colors = {
            'ADMIN': '#dc3545',
            'ANALISTA': '#0d6efd',
            'AUDITOR': '#198754',
        }
        color = colors.get(obj.rol, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_rol_display()
        )
    rol_badge.short_description = 'Rol'

    def activo_badge(self, obj):
        """Muestra estado del usuario"""
        if obj.activo and obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
        else:
            return format_html('<span style="color: red; font-weight: bold;">✗ Inactivo</span>')
    activo_badge.short_description = 'Estado'

    def permisos_display(self, obj):
        """Muestra permisos según rol"""
        permisos = obj.get_permisos_rbac()
        if not permisos:
            return "Sin permisos"
        return format_html(
            '<ul style="margin: 0; padding-left: 20px;">{}</ul>',
            ''.join([f'<li><code>{perm}</code></li>' for perm in permisos])
        )
    permisos_display.short_description = 'Permisos del Rol'

    def save_model(self, request, obj, form, change):
        """Sincronizar is_active con activo"""
        obj.is_active = obj.activo
        super().save_model(request, obj, form, change)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'accion', 'modelo', 'descripcion', 'creado_en')
    list_filter = ('accion', 'modelo', 'creado_en')
    search_fields = ('usuario__username', 'modelo', 'descripcion')
    readonly_fields = ('usuario', 'accion', 'modelo', 'descripcion', 'object_id', 'content_type', 
                       'datos_anterior', 'datos_nuevo', 'ip_address', 'user_agent', 'creado_en')
    date_hierarchy = 'creado_en'
    
    def has_delete_permission(self, request):
        return False
    
    def has_add_permission(self, request):
        return False
