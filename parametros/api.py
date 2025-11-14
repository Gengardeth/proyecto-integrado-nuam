from rest_framework import viewsets, permissions
from .models import Parametro
from .serializers import ParametroSerializer


class ParametroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet que expone parámetros activos (ej.: estados)."""
    queryset = Parametro.objects.filter(activo=True)
    serializer_class = ParametroSerializer
    permission_classes = [permissions.AllowAny]
