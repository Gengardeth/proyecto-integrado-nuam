from rest_framework import viewsets, permissions
from .models import CalificacionTributaria, Contribuyente
from .serializers import CalificacionTributariaSerializer, ContribuyenteSerializer


class CalificacionViewSet(viewsets.ModelViewSet):
    """API para Calificaciones Tributarias."""
    queryset = CalificacionTributaria.objects.all()
    serializer_class = CalificacionTributariaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


class ContribuyenteViewSet(viewsets.ModelViewSet):
    """API para Contribuyentes."""
    queryset = Contribuyente.objects.all()
    serializer_class = ContribuyenteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
