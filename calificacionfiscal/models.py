from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from parametros.models import Parametro, Issuer, Instrument

class Contribuyente(models.Model):
    rut = models.CharField(max_length=12, unique=True)
    razon_social = models.CharField(max_length=150)
    giro = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"{self.rut} - {self.razon_social}"

class CalificacionTributaria(models.Model):
    contribuyente = models.ForeignKey(Contribuyente, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    estado = models.ForeignKey(Parametro, on_delete=models.PROTECT, related_name='estados')
    puntaje_total = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Calificación de {self.contribuyente.razon_social} ({self.estado.nombre})"


class TaxRating(models.Model):
    """
    Modelo para Calificación Tributaria.
    Relaciona Issuer, Instrument con su calificación y fecha.
    """
    RATING_CHOICES = [
        ('AAA', 'AAA - Riesgo muy bajo'),
        ('AA', 'AA - Riesgo bajo'),
        ('A', 'A - Riesgo bajo a moderado'),
        ('BBB', 'BBB - Riesgo moderado'),
        ('BB', 'BB - Riesgo moderado a alto'),
        ('B', 'B - Riesgo alto'),
        ('CCC', 'CCC - Riesgo muy alto'),
        ('CC', 'CC - Riesgo muy alto'),
        ('C', 'C - Riesgo muy alto'),
        ('D', 'D - En incumplimiento'),
    ]
    
    issuer = models.ForeignKey(Issuer, on_delete=models.PROTECT, related_name='tax_ratings')
    instrument = models.ForeignKey(Instrument, on_delete=models.PROTECT, related_name='tax_ratings')
    rating = models.CharField(max_length=10, choices=RATING_CHOICES)
    fecha_rating = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    analista = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tax_ratings_creados')
    outlook = models.CharField(max_length=20, choices=[('POSITIVO', 'Positivo'), ('ESTABLE', 'Estable'), ('NEGATIVO', 'Negativo')], default='ESTABLE')
    notas = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_rating']
        unique_together = ('issuer', 'instrument', 'fecha_rating')
        verbose_name = 'Calificación Tributaria'
        verbose_name_plural = 'Calificaciones Tributarias'
        indexes = [
            models.Index(fields=['issuer', 'fecha_rating']),
            models.Index(fields=['instrument', 'fecha_rating']),
            models.Index(fields=['rating']),
            models.Index(fields=['creado_en']),
        ]

    def __str__(self):
        return f"{self.issuer.nombre} - {self.instrument.nombre} ({self.rating}) - {self.fecha_rating}"

