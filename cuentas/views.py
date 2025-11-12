from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets, filters
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate, login, logout
from .models import Usuario
from .serializers import UsuarioSerializer, AuditLogSerializer
from .audit_models import AuditLog

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({'detail': 'Login exitoso', 'user': UsuarioSerializer(user).data})
        return Response({'detail': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'detail': 'Logout exitoso'})

class MeView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated:
            return Response(UsuarioSerializer(user).data)
        return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

class RolesView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        roles = [{'key': k, 'label': v} for k, v in Usuario.ROLES]
        return Response(roles)

class AuditLogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar logs de auditoría.
    Solo lectura. Requiere autenticación.
    """
    queryset = AuditLog.objects.all().select_related('usuario')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditLogPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['usuario__username', 'modelo', 'accion', 'descripcion']
    ordering_fields = ['creado_en', 'accion', 'modelo']
    ordering = ['-creado_en']

    @action(detail=False, methods=['get'])
    def por_usuario(self, request):
        """Filtro: logs de un usuario específico."""
        usuario_id = request.query_params.get('usuario_id')
        if usuario_id:
            queryset = self.get_queryset().filter(usuario_id=usuario_id)
        else:
            queryset = self.get_queryset().filter(usuario=request.user)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_accion(self, request):
        """Filtro: logs por tipo de acción."""
        accion = request.query_params.get('accion')
        if accion:
            queryset = self.get_queryset().filter(accion=accion)
        else:
            queryset = self.get_queryset()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_modelo(self, request):
        """Filtro: logs por modelo."""
        modelo = request.query_params.get('modelo')
        if modelo:
            queryset = self.get_queryset().filter(modelo=modelo)
        else:
            queryset = self.get_queryset()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de auditoría: conteos por acción y modelo."""
        from django.db.models import Count
        
        resumen = {
            'por_accion': list(
                self.get_queryset().values('accion').annotate(count=Count('id'))
            ),
            'por_modelo': list(
                self.get_queryset().values('modelo').annotate(count=Count('id'))
            ),
            'por_usuario': list(
                self.get_queryset().values('usuario__username').annotate(count=Count('id'))
            ),
            'total': self.get_queryset().count(),
        }
        return Response(resumen)
