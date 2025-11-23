#!/usr/bin/env python
"""
Script para crear datos de prueba de cargas masivas (BulkUploads) 
para que los analistas puedan ver el historial de cargas.
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

# Obtener o crear usuario admin para las cargas de prueba
try:
    admin_user = Usuario.objects.get(username='admin')
except Usuario.DoesNotExist:
    print("Error: No existe usuario 'admin' en el sistema")
    print("Por favor, crea un administrador primero")
    sys.exit(1)

# Datos de prueba para BulkUploads
test_uploads = [
    {
        'total_filas': 100,
        'filas_ok': 95,
        'filas_error': 5,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 10,
        'archivo': 'media/bulk_uploads/2025/01/01/carga_test_1.txt',
    },
    {
        'total_filas': 250,
        'filas_ok': 250,
        'filas_error': 0,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 7,
        'archivo': 'media/bulk_uploads/2025/01/02/carga_test_2.txt',
    },
    {
        'total_filas': 150,
        'filas_ok': 120,
        'filas_error': 30,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 5,
        'archivo': 'media/bulk_uploads/2025/01/03/carga_test_3.txt',
    },
    {
        'total_filas': 75,
        'filas_ok': 0,
        'filas_error': 75,
        'estado': 'COMPLETADO',
        'tipo': 'UTF8',
        'dias_atras': 3,
        'archivo': 'media/bulk_uploads/2025/01/04/carga_test_error.txt',
    },
    {
        'total_filas': 200,
        'filas_ok': 0,
        'filas_error': 0,
        'estado': 'PENDIENTE',
        'tipo': 'UTF8',
        'dias_atras': 1,
        'archivo': 'media/bulk_uploads/2025/01/05/carga_pendiente.txt',
    },
]

print("=" * 70)
print("CREAR DATOS DE PRUEBA DE CARGAS MASIVAS")
print("=" * 70)

for i, upload_data in enumerate(test_uploads, 1):
    try:
        # Calcular fecha
        dias_atras = upload_data.pop('dias_atras')
        fecha_creacion = timezone.now() - timedelta(days=dias_atras)
        
        bulk_upload, created = BulkUpload.objects.get_or_create(
            archivo=upload_data['archivo'],
            defaults={
                'usuario': admin_user,
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
            # Si fue creado, actualizar la fecha de finalización
            if bulk_upload.estado == 'COMPLETADO':
                bulk_upload.fecha_inicio = fecha_creacion
                bulk_upload.fecha_fin = fecha_creacion + timedelta(minutes=5)
                bulk_upload.save()
            
            estado_msg = "✓ Creado"
            archivo_name = upload_data['archivo'].split('/')[-1]
            print(f"{i}. {estado_msg}")
            print(f"   Archivo: {archivo_name}")
            print(f"   Estado: {bulk_upload.estado}")
            print(f"   Total filas: {bulk_upload.total_filas} | OK: {bulk_upload.filas_ok} | Error: {bulk_upload.filas_error}")
            print(f"   Éxito: {bulk_upload.porcentaje_exito}%")
            print(f"   Creado: {bulk_upload.creado_en.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
        else:
            print(f"{i}. ✓ Ya existe: {upload_data['archivo']}")
            print()
    
    except Exception as e:
        print(f"ERROR creando registro {i}: {str(e)}")
        print()

# Mostrar resumen
total_cargas = BulkUpload.objects.count()
print("=" * 70)
print(f"RESUMEN: Total de cargas en el sistema: {total_cargas}")
print("=" * 70)

# Mostrar cargas por estado
estados = {}
for carga in BulkUpload.objects.all():
    estado = carga.estado
    estados[estado] = estados.get(estado, 0) + 1

print("\nCargas por estado:")
for estado, cantidad in sorted(estados.items()):
    print(f"  - {estado}: {cantidad}")

print("\n✓ Datos de prueba creados correctamente")
print("\nAhora los analistas deberían ver el historial de cargas en la página de Carga Masiva")
