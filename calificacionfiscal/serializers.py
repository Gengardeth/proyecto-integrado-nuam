from rest_framework import serializers
from django.db import models
from .models import CalificacionTributaria, Contribuyente, TaxRating, BulkUpload, BulkUploadItem
from parametros.serializers import IssuerSerializer, InstrumentSerializer
from django.utils import timezone


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
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TaxRating
        fields = (
            'id', 'issuer', 'issuer_nombre', 'instrument', 'instrument_nombre', 
            'rating', 'rating_display', 'risk_level', 'risk_level_display',
            'valid_from', 'valid_to', 'status', 'status_display', 'comments',
            'analista', 'analista_username', 'creado_en', 'actualizado_en'
        )
        read_only_fields = ('id', 'creado_en', 'actualizado_en')
    
    def validate(self, data):
        """Validaciones personalizadas."""
        valid_from = data.get('valid_from')
        valid_to = data.get('valid_to')
        
        # Validar que valid_to sea posterior a valid_from
        if valid_to and valid_from and valid_to <= valid_from:
            raise serializers.ValidationError({
                'valid_to': 'La fecha de fin debe ser posterior a la fecha de inicio.'
            })
        
        # Validar que no haya solapamiento de fechas para el mismo issuer/instrument
        issuer = data.get('issuer')
        instrument = data.get('instrument')
        
        if issuer and instrument and valid_from:
            # Excluir la instancia actual si estamos actualizando
            queryset = TaxRating.objects.filter(
                issuer=issuer,
                instrument=instrument,
                status='VIGENTE'
            )
            
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            # Verificar solapamiento
            # Si valid_to es None, la calificación está abierta (sin fecha fin)
            # Debemos verificar contra calificaciones existentes
            if valid_to:
                # Caso 1: Hay fecha de fin especificada
                overlapping = queryset.filter(
                    valid_from__lte=valid_to
                ).filter(
                    models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=valid_from)
                )
            else:
                # Caso 2: Sin fecha de fin (calificación abierta)
                # No debe solaparse con ninguna calificación vigente
                overlapping = queryset.filter(
                    models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=valid_from)
                )
            
            if overlapping.exists():
                raise serializers.ValidationError(
                    'Ya existe una calificación vigente para este emisor e instrumento en el rango de fechas especificado.'
                )
        
        return data


class TaxRatingListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados."""
    issuer_nombre = serializers.CharField(source='issuer.nombre', read_only=True)
    issuer_rut = serializers.CharField(source='issuer.rut', read_only=True)
    instrument_nombre = serializers.CharField(source='instrument.nombre', read_only=True)
    instrument_codigo = serializers.CharField(source='instrument.codigo', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TaxRating
        fields = (
            'id', 'issuer', 'issuer_nombre', 'issuer_rut',
            'instrument', 'instrument_nombre', 'instrument_codigo',
            'rating', 'rating_display', 'risk_level', 'valid_from', 'valid_to',
            'status', 'status_display', 'creado_en'
        )


class TaxRatingDetailSerializer(TaxRatingSerializer):
    """Serializer detallado con información completa de issuer e instrument."""
    issuer_detail = IssuerSerializer(source='issuer', read_only=True)
    instrument_detail = InstrumentSerializer(source='instrument', read_only=True)
    
    class Meta(TaxRatingSerializer.Meta):
        fields = TaxRatingSerializer.Meta.fields + ('issuer_detail', 'instrument_detail')


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
            'id', 'usuario', 'estado', 'tipo', 'total_filas', 'filas_ok', 'filas_error', 
            'resumen_errores', 'fecha_inicio', 'fecha_fin', 'creado_en', 'actualizado_en'
        )
    
    def validate_archivo(self, value):
        """Validar que el archivo sea UTF-8 (.txt, .tsv)."""
        if not value.name.endswith(('.txt', '.tsv')):
            raise serializers.ValidationError(
                "Solo se permiten archivos de texto UTF-8 (.txt, .tsv). No se aceptan CSV o XLSX."
            )
        
        # Validar tamaño (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede superar los 10MB")
        
        # Validar que sea UTF-8 válido
        try:
            value.read()
            value.seek(0)
            value.read().decode('utf-8')
            value.seek(0)
        except UnicodeDecodeError:
            raise serializers.ValidationError(
                "El archivo no está en formato UTF-8 válido. Asegúrese de guardar con codificación UTF-8."
            )
        
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
