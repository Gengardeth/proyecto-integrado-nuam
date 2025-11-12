from django.db import models

class TipoParametro(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

class Parametro(models.Model):
    tipo = models.ForeignKey(TipoParametro, on_delete=models.CASCADE, related_name='parametros')
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tipo', 'codigo')
        verbose_name = 'Parámetro'
        verbose_name_plural = 'Parámetros'

    def __str__(self):
        return f"{self.tipo.nombre} - {self.nombre}"


class Issuer(models.Model):
    """
    Modelo para Emisor de instrumentos financieros.
    Ej: Banco, Empresa, etc.
    """
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    razon_social = models.CharField(max_length=250, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Emisor'
        verbose_name_plural = 'Emisores'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Instrument(models.Model):
    """
    Modelo para Instrumento financiero.
    Ej: Bono, Acción, etc.
    """
    TIPO_CHOICES = [
        ('BONO', 'Bono'),
        ('ACCION', 'Acción'),
        ('PAGARE', 'Pagaré'),
        ('LETRA', 'Letra'),
        ('OTRO', 'Otro'),
    ]
    
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='OTRO')
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Instrumento'
        verbose_name_plural = 'Instrumentos'

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_tipo_display()})"

