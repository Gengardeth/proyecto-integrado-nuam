"""
Comando Django para procesar cargas masivas pendientes.
Uso: python manage.py process_uploads
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from calificacionfiscal.models import BulkUpload
from calificacionfiscal.utils import process_bulk_upload_file


class Command(BaseCommand):
    help = 'Procesa cargas masivas pendientes de archivos CSV/XLSX'

    def add_arguments(self, parser):
        parser.add_argument(
            '--id',
            type=int,
            help='Procesar solo la carga con este ID específico',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Procesar todas las cargas pendientes',
        )

    def handle(self, *args, **options):
        upload_id = options.get('id')
        process_all = options.get('all')
        
        if upload_id:
            # Procesar una carga específica
            try:
                bulk_upload = BulkUpload.objects.get(id=upload_id)
                self.process_upload(bulk_upload)
            except BulkUpload.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'No existe carga con ID {upload_id}')
                )
        elif process_all:
            # Procesar todas las pendientes
            pending_uploads = BulkUpload.objects.filter(estado='PENDIENTE')
            total = pending_uploads.count()
            
            if total == 0:
                self.stdout.write(
                    self.style.WARNING('No hay cargas pendientes')
                )
                return
            
            self.stdout.write(
                self.style.NOTICE(f'Procesando {total} cargas pendientes...')
            )
            
            for bulk_upload in pending_uploads:
                self.process_upload(bulk_upload)
        else:
            self.stdout.write(
                self.style.ERROR('Debe especificar --id o --all')
            )
    
    def process_upload(self, bulk_upload):
        """Procesa una carga masiva individual."""
        self.stdout.write(
            self.style.NOTICE(f'Procesando carga #{bulk_upload.id}...')
        )
        
        # Actualizar estado
        bulk_upload.estado = 'PROCESANDO'
        bulk_upload.fecha_inicio = timezone.now()
        bulk_upload.save()
        
        try:
            # Procesar archivo
            resultado = process_bulk_upload_file(bulk_upload)
            
            # Actualizar con resultados
            bulk_upload.estado = 'COMPLETADO'
            bulk_upload.total_filas = resultado['total_filas']
            bulk_upload.filas_ok = resultado['filas_ok']
            bulk_upload.filas_error = resultado['filas_error']
            bulk_upload.resumen_errores = resultado['resumen_errores']
            bulk_upload.fecha_fin = timezone.now()
            bulk_upload.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Carga #{bulk_upload.id} completada: '
                    f'{resultado["filas_ok"]} OK, {resultado["filas_error"]} errores'
                )
            )
            
        except Exception as e:
            bulk_upload.estado = 'ERROR'
            bulk_upload.resumen_errores = {'error_general': str(e)}
            bulk_upload.fecha_fin = timezone.now()
            bulk_upload.save()
            
            self.stdout.write(
                self.style.ERROR(
                    f'✗ Error en carga #{bulk_upload.id}: {str(e)}'
                )
            )
