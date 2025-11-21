"""
Utilidades para procesar cargas masivas de archivos UTF-8.
Los archivos deben ser texto plano en formato UTF-8, con datos separados por pipes (|) o tabulaciones.
"""
import csv
from datetime import datetime
from django.core.exceptions import ValidationError
from parametros.models import Issuer, Instrument


def parse_utf8_file(file_path):
    """
    Parsea un archivo de texto UTF-8 y retorna las filas.
    
    El archivo debe tener:
    - Primera fila: headers separados por pipes (|) o tabulaciones
    - Filas siguientes: datos separados por el mismo delimitador
    
    Args:
        file_path: Ruta al archivo UTF-8
        
    Returns:
        list: Lista de diccionarios con los datos de cada fila
        
    Raises:
        ValidationError: Si el archivo no es UTF-8 válido o está mal formado
    """
    rows = []
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            # Detectar delimitador
            first_line = file.readline().strip()
            if '|' in first_line:
                delimiter = '|'
            elif '\t' in first_line:
                delimiter = '\t'
            else:
                raise ValidationError(
                    "El archivo debe tener headers separados por pipes (|) o tabulaciones"
                )
            
            # Volver al inicio del archivo
            file.seek(0)
            
            # Leer con CSV reader
            reader = csv.DictReader(file, delimiter=delimiter)
            
            if reader.fieldnames is None:
                raise ValidationError("El archivo no tiene headers válidos")
            
            for idx, row in enumerate(reader, start=2):  # Fila 1 es el header
                # Limpiar espacios en blanco de las claves y valores
                cleaned_row = {k.strip(): (v.strip() if v else '') for k, v in row.items()}
                rows.append({'numero_fila': idx, 'datos': cleaned_row})
                
    except UnicodeDecodeError as e:
        raise ValidationError(
            f"El archivo no está en formato UTF-8 válido: {str(e)}"
        )
    except Exception as e:
        raise ValidationError(f"Error al leer archivo UTF-8: {str(e)}")
    
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
    Procesa un archivo UTF-8 de carga masiva y crea los items correspondientes.
    
    Args:
        bulk_upload: Instancia de BulkUpload
        
    Returns:
        dict: Resumen del procesamiento
    """
    from .models import BulkUploadItem, TaxRating
    from parametros.models import Issuer, Instrument
    
    file_path = bulk_upload.archivo.path
    
    # Parsear archivo UTF-8
    rows = parse_utf8_file(file_path)
    
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
