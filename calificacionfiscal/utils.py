"""
Utilidades para procesar cargas masivas de archivos UTF-8.
Los archivos deben ser texto plano en formato UTF-8, con datos separados por pipes (|) o tabulaciones.
"""
import csv
import io
import logging
from datetime import datetime
from django.core.exceptions import ValidationError
from parametros.models import Issuer, Instrument

logger = logging.getLogger(__name__)


def parse_utf8_file(file_obj):
    """
    Parsea un archivo de texto UTF-8 y retorna las filas.
    
    El archivo debe tener:
    - Primera fila: headers separados por pipes (|) o tabulaciones
    - Filas siguientes: datos separados por el mismo delimitador
    
    Args:
        file_obj: Objeto FileField de Django o archivo abierto o ruta string
        
    Returns:
        list: Lista de diccionarios con los datos de cada fila
        
    Raises:
        ValidationError: Si el archivo no es UTF-8 válido o está mal formado
    """
    rows = []
    content = None
    
    try:
        # Obtener contenido según el tipo de input
        if isinstance(file_obj, str):
            # Es una ruta de archivo
            logger.info(f"Leyendo archivo desde ruta: {file_obj}")
            with open(file_obj, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            # Es un objeto FileField/File de Django
            logger.info(f"Leyendo archivo desde FileField: {getattr(file_obj, 'name', 'unknown')}")
            try:
                file_obj.seek(0)  # Ir al inicio del archivo
            except:
                pass
            
            # Intentar leer
            try:
                data = file_obj.read()
            except:
                # Si read() sin argumentos no funciona, abrir el file
                file_obj.open('r')
                data = file_obj.read()
            
            # Convertir a string si es bytes
            if isinstance(data, bytes):
                logger.info("Contenido es bytes, decodificando a UTF-8")
                content = data.decode('utf-8')
            else:
                content = data
        
        if not content or len(content.strip()) == 0:
            raise ValidationError("El archivo está vacío")
        
        logger.info(f"Contenido leído, {len(content)} caracteres")
        logger.info(f"Primeros 200 caracteres: {repr(content[:200])}")
        
        # Dividir en líneas
        lines = content.split('\n')
        logger.info(f"Total de líneas: {len(lines)}")
        
        if len(lines) < 2:
            raise ValidationError("El archivo debe tener al menos un header y una fila de datos")
        
        # Detectar delimitador desde la primera línea
        first_line = lines[0].strip()
        logger.info(f"Primera línea (stripped): {repr(first_line)}")
        
        if not first_line:
            raise ValidationError("La primera línea (headers) está vacía")
        
        # Determinar delimitador
        delimiter = None
        if '|' in first_line:
            delimiter = '|'
            logger.info("Delimitador detectado: pipe (|)")
        elif '\t' in first_line:
            delimiter = '\t'
            logger.info("Delimitador detectado: tabulación")
        else:
            logger.error(f"No se detectó delimitador en: {repr(first_line)}")
            raise ValidationError(
                "El archivo debe tener headers separados por pipes (|) o tabulaciones"
            )
        
        # Usar StringIO para leer como archivo CSV
        file_stream = io.StringIO(content)
        
        # Leer con CSV reader
        reader = csv.DictReader(file_stream, delimiter=delimiter)
        
        if reader.fieldnames is None:
            raise ValidationError("El archivo no tiene headers válidos")
        
        logger.info(f"Headers encontrados: {reader.fieldnames}")
        
        # Parsear filas
        for idx, row in enumerate(reader, start=2):  # Fila 1 es el header
            # Limpiar espacios en blanco de las claves y valores
            cleaned_row = {k.strip(): (v.strip() if v else '') for k, v in row.items()}
            rows.append({'numero_fila': idx, 'datos': cleaned_row})
            logger.debug(f"Fila {idx} parseada: {cleaned_row}")
        
        logger.info(f"✓ Total filas parseadas exitosamente: {len(rows)}")
        
    except ValidationError:
        raise
    except UnicodeDecodeError as e:
        logger.error(f"Error de codificación UTF-8: {str(e)}")
        raise ValidationError(
            f"El archivo no está en formato UTF-8 válido: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error inesperado al leer archivo: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
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

    logger.info(f"Iniciando procesamiento de BulkUpload {bulk_upload.id}: {bulk_upload.archivo.name}")
    
    # Parsear archivo UTF-8 - pasar el FileField directamente
    rows = parse_utf8_file(bulk_upload.archivo)
    
    logger.info(f"Se parsearon {len(rows)} filas del archivo")
    
    total_filas = len(rows)
    filas_ok = 0
    filas_error = 0
    resumen_errores = {}
    
    # Procesar cada fila
    for row in rows:
        numero_fila = row['numero_fila']
        row_data = row['datos']
        
        logger.info(f"Procesando fila {numero_fila}: {row_data}")
        
        # Validar fila
        es_valido, errores = validate_tax_rating_row(row_data)
        
        if es_valido:
            logger.info(f"Fila {numero_fila} válida, creando TaxRating")
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
                logger.info(f"Fila {numero_fila} procesada exitosamente")
                
            except Exception as e:
                logger.error(f"Error al procesar fila {numero_fila}: {str(e)}")
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
            logger.warning(f"Fila {numero_fila} falló validación: {errores}")
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
    
    logger.info(f"Procesamiento completado: {filas_ok} OK, {filas_error} ERROR, Total: {total_filas}")
    
    return {
        'total_filas': total_filas,
        'filas_ok': filas_ok,
        'filas_error': filas_error,
        'resumen_errores': resumen_errores
    }
