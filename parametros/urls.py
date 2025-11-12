from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IssuersViewSet, InstrumentsViewSet

router = DefaultRouter()
router.register(r'issuers', IssuersViewSet, basename='issuer')
router.register(r'instruments', InstrumentsViewSet, basename='instrument')

urlpatterns = [
    path('', include(router.urls)),
]
