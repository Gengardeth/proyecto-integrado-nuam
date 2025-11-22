#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Limpia las cargas masivas previas y crea un archivo de prueba limpio con 500 registros.
250 OK + 250 ERROR con diferentes tipos de errores.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from parametros.models import Issuer, Instrument
from calificacionfiscal.models import BulkUpload, BulkUploadItem, TaxRating

# Obtener los issuers e instruments reales de la BD
issuers = list(Issuer.objects.all().values_list('codigo', flat=True))
instruments = list(Instrument.objects.all().values_list('codigo', flat=True))

print(f"Issuers ({len(issuers)}): {issuers}")
print(f"Instruments ({len(instruments)}): {instruments}")

if not issuers or not instruments:
    print("ERROR: No hay issuers o instruments")
    exit(1)

# Limpiar TaxRatings previos para evitar duplicados
print("\nLimpiando TaxRatings previos...")
TaxRating.objects.all().delete()
print(f"✓ TaxRatings eliminados: {TaxRating.objects.count()} restantes")

# Limpiar BulkUploads previos (opcional)
print("Limpiando BulkUploads previos...")
BulkUpload.objects.all().delete()
BulkUploadItem.objects.all().delete()
print("✓ BulkUploads eliminados")

# Datos válidos
RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']
STATUSES = ['VIGENTE', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO']
RISK_LEVELS = ['MUY_BAJO', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO']

output_path = r'c:\Users\chiko\proyecto-integrado-nuam\docs\bulk_upload_examples\test_carga_masiva_500_mixta.txt'

print(f"\nGenerando archivo de prueba: {output_path}")

with open(output_path, 'w', encoding='utf-8') as f:
    # Header
    header = "issuer_codigo\tinstrument_codigo\trating\tvalid_from\tvalid_to\tstatus\trisk_level\tcomments"
    f.write(header + "\n")
    
    # 250 registros válidos - Usando diferentes combinaciones de issuers/instruments existentes
    print("  Generando 250 registros válidos...")
    for i in range(1, 251):
        # Variar issuer/instrument para evitar duplicados por fecha
        issuer_idx = (i - 1) % len(issuers)
        instrument_idx = (i - 1) % len(instruments)
        issuer_codigo = issuers[issuer_idx]
        instrument_codigo = instruments[instrument_idx]
        
        rating = RATINGS[(i - 1) % len(RATINGS)]
        status = STATUSES[(i - 1) % len(STATUSES)]
        risk_level = RISK_LEVELS[(i - 1) % len(RISK_LEVELS)]
        
        # Variar las fechas para evitar duplicados por (issuer, instrument, valid_from)
        month = (i % 12) + 1
        day = ((i // 12) % 28) + 1
        year = 2025 if i < 200 else 2026
        valid_from = f"{year}-{month:02d}-{day:02d}"
        
        # valid_to varia
        if i % 3 == 0:
            valid_to = f"{year+1}-{month:02d}-{day:02d}"
        else:
            valid_to = ""
        
        line = f"{issuer_codigo}\t{instrument_codigo}\t{rating}\t{valid_from}\t{valid_to}\t{status}\t{risk_level}\tVálido #{i}"
        f.write(line + "\n")
    
    # 250 registros con errores
    print("  Generando 250 registros con errores...")
    
    # 50 con issuer inválido
    for i in range(251, 301):
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"NONEXISTENT_ISSUER_{i}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Issuer no existe\n")
    
    # 50 con instrumento inválido
    for i in range(301, 351):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        f.write(f"{issuer_codigo}\tNONEXISTENT_INST_{i}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Instrument no existe\n")
    
    # 50 con rating inválido
    for i in range(351, 401):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"{issuer_codigo}\t{instrument_codigo}\tINVALID_RATING\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Rating inválido\n")
    
    # 50 con fechas inválidas
    for i in range(401, 451):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        if i % 2 == 0:
            # Fecha imposible
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-02-30\t2026-03-31\tVIGENTE\tBAJO\tError: Fecha imposible 02-30\n")
        else:
            # Fecha fin anterior a inicio
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2026-12-31\t2025-01-01\tVIGENTE\tBAJO\tError: valid_to < valid_from\n")
    
    # 50 con status inválido
    for i in range(451, 501):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tINVALID_STATUS\tBAJO\tError: Status inválido\n")

print(f"✓ Archivo generado")

# Verificar
with open(output_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(f"\nVerificación:")
    print(f"  Total líneas: {len(lines)}")
    print(f"  Datos (sin header): {len(lines)-1}")
    print(f"  Primeras 3 líneas:")
    for i in range(min(3, len(lines))):
        preview = lines[i][:80] if len(lines[i]) > 80 else lines[i]
        print(f"    {preview.strip()}")
    print(f"  Últimas 3 líneas:")
    for i in range(max(0, len(lines)-3), len(lines)):
        preview = lines[i][:80] if len(lines[i]) > 80 else lines[i]
        print(f"    {preview.strip()}")

print(f"\n✓ Completado - Archivo listo para carga")
print(f"  Ubicación: {output_path}")
