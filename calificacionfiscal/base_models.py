"""
Modelos base para la aplicación.
Contiene clases abstractas reutilizables.
"""
from django.db import models


class TimeStampedModel(models.Model):
    """
    Modelo abstracto que proporciona campos de timestamp automáticos.
    Todas las entidades que hereden de esta clase tendrán campos created_at y updated_at.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')
    
    class Meta:
        abstract = True
