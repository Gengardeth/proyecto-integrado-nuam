from rest_framework import serializers
from .models import CalificacionTributaria, Contribuyente, TaxRating, BulkUpload, BulkUploadItem

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


class BulkUploadSerializer(serializers.ModelSerializer):
    """Serializer para cargas masivas."""
    porcentaje_exito = serializers.ReadOnlyField()
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = BulkUpload
        fields = (
            'id', 'archivo', 'tipo', 'usuario', 'usuario_username', 'estado', 
            'total_filas', 'filas_ok', 'filas_error', 'resumen_errores', 
            'porcentaje_exito', 'fecha_inicio', 'fecha_fin', 'creado_en', 'actualizado_en'
        )
        read_only_fields = (
            'id', 'usuario', 'estado', 'total_filas', 'filas_ok', 'filas_error', 
            'resumen_errores', 'fecha_inicio', 'fecha_fin', 'creado_en', 'actualizado_en'
        )
    
    def validate_archivo(self, value):
        """Validar que el archivo sea CSV o XLSX."""
        if not value.name.endswith(('.csv', '.xlsx')):
            raise serializers.ValidationError("Solo se permiten archivos CSV o XLSX")
        
        # Validar tamaño (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede superar los 10MB")
        
        return value


class BulkUploadItemSerializer(serializers.ModelSerializer):
    """Serializer para items individuales de cargas masivas."""
    
    class Meta:
        model = BulkUploadItem
        fields = (
            'id', 'bulk_upload', 'numero_fila', 'estado', 'mensaje_error', 
            'datos', 'creado_en'
        )
        read_only_fields = ('id', 'creado_en')


class BulkUploadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de cargas."""
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    porcentaje_exito = serializers.ReadOnlyField()
    
    class Meta:
        model = BulkUpload
        fields = (
            'id', 'archivo', 'tipo', 'usuario_username', 'estado', 
            'total_filas', 'filas_ok', 'filas_error', 'porcentaje_exito', 'creado_en'
        )
