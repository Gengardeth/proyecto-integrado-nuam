from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario
from .audit_models import AuditLog


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'rol', 'rol_display', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login', 'password', 'password_confirm'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')
        extra_kwargs = {
            'password': {'write_only': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }
    
    def validate(self, data):
        """Validar que las contraseñas coincidan."""
        if 'password' in data or 'password_confirm' in data:
            password = data.get('password')
            password_confirm = data.pop('password_confirm', None)
            
            if password != password_confirm:
                raise serializers.ValidationError({
                    'password_confirm': 'Las contraseñas no coinciden.'
                })
        
        return data
    
    def create(self, validated_data):
        """Crear usuario con contraseña hasheada."""
        password = validated_data.pop('password', None)
        usuario = Usuario.objects.create(**validated_data)
        
        if password:
            usuario.set_password(password)
            usuario.save()
        
        return usuario
    
    def update(self, instance, validated_data):
        """Actualizar usuario, incluyendo contraseña si se proporciona."""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados."""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'rol', 'rol_display', 'is_active')


class UsuarioLoginSerializer(serializers.Serializer):
    """Serializer para login."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UsuarioProfileSerializer(serializers.ModelSerializer):
    """Serializer para el perfil del usuario actual."""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'is_active', 'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'username', 'rol', 'date_joined', 'last_login')


class AuditLogSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)
    usuario_rol = serializers.CharField(source='usuario.rol', read_only=True, allow_null=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = (
            'id', 'usuario', 'usuario_username', 'usuario_rol', 
            'accion', 'accion_display', 'modelo', 'descripcion', 
            'object_id', 'datos_anterior', 'datos_nuevo', 
            'ip_address', 'user_agent', 'creado_en'
        )
        read_only_fields = fields


class AuditLogListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de auditoría."""
    usuario_username = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = (
            'id', 'usuario_username', 'accion', 'accion_display', 
            'modelo', 'descripcion', 'creado_en'
        )
