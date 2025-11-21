#!/usr/bin/env python
"""
Script para crear los datos de prueba (Issuers e Instruments) necesarios para testear la carga masiva.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from parametros.models import Issuer, Instrument

# Crear Issuers
issuers = [
    {'codigo': 'ISSUER001', 'nombre': 'Empresa Financiera Alpha', 'rut': '11111111-1'},
    {'codigo': 'ISSUER002', 'nombre': 'Banco Beta S.A.', 'rut': '22222222-2'},
    {'codigo': 'ISSUER003', 'nombre': 'Corporación Gamma', 'rut': '33333333-3'},
    {'codigo': 'ISSUER004', 'nombre': 'Fondo de Inversión Delta', 'rut': '44444444-4'},
    {'codigo': 'ISSUER005', 'nombre': 'Sociedad Anónima Epsilon', 'rut': '55555555-5'},
]

# Crear Instruments
instruments = [
    {'codigo': 'INST001', 'nombre': 'Bonos Senior A'},
    {'codigo': 'INST002', 'nombre': 'Bonos Subordinados B'},
    {'codigo': 'INST003', 'nombre': 'Notas de Corto Plazo'},
    {'codigo': 'INST004', 'nombre': 'Obligaciones Convertibles'},
]

print("=" * 60)
print("Creando Issuers...")
print("=" * 60)
for issuer_data in issuers:
    issuer, created = Issuer.objects.get_or_create(
        codigo=issuer_data['codigo'],
        defaults={
            'nombre': issuer_data['nombre'],
            'rut': issuer_data['rut']
        }
    )
    status = "✓ Creado" if created else "✓ Ya existe"
    print(f"{status}: {issuer.codigo} - {issuer.nombre}")

print("\n" + "=" * 60)
print("Creando Instruments...")
print("=" * 60)
for inst_data in instruments:
    instrument, created = Instrument.objects.get_or_create(
        codigo=inst_data['codigo'],
        defaults={'nombre': inst_data['nombre']}
    )
    status = "✓ Creado" if created else "✓ Ya existe"
    print(f"{status}: {instrument.codigo} - {instrument.nombre}")

print("\n" + "=" * 60)
print("✓ Datos de prueba creados exitosamente")
print("=" * 60)
