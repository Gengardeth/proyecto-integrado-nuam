from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxRatingViewSet, BulkUploadViewSet, ReportsViewSet

router = DefaultRouter()
router.register(r'tax-ratings', TaxRatingViewSet, basename='tax-rating')
router.register(r'bulk-uploads', BulkUploadViewSet, basename='bulk-upload')
router.register(r'reports', ReportsViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
