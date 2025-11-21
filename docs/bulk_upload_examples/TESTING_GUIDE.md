# Guía de Testing - Carga Masiva de Calificaciones

Esta guía te ayuda a probar la funcionalidad de carga masiva en el sistema NUAM.

## Archivos de Prueba Disponibles

Se proporcionan varios archivos de ejemplo listos para usar:

### 1. `test_carga_masiva.txt` (Formato TSV - Tabulaciones)
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva.txt`
- **Delimitador**: Tabulaciones (invisible en el editor, pero el formato es correcto)
- **Contenido**: 10 registros válidos de prueba
- **Uso**: Probar el flujo normal de carga exitosa
- **Ventaja**: Compatible con Excel y herramientas de hojas de cálculo

### 2. `test_carga_masiva_pipes.txt` (Formato Pipes)
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva_pipes.txt`
- **Delimitador**: Pipes (|) - visible y fácil de editar
- **Contenido**: Los mismos 10 registros en formato pipes
- **Uso**: Probar ambos delimitadores (tabulaciones y pipes)
- **Ventaja**: Más fácil de leer y editar manualmente

### 3. `test_carga_masiva_mixta.txt` (Formato TSV - Datos Mezclados) ⭐ NUEVO
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva_mixta.txt`
- **Delimitador**: Tabulaciones
- **Contenido**: 15 registros con datos VÁLIDOS e INVÁLIDOS
- **Uso**: Probar validación, errores y manejo de filas mixtas
- **Ventaja**: Prueba completa del sistema de validación
- **Esperado**: Aprox. 10 filas OK, 5 filas Error

### 4. `test_carga_masiva_mixta_pipes.txt` (Formato Pipes - Datos Mezclados) ⭐ NUEVO
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva_mixta_pipes.txt`
- **Delimitador**: Pipes (|)
- **Contenido**: Los mismos 15 registros en formato pipes
- **Uso**: Probar validación con delimitador pipes
- **Ventaja**: Más legible para revisar qué debe fallar

## Datos de Prueba en Archivos Base

Los archivos `test_carga_masiva.txt` y `test_carga_masiva_pipes.txt` contienen 10 registros válidos:

| # | Issuer | Instrumento | Rating | Status | Risk Level | Descripción |
|---|--------|-------------|--------|--------|-----------|------------|
| 1 | ISSUER001 | INST001 | AAA | VIGENTE | BAJO | ✓ Caso base exitoso |
| 2 | ISSUER001 | INST002 | AA | VIGENTE | BAJO | ✓ Sin fecha vencimiento |
| 3 | ISSUER002 | INST001 | BBB | VIGENTE | MODERADO | ✓ Grado inversión |
| 4 | ISSUER002 | INST003 | BB | VIGENTE | ALTO | ✓ Especulativo |
| 5 | ISSUER003 | INST002 | B | VENCIDO | MUY_ALTO | ✓ Estado vencido |
| 6 | ISSUER003 | INST004 | CCC | SUSPENDIDO | MUY_ALTO | ✓ Estado suspendido |
| 7 | ISSUER004 | INST001 | A | VIGENTE | BAJO | ✓ Grado inversión |
| 8 | ISSUER004 | INST003 | AA | VIGENTE | BAJO | ✓ Empresa calidad |
| 9 | ISSUER005 | INST002 | D | CANCELADO | MUY_ALTO | ✓ Estado cancelado |
| 10 | ISSUER001 | INST004 | AAA | VIGENTE | MUY_BAJO | ✓ Nuevo instrumento |

## Datos de Prueba en Archivo Mixto

El archivo `test_carga_masiva_mixta.txt` contiene 15 registros para validar manejo de errores:

