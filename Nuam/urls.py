
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from calificacionfiscal import views as vistas_calificaciones
from calificacionfiscal.api import CalificacionViewSet, ContribuyenteViewSet
from parametros.api import ParametroViewSet
from django.urls import include
import cuentas.urls as cuentas_urls
from rest_framework.authtoken.views import obtain_auth_token

router = routers.DefaultRouter()
router.register(r'calificaciones', CalificacionViewSet, basename='calificacion')
router.register(r'contribuyentes', ContribuyenteViewSet, basename='contribuyente')
router.register(r'parametros', ParametroViewSet, basename='parametro')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', vistas_calificaciones.inicio, name='inicio'),
    path('api/', include(router.urls)),
    path('api/v1/', include((cuentas_urls.urlpatterns, 'cuentas'), namespace='cuentas')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
]

