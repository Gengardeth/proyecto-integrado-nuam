from rest_framework import serializers
from .models import Usuario
from .audit_models import AuditLog

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'rol', 'is_active')

class AuditLogSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)
    usuario_rol = serializers.CharField(source='usuario.rol', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = (
            'id', 'usuario', 'usuario_username', 'usuario_rol', 'accion', 'modelo', 
            'descripcion', 'object_id', 'datos_anterior', 'datos_nuevo', 
            'ip_address', 'creado_en'
        )
        read_only_fields = fields

