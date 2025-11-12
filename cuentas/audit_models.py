from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import json

class AuditLog(models.Model):
    """
    Modelo para registro de auditoría.
    Registra todas las acciones (crear, actualizar, eliminar) de los modelos críticos.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Crear'),
        ('UPDATE', 'Actualizar'),
        ('DELETE', 'Eliminar'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Exportar'),
        ('UPLOAD', 'Cargar archivo'),
    ]
    
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    accion = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    # Generic relation para cualquier modelo
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Datos
    modelo = models.CharField(max_length=100)  # Nombre del modelo (TaxRating, Issuer, etc.)
    descripcion = models.CharField(max_length=255, blank=True)
    
    # Antes y después (JSON)
    datos_anterior = models.JSONField(null=True, blank=True, help_text="Datos antes de la acción")
    datos_nuevo = models.JSONField(null=True, blank=True, help_text="Datos después de la acción")
    
    # IP y navegador (para seguridad)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        indexes = [
            models.Index(fields=['usuario', 'creado_en']),
            models.Index(fields=['accion', 'creado_en']),
            models.Index(fields=['modelo', 'creado_en']),
        ]

    def __str__(self):
        return f"{self.accion} - {self.modelo} - {self.usuario} - {self.creado_en.strftime('%Y-%m-%d %H:%M:%S')}"
