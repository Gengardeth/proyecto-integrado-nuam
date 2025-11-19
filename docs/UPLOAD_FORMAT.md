# Formato de Carga Masiva de Calificaciones (TaxRating)

Este documento describe el formato esperado para los archivos CSV/XLSX utilizados en la carga masiva.

Campos esperados (encabezados exactos):
- issuer_codigo: Código del emisor (Issuer.codigo) existente.
- instrument_codigo: Código del instrumento (Instrument.codigo) existente.
- rating: Uno de [AAA, AA, A, BBB, BB, B, CCC, CC, C, D].
- valid_from: Fecha de inicio de vigencia, formato YYYY-MM-DD (requerido).
- valid_to: Fecha de fin de vigencia, formato YYYY-MM-DD (opcional; puede ir vacío).
- status: Uno de [VIGENTE, VENCIDO, SUSPENDIDO, CANCELADO] (opcional; por defecto VIGENTE).
- risk_level: Uno de [MUY_BAJO, BAJO, MODERADO, ALTO, MUY_ALTO] (opcional; por defecto MODERADO).
- comments: Texto libre opcional.

Notas:
- Si `valid_to` se especifica, debe ser posterior a `valid_from`.
- Se valida que `issuer_codigo` e `instrument_codigo` existan en parámetros.
- No se permiten valores fuera de los catálogos dados para `rating`, `status` y `risk_level`.
- La unicidad es por (issuer, instrument, valid_from). Si ya existe un registro con esa clave, se registrará como error en el item de la carga.

Ejemplos:
- Plantilla base: `docs/bulk_upload_examples/plantilla_tax_ratings.csv`
- Archivo de ejemplo: `docs/bulk_upload_examples/ejemplo_tax_ratings.csv`

Cómo probar (UI):
1) Ir a la sección "Carga Masiva", subir un CSV/XLSX con los encabezados descritos.
2) Una vez creada la carga (estado PENDIENTE), pulsar "Procesar".
3) Revisar el resumen: totales, porcentaje de éxito y listado de filas con error.

Cómo probar (management command):
- Procesar por ID específico: `python manage.py process_uploads --id 123`
- Procesar todas las pendientes: `python manage.py process_uploads --all`

Sugerencia para Excel:
- Puede armar el archivo en Excel y guardarlo como .xlsx o exportarlo a CSV con los mismos encabezados.
