# Guía de Testing - Carga Masiva de Calificaciones

Esta guía te ayuda a probar la funcionalidad de carga masiva en el sistema NUAM.

## Archivos de Prueba Disponibles

Se proporcionan dos archivos de ejemplo listos para usar:

### 1. `test_carga_masiva.txt` (Formato TSV - Tabulaciones)
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva.txt`
- **Delimitador**: Tabulaciones (invisible en el editor, pero el formato es correcto)
- **Contenido**: 10 registros de prueba con diferentes combinaciones de datos
- **Ventaja**: Compatible con Excel y herramientas de hojas de cálculo

### 2. `test_carga_masiva_pipes.txt` (Formato Pipes)
- **Ubicación**: `docs/bulk_upload_examples/test_carga_masiva_pipes.txt`
- **Delimitador**: Pipes (|) - visible y fácil de editar
- **Contenido**: Los mismos 10 registros en formato pipes
- **Ventaja**: Más fácil de leer y editar manualmente

## Datos de Prueba Incluidos

Los archivos contienen 10 registros para probar diferentes escenarios:

| Issuer | Instrumento | Rating | Status | Risk Level | Caso de Uso |
|--------|-------------|--------|--------|-----------|------------|
| ISSUER001 | INST001 | AAA | VIGENTE | BAJO | ✓ Caso base exitoso |
| ISSUER001 | INST002 | AA | VIGENTE | BAJO | ✓ Sin fecha vencimiento |
| ISSUER002 | INST001 | BBB | VIGENTE | MODERADO | ✓ Grado inversión |
| ISSUER002 | INST003 | BB | VIGENTE | ALTO | ✓ Especulativo |
| ISSUER003 | INST002 | B | VENCIDO | MUY_ALTO | ✓ Estado vencido |
| ISSUER003 | INST004 | CCC | SUSPENDIDO | MUY_ALTO | ✓ Estado suspendido |
| ISSUER004 | INST001 | A | VIGENTE | BAJO | ✓ Grado inversión |
| ISSUER004 | INST003 | AA | VIGENTE | BAJO | ✓ Empresa calidad |
| ISSUER005 | INST002 | D | CANCELADO | MUY_ALTO | ✓ Estado cancelado |
| ISSUER001 | INST004 | AAA | VIGENTE | MUY_BAJO | ✓ Nuevo instrumento |

## Cómo Hacer Testing

### Paso 1: Preparar los Datos
Asegúrate de que existan los siguientes registros en la BD:

**Issuers:**
- ISSUER001, ISSUER002, ISSUER003, ISSUER004, ISSUER005

**Instruments:**
- INST001, INST002, INST003, INST004

Si no existen, crea los siguientes registros:
1. Ve a **Emisores** → **+ Nuevo Issuer**
2. Ve a **Instrumentos** → **+ Nuevo Instrumento**

O utiliza el admin de Django:
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
        defaults={'nombre': f'Instrumento {code}', 'tipo': 'BONO'}
    )
```

### Paso 2: Acceder a Carga Masiva
1. Inicia sesión como **ADMIN**
2. Ve a **Carga Masiva** en el menú lateral
3. Haz clic en el área de upload o arrastra un archivo

### Paso 3: Subir Archivo de Prueba
1. Descarga uno de los archivos de prueba:
   - Recomendado: `test_carga_masiva.txt` (TSV)
   - Alternativa: `test_carga_masiva_pipes.txt` (Pipes)
2. Sube el archivo en la sección de carga masiva
3. Se debería crear una carga con estado **PENDIENTE**

### Paso 4: Procesar la Carga
1. En el historial de cargas, busca tu carga (estado PENDIENTE)
2. Haz clic en el botón **Procesar**
3. Espera a que se procese (debería ser rápido con 10 registros)

### Paso 5: Revisar Resultados
Deberías ver un resumen similar a este:
```
Total de ítems: 10
Exitosos: 10 (100%)
Con error: 0 (0%)
```

### Paso 6: Verificar en Calificaciones
1. Ve a **Calificaciones**
2. Busca por issuer o instrumento para ver los registros creados
3. Verifica que los datos se importaron correctamente

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