| # | Issuer | Instrumento | Rating | Motivo | Esperado |
|---|--------|-------------|--------|--------|----------|
| 1 | ISSUER001 | INST001 | AAA | Válido - Empresa/Instrumento existentes | ✓ OK |
| 2 | ISSUER002 | INST002 | AA | Válido - Sin fecha vencimiento | ✓ OK |
| 3 | ISSUER_INEXISTENTE | INST001 | BBB | Issuer no existe en BD | ✗ ERROR |
| 4 | ISSUER001 | INST_INEXISTENTE | BB | Instrumento no existe en BD | ✗ ERROR |
| 5 | ISSUER003 | INST003 | B | Válido - Status VENCIDO | ✓ OK |
| 6 | ISSUER001 | INST001 | ZZZ | Rating inválido (no es AAA/AA/A/etc) | ✗ ERROR |
| 7 | ISSUER002 | INST002 | A | Fecha inválida en valid_from (INVALID_DATE) | ✗ ERROR |
| 8 | ISSUER004 | INST004 | AA | valid_to anterior a valid_from | ✗ ERROR |
| 9 | ISSUER001 | INST002 | AAA | Válido - Empresa Financiera | ✓ OK |
| 10 | ISSUER003 | INST003 | CCC | Válido - Status SUSPENDIDO | ✓ OK |
| 11 | ISSUER002 | INST001 | BBB | Válido - Banco Beta | ✓ OK |
| 12 | ISSUER004 | INST004 | AA | Issuer004 no existe | ✗ ERROR |
| 13 | ISSUER001 | INST001 | A | Válido - Última del año | ✓ OK |
| 14 | ISSUER001 | INST003 | AA | Válido - Instrumento 3 | ✓ OK |
| 15 | ISSUER002 | INST002 | BBB | Válido - Bonos subordinados | ✓ OK |

**Resumen Esperado**: 10 OK, 5 ERROR (66.7% éxito)

## Cómo Hacer Testing

### Paso 1: Preparar los Datos
Asegúrate de que existan los siguientes registros en la BD:

**Issuers:**
- ISSUER001, ISSUER002, ISSUER003, ISSUER004, ISSUER005

**Instruments:**
- INST001, INST002, INST003, INST004

Si no existen, utiliza el script incluido:
```bash
python create_test_data.py
```

O manualmente en Django shell:
```bash
python manage.py shell
```

```python
from parametros.models import Issuer, Instrument

# Crear Issuers
for i in range(1, 6):
    Issuer.objects.get_or_create(
        codigo=f'ISSUER{i:03d}',
        defaults={'nombre': f'Empresa {i}', 'rut': f'{10000000 + i}-K'}
    )

# Crear Instruments
instruments = ['INST001', 'INST002', 'INST003', 'INST004']
for code in instruments:
    Instrument.objects.get_or_create(
        codigo=code,
        defaults={'nombre': f'Instrumento {code}'}
    )
```

### Paso 2: Acceder a Carga Masiva
1. Inicia sesión como **ADMIN**
2. Ve a **Carga Masiva** en el menú lateral
3. Haz clic en el área de upload o arrastra un archivo

### Paso 3: Subir Archivo de Prueba
1. Descarga uno de los archivos de prueba:
   - **Para prueba simple**: `test_carga_masiva.txt`
   - **Para prueba de validación**: `test_carga_masiva_mixta.txt` (recomendado)
2. Sube el archivo en la sección de carga masiva
3. Verifica que aparezca el preview con el **Total de filas correcto**

### Paso 4: Procesar la Carga
1. En el preview "Carga Registrada", haz clic en **▶️ Procesar Carga**
2. Espera a que se procese
3. Se actualizará automáticamente con los resultados

### Paso 5: Revisar Resultados

**Para archivo simple (test_carga_masiva.txt)**:
```
Total filas: 10
Filas OK: 10
Filas Error: 0
Éxito %: 100%
```

**Para archivo mixto (test_carga_masiva_mixta.txt)**:
```
Total filas: 15
Filas OK: 10
Filas Error: 5
Éxito %: 66.67%
```

