from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CalificacionTributaria, TaxRating, BulkUpload, BulkUploadItem
from .serializers import (
    CalificacionTributariaSerializer, TaxRatingSerializer, TaxRatingListSerializer,
    BulkUploadSerializer, BulkUploadListSerializer, BulkUploadItemSerializer
)

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
    Permite CRUD completo con filtros por issuer, instrument, fecha y más.
    """
    queryset = TaxRating.objects.select_related('issuer', 'instrument', 'analista').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['issuer__nombre', 'instrument__nombre', 'rating']
    ordering_fields = ['fecha_rating', 'creado_en', 'issuer__nombre']
    ordering = ['-fecha_rating']
    pagination_class = TaxRatingPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return TaxRatingListSerializer
        return TaxRatingSerializer

    def perform_create(self, serializer):
        """Asigna automáticamente el usuario actual como analista."""
        serializer.save(analista=self.request.user)

    def perform_update(self, serializer):
        """Asigna automáticamente el usuario actual como analista."""
        serializer.save(analista=self.request.user)

    @action(detail=False, methods=['get'])
    def por_issuer(self, request):
        """Retorna calificaciones agrupadas por issuer."""
        issuer_id = request.query_params.get('issuer_id')
        if issuer_id:
            queryset = self.get_queryset().filter(issuer_id=issuer_id)
        else:
            queryset = self.get_queryset()
        
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
            queryset = queryset.filter(fecha_rating__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_rating__lte=fecha_hasta)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado activo/inactivo de una calificación."""
        obj = self.get_object()
        activo = request.data.get('activo')
        if activo is not None:
            obj.activo = activo
            obj.save()
            return Response({'detail': 'Estado actualizado', 'activo': obj.activo})
        return Response({'error': 'Campo activo requerido'}, status=status.HTTP_400_BAD_REQUEST)


class BulkUploadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar cargas masivas de TaxRatings.
    Permite subir archivos CSV/XLSX y consultar el estado del procesamiento.
    """
    queryset = BulkUpload.objects.select_related('usuario').all()
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = TaxRatingPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BulkUploadListSerializer
        return BulkUploadSerializer
    
    def perform_create(self, serializer):
        """
        Crea el registro de BulkUpload y determina el tipo de archivo.
        El procesamiento se hace de forma asíncrona o con comando management.
        """
        archivo = self.request.FILES.get('archivo')
        tipo = 'XLSX' if archivo.name.endswith('.xlsx') else 'CSV'
        serializer.save(usuario=self.request.user, tipo=tipo)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Retorna los items (filas) de una carga específica."""
        bulk_upload = self.get_object()
        items = BulkUploadItem.objects.filter(bulk_upload=bulk_upload)
        
        # Filtrar por estado si se especifica
        estado = request.query_params.get('estado')
        if estado:
            items = items.filter(estado=estado)
        
        serializer = BulkUploadItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def procesar(self, request, pk=None):
        """
        Procesa una carga masiva de forma síncrona.
        NOTA: Para grandes volúmenes usar Celery o comando management asíncrono.
        """
        from .utils import process_bulk_upload_file
        
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
            queryset = queryset.filter(fecha_rating__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_rating__lte=fecha_hasta)
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
            queryset = queryset.filter(fecha_rating__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_rating__lte=fecha_hasta)
        
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
            queryset = queryset.filter(fecha_rating__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_rating__lte=fecha_hasta)
        
        return generar_reporte_pdf(queryset, incluir_estadisticas=incluir_stats)


