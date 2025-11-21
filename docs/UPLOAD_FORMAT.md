# Formato de Carga Masiva de Calificaciones (TaxRating)

Este documento describe el formato esperado para los archivos de texto UTF-8 utilizados en la carga masiva.

## Formato de Archivo

Los archivos deben ser:
- **Codificación**: UTF-8
- **Formato**: Texto plano (.txt, .tsv, o sin extensión)
- **Delimitador**: Pipes (|) o tabulaciones (\t)
- **Primera línea**: Headers con los nombres de los campos
- **Filas subsecuentes**: Datos separados por el mismo delimitador

## Campos Esperados

Los headers exactos (no sensible a espacios):
- `issuer_codigo`: Código del emisor (Issuer.codigo) existente.
- `instrument_codigo`: Código del instrumento (Instrument.codigo) existente.
- `rating`: Uno de [AAA, AA, A, BBB, BB, B, CCC, CC, C, D].
- `valid_from`: Fecha de inicio de vigencia, formato YYYY-MM-DD (requerido).
- `valid_to`: Fecha de fin de vigencia, formato YYYY-MM-DD (opcional; puede ir vacío).
- `status`: Uno de [VIGENTE, VENCIDO, SUSPENDIDO, CANCELADO] (opcional; por defecto VIGENTE).
- `risk_level`: Uno de [MUY_BAJO, BAJO, MODERADO, ALTO, MUY_ALTO] (opcional; por defecto MODERADO).
- `comments`: Texto libre opcional.

## Validaciones

- Si `valid_to` se especifica, debe ser posterior a `valid_from`.
- Se valida que `issuer_codigo` e `instrument_codigo` existan en parámetros.
- No se permiten valores fuera de los catálogos dados para `rating`, `status` y `risk_level`.
- La unicidad es por (issuer, instrument, valid_from). Si ya existe un registro con esa clave, se registrará como error en el item de la carga.

## Ejemplos

### Formato con Pipes (|)

```
issuer_codigo|instrument_codigo|rating|valid_from|valid_to|status|risk_level|comments
ISSUER001|INST001|AAA|2025-01-01|2025-12-31|VIGENTE|BAJO|Calificación positiva
ISSUER002|INST002|BB|2025-01-15||VIGENTE|ALTO|Sin fecha de vencimiento
```

### Formato con Tabulaciones (\t)

```
issuer_codigo	instrument_codigo	rating	valid_from	valid_to	status	risk_level	comments
ISSUER001	INST001	AAA	2025-01-01	2025-12-31	VIGENTE	BAJO	Calificación positiva
ISSUER002	INST002	BB	2025-01-15			VIGENTE	ALTO	Sin fecha de vencimiento
```

## Cómo Crear el Archivo

### Opción 1: Con un Editor de Texto (Recomendado)
1. Abre Notepad++, VS Code o cualquier editor de texto
2. Copia el formato anterior (pipes o tabulaciones)
3. Añade tus datos
4. Guarda como UTF-8 (Archivo → Codificación → UTF-8)
5. Usa extensión `.txt` o `.tsv`

### Opción 2: Desde Excel
1. Crea tu hoja de cálculo en Excel
2. Selecciona todo (Ctrl+A)
3. Copia (Ctrl+C)
4. Abre Notepad++
5. Pega (Ctrl+V) - automáticamente se separará por tabulaciones
6. Guarda como UTF-8 con extensión `.txt`

## Cómo Probar (UI)

1. Ir a la sección "Carga Masiva"
2. Subir el archivo UTF-8 (extensión .txt o .tsv)
3. Una vez creada la carga (estado PENDIENTE), pulsar "Procesar"
4. Revisar el resumen: totales, porcentaje de éxito y listado de filas con error

## Cómo Probar (management command)

```bash
# Procesar por ID específico
python manage.py process_uploads --id 123

# Procesar todas las pendientes
python manage.py process_uploads --all
```

## Notas Importantes

- ❌ **NO** se aceptan archivos .xlsx, .xls o .csv
- ✅ Solo archivos de texto UTF-8
- ✅ Compatible con pipes (|) o tabulaciones como delimitadores
- ⚠️ Asegúrate de guardar con codificación UTF-8
- ⚠️ Los espacios al inicio/final de los valores se eliminarán automáticamente

## Archivos de Ejemplo

- Plantilla base: `docs/bulk_upload_examples/plantilla_tax_ratings.txt` (actualizada)
- Archivo de ejemplo: `docs/bulk_upload_examples/ejemplo_tax_ratings.txt` (actualizado)
