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
    Relaciona Issuer, Instrument con su calificación, nivel de riesgo y fecha de vigencia.
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
    
    RISK_LEVEL_CHOICES = [
        ('MUY_BAJO', 'Muy Bajo'),
        ('BAJO', 'Bajo'),
        ('MODERADO', 'Moderado'),
        ('ALTO', 'Alto'),
        ('MUY_ALTO', 'Muy Alto'),
    ]
    
    STATUS_CHOICES = [
        ('VIGENTE', 'Vigente'),
        ('VENCIDO', 'Vencido'),
        ('SUSPENDIDO', 'Suspendido'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    issuer = models.ForeignKey(Issuer, on_delete=models.PROTECT, related_name='tax_ratings')
    instrument = models.ForeignKey(Instrument, on_delete=models.PROTECT, related_name='tax_ratings')
    rating = models.CharField(max_length=10, choices=RATING_CHOICES)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='MODERADO')
    valid_from = models.DateField(verbose_name='Válido desde')
    valid_to = models.DateField(null=True, blank=True, verbose_name='Válido hasta')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='VIGENTE')
    comments = models.TextField(blank=True, verbose_name='Comentarios')
    analista = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tax_ratings_creados')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    
    class Meta:
        ordering = ['-valid_from']
        unique_together = ('issuer', 'instrument', 'valid_from')
        verbose_name = 'Calificación Tributaria'
        verbose_name_plural = 'Calificaciones Tributarias'
        indexes = [
            models.Index(fields=['issuer', 'valid_from']),
            models.Index(fields=['instrument', 'valid_from']),
            models.Index(fields=['rating']),
            models.Index(fields=['status']),
            models.Index(fields=['creado_en']),
        ]

    def __str__(self):
        return f"{self.issuer.nombre} - {self.instrument.nombre} ({self.rating}) - {self.valid_from}"


class BulkUpload(models.Model):
    """
    Modelo para gestionar cargas masivas de datos desde archivos UTF-8.
    Registra el estado del proceso y resultados.
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('RECHAZADO', 'Rechazado'),
        ('ERROR', 'Error'),
    ]
    
    TIPO_CHOICES = [
        ('UTF8', 'UTF-8'),
    ]
    
    archivo = models.FileField(upload_to='bulk_uploads/%Y/%m/%d/')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='bulk_uploads')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    total_filas = models.IntegerField(default=0)
    filas_ok = models.IntegerField(default=0)
    filas_error = models.IntegerField(default=0)
    resumen_errores = models.JSONField(default=dict, blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Carga Masiva'
        verbose_name_plural = 'Cargas Masivas'
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['creado_en']),
        ]
    
    def __str__(self):
        return f"Carga {self.id} - {self.estado} ({self.usuario.username if self.usuario else 'N/A'})"
    
    @property
    def porcentaje_exito(self):
        if self.total_filas == 0:
            return 0
        return round((self.filas_ok / self.total_filas) * 100, 2)


class BulkUploadItem(models.Model):
    """
    Modelo para registrar cada fila procesada en una carga masiva.
    Permite trazabilidad y debugging.
    """
    ESTADO_CHOICES = [
        ('OK', 'OK'),
        ('ERROR', 'Error'),
    ]
    
    bulk_upload = models.ForeignKey(BulkUpload, on_delete=models.CASCADE, related_name='items')
    numero_fila = models.IntegerField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES)
    mensaje_error = models.CharField(max_length=500, blank=True)
    datos = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['numero_fila']
        verbose_name = 'Item de Carga Masiva'
        verbose_name_plural = 'Items de Carga Masiva'
        indexes = [
            models.Index(fields=['bulk_upload', 'estado']),
        ]
    
    def __str__(self):
        return f"Fila {self.numero_fila} - {self.estado}"

