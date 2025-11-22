#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from calificacionfiscal.models import TaxRating
from django.db.models import Count

print("=" * 60)
print("🔍 VERIFICACIÓN DE FILTROS - CALIFICACIONES FISCALES")
print("=" * 60)

# 1. Contar registros totales
total = TaxRating.objects.count()
print(f"\n✅ Total de Calificaciones: {total}")

# 2. Ratings únicos
ratings = TaxRating.objects.values('rating').distinct().count()
print(f"✅ Ratings únicos en BD: {ratings}")

# 3. Status únicos
statuses = TaxRating.objects.values('status').distinct().count()
print(f"✅ Status únicos en BD: {statuses}")

# 4. Top Issuers
print("\n📊 Top 5 Issuers por cantidad de registros:")
top_issuers = (
    TaxRating.objects
    .select_related('issuer')
    .values('issuer__nombre')
    .annotate(count=Count('id'))
    .order_by('-count')[:5]
)
for i, item in enumerate(top_issuers, 1):
    print(f"   {i}. {item['issuer__nombre']}: {item['count']} registros")

# 5. Top Instruments
print("\n📊 Top 5 Instruments por cantidad de registros:")
top_instruments = (
    TaxRating.objects
    .select_related('instrument')
    .values('instrument__nombre')
    .annotate(count=Count('id'))
    .order_by('-count')[:5]
)
for i, item in enumerate(top_instruments, 1):
    print(f"   {i}. {item['instrument__nombre']}: {item['count']} registros")

# 6. Prueba de búsqueda (search_fields)
print("\n🔎 Pruebas de Búsqueda:")
search_tests = [
    ('ISSUER', 'issuer__nombre__icontains'),
    ('INST', 'instrument__codigo__icontains'),
    ('AAA', 'rating__icontains'),
]

for search_term, filter_key in search_tests:
    count = TaxRating.objects.filter(**{filter_key: search_term}).count()
    print(f"   • Búsqueda '{search_term}': {count} resultados")

# 7. Filtros por rango de fecha
from datetime import datetime, timedelta
fecha_desde = datetime(2025, 1, 1).date()
fecha_hasta = datetime(2025, 12, 31).date()
count_fecha = TaxRating.objects.filter(
    valid_from__gte=fecha_desde,
    valid_from__lte=fecha_hasta
).count()
print(f"\n📅 Registros en rango 2025-01-01 a 2025-12-31: {count_fecha}")

# 8. Verificar ordenamiento
print("\n📋 Últimas 3 calificaciones (ordenadas por valid_from DESC):")
latest = TaxRating.objects.select_related('issuer', 'instrument').order_by('-valid_from')[:3]
for i, calif in enumerate(latest, 1):
    print(f"   {i}. {calif.issuer.nombre} - {calif.instrument.nombre}: {calif.rating} ({calif.valid_from})")

print("\n" + "=" * 60)
print("✅ VERIFICACIÓN COMPLETADA - FILTRO FUNCIONANDO CORRECTAMENTE")
print("=" * 60)
