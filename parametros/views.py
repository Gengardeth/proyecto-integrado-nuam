from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Issuer, Instrument
from .serializers import IssuerSerializer, InstrumentSerializer

class IssuersViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Issuer (Emisor).
    Permite CRUD completo de emisores.
    """
    queryset = Issuer.objects.all()
    serializer_class = IssuerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'razon_social', 'rut']
    ordering_fields = ['nombre', 'creado_en']
    ordering = ['nombre']

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo los emisores activos."""
        queryset = self.get_queryset().filter(activo=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class InstrumentsViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Instrument (Instrumento financiero).
    Permite CRUD completo de instrumentos.
    """
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'tipo']
    ordering_fields = ['nombre', 'tipo', 'creado_en']
    ordering = ['nombre']

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo los instrumentos activos."""
        queryset = self.get_queryset().filter(activo=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Retorna instrumentos agrupados por tipo."""
        tipos = {}
        for obj in self.get_queryset():
            tipo = obj.get_tipo_display()
            if tipo not in tipos:
                tipos[tipo] = []
            tipos[tipo].append(self.get_serializer(obj).data)
        return Response(tipos)
