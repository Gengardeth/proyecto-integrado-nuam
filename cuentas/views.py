from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets, filters
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate, login, logout
from django.contrib.contenttypes.models import ContentType
from .models import Usuario
from .authentication import CsrfExemptSessionAuthentication
from .serializers import (
    UsuarioSerializer, UsuarioListSerializer, UsuarioLoginSerializer, 
    UsuarioProfileSerializer, AuditLogSerializer, AuditLogListSerializer
)
from .audit_models import AuditLog


class LoginView(APIView):
    """Vista para iniciar sesión."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=username, password=password)
            
        if user is not None:
            if not user.is_active:
                return Response(
                    {'detail': 'Usuario inactivo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            login(request, user)
            
            # Registrar login en auditoría
            AuditLog.objects.create(
                usuario=user,
                accion='LOGIN',
                modelo='Usuario',
                descripcion=f'Login exitoso de {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Debug: verificar sesión
            print(f"DEBUG Login: Session Key = {request.session.session_key}")
            print(f"DEBUG Login: User authenticated = {request.user.is_authenticated}")
            
            # Dejar que Django SessionMiddleware maneje la cookie de sesión automáticamente
            return Response({
                'detail': 'Login exitoso',
                'user': UsuarioProfileSerializer(user).data
            })
        
        return Response(
            {'detail': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    def get_client_ip(self, request):
        """Obtiene la IP del cliente."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class LogoutView(APIView):
    """Vista para cerrar sesión."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Registrar logout en auditoría
        AuditLog.objects.create(
            usuario=request.user,
            accion='LOGOUT',
            modelo='Usuario',
            descripcion=f'Logout de {request.user.username}',
            ip_address=LoginView().get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        logout(request)
        return Response({'detail': 'Logout exitoso'})


class MeView(APIView):
    """Vista para obtener información del usuario actual."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Debug: verificar autenticación
        print(f"DEBUG Me: User = {request.user}")
        print(f"DEBUG Me: Authenticated = {request.user.is_authenticated}")
        print(f"DEBUG Me: Session Key = {request.session.session_key}")
        print(f"DEBUG Me: Cookies = {request.COOKIES}")
        
        serializer = UsuarioProfileSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Actualizar perfil del usuario actual."""
        serializer = UsuarioProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RolesView(APIView):
    """Vista para obtener la lista de roles disponibles."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        roles = [{'key': k, 'label': v} for k, v in Usuario.ROLES]
        return Response(roles)


class UsuarioPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios.
    Solo ADMIN puede gestionar usuarios.
    """
    queryset = Usuario.objects.all().order_by('-date_joined')
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = UsuarioPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username', 'email']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer
    
    def get_permissions(self):
        """Solo ADMIN puede crear/modificar/eliminar usuarios."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Registrar creación en auditoría."""
        usuario = serializer.save()
        
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='CREATE',
            modelo='Usuario',
            object_id=str(usuario.id),
            descripcion=f'Usuario {usuario.username} creado',
            datos_nuevo={'username': usuario.username, 'email': usuario.email, 'rol': usuario.rol}
        )
    
    def perform_update(self, serializer):
        """Registrar actualización en auditoría."""
        usuario_anterior = self.get_object()
        datos_anterior = {
            'username': usuario_anterior.username,
            'email': usuario_anterior.email,
            'rol': usuario_anterior.rol,
            'is_active': usuario_anterior.is_active
        }
        
        usuario = serializer.save()
        
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='UPDATE',
            modelo='Usuario',
            object_id=str(usuario.id),
            descripcion=f'Usuario {usuario.username} actualizado',
            datos_anterior=datos_anterior,
            datos_nuevo={'username': usuario.username, 'email': usuario.email, 'rol': usuario.rol}
        )
    
    def perform_destroy(self, instance):
        """Registrar eliminación en auditoría."""
        AuditLog.objects.create(
            usuario=self.request.user,
            accion='DELETE',
            modelo='Usuario',
            object_id=str(instance.id),
            descripcion=f'Usuario {instance.username} eliminado',
            datos_anterior={'username': instance.username, 'email': instance.email}
        )
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def por_rol(self, request):
        """Filtrar usuarios por rol."""
        rol = request.query_params.get('rol')
        if rol:
            queryset = self.get_queryset().filter(rol=rol)
        else:
            queryset = self.get_queryset()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activar un usuario."""
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save()
        
        AuditLog.objects.create(
            usuario=request.user,
            accion='UPDATE',
            modelo='Usuario',
            object_id=str(usuario.id),
            descripcion=f'Usuario {usuario.username} activado'
        )
        
        return Response({'detail': 'Usuario activado'})
    
    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        """Desactivar un usuario."""
        usuario = self.get_object()
        usuario.is_active = False
        usuario.save()
        
        AuditLog.objects.create(
            usuario=request.user,
            accion='UPDATE',
            modelo='Usuario',
            object_id=str(usuario.id),
            descripcion=f'Usuario {usuario.username} desactivado'
        )
        
        return Response({'detail': 'Usuario desactivado'})


class AuditLogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar logs de auditoría.
    Solo lectura. Requiere autenticación.
    ADMIN y AUDITOR ven todos los logs.
    ANALISTA solo ve sus propios logs.
    """
    queryset = AuditLog.objects.all().select_related('usuario')
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditLogPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['usuario__username', 'modelo', 'accion', 'descripcion']
    ordering_fields = ['creado_en', 'accion', 'modelo']
    ordering = ['-creado_en']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AuditLogListSerializer
        return AuditLogSerializer
    
    def get_queryset(self):
        """Filtrar por rol: ANALISTA solo ve sus logs."""
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.rol == 'ANALISTA':
            return queryset.filter(usuario=user)
        
        # ADMIN y AUDITOR ven todo; aplicar filtros de fecha si se proporcionan
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        from datetime import datetime, timedelta
        from django.utils import timezone

        if fecha_desde:
            try:
                dt_desde = datetime.strptime(fecha_desde, '%Y-%m-%d')
                dt_desde = timezone.make_aware(dt_desde)
                queryset = queryset.filter(creado_en__gte=dt_desde)
            except ValueError:
                pass  # Ignorar formato inválido
        if fecha_hasta:
            try:
                dt_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d')
                dt_hasta = timezone.make_aware(dt_hasta) + timedelta(days=1)  # Inclusivo hasta fin del día
                queryset = queryset.filter(creado_en__lt=dt_hasta)
            except ValueError:
                pass

        return queryset

    @action(detail=False, methods=['get'])
    def por_usuario(self, request):
        """Filtro: logs de un usuario específico."""
        usuario_id = request.query_params.get('usuario_id')
        
        if usuario_id:
            # Solo ADMIN y AUDITOR pueden ver logs de otros usuarios
            if request.user.rol not in ['ADMIN', 'AUDITOR']:
                return Response(
                    {'detail': 'No tiene permisos para ver logs de otros usuarios'},
                    status=status.HTTP_403_FORBIDDEN
                )
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
        queryset = self.get_queryset()
        
        if accion:
            queryset = queryset.filter(accion=accion)
        
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
        queryset = self.get_queryset()
        
        if modelo:
            queryset = queryset.filter(modelo=modelo)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de auditoría."""
        from django.db.models import Count
        
        queryset = self.get_queryset()
        
        # Contar por acción
        por_accion = queryset.values('accion').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Contar por modelo
        por_modelo = queryset.values('modelo').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Contar por usuario (solo para ADMIN/AUDITOR)
        por_usuario = None
        if request.user.rol in ['ADMIN', 'AUDITOR']:
            por_usuario = queryset.values(
                'usuario__username', 'usuario__rol'
            ).annotate(
                count=Count('id')
            ).order_by('-count')[:10]
        
        return Response({
            'por_accion': list(por_accion),
            'por_modelo': list(por_modelo),
            'por_usuario': list(por_usuario) if por_usuario else None,
            'total_registros': queryset.count()
        })

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
