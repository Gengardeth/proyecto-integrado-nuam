from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .audit_models import AuditLog
from parametros.models import Issuer, Instrument
from calificacionfiscal.models import TaxRating
import json

def get_model_data(instance):
    """Extrae los datos de una instancia como diccionario."""
    data = {}
    for field in instance._meta.fields:
        value = getattr(instance, field.name)
        # Convierte valores no serializables a string
        if hasattr(value, 'isoformat'):
            data[field.name] = value.isoformat()
        elif isinstance(value, bool):
            data[field.name] = value
        else:
            data[field.name] = str(value) if value is not None else None
    return data

@receiver(post_save, sender=Issuer)
def audit_issuer_change(sender, instance, created, **kwargs):
    """Registra cambios en Issuer."""
    accion = 'CREATE' if created else 'UPDATE'
    AuditLog.objects.create(
        usuario=getattr(instance, '_audit_user', None),
        accion=accion,
        modelo='Issuer',
        descripcion=f"{accion}: {instance.nombre}",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(Issuer),
        datos_nuevo=get_model_data(instance),
    )

@receiver(post_delete, sender=Issuer)
def audit_issuer_delete(sender, instance, **kwargs):
    """Registra eliminación de Issuer."""
    AuditLog.objects.create(
        usuario=getattr(instance, '_audit_user', None),
        accion='DELETE',
        modelo='Issuer',
        descripcion=f"DELETE: {instance.nombre}",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(Issuer),
        datos_anterior=get_model_data(instance),
    )

@receiver(post_save, sender=Instrument)
def audit_instrument_change(sender, instance, created, **kwargs):
    """Registra cambios en Instrument."""
    accion = 'CREATE' if created else 'UPDATE'
    AuditLog.objects.create(
        usuario=getattr(instance, '_audit_user', None),
        accion=accion,
        modelo='Instrument',
        descripcion=f"{accion}: {instance.nombre}",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(Instrument),
        datos_nuevo=get_model_data(instance),
    )

@receiver(post_delete, sender=Instrument)
def audit_instrument_delete(sender, instance, **kwargs):
    """Registra eliminación de Instrument."""
    AuditLog.objects.create(
        usuario=getattr(instance, '_audit_user', None),
        accion='DELETE',
        modelo='Instrument',
        descripcion=f"DELETE: {instance.nombre}",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(Instrument),
        datos_anterior=get_model_data(instance),
    )

@receiver(post_save, sender=TaxRating)
def audit_taxrating_change(sender, instance, created, **kwargs):
    """Registra cambios en TaxRating."""
    accion = 'CREATE' if created else 'UPDATE'
    AuditLog.objects.create(
        usuario=instance.analista if instance.analista else None,
        accion=accion,
        modelo='TaxRating',
        descripcion=f"{accion}: {instance.issuer.nombre} - {instance.instrument.nombre} ({instance.rating})",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(TaxRating),
        datos_nuevo=get_model_data(instance),
    )

@receiver(post_delete, sender=TaxRating)
def audit_taxrating_delete(sender, instance, **kwargs):
    """Registra eliminación de TaxRating."""
    AuditLog.objects.create(
        usuario=instance.analista if instance.analista else None,
        accion='DELETE',
        modelo='TaxRating',
        descripcion=f"DELETE: {instance.issuer.nombre} - {instance.instrument.nombre}",
        object_id=str(instance.id),
        content_type=ContentType.objects.get_for_model(TaxRating),
        datos_anterior=get_model_data(instance),
    )
