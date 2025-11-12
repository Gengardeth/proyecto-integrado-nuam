from django.contrib import admin
from .models import Contribuyente, CalificacionTributaria, TaxRating

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
    list_display = ('issuer', 'instrument', 'rating', 'fecha_rating', 'outlook', 'activo')
    list_filter = ('rating', 'outlook', 'activo', 'fecha_rating')
    search_fields = ('issuer__nombre', 'instrument__nombre')
    date_hierarchy = 'fecha_rating'
    readonly_fields = ('creado_en', 'actualizado_en')
    fieldsets = (
        ('Información Básica', {
            'fields': ('issuer', 'instrument', 'rating', 'outlook', 'activo')
        }),
        ('Fechas', {
            'fields': ('fecha_rating', 'fecha_vencimiento')
        }),
        ('Usuario', {
            'fields': ('analista',)
        }),
        ('Observaciones', {
            'fields': ('notas',)
        }),
        ('Auditoría', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )
