from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import CalificacionTributaria, TaxRating
from .serializers import (
    CalificacionTributariaSerializer, TaxRatingSerializer, TaxRatingListSerializer
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

