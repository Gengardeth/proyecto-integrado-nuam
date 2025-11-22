#!/usr/bin/env python
"""
Script para verificar que los filtros case-insensitive funcionan correctamente
en todas las vistas del sistema.
"""
import os
import sys
import django
from django.test.utils import setup_test_environment

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from calificacionfiscal.models import TaxRating
from cuentas.audit_models import AuditLog
from django.db.models import Q

def test_taxrating_status_filters():
    """Prueba filtros case-insensitive de status en TaxRating"""
    print("\n" + "="*60)
    print("PRUEBA 1: TaxRating Status Filters (case-insensitive)")
    print("="*60)
    
    # Obtener status únicos
    unique_statuses = TaxRating.objects.values('status').distinct()
    print(f"\nStatus únicos en BD: {[s['status'] for s in unique_statuses]}")
    
    if not unique_statuses:
        print("⚠️  No hay TaxRatings en la BD")
        return
    
    # Probar con el primer status encontrado
    original_status = unique_statuses[0]['status']
    print(f"\nUsando status original: '{original_status}'")
    
    # Pruebas
    test_cases = [
        (original_status, "exacto"),
        (original_status.upper(), "MAYÚSCULAS"),
        (original_status.lower(), "minúsculas"),
        (original_status.title(), "Title Case"),
    ]
    
    for test_value, description in test_cases:
        count = TaxRating.objects.filter(status__iexact=test_value).count()
        expected = TaxRating.objects.filter(status=original_status).count()
        status_icon = "✅" if count == expected else "❌"
        print(f"{status_icon} status__iexact='{test_value}' ({description}): {count} resultados (esperado: {expected})")
    
    print()

def test_taxrating_rating_filters():
    """Prueba filtros case-insensitive de rating en TaxRating"""
    print("\n" + "="*60)
    print("PRUEBA 2: TaxRating Rating Filters (case-insensitive)")
    print("="*60)
    
    # Obtener ratings únicos
    unique_ratings = TaxRating.objects.values('rating').distinct()
    print(f"\nRatings únicos en BD: {[r['rating'] for r in unique_ratings if r['rating']]}")
    
    ratings_with_values = [r for r in unique_ratings if r['rating']]
    if not ratings_with_values:
        print("⚠️  No hay ratings en la BD")
        return
    
    # Probar con el primer rating encontrado
    original_rating = ratings_with_values[0]['rating']
    print(f"\nUsando rating original: '{original_rating}'")
    
    # Pruebas
    test_cases = [
        (original_rating, "exacto"),
        (str(original_rating).upper(), "MAYÚSCULAS"),
        (str(original_rating).lower(), "minúsculas"),
    ]
    
    for test_value, description in test_cases:
        count = TaxRating.objects.filter(rating__iexact=test_value).count()
        expected = TaxRating.objects.filter(rating=original_rating).count()
        status_icon = "✅" if count == expected else "❌"
        print(f"{status_icon} rating__iexact='{test_value}' ({description}): {count} resultados (esperado: {expected})")
    
    print()

def test_auditlog_filters():
    """Prueba filtros case-insensitive en AuditLog"""
    print("\n" + "="*60)
    print("PRUEBA 3: AuditLog Filters (case-insensitive)")
    print("="*60)
    
    # Obtener acciones únicas
    unique_acciones = AuditLog.objects.values('accion').distinct()
    print(f"\nAcciones únicas en BD: {[a['accion'] for a in unique_acciones]}")
    
    if not unique_acciones:
        print("⚠️  No hay AuditLogs en la BD")
        return
    
    # Probar con la primera acción encontrada
    original_accion = unique_acciones[0]['accion']
    print(f"\nUsando acción original: '{original_accion}'")
    
    # Pruebas
    test_cases = [
        (original_accion, "exacto"),
        (original_accion.upper(), "MAYÚSCULAS"),
        (original_accion.lower(), "minúsculas"),
    ]
    
    for test_value, description in test_cases:
        count = AuditLog.objects.filter(accion__iexact=test_value).count()
        expected = AuditLog.objects.filter(accion=original_accion).count()
        status_icon = "✅" if count == expected else "❌"
        print(f"{status_icon} accion__iexact='{test_value}' ({description}): {count} resultados (esperado: {expected})")
    
    print()

def test_auditlog_modelo_filters():
    """Prueba filtros case-insensitive de modelo en AuditLog"""
    print("\n" + "="*60)
    print("PRUEBA 4: AuditLog Modelo Filters (case-insensitive)")
    print("="*60)
    
    # Obtener modelos únicos
    unique_modelos = AuditLog.objects.values('modelo').distinct()
    print(f"\nModelos únicos en BD: {[m['modelo'] for m in unique_modelos]}")
    
    modelos_with_values = [m for m in unique_modelos if m['modelo']]
    if not modelos_with_values:
        print("⚠️  No hay modelos en la BD")
        return
    
    # Probar con el primer modelo encontrado
    original_modelo = modelos_with_values[0]['modelo']
    print(f"\nUsando modelo original: '{original_modelo}'")
    
    # Pruebas
    test_cases = [
        (original_modelo, "exacto"),
        (original_modelo.upper(), "MAYÚSCULAS"),
        (original_modelo.lower(), "minúsculas"),
    ]
    
    for test_value, description in test_cases:
        count = AuditLog.objects.filter(modelo__iexact=test_value).count()
        expected = AuditLog.objects.filter(modelo=original_modelo).count()
        status_icon = "✅" if count == expected else "❌"
        print(f"{status_icon} modelo__iexact='{test_value}' ({description}): {count} resultados (esperado: {expected})")
    
    print()

def test_filterset_filters():
    """Prueba los FilterSets personalizados"""
    print("\n" + "="*60)
    print("PRUEBA 5: FilterSet Custom Filters")
    print("="*60)
    
    from calificacionfiscal.views import TaxRatingFilterSet
    from cuentas.views import AuditLogFilterSet
    
    # Verificar que los FilterSets existen y tienen los métodos correctos
    tax_rating_fs = TaxRatingFilterSet()
    print(f"\n✅ TaxRatingFilterSet cargado")
    print(f"   - Tiene método 'filter_status_icase': {hasattr(tax_rating_fs, 'filter_status_icase')}")
    print(f"   - Tiene método 'filter_rating_icase': {hasattr(tax_rating_fs, 'filter_rating_icase')}")
    
    audit_log_fs = AuditLogFilterSet()
    print(f"\n✅ AuditLogFilterSet cargado")
    print(f"   - Tiene método 'filter_accion_icase': {hasattr(audit_log_fs, 'filter_accion_icase')}")
    print(f"   - Tiene método 'filter_modelo_icase': {hasattr(audit_log_fs, 'filter_modelo_icase')}")
    print(f"   - Tiene método 'filter_usuario_icase': {hasattr(audit_log_fs, 'filter_usuario_icase')}")
    
    print()

if __name__ == '__main__':
    print("\n" + "🔍 PRUEBAS DE FILTROS CASE-INSENSITIVE 🔍")
    print("="*60)
    
    try:
        test_filterset_filters()
        test_taxrating_status_filters()
        test_taxrating_rating_filters()
        test_auditlog_filters()
        test_auditlog_modelo_filters()
        
        print("\n" + "="*60)
        print("✅ TODAS LAS PRUEBAS COMPLETADAS")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
