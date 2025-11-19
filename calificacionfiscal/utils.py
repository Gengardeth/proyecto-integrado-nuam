"""
Utilidades para procesar cargas masivas de archivos CSV/XLSX.
"""
import csv
import openpyxl
from datetime import datetime
from django.core.exceptions import ValidationError
from parametros.models import Issuer, Instrument


def parse_csv_file(file_path):
    """
    Parsea un archivo CSV y retorna las filas.
    
    Args:
        file_path: Ruta al archivo CSV
        
    Returns:
        list: Lista de diccionarios con los datos de cada fila
    """
    rows = []
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for idx, row in enumerate(reader, start=2):  # Fila 1 es el header
                rows.append({'numero_fila': idx, 'datos': row})
    except Exception as e:
        raise ValidationError(f"Error al leer archivo CSV: {str(e)}")
    
    return rows


def parse_xlsx_file(file_path):
    """
    Parsea un archivo XLSX y retorna las filas.
    
    Args:
        file_path: Ruta al archivo XLSX
        
    Returns:
        list: Lista de diccionarios con los datos de cada fila
    """
    rows = []
    try:
        workbook = openpyxl.load_workbook(file_path, read_only=True)
        sheet = workbook.active
        
        # Obtener headers de la primera fila
        headers = [cell.value for cell in sheet[1]]
        
        # Procesar filas
        for idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            row_data = dict(zip(headers, row))
            rows.append({'numero_fila': idx, 'datos': row_data})
            
        workbook.close()
    except Exception as e:
        raise ValidationError(f"Error al leer archivo XLSX: {str(e)}")
    
    return rows


def validate_tax_rating_row(row_data):
    """
    Valida que una fila tenga los datos necesarios para crear un TaxRating.
    
    Args:
        row_data: Diccionario con los datos de la fila
        
    Returns:
        tuple: (es_valido: bool, errores: list)
    """
    errores = []
    
    # Campos requeridos
    required_fields = ['issuer_codigo', 'instrument_codigo', 'rating', 'valid_from']
    for field in required_fields:
        if not row_data.get(field):
            errores.append(f"Campo requerido '{field}' faltante o vacío")
    
    if errores:
        return False, errores
    
    # Validar que exista el Issuer
    try:
        issuer = Issuer.objects.get(codigo=row_data['issuer_codigo'])
    except Issuer.DoesNotExist:
        errores.append(f"Issuer con código '{row_data['issuer_codigo']}' no existe")
    
    # Validar que exista el Instrument
    try:
        instrument = Instrument.objects.get(codigo=row_data['instrument_codigo'])
    except Instrument.DoesNotExist:
        errores.append(f"Instrument con código '{row_data['instrument_codigo']}' no existe")
    
    # Validar rating
    valid_ratings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D']
    if row_data['rating'] not in valid_ratings:
        errores.append(f"Rating '{row_data['rating']}' no es válido. Opciones: {', '.join(valid_ratings)}")
    
    # Validar formato de fechas (valid_from requerido, valid_to opcional)
    try:
        datetime.strptime(str(row_data['valid_from']), '%Y-%m-%d')
    except ValueError:
        errores.append("Formato de 'valid_from' inválido. Use YYYY-MM-DD")

    if row_data.get('valid_to'):
        try:
            # Permitir vacío como no definido
            if str(row_data['valid_to']).strip():
                valid_from_dt = datetime.strptime(str(row_data['valid_from']), '%Y-%m-%d')
                valid_to_dt = datetime.strptime(str(row_data['valid_to']), '%Y-%m-%d')
                if valid_to_dt <= valid_from_dt:
                    errores.append("'valid_to' debe ser posterior a 'valid_from'")
        except ValueError:
            errores.append("Formato de 'valid_to' inválido. Use YYYY-MM-DD")

    # Validar status (opcional)
    if row_data.get('status'):
        valid_status = ['VIGENTE', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO']
        if row_data['status'] not in valid_status:
            errores.append(f"Status '{row_data['status']}' no es válido. Opciones: {', '.join(valid_status)}")

    # Validar risk_level (opcional)
    if row_data.get('risk_level'):
        valid_levels = ['MUY_BAJO', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO']
        if row_data['risk_level'] not in valid_levels:
            errores.append(f"Risk level '{row_data['risk_level']}' no es válido. Opciones: {', '.join(valid_levels)}")
    
    return len(errores) == 0, errores


def process_bulk_upload_file(bulk_upload):
    """
    Procesa un archivo de carga masiva y crea los items correspondientes.
    
    Args:
        bulk_upload: Instancia de BulkUpload
        
    Returns:
        dict: Resumen del procesamiento
    """
    from .models import BulkUploadItem, TaxRating
    from parametros.models import Issuer, Instrument
    
    file_path = bulk_upload.archivo.path
    
    # Parsear archivo según tipo
    if bulk_upload.tipo == 'CSV':
        rows = parse_csv_file(file_path)
    elif bulk_upload.tipo == 'XLSX':
        rows = parse_xlsx_file(file_path)
    else:
        raise ValidationError(f"Tipo de archivo no soportado: {bulk_upload.tipo}")
    
    total_filas = len(rows)
    filas_ok = 0
    filas_error = 0
    resumen_errores = {}
    
    # Procesar cada fila
    for row in rows:
        numero_fila = row['numero_fila']
        row_data = row['datos']
        
        # Validar fila
        es_valido, errores = validate_tax_rating_row(row_data)
        
        if es_valido:
            try:
                # Crear TaxRating
                issuer = Issuer.objects.get(codigo=row_data['issuer_codigo'])
                instrument = Instrument.objects.get(codigo=row_data['instrument_codigo'])
                
                # Normalizar opcionales
                valid_to_value = row_data.get('valid_to')
                if valid_to_value is not None and str(valid_to_value).strip() == '':
                    valid_to_value = None

                status_value = row_data.get('status') or 'VIGENTE'
                risk_level_value = row_data.get('risk_level') or 'MODERADO'
                comments_value = row_data.get('comments') or row_data.get('notas', '') or ''

                TaxRating.objects.create(
                    issuer=issuer,
                    instrument=instrument,
                    rating=row_data['rating'],
                    valid_from=row_data['valid_from'],
                    valid_to=valid_to_value,
                    status=status_value,
                    risk_level=risk_level_value,
                    comments=comments_value,
                    analista=bulk_upload.usuario,
                )
                
                # Crear item exitoso
                BulkUploadItem.objects.create(
                    bulk_upload=bulk_upload,
                    numero_fila=numero_fila,
                    estado='OK',
                    datos=row_data
                )
                filas_ok += 1
                
            except Exception as e:
                # Error al crear
                BulkUploadItem.objects.create(
                    bulk_upload=bulk_upload,
                    numero_fila=numero_fila,
                    estado='ERROR',
                    mensaje_error=str(e),
                    datos=row_data
                )
                filas_error += 1
                resumen_errores[numero_fila] = str(e)
        else:
            # Validación fallida
            mensaje_error = '; '.join(errores)
            BulkUploadItem.objects.create(
                bulk_upload=bulk_upload,
                numero_fila=numero_fila,
                estado='ERROR',
                mensaje_error=mensaje_error,
                datos=row_data
            )
            filas_error += 1
            resumen_errores[numero_fila] = mensaje_error
    
    return {
        'total_filas': total_filas,
        'filas_ok': filas_ok,
        'filas_error': filas_error,
        'resumen_errores': resumen_errores
    }
