from django.shortcuts import render
from .models import CalificacionTributaria

def inicio(request):
    calificaciones = CalificacionTributaria.objects.select_related('contribuyente', 'estado').all()
    return render(request, 'inicio.html', {'calificaciones': calificaciones})
