from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, LogoutView, MeView, RolesView, AuditLogViewSet, UsuarioViewSet
from .health import HealthView

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'users', UsuarioViewSet, basename='user')

urlpatterns = [
    path('health', HealthView.as_view(), name='health'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/me', MeView.as_view(), name='me'),
    path('roles', RolesView.as_view(), name='roles'),
    path('', include(router.urls)),
]
