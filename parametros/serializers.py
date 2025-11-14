from rest_framework import serializers
from .models import Issuer, Instrument, Parametro, TipoParametro


class TipoParametroSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoParametro
        fields = ('id', 'nombre')


class ParametroSerializer(serializers.ModelSerializer):
    tipo = TipoParametroSerializer(read_only=True)
    tipo_id = serializers.PrimaryKeyRelatedField(queryset=TipoParametro.objects.all(), source='tipo', write_only=True)

    class Meta:
        model = Parametro
        fields = ('id', 'tipo', 'tipo_id', 'codigo', 'nombre', 'activo')
        read_only_fields = ('id',)


class IssuerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issuer
        fields = ('id', 'codigo', 'nombre', 'razon_social', 'rut', 'activo', 'creado_en', 'actualizado_en')
        read_only_fields = ('id', 'creado_en', 'actualizado_en')


class InstrumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instrument
        fields = ('id', 'codigo', 'nombre', 'tipo', 'descripcion', 'activo', 'creado_en', 'actualizado_en')
        read_only_fields = ('id', 'creado_en', 'actualizado_en')
