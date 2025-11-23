#!/usr/bin/env python
"""
Script para agregar más datos de prueba de cargas masivas desde diferentes usuarios.
Esto demuestra que todos los usuarios ven todas las cargas (sin filtro por usuario).
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from calificacionfiscal.models import BulkUpload
from cuentas.models import Usuario

# Obtener usuarios
admin_user = Usuario.objects.filter(rol='ADMIN').first()
analista_user = Usuario.objects.filter(rol='ANALISTA').first()

if not admin_user or not analista_user:
    print("Error: No existen usuarios admin o analista")
    sys.exit(1)

print("=" * 70)
print("AGREGAR MÁS DATOS DE PRUEBA DE CARGAS")
print("=" * 70)

# Crear 3 cargas adicionales del analista
additional_uploads = [
    {
        'total_filas': 300,
        'filas_ok': 300,
        'filas_error': 0,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 15,
        'archivo': 'media/bulk_uploads/2025/01/06/carga_analista_1.txt',
        'usuario': analista_user,
    },
    {
        'total_filas': 180,
        'filas_ok': 150,
        'filas_error': 30,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 12,
        'archivo': 'media/bulk_uploads/2025/01/07/carga_analista_2.txt',
        'usuario': analista_user,
    },
    {
        'total_filas': 220,
        'filas_ok': 220,
        'filas_error': 0,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 8,
        'archivo': 'media/bulk_uploads/2025/01/08/carga_analista_3.txt',
        'usuario': analista_user,
    },
]

print("\nCreando cargas del usuario ANALISTA:")
print("-" * 70)

for i, upload_data in enumerate(additional_uploads, 1):
    try:
        dias_atras = upload_data.pop('dias_atras')
        usuario = upload_data.pop('usuario')
        fecha_creacion = timezone.now() - timedelta(days=dias_atras)
        
        bulk_upload, created = BulkUpload.objects.get_or_create(
            archivo=upload_data['archivo'],
            defaults={
                'usuario': usuario,
                'tipo': upload_data['tipo'],
                'estado': upload_data['estado'],
                'total_filas': upload_data['total_filas'],
                'filas_ok': upload_data['filas_ok'],
                'filas_error': upload_data['filas_error'],
                'creado_en': fecha_creacion,
                'actualizado_en': fecha_creacion,
            }
        )
        
        if created:
            if bulk_upload.estado == 'COMPLETADO':
                bulk_upload.fecha_inicio = fecha_creacion
                bulk_upload.fecha_fin = fecha_creacion + timedelta(minutes=5)
                bulk_upload.save()
            
            archivo_name = upload_data['archivo'].split('/')[-1]
            print(f"{i}. ✓ Creado por {usuario.username}")
            print(f"   Archivo: {archivo_name}")
            print(f"   Filas: {bulk_upload.total_filas} | OK: {bulk_upload.filas_ok} | Éxito: {bulk_upload.porcentaje_exito}%")
            print()
    except Exception as e:
        print(f"   ✗ Error: {str(e)}\n")

# Mostrar resumen
print("=" * 70)
print("RESUMEN FINAL")
print("=" * 70)

total_cargas = BulkUpload.objects.count()
cargas_admin = BulkUpload.objects.filter(usuario=admin_user).count()
cargas_analista = BulkUpload.objects.filter(usuario=analista_user).count()

print(f"\nTotal de cargas en el sistema: {total_cargas}")
print(f"  - Cargas del ADMIN ({admin_user.username}): {cargas_admin}")
print(f"  - Cargas del ANALISTA ({analista_user.username}): {cargas_analista}")

print("\n" + "=" * 70)
print("✓ IMPORTANTE: Todos los usuarios pueden ver TODAS las cargas")
print("  No hay filtro por usuario. Analista ve cargas de Admin y vice versa.")
print("=" * 70)

# Mostrar cargas por estado
estados = {}
for carga in BulkUpload.objects.all():
    estado = carga.estado
    estados[estado] = estados.get(estado, 0) + 1

print("\nCargas por estado:")
for estado, cantidad in sorted(estados.items()):
    print(f"  - {estado}: {cantidad}")
