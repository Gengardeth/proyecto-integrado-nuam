from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxRatingViewSet

router = DefaultRouter()
router.register(r'tax-ratings', TaxRatingViewSet, basename='tax-rating')

urlpatterns = [
    path('', include(router.urls)),
]
