#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Genera un archivo de prueba con 500 registros (250 OK, 250 con errores)"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from parametros.models import Issuer, Instrument

# Obtener los issuers e instruments reales de la BD
issuers = list(Issuer.objects.all().values_list('codigo', flat=True))
instruments = list(Instrument.objects.all().values_list('codigo', flat=True))

print(f"Issuers disponibles ({len(issuers)}): {issuers}")
print(f"Instruments disponibles ({len(instruments)}): {instruments}")

if not issuers or not instruments:
    print("ERROR: No hay issuers o instruments en la BD")
    exit(1)

# Datos válidos para los registros correctos
RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']
STATUSES = ['VIGENTE', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO']
RISK_LEVELS = ['MUY_BAJO', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO']

# Crear archivo
output_path = r'c:\Users\chiko\proyecto-integrado-nuam\docs\bulk_upload_examples\test_carga_masiva_500_mixta.txt'

with open(output_path, 'w', encoding='utf-8') as f:
    # Header
    header = "issuer_codigo\tinstrument_codigo\trating\tvalid_from\tvalid_to\tstatus\trisk_level\tcomments"
    f.write(header + "\n")
    
    # 250 registros válidos
    print("\nGenerando 250 registros válidos...")
    for i in range(1, 251):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        rating = RATINGS[(i - 1) % len(RATINGS)]
        status = STATUSES[(i - 1) % len(STATUSES)]
        risk_level = RISK_LEVELS[(i - 1) % len(RISK_LEVELS)]
        valid_from = f"2025-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}"
        valid_to = f"2026-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}" if i % 2 == 0 else ""
        
        line = f"{issuer_codigo}\t{instrument_codigo}\t{rating}\t{valid_from}\t{valid_to}\t{status}\t{risk_level}\tRegistro válido #{i}"
        f.write(line + "\n")
    
    # 250 registros con errores
    print("Generando 250 registros con errores...")
    
    # 50 con issuer inválido/faltante
    for i in range(251, 301):
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"INVALID_ISSUER_{i}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Issuer no existe\n")
    
    # 50 con instrumento inválido/faltante
    for i in range(301, 351):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        f.write(f"{issuer_codigo}\tINVALID_INST_{i}\tAAA\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Instrument no existe\n")
    
    # 50 con rating inválido
    for i in range(351, 401):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"{issuer_codigo}\t{instrument_codigo}\tXXXX\t2025-01-01\t2026-01-01\tVIGENTE\tBAJO\tError: Rating inválido\n")
    
    # 50 con dates inválidas
    for i in range(401, 451):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        if i % 2 == 0:
            # Fecha imposible
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-02-30\t2026-02-28\tVIGENTE\tBAJO\tError: Fecha imposible\n")
        else:
            # Fecha fin anterior a inicio
            f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2026-01-01\t2025-01-01\tVIGENTE\tBAJO\tError: valid_to < valid_from\n")
    
    # 50 con status inválido
    for i in range(451, 501):
        issuer_codigo = issuers[(i - 1) % len(issuers)]
        instrument_codigo = instruments[(i - 1) % len(instruments)]
        f.write(f"{issuer_codigo}\t{instrument_codigo}\tAAA\t2025-01-01\t2026-01-01\tINVALID_STATUS\tBAJO\tError: Status inválido\n")

print(f"✓ Archivo generado: {output_path}")

# Verificar
with open(output_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(f"Total de líneas: {len(lines)} (1 header + {len(lines)-1} datos)")
    print(f"Primeras 3 líneas:")
    for line in lines[:3]:
        print(f"  {repr(line[:80])}")
    print(f"Últimas 3 líneas:")
    for line in lines[-3:]:
        print(f"  {repr(line[:80])}")