### Paso 6: Ver Detalle de Errores
1. En la tabla de cargas, haz clic en el ícono de **detalles** (👁️)
2. Se mostrarán todas las filas con sus estados
3. Las filas con ERROR mostrarán el mensaje de validación

### Paso 7: Verificar en Calificaciones
1. Ve a **Calificaciones**
2. Busca por issuer o instrumento para ver los registros creados
3. Verifica que solo las filas válidas se importaron

## Casos de Prueba Adicionales

### Prueba 1: Validar Rechazo de Formato Incorrecto
**Objetivo**: Asegurarse de que archivos .csv o .xlsx sean rechazados

**Pasos**:
1. Intenta subir un archivo .csv o .xlsx
2. Deberías recibir error: "Solo se aceptan archivos UTF-8 (.txt, .tsv)"

### Prueba 2: Validar Campos Requeridos
**Objetivo**: Comprobar que faltan campos requeridos

**Crea un archivo con una línea sin `rating`**:
```
issuer_codigo	instrument_codigo	rating	valid_from
ISSUER001	INST001		2025-01-01
```

**Resultado esperado**: Error en ese ítem de carga

### Prueba 3: Validar Fechas
**Objetivo**: Probar validación de fechas

**Crea un archivo con fecha posterior a vencimiento**:
```
issuer_codigo	instrument_codigo	rating	valid_from	valid_to
ISSUER001	INST001	AAA	2025-12-31	2025-01-01
```

**Resultado esperado**: Error (valid_to debe ser posterior a valid_from)

### Prueba 4: Validar Códigos Inexistentes
**Objetivo**: Comprobar que rechaza códigos que no existen

**Crea un archivo con código inexistente**:
```
issuer_codigo	instrument_codigo	rating	valid_from
ISSUER_FAKE	INST001	AAA	2025-01-01
```

**Resultado esperado**: Error (Issuer no existe)

### Prueba 5: Roles Restringidos
**Objetivo**: Verificar que ANALISTA/AUDITOR no pueden subir

**Pasos**:
1. Inicia sesión como ANALISTA
2. Ve a **Carga Masiva**
3. Deberías ver mensaje: "ℹ️ Solo los administradores pueden subir archivos"
4. No deberías ver el área de upload

## Logs y Debugging

Para ver detalles de procesamiento:

```bash
# Ver los últimos registros de auditoría
python manage.py shell
```

```python
from cuentas.audit_models import AuditLog

# Ver últimos 20 eventos de carga masiva
logs = AuditLog.objects.filter(accion__in=['UPLOAD', 'PROCESAMIENTO']).order_by('-creado_en')[:20]
for log in logs:
    print(f"{log.creado_en} | {log.usuario.username} | {log.accion} | {log.descripcion}")
```

## Troubleshooting

### ❌ "Solo se aceptan archivos UTF-8"
**Causa**: El archivo no está en UTF-8

**Solución**:
1. Abre el archivo con VS Code
2. En la esquina inferior derecha, haz clic en "UTF-8"
3. Selecciona "Save with Encoding" → "UTF-8"

### ❌ "Issuer/Instrument no existe"
**Causa**: Los códigos en el archivo no coinciden con los creados

**Solución**: Verifica que los códigos sean exactamente iguales (mayúsculas/minúsculas importan)

### ❌ "No se puede procesar"
**Causa**: La carga no tiene estado PENDIENTE

**Solución**: Recarga la página y verifica el estado en el historial

## Referencias

- **Documentación de formato**: `docs/UPLOAD_FORMAT.md`
- **Plantilla base**: `docs/bulk_upload_examples/plantilla_tax_ratings.txt`
- **Código de carga masiva**: `calificacionfiscal/views.py` → `BulkUploadViewSet`
- **Utilidades de parsing**: `calificacionfiscal/utils.py` → `parse_utf8_file()`

---

**Última actualización**: 21 de noviembre de 2025
**Versión del sistema**: v1.0
