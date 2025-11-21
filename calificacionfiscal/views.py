from django.shortcuts import render
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from cuentas.authentication import CsrfExemptSessionAuthentication
from .models import CalificacionTributaria, TaxRating, BulkUpload, BulkUploadItem
from .serializers import (
    CalificacionTributariaSerializer, TaxRatingSerializer, TaxRatingListSerializer,
    TaxRatingDetailSerializer, BulkUploadSerializer, BulkUploadListSerializer, BulkUploadItemSerializer
)
from .permissions import TaxRatingPermission, BulkUploadPermission, ReportPermission


def inicio(request):
    calificaciones = CalificacionTributaria.objects.select_related('contribuyente', 'estado').all()
    return render(request, 'inicio.html', {'calificaciones': calificaciones})


class TaxRatingPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TaxRatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para TaxRating (Calificaciones Tributarias).
    
    Permisos según rol:
    - ADMIN: full CRUD (crear, leer, actualizar, eliminar)
    - ANALISTA: solo lectura (ver calificaciones)
    - AUDITOR: solo lectura (ver calificaciones)
    """
    queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated, TaxRatingPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['issuer__nombre', 'issuer__rut', 'instrument__nombre', 'instrument__codigo', 'rating', 'status']
    ordering_fields = ['valid_from', 'creado_en', 'issuer__nombre', 'rating']
    ordering = ['-valid_from']
    pagination_class = TaxRatingPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return TaxRatingListSerializer
        elif self.action == 'retrieve':
            return TaxRatingDetailSerializer
        return TaxRatingSerializer

    def perform_create(self, serializer):
        """Asigna automáticamente el usuario actual como analista y registra en auditoría."""
        from cuentas.audit_models import AuditLog
        
        # Verificar permiso explícitamente
        user_rol = getattr(self.request.user, 'rol', None)
        if user_rol != 'ADMIN':
            raise PermissionError("No tiene los privilegios para realizar esta acción. Solo administradores pueden crear calificaciones.")
        
        tax_rating = serializer.save(analista=self.request.user)
        
        # Registrar en auditoría
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='CREATE',
            modelo='TaxRating',
            object_id=str(tax_rating.id),
            descripcion=f'Calificación creada: {tax_rating.issuer.nombre} - {tax_rating.instrument.nombre}',
            datos_nuevo={
                'issuer': tax_rating.issuer.nombre,
                'instrument': tax_rating.instrument.nombre,
                'rating': tax_rating.rating,
                'valid_from': str(tax_rating.valid_from)
            }
        )

    def perform_update(self, serializer):
        """Actualiza y registra en auditoría."""
        from cuentas.audit_models import AuditLog
        
        # Verificar permiso explícitamente
        user_rol = getattr(self.request.user, 'rol', None)
        if user_rol != 'ADMIN':
            raise PermissionError("No tiene los privilegios para realizar esta acción. Solo administradores pueden editar calificaciones.")
        
        instance = self.get_object()
        datos_anterior = {
            'rating': instance.rating,
            'risk_level': instance.risk_level,
            'status': instance.status,
            'valid_from': str(instance.valid_from),
            'valid_to': str(instance.valid_to) if instance.valid_to else None
        }
        
        tax_rating = serializer.save()
        
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='UPDATE',
            modelo='TaxRating',
            object_id=str(tax_rating.id),
            descripcion=f'Calificación actualizada: {tax_rating.issuer.nombre} - {tax_rating.instrument.nombre}',
            datos_anterior=datos_anterior,
            datos_nuevo={
                'rating': tax_rating.rating,
                'risk_level': tax_rating.risk_level,
                'status': tax_rating.status,
                'valid_from': str(tax_rating.valid_from),
                'valid_to': str(tax_rating.valid_to) if tax_rating.valid_to else None
            }
        )
    
    def perform_destroy(self, instance):
        """Elimina y registra en auditoría."""
        from cuentas.audit_models import AuditLog
        
        # Verificar permiso explícitamente
        user_rol = getattr(self.request.user, 'rol', None)
        if user_rol != 'ADMIN':
            raise PermissionError("No tiene los privilegios para realizar esta acción. Solo administradores pueden eliminar calificaciones.")
        
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='DELETE',
            modelo='TaxRating',
            object_id=str(instance.id),
            descripcion=f'Calificación eliminada: {instance.issuer.nombre} - {instance.instrument.nombre}',
            datos_anterior={
                'issuer': instance.issuer.nombre,
                'instrument': instance.instrument.nombre,
                'rating': instance.rating
            }
        )
        instance.delete()

    @action(detail=False, methods=['get'])
    def por_issuer(self, request):
        """Retorna calificaciones agrupadas por issuer."""
        issuer_id = request.query_params.get('issuer_id')
        if issuer_id:
            queryset = self.get_queryset().filter(issuer_id=issuer_id)
        else:
            queryset = self.get_queryset()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def ultimas(self, request):
        """Retorna las últimas N calificaciones."""
        limit = int(request.query_params.get('limit', 10))
        queryset = self.get_queryset()[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_rango_fecha(self, request):
        """Filtra por rango de fecha."""
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        queryset = self.get_queryset()
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas de calificaciones."""
        from django.db.models import Count
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'por_rating': list(queryset.values('rating').annotate(count=Count('id')).order_by('-count')),
            'por_status': list(queryset.values('status').annotate(count=Count('id'))),
            'por_risk_level': list(queryset.values('risk_level').annotate(count=Count('id'))),
            'vigentes': queryset.filter(status='VIGENTE').count(),
        }
        
        return Response(stats)

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado de una calificación."""
        obj = self.get_object()
        nuevo_status = request.data.get('status')
        
        if nuevo_status not in dict(TaxRating.STATUS_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        obj.status = nuevo_status
        obj.save()
        
        return Response({
            'detail': 'Estado actualizado',
            'status': obj.status
        })


class BulkUploadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar cargas masivas de TaxRatings.
    Permite subir archivos UTF-8 (.txt, .tsv) y consultar el estado del procesamiento.
    Rechaza archivos CSV y XLSX.
    Permisos: ADMIN y ANALISTA pueden subir, AUDITOR solo lectura.
    """
    queryset = BulkUpload.objects.select_related('usuario').all()
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated, BulkUploadPermission]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = TaxRatingPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BulkUploadListSerializer
        return BulkUploadSerializer
    
    def perform_create(self, serializer):
        """
        Crea el registro de BulkUpload validando que sea archivo UTF-8.
        Solo acepta archivos de texto plano en UTF-8, rechaza CSV, XLSX, XLS.
        El procesamiento se hace de forma asíncrona o con comando management.
        """
        from cuentas.audit_models import AuditLog
        
        archivo = self.request.FILES.get('archivo')
        
        # Rechazar extensiones no permitidas
        archivo_name = archivo.name.lower()
        extensiones_rechazadas = ['.xlsx', '.xls', '.csv']
        
        for ext in extensiones_rechazadas:
            if archivo_name.endswith(ext):
                raise ValidationError(
                    f"Formato no soportado: {ext}. Solo se aceptan archivos de texto UTF-8 (.txt, .tsv, etc.)"
                )
        
        # Validar que sea un archivo UTF-8 válido
        try:
            contenido = archivo.read()
            contenido.decode('utf-8')
            archivo.seek(0)  # Resetear el puntero para que se guarde correctamente
        except UnicodeDecodeError:
            raise ValidationError(
                "El archivo no está en formato UTF-8 válido. Asegúrese de guardar el archivo con codificación UTF-8."
            )
        
        # Guardar como tipo UTF8
        bulk_upload = serializer.save(usuario=self.request.user, tipo='UTF8')
        
        # Hacer un parsing preliminar para mostrar preview
        try:
            from .utils import parse_utf8_file
            archivo.seek(0)
            rows = parse_utf8_file(archivo)
            # Actualizar con el conteo preliminar
            bulk_upload.total_filas = len(rows)
            bulk_upload.save()
        except Exception as e:
            # Si falla el parsing preliminar, no es un error fatal
            # Se intentará de nuevo cuando se procese
            pass
        
        # Registrar en auditoría
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='UPLOAD',
            modelo='BulkUpload',
            object_id=str(bulk_upload.id),
            descripcion=f'Carga masiva iniciada: {archivo.name}'
        )
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Retorna los items (filas) de una carga específica."""
        bulk_upload = self.get_object()
        items = BulkUploadItem.objects.filter(bulk_upload=bulk_upload)
        
        # Filtrar por estado si se especifica
        estado = request.query_params.get('estado')
        if estado:
            items = items.filter(estado=estado)
        
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = BulkUploadItemSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BulkUploadItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def procesar(self, request, pk=None):
        """
        Procesa una carga masiva de forma síncrona.
        NOTA: Para grandes volúmenes usar Celery o comando management asíncrono.
        """
        from .utils import process_bulk_upload_file
        from cuentas.audit_models import AuditLog
        
        bulk_upload = self.get_object()
        
        if bulk_upload.estado != 'PENDIENTE':
            return Response(
                {'error': 'Esta carga ya fue procesada o está en proceso'},
                status=status.HTTP_400_BAD_REQUEST
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
            
            # Auditoría
            AuditLog.objects.create(
                usuario=request.user,
                accion='UPDATE',
                modelo='BulkUpload',
                object_id=str(bulk_upload.id),
                descripcion=f'Carga masiva completada: {bulk_upload.filas_ok} OK, {bulk_upload.filas_error} errores'
            )
            
            serializer = self.get_serializer(bulk_upload)
            return Response(serializer.data)
            
        except Exception as e:
            bulk_upload.estado = 'ERROR'
            bulk_upload.resumen_errores = {'error_general': str(e)}
            bulk_upload.fecha_fin = timezone.now()
            bulk_upload.save()
            
            return Response(
                {'error': f'Error al procesar archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechaza/cancela una carga masiva pendiente.
        Solo es posible si el estado es PENDIENTE.
        """
        from cuentas.audit_models import AuditLog
        
        bulk_upload = self.get_object()
        
        if bulk_upload.estado != 'PENDIENTE':
            return Response(
                {'error': f'No se puede rechazar una carga en estado {bulk_upload.estado}. Solo las pendientes pueden rechazarse.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar a RECHAZADO
        bulk_upload.estado = 'RECHAZADO'
        bulk_upload.fecha_fin = timezone.now()
        bulk_upload.save()
        
        # Registrar en auditoría
        AuditLog.objects.create(
            usuario=request.user,
            accion='DELETE',
            modelo='BulkUpload',
            object_id=str(bulk_upload.id),
            descripcion=f'Carga masiva rechazada/cancelada por el usuario'
        )
        
        serializer = self.get_serializer(bulk_upload)
        return Response({
            'mensaje': 'Carga masiva rechazada correctamente',
            'carga': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Retorna un resumen de todas las cargas del usuario."""
        usuario = request.user
        cargas = BulkUpload.objects.filter(usuario=usuario)
        
        resumen = {
            'total_cargas': cargas.count(),
            'pendientes': cargas.filter(estado='PENDIENTE').count(),
            'procesando': cargas.filter(estado='PROCESANDO').count(),
            'completadas': cargas.filter(estado='COMPLETADO').count(),
            'con_error': cargas.filter(estado='ERROR').count(),
        }
        
        return Response(resumen)


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet para generar reportes y estadísticas de TaxRatings.
    Permite exportar en formato CSV y PDF.
    Permisos: todos los roles pueden generar reportes.
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated, ReportPermission]
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas generales de las calificaciones."""
        from .reports import obtener_estadisticas
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        issuer_id = request.query_params.get('issuer_id')
        instrument_id = request.query_params.get('instrument_id')
        status_filter = request.query_params.get('status')
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        if issuer_id:
            queryset = queryset.filter(issuer_id=issuer_id)
        if instrument_id:
            queryset = queryset.filter(instrument_id=instrument_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        estadisticas = obtener_estadisticas(queryset)
        return Response(estadisticas)
    
    @action(detail=False, methods=['get'])
    def exportar_csv(self, request):
        """Exporta las calificaciones en formato CSV."""
        from .reports import generar_reporte_csv
        from cuentas.audit_models import AuditLog
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        
        # Auditoría
        AuditLog.objects.create(
            usuario=request.user,
            accion='EXPORT',
            modelo='TaxRating',
            descripcion=f'Exportación CSV: {queryset.count()} registros'
        )
        
        return generar_reporte_csv(queryset)
    
    @action(detail=False, methods=['get'])
    def exportar_pdf(self, request):
        """Exporta las calificaciones en formato PDF."""
        from .reports import generar_reporte_pdf
        from cuentas.audit_models import AuditLog
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        incluir_stats = request.query_params.get('incluir_estadisticas', 'true').lower() == 'true'
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        
        # Auditoría
        AuditLog.objects.create(
            usuario=request.user,
            accion='EXPORT',
            modelo='TaxRating',
            descripcion=f'Exportación PDF: {queryset.count()} registros'
        )
        
        return generar_reporte_pdf(queryset, incluir_estadisticas=incluir_stats)

        
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
            
            serializer = self.get_serializer(bulk_upload)
            return Response(serializer.data)
            
        except Exception as e:
            bulk_upload.estado = 'ERROR'
            bulk_upload.resumen_errores = {'error_general': str(e)}
            bulk_upload.fecha_fin = timezone.now()
            bulk_upload.save()
            
            return Response(
                {'error': f'Error al procesar archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Retorna un resumen de todas las cargas del usuario."""
        usuario = request.user
        cargas = BulkUpload.objects.filter(usuario=usuario)
        
        resumen = {
            'total_cargas': cargas.count(),
            'pendientes': cargas.filter(estado='PENDIENTE').count(),
            'procesando': cargas.filter(estado='PROCESANDO').count(),
            'completadas': cargas.filter(estado='COMPLETADO').count(),
            'con_error': cargas.filter(estado='ERROR').count(),
        }
        
        return Response(resumen)


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet para generar reportes y estadísticas de TaxRatings.
    Permite exportar en formato CSV y PDF.
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas generales de las calificaciones."""
        from .reports import obtener_estadisticas
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        issuer_id = request.query_params.get('issuer_id')
        instrument_id = request.query_params.get('instrument_id')
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        if issuer_id:
            queryset = queryset.filter(issuer_id=issuer_id)
        if instrument_id:
            queryset = queryset.filter(instrument_id=instrument_id)
        
        estadisticas = obtener_estadisticas(queryset)
        return Response(estadisticas)
    
    @action(detail=False, methods=['get'])
    def exportar_csv(self, request):
        """Exporta las calificaciones en formato CSV."""
        from .reports import generar_reporte_csv
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        
        return generar_reporte_csv(queryset)
    
    @action(detail=False, methods=['get'])
    def exportar_pdf(self, request):
        """Exporta las calificaciones en formato PDF."""
        from .reports import generar_reporte_pdf
        
        # Aplicar filtros opcionales
        queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
        
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        incluir_stats = request.query_params.get('incluir_estadisticas', 'true').lower() == 'true'
        
        if fecha_desde:
            queryset = queryset.filter(valid_from__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(valid_from__lte=fecha_hasta)
        
        return generar_reporte_pdf(queryset, incluir_estadisticas=incluir_stats)


