#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Genera un segundo archivo de prueba con 100 registros (50 OK, 50 ERROR).
Para variedad de pruebas.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from parametros.models import Issuer, Instrument

# Obtener los issuers e instruments reales de la BD
issuers = list(Issuer.objects.all().values_list('codigo', flat=True))
instruments = list(Instrument.objects.all().values_list('codigo', flat=True))

print(f"Issuers ({len(issuers)}): {issuers}")
print(f"Instruments ({len(instruments)}): {instruments}")

if not issuers or not instruments:
    print("ERROR: No hay issuers o instruments")
    exit(1)

# Datos válidos
RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']
STATUSES = ['VIGENTE', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO']
RISK_LEVELS = ['MUY_BAJO', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO']

output_path = r'c:\Users\chiko\proyecto-integrado-nuam\docs\bulk_upload_examples\test_carga_masiva_100_mixta.txt'

print(f"\nGenerando archivo de prueba: {output_path}")

with open(output_path, 'w', encoding='utf-8') as f:
    # Header
    header = "issuer_codigo\tinstrument_codigo\trating\tvalid_from\tvalid_to\tstatus\trisk_level\tcomments"
    f.write(header + "\n")
    
    # 50 registros válidos
    print("  Generando 50 registros válidos...")
    for i in range(1, 51):
        issuer_idx = (i - 1) % len(issuers)
        instrument_idx = (i - 1) % len(instruments)
        issuer_codigo = issuers[issuer_idx]
        instrument_codigo = instruments[instrument_idx]
        
        rating = RATINGS[(i - 1) % len(RATINGS)]
        status = STATUSES[(i - 1) % len(STATUSES)]
        risk_level = RISK_LEVELS[(i - 1) % len(RISK_LEVELS)]
        
        month = (i % 12) + 1
        day = ((i // 12) % 28) + 1
        year = 2025 if i < 30 else 2026
        valid_from = f"{year}-{month:02d}-{day:02d}"
        
        if i % 2 == 0:
            valid_to = f"{year+1}-{month:02d}-{day:02d}"
        else:
            valid_to = ""
        
        line = f"{issuer_codigo}\t{instrument_codigo}\t{rating}\t{valid_from}\t{valid_to}\t{status}\t{risk_level}\tVálido #{i}"
        f.write(line + "\n")
    
    # 50 registros con errores (diferentes tipos)
    print("  Generando 50 registros con errores...")
    
    # 10 con issuer inválido
    for i in range(51, 61):
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"ISSUER_FAKE_{i}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Issuer no existe\n")
    
    # 10 con instrumento inválido
    for i in range(61, 71):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        f.write(f"{issuer_codigo}\tINST_FAKE_{i}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Instrument no existe\n")
    
    # 10 con rating inválido
    for i in range(71, 81):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"{issuer_codigo}\t{instrument_codigo}\tZZZ\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Rating no válido\n")
    
    # 10 con fechas inválidas
    for i in range(81, 91):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        if i % 2 == 0:
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-13-01\t2026-01-01\tVIGENTE\tBAJO\tError: Mes inválido 13\n")
        else:
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2026-01-01\t2025-12-31\tVIGENTE\tBAJO\tError: valid_to < valid_from\n")
    
    # 10 con status/risk inválido
    for i in range(91, 101):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        if i % 2 == 0:
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tBAD_STATUS\tBAJO\tError: Status inválido\n")
        else:
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAD_RISK\tError: Risk level inválido\n")

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
