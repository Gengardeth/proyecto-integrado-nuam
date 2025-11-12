from rest_framework import serializers
from .models import Issuer, Instrument

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
