from rest_framework import serializers
from .models import CalificacionTributaria, Contribuyente, TaxRating

class ContribuyenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribuyente
        fields = ('id', 'rut', 'razon_social', 'giro')

class CalificacionTributariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalificacionTributaria
        fields = ('id', 'contribuyente', 'fecha', 'estado', 'puntaje_total', 'creado_por')
        read_only_fields = ('id', 'fecha', 'creado_por')

class TaxRatingSerializer(serializers.ModelSerializer):
    issuer_nombre = serializers.CharField(source='issuer.nombre', read_only=True)
    instrument_nombre = serializers.CharField(source='instrument.nombre', read_only=True)
    analista_username = serializers.CharField(source='analista.username', read_only=True)
    
    class Meta:
        model = TaxRating
        fields = (
            'id', 'issuer', 'issuer_nombre', 'instrument', 'instrument_nombre', 'rating', 
            'fecha_rating', 'fecha_vencimiento', 'analista', 'analista_username', 
            'outlook', 'notas', 'activo', 'creado_en', 'actualizado_en'
        )
        read_only_fields = ('id', 'creado_en', 'actualizado_en')

class TaxRatingListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados."""
    issuer_nombre = serializers.CharField(source='issuer.nombre', read_only=True)
    instrument_nombre = serializers.CharField(source='instrument.nombre', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    
    class Meta:
        model = TaxRating
        fields = ('id', 'issuer', 'issuer_nombre', 'instrument', 'instrument_nombre', 
                  'rating', 'rating_display', 'fecha_rating', 'outlook', 'activo')
