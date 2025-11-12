from django.contrib import admin
from .models import TipoParametro, Parametro, Issuer, Instrument

@admin.register(TipoParametro)
class TipoParametroAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Parametro)
class ParametroAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'codigo', 'nombre', 'activo')
    list_filter = ('tipo', 'activo')
    search_fields = ('codigo', 'nombre')
    ordering = ['tipo', 'codigo']

@admin.register(Issuer)
class IssuerAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'rut', 'activo', 'creado_en')
    list_filter = ('activo', 'creado_en')
    search_fields = ('codigo', 'nombre', 'razon_social', 'rut')
    readonly_fields = ('creado_en', 'actualizado_en')
    date_hierarchy = 'creado_en'

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'tipo', 'activo', 'creado_en')
    list_filter = ('tipo', 'activo', 'creado_en')
    search_fields = ('codigo', 'nombre')
    readonly_fields = ('creado_en', 'actualizado_en')
    date_hierarchy = 'creado_en'
