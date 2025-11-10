from django.db import models
from django.conf import settings
from parametros.models import Parametro

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
