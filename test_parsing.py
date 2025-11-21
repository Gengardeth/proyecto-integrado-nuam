#!/usr/bin/env python
"""
Script de test para verificar que el parsing de archivos funciona correctamente.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nuam.settings')
django.setup()

from calificacionfiscal.utils import parse_utf8_file
from django.core.exceptions import ValidationError

# Testear con el archivo de prueba
test_file = r'c:\Users\chiko\proyecto-integrado-nuam\docs\bulk_upload_examples\test_carga_masiva.txt'

print(f"Intentando parsear: {test_file}")
print(f"Archivo existe: {os.path.exists(test_file)}")

try:
    rows = parse_utf8_file(test_file)
    print(f"\n✓ Parsing exitoso!")
    print(f"Total filas parseadas: {len(rows)}")
    print("\nPrimeras 3 filas:")
    for i, row in enumerate(rows[:3], 1):
        print(f"\n  Fila {row['numero_fila']}:")
        print(f"    {row['datos']}")
except ValidationError as e:
    print(f"\n✗ Error de validación: {e}")
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
