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
