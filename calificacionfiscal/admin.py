from django.contrib import admin
from .models import Contribuyente, CalificacionTributaria, TaxRating, BulkUpload, BulkUploadItem

@admin.register(Contribuyente)
class ContribuyenteAdmin(admin.ModelAdmin):
    list_display = ('rut', 'razon_social', 'giro')
    search_fields = ('rut', 'razon_social')
    ordering = ['razon_social']

@admin.register(CalificacionTributaria)
class CalificacionTributariaAdmin(admin.ModelAdmin):
    list_display = ('contribuyente', 'fecha', 'estado', 'puntaje_total', 'creado_por')
    list_filter = ('fecha', 'estado')
    search_fields = ('contribuyente__razon_social',)
    date_hierarchy = 'fecha'

@admin.register(TaxRating)
class TaxRatingAdmin(admin.ModelAdmin):
    list_display = ('issuer', 'instrument', 'rating', 'risk_level', 'status', 'valid_from', 'valid_to')
    list_filter = ('rating', 'risk_level', 'status', 'valid_from')
    search_fields = ('issuer__nombre', 'instrument__nombre')
    date_hierarchy = 'valid_from'
    readonly_fields = ('creado_en', 'actualizado_en')
    fieldsets = (
        ('Información Básica', {
            'fields': ('issuer', 'instrument', 'rating', 'risk_level', 'status')
        }),
        ('Vigencia', {
            'fields': ('valid_from', 'valid_to')
        }),
        ('Usuario', {
            'fields': ('analista',)
        }),
        ('Comentarios', {
            'fields': ('comments',)
        }),
        ('Auditoría', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BulkUpload)
class BulkUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'usuario', 'estado', 'total_filas', 'filas_ok', 'filas_error', 'porcentaje_exito', 'creado_en')
    list_filter = ('estado', 'tipo', 'creado_en')
    search_fields = ('usuario__username',)
    readonly_fields = ('usuario', 'tipo', 'total_filas', 'filas_ok', 'filas_error', 'resumen_errores', 
                       'fecha_inicio', 'fecha_fin', 'creado_en', 'actualizado_en', 'porcentaje_exito')
    date_hierarchy = 'creado_en'
    
    fieldsets = (
        ('Información del Archivo', {
            'fields': ('archivo', 'tipo')
        }),
        ('Estado del Proceso', {
            'fields': ('usuario', 'estado', 'fecha_inicio', 'fecha_fin')
        }),
        ('Resultados', {
            'fields': ('total_filas', 'filas_ok', 'filas_error', 'porcentaje_exito', 'resumen_errores')
        }),
        ('Auditoría', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(BulkUploadItem)
class BulkUploadItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'bulk_upload', 'numero_fila', 'estado', 'mensaje_error_truncado', 'creado_en')
    list_filter = ('estado', 'creado_en')
    search_fields = ('bulk_upload__id', 'mensaje_error')
    readonly_fields = ('bulk_upload', 'numero_fila', 'estado', 'mensaje_error', 'datos', 'creado_en')
    
    fieldsets = (
        ('Información de la Fila', {
            'fields': ('bulk_upload', 'numero_fila', 'estado')
        }),
        ('Detalles', {
            'fields': ('mensaje_error', 'datos')
        }),
        ('Auditoría', {
            'fields': ('creado_en',),
            'classes': ('collapse',)
        }),
    )
    
    def mensaje_error_truncado(self, obj):
        if obj.mensaje_error:
            return obj.mensaje_error[:50] + '...' if len(obj.mensaje_error) > 50 else obj.mensaje_error
        return '-'
    mensaje_error_truncado.short_description = 'Error'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
