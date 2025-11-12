from django.contrib import admin
from .models import Usuario
from .audit_models import AuditLog

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'rol', 'is_active', 'is_staff')
    list_filter = ('rol', 'is_active', 'is_staff')
    search_fields = ('username', 'email')

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
