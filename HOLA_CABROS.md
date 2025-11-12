# 🚀 HOLA CABROS - GUÍA COMPLETA PARA LOS PRÓXIMOS SPRINTS

> **Archivo de Contexto Completo para IA/Desarrolladores**  
> Este documento contiene TODO lo que necesitan saber para continuar con los Sprints 2-4

---

## 📋 ÍNDICE RÁPIDO

1. [Estado Actual (Sprint 1 ✅)](#estado-actual-sprint-1-completado)
2. [Sprint 2: Carga Masiva + Reportes](#sprint-2-carga-masiva--reportes)
3. [Sprint 3: Frontend React](#sprint-3-frontend-react)
4. [Sprint 4: Tests + DevOps](#sprint-4-tests--devops)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Arquitectura Actual](#arquitectura-actual)
7. [Instrucciones Detalladas por Sprint](#instrucciones-detalladas-por-sprint)

---

## Estado Actual (Sprint 1 COMPLETADO ✅)

### Lo Que Ya Existe

**Backend API REST funcionando con:**
- ✅ 6 modelos Django (Usuario, Issuer, Instrument, TaxRating, AuditLog, + 2 heredados)
- ✅ 4 ViewSets con 30+ endpoints REST
- ✅ Sistema RBAC completo (3 roles: ADMIN, ANALISTA, AUDITOR)
- ✅ Auditoría automática con AuditLog (8 Django signals)
- ✅ Middleware para captura de IP y User-Agent
- ✅ Admin Django funcional para todos los modelos
- ✅ 4 migraciones versionadas
- ✅ 3 usuarios demo (admin, analista, auditor)
- ✅ 10 documentos de documentación

**Problemas Conocidos:**
- ❌ PostgreSQL requiere configuración (credentials en settings.py)
- ❌ Puedes usar SQLite en desarrollo si no tienes Postgres disponible

**Endpoints Existentes:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/roles
GET    /api/v1/health

GET/POST   /api/v1/issuers
GET/PUT/DELETE /api/v1/issuers/{id}
GET    /api/v1/issuers/activos

GET/POST   /api/v1/instruments
GET/PUT/DELETE /api/v1/instruments/{id}
GET    /api/v1/instruments/activos
GET    /api/v1/instruments/por-tipo

GET/POST   /api/v1/tax-ratings
GET/PUT/DELETE /api/v1/tax-ratings/{id}
GET    /api/v1/tax-ratings/ultimas
GET    /api/v1/tax-ratings/por-issuer
GET    /api/v1/tax-ratings/por-rango-fecha
PATCH  /api/v1/tax-ratings/{id}/cambiar-estado

GET    /api/v1/audit-logs
GET    /api/v1/audit-logs/{id}
GET    /api/v1/audit-logs/por-usuario
GET    /api/v1/audit-logs/por-accion
GET    /api/v1/audit-logs/por-modelo
GET    /api/v1/audit-logs/resumen
```

---

## 🎯 SPRINT 2: CARGA MASIVA + REPORTES (2 semanas)

### Objetivo
Permitir que usuarios **Analista** suban masivamente calificaciones desde archivos CSV/XLSX y generen reportes filtrados con exportación a CSV/PDF.

### 2.1 CARGA MASIVA (CSV/XLSX) - Semana 1

#### 2.1.1 Crear Modelos

**Archivo:** `calificacionfiscal/models.py` (agregar al final)

```python
from django.db import models
from django.core.files.storage import default_storage
import json

class BulkUpload(models.Model):
    """Registro de cargas masivas de calificaciones"""
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('ERROR', 'Error'),
    ]
    
    archivo = models.FileField(upload_to='bulk_uploads/')
    tipo = models.CharField(max_length=10, choices=[('CSV', 'CSV'), ('XLSX', 'Excel')])
    usuario = models.ForeignKey('cuentas.Usuario', on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    
    # Estadísticas
    total_filas = models.IntegerField(default=0)
    filas_ok = models.IntegerField(default=0)
    filas_error = models.IntegerField(default=0)
    
    # Errores detallados
    resumen_errores = models.JSONField(default=dict, blank=True)
    # Formato: {
    #   "fila_2": ["Campo issuer_id no existe"],
    #   "fila_5": ["Rating inválido: XYZ", "Fecha vencimiento menor a rating"]
    # }
    
    # Timestamps
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['usuario', '-fecha_inicio']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"Carga {self.id} - {self.estado}"


class BulkUploadItem(models.Model):
    """Detalle de cada fila en una carga masiva"""
    
    STATUS_CHOICES = [
        ('OK', 'OK'),
        ('ERROR', 'Error'),
    ]
    
    bulk_upload = models.ForeignKey(BulkUpload, on_delete=models.CASCADE, related_name='items')
    numero_fila = models.IntegerField()
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    # Datos raw de la fila
    datos_raw = models.JSONField()
    # Formato: {"issuer_id": "1", "instrument_id": "2", "rating": "AAA", "fecha_rating": "2025-11-12", ...}
    
    # Si se creó exitosamente
    tax_rating = models.ForeignKey(TaxRating, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Errores de la fila
    errores = models.JSONField(default=list, blank=True)
    # Formato: ["Campo issuer_id no existe", "Rating inválido: XYZ"]
    
    class Meta:
        ordering = ['numero_fila']
        indexes = [
            models.Index(fields=['bulk_upload', 'estado']),
        ]
    
    def __str__(self):
        return f"Item {self.numero_fila} - {self.estado}"
```

**Agregar a migrations:**
```bash
python manage.py makemigrations calificacionfiscal
# Esto creará: calificacionfiscal/migrations/0004_bulkupload_bulkuploaditem.py
```

#### 2.1.2 Crear Parser CSV/XLSX

**Archivo:** `calificacionfiscal/parsers.py` (NUEVO)

```python
import csv
from io import StringIO, BytesIO
import json
from datetime import datetime
from decimal import Decimal

class BulkUploadParser:
    """Parser para archivos CSV/XLSX"""
    
    CAMPOS_REQUERIDOS = [
        'issuer_id',
        'instrument_id',
        'rating',
        'fecha_rating',
        'fecha_vencimiento',
        'outlook',
    ]
    
    CAMPOS_OPCIONALES = [
        'notas',
        'analista_id',  # Si no se proporciona, usa el usuario actual
    ]
    
    RATINGS_VALIDOS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D']
    OUTLOOKS_VALIDOS = ['POSITIVO', 'ESTABLE', 'NEGATIVO']
    
    @staticmethod
    def parse_csv(contenido_archivo, usuario):
        """
        Parsear archivo CSV
        
        Args:
            contenido_archivo: FileField del modelo BulkUpload
            usuario: Usuario que hizo la carga (para analista por defecto)
            
        Returns:
            dict: {
                'filas': [
                    {
                        'numero': 2,
                        'datos': {...},
                        'errores': [...]
                    }
                ],
                'total_filas': N,
                'filas_ok': M,
                'filas_error': K,
                'resumen_errores': {...}
            }
        """
        resultado = {
            'filas': [],
            'total_filas': 0,
            'filas_ok': 0,
            'filas_error': 0,
            'resumen_errores': {}
        }
        
        try:
            # Leer contenido del archivo
            contenido = contenido_archivo.read()
            if isinstance(contenido, bytes):
                contenido = contenido.decode('utf-8')
            
            # Parsear CSV
            lector = csv.DictReader(StringIO(contenido))
            numero_fila = 1
            
            for row in lector:
                numero_fila += 1  # Header es fila 1
                resultado['total_filas'] += 1
                
                # Validar fila
                errores = BulkUploadParser.validar_fila(row, usuario)
                
                fila_result = {
                    'numero': numero_fila,
                    'datos': row,
                    'errores': errores,
                    'estado': 'ERROR' if errores else 'OK'
                }
                
                resultado['filas'].append(fila_result)
                
                if errores:
                    resultado['filas_error'] += 1
                    resultado['resumen_errores'][f'fila_{numero_fila}'] = errores
                else:
                    resultado['filas_ok'] += 1
            
        except Exception as e:
            resultado['resumen_errores']['archivo'] = [str(e)]
        
        return resultado
    
    @staticmethod
    def parse_xlsx(contenido_archivo, usuario):
        """Parsear archivo XLSX - requiere openpyxl"""
        try:
            import openpyxl
        except ImportError:
            return {
                'resumen_errores': {
                    'archivo': ['Instala openpyxl: pip install openpyxl']
                }
            }
        
        resultado = {
            'filas': [],
            'total_filas': 0,
            'filas_ok': 0,
            'filas_error': 0,
            'resumen_errores': {}
        }
        
        try:
            # Leer XLSX
            contenido = contenido_archivo.read()
            wb = openpyxl.load_workbook(BytesIO(contenido))
            ws = wb.active
            
            # Leer header
            headers = [cell.value for cell in ws[1]]
            
            numero_fila = 1
            for row in ws.iter_rows(min_row=2, values_only=False):
                numero_fila += 1
                resultado['total_filas'] += 1
                
                # Convertir fila a dict
                row_dict = {}
                for idx, cell in enumerate(row):
                    if idx < len(headers):
                        row_dict[headers[idx]] = cell.value
                
                # Validar fila
                errores = BulkUploadParser.validar_fila(row_dict, usuario)
                
                fila_result = {
                    'numero': numero_fila,
                    'datos': row_dict,
                    'errores': errores,
                    'estado': 'ERROR' if errores else 'OK'
                }
                
                resultado['filas'].append(fila_result)
                
                if errores:
                    resultado['filas_error'] += 1
                    resultado['resumen_errores'][f'fila_{numero_fila}'] = errores
                else:
                    resultado['filas_ok'] += 1
        
        except Exception as e:
            resultado['resumen_errores']['archivo'] = [str(e)]
        
        return resultado
    
    @staticmethod
    def validar_fila(row, usuario):
        """
        Validar una fila individual
        
        Returns:
            list: Lista de errores encontrados (vacía si es válida)
        """
        errores = []
        
        # Validar campos requeridos
        for campo in BulkUploadParser.CAMPOS_REQUERIDOS:
            if not row.get(campo):
                errores.append(f"Campo '{campo}' es requerido")
        
        if errores:
            return errores
        
        # Validar issuer existe
        try:
            from parametros.models import Issuer
            issuer_id = row.get('issuer_id')
            if not Issuer.objects.filter(id=issuer_id).exists():
                errores.append(f"Issuer con ID '{issuer_id}' no existe")
        except:
            errores.append("Error validando Issuer")
        
        # Validar instrument existe
        try:
            from parametros.models import Instrument
            instrument_id = row.get('instrument_id')
            if not Instrument.objects.filter(id=instrument_id).exists():
                errores.append(f"Instrument con ID '{instrument_id}' no existe")
        except:
            errores.append("Error validando Instrument")
        
        # Validar rating
        rating = row.get('rating', '').upper()
        if rating not in BulkUploadParser.RATINGS_VALIDOS:
            errores.append(f"Rating '{rating}' inválido. Válidos: {', '.join(BulkUploadParser.RATINGS_VALIDOS)}")
        
        # Validar outlook
        outlook = row.get('outlook', '').upper()
        if outlook not in BulkUploadParser.OUTLOOKS_VALIDOS:
            errores.append(f"Outlook '{outlook}' inválido. Válidos: {', '.join(BulkUploadParser.OUTLOOKS_VALIDOS)}")
        
        # Validar fechas
        try:
            fecha_rating = datetime.strptime(row.get('fecha_rating'), '%Y-%m-%d').date()
            fecha_vencimiento = datetime.strptime(row.get('fecha_vencimiento'), '%Y-%m-%d').date()
            if fecha_vencimiento <= fecha_rating:
                errores.append("Fecha vencimiento debe ser posterior a fecha rating")
        except ValueError as e:
            errores.append(f"Formato de fecha inválido (usar YYYY-MM-DD): {e}")
        
        return errores
```

**Instalar dependencias:**
```bash
pip install openpyxl pandas
pip freeze > requirements.txt
```

#### 2.1.3 Crear Serializers

**Archivo:** `calificacionfiscal/serializers.py` (agregar al final)

```python
from rest_framework import serializers
from .models import BulkUpload, BulkUploadItem

class BulkUploadItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkUploadItem
        fields = ['id', 'numero_fila', 'estado', 'datos_raw', 'tax_rating', 'errores']
        read_only_fields = ['id', 'estado', 'errores', 'tax_rating']

class BulkUploadSerializer(serializers.ModelSerializer):
    items = BulkUploadItemSerializer(many=True, read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = BulkUpload
        fields = [
            'id', 'archivo', 'tipo', 'usuario', 'usuario_nombre',
            'estado', 'total_filas', 'filas_ok', 'filas_error',
            'resumen_errores', 'fecha_inicio', 'fecha_fin', 'items'
        ]
        read_only_fields = [
            'id', 'usuario', 'estado', 'total_filas', 'filas_ok',
            'filas_error', 'resumen_errores', 'fecha_inicio', 'fecha_fin'
        ]
    
    def validate_archivo(self, value):
        """Validar que el archivo sea CSV o XLSX"""
        nombre_archivo = value.name.lower()
        if not (nombre_archivo.endswith('.csv') or nombre_archivo.endswith('.xlsx')):
            raise serializers.ValidationError(
                "Archivo debe ser CSV o XLSX"
            )
        
        # Validar tamaño (máximo 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "Archivo no puede superar 10MB"
            )
        
        return value
```

#### 2.1.4 Crear ViewSet

**Archivo:** `calificacionfiscal/views.py` (agregar al final)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import BulkUpload, BulkUploadItem, TaxRating
from .serializers import BulkUploadSerializer, BulkUploadItemSerializer
from .parsers import BulkUploadParser

class BulkUploadViewSet(viewsets.ModelViewSet):
    """ViewSet para cargas masivas de TaxRatings"""
    
    queryset = BulkUpload.objects.all()
    serializer_class = BulkUploadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Usuarios Analista ven solo sus propias cargas, Admin ve todas"""
        if self.request.user.is_admin:
            return BulkUpload.objects.all()
        return BulkUpload.objects.filter(usuario=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Crear nueva carga masiva
        
        POST /api/v1/bulk-uploads/
        {
            "archivo": <file>,
            "tipo": "CSV" o "XLSX"
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Crear instancia de BulkUpload
        bulk_upload = BulkUpload.objects.create(
            archivo=serializer.validated_data['archivo'],
            tipo=serializer.validated_data['tipo'],
            usuario=request.user,
            estado='PROCESANDO'
        )
        
        # Parsear archivo
        if bulk_upload.tipo == 'CSV':
            resultado = BulkUploadParser.parse_csv(bulk_upload.archivo, request.user)
        else:
            resultado = BulkUploadParser.parse_xlsx(bulk_upload.archivo, request.user)
        
        # Guardar resultado en BD
        with transaction.atomic():
            bulk_upload.total_filas = resultado['total_filas']
            bulk_upload.filas_ok = resultado['filas_ok']
            bulk_upload.filas_error = resultado['filas_error']
            bulk_upload.resumen_errores = resultado['resumen_errores']
            
            # Crear items
            for fila in resultado['filas']:
                BulkUploadItem.objects.create(
                    bulk_upload=bulk_upload,
                    numero_fila=fila['numero'],
                    estado=fila['estado'],
                    datos_raw=fila['datos'],
                    errores=fila['errores']
                )
                
                # Si la fila es válida, crear TaxRating
                if fila['estado'] == 'OK':
                    try:
                        tax_rating = TaxRating.objects.create(
                            issuer_id=fila['datos']['issuer_id'],
                            instrument_id=fila['datos']['instrument_id'],
                            rating=fila['datos']['rating'],
                            fecha_rating=fila['datos']['fecha_rating'],
                            fecha_vencimiento=fila['datos']['fecha_vencimiento'],
                            outlook=fila['datos']['outlook'],
                            notas=fila['datos'].get('notas', ''),
                            analista=request.user
                        )
                        
                        # Actualizar referencia en BulkUploadItem
                        BulkUploadItem.objects.filter(
                            bulk_upload=bulk_upload,
                            numero_fila=fila['numero']
                        ).update(tax_rating=tax_rating)
                    
                    except Exception as e:
                        # Marcar como error si falla creación
                        BulkUploadItem.objects.filter(
                            bulk_upload=bulk_upload,
                            numero_fila=fila['numero']
                        ).update(
                            estado='ERROR',
                            errores=[str(e)]
                        )
            
            # Finalizar carga
            bulk_upload.estado = 'COMPLETADO' if resultado['filas_error'] == 0 else 'COMPLETADO'
            bulk_upload.fecha_fin = timezone.now()
            bulk_upload.save()
        
        # Retornar respuesta
        return Response(
            self.get_serializer(bulk_upload).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """
        GET /api/v1/bulk-uploads/{id}/items/
        Obtener todos los items de una carga
        """
        bulk_upload = self.get_object()
        items = bulk_upload.items.all()
        
        # Filtrar por estado si se proporciona
        estado = request.query_params.get('estado')
        if estado:
            items = items.filter(estado=estado)
        
        serializer = BulkUploadItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def resumen(self, request, pk=None):
        """
        GET /api/v1/bulk-uploads/{id}/resumen/
        Obtener resumen de la carga
        """
        bulk_upload = self.get_object()
        
        return Response({
            'id': bulk_upload.id,
            'total_filas': bulk_upload.total_filas,
            'filas_ok': bulk_upload.filas_ok,
            'filas_error': bulk_upload.filas_error,
            'porcentaje_exito': (bulk_upload.filas_ok / bulk_upload.total_filas * 100) if bulk_upload.total_filas > 0 else 0,
            'estado': bulk_upload.estado,
            'fecha_inicio': bulk_upload.fecha_inicio,
            'fecha_fin': bulk_upload.fecha_fin,
            'errores': bulk_upload.resumen_errores
        })
    
    @action(detail=True, methods=['post'])
    def reintentar(self, request, pk=None):
        """
        POST /api/v1/bulk-uploads/{id}/reintentar/
        Reintentar creación de items que fallaron
        """
        bulk_upload = self.get_object()
        items_error = bulk_upload.items.filter(estado='ERROR')
        
        if not items_error.exists():
            return Response(
                {'detail': 'No hay items con error para reintentar'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implementar lógica de reintento
        return Response({'detail': 'Reintentos pendientes de implementar'})
```

**Registrar en urls.py:**

```python
# calificacionfiscal/urls.py
from rest_framework.routers import DefaultRouter
from .views import TaxRatingViewSet, BulkUploadViewSet

router = DefaultRouter()
router.register(r'tax-ratings', TaxRatingViewSet)
router.register(r'bulk-uploads', BulkUploadViewSet)

urlpatterns = router.urls
```

#### 2.1.5 Registrar en Admin

**Archivo:** `calificacionfiscal/admin.py` (agregar al final)

```python
class BulkUploadItemInline(admin.TabularInline):
    model = BulkUploadItem
    extra = 0
    readonly_fields = ['numero_fila', 'estado', 'datos_raw', 'errores', 'tax_rating']
    fields = ['numero_fila', 'estado', 'errores', 'tax_rating']

@admin.register(BulkUpload)
class BulkUploadAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'tipo', 'estado', 'filas_ok', 'filas_error', 'fecha_inicio']
    list_filter = ['estado', 'tipo', 'fecha_inicio']
    search_fields = ['usuario__username', 'id']
    readonly_fields = [
        'total_filas', 'filas_ok', 'filas_error', 'resumen_errores',
        'fecha_inicio', 'fecha_fin', 'usuario'
    ]
    
    fieldsets = (
        ('Información General', {
            'fields': ('archivo', 'tipo', 'usuario', 'estado')
        }),
        ('Estadísticas', {
            'fields': ('total_filas', 'filas_ok', 'filas_error')
        }),
        ('Errores', {
            'fields': ('resumen_errores',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
    )
    
    inlines = [BulkUploadItemInline]

@admin.register(BulkUploadItem)
class BulkUploadItemAdmin(admin.ModelAdmin):
    list_display = ['numero_fila', 'bulk_upload', 'estado', 'tax_rating']
    list_filter = ['estado', 'bulk_upload__usuario']
    search_fields = ['bulk_upload__id', 'numero_fila']
    readonly_fields = ['numero_fila', 'estado', 'datos_raw', 'errores']
```

---

### 2.2 REPORTES Y EXPORTACIÓN - Semana 2

#### 2.2.1 Crear Modelo Report

**Archivo:** `calificacionfiscal/models.py` (agregar al final)

```python
class Report(models.Model):
    """Caché de reportes generados"""
    
    usuario = models.ForeignKey('cuentas.Usuario', on_delete=models.PROTECT)
    tipo = models.CharField(max_length=20)  # 'summary', 'by_issuer', etc
    filtros = models.JSONField(default=dict)
    # Formato: {"fecha_desde": "2025-11-01", "fecha_hasta": "2025-11-30", "issuer_id": 1}
    
    datos = models.JSONField()
    formato = models.CharField(max_length=10, choices=[('JSON', 'JSON'), ('CSV', 'CSV'), ('PDF', 'PDF')])
    
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-creado_en']
```

#### 2.2.2 Crear Generador de Reportes

**Archivo:** `calificacionfiscal/reports.py` (NUEVO)

```python
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import TaxRating

class ReportGenerator:
    """Generador de reportes de calificaciones"""
    
    @staticmethod
    def resumen_general(fecha_desde=None, fecha_hasta=None, issuer_id=None):
        """
        Generar resumen general de calificaciones
        
        Returns:
            {
                'total_ratings': N,
                'ratings_por_calificacion': {...},
                'ratings_por_outlook': {...},
                'ratings_por_issuer': [...],
                'fecha_generacion': '...',
                'filtros_aplicados': {...}
            }
        """
        queryset = TaxRating.objects.filter(activo=True)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_rating__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_rating__lte=fecha_hasta)
        if issuer_id:
            queryset = queryset.filter(issuer_id=issuer_id)
        
        # Estadísticas generales
        total = queryset.count()
        
        # Por calificación
        ratings = queryset.values('rating').annotate(
            cantidad=Count('id')
        ).order_by('rating')
        
        # Por outlook
        outlooks = queryset.values('outlook').annotate(
            cantidad=Count('id')
        )
        
        # Por issuer (top 10)
        issuers = queryset.values(
            'issuer__nombre',
            'issuer__id'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]
        
        return {
            'total_ratings': total,
            'ratings_por_calificacion': list(ratings),
            'ratings_por_outlook': list(outlooks),
            'top_issuers': list(issuers),
            'fecha_generacion': timezone.now().isoformat(),
            'filtros_aplicados': {
                'fecha_desde': str(fecha_desde) if fecha_desde else None,
                'fecha_hasta': str(fecha_hasta) if fecha_hasta else None,
                'issuer_id': issuer_id
            }
        }
    
    @staticmethod
    def historico_por_fecha(fecha_desde=None, fecha_hasta=None):
        """Histórico de ratings por fecha"""
        if not fecha_desde:
            fecha_desde = timezone.now().date() - timedelta(days=90)
        if not fecha_hasta:
            fecha_hasta = timezone.now().date()
        
        queryset = TaxRating.objects.filter(
            fecha_rating__gte=fecha_desde,
            fecha_rating__lte=fecha_hasta,
            activo=True
        ).values('fecha_rating').annotate(
            cantidad=Count('id')
        ).order_by('fecha_rating')
        
        return list(queryset)
```

#### 2.2.3 Crear ViewSet de Reportes

**Archivo:** `calificacionfiscal/views.py` (agregar al final)

```python
from rest_framework.decorators import action
from .reports import ReportGenerator
import csv
from django.http import HttpResponse

class ReportViewSet(viewsets.ViewSet):
    """ViewSet para generación de reportes"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        GET /api/v1/reports/summary/
        ?fecha_desde=2025-11-01&fecha_hasta=2025-11-30&issuer_id=1&formato=json
        
        Generar resumen general
        """
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        issuer_id = request.query_params.get('issuer_id')
        formato = request.query_params.get('formato', 'json').lower()
        
        # Generar reporte
        datos = ReportGenerator.resumen_general(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            issuer_id=issuer_id
        )
        
        if formato == 'json':
            return Response(datos)
        
        elif formato == 'csv':
            # Exportar a CSV
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="reporte_resumen.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['REPORTE RESUMEN DE CALIFICACIONES'])
            writer.writerow(['Generado en:', datos['fecha_generacion']])
            writer.writerow([])
            
            # Tabla principal
            writer.writerow(['ESTADÍSTICA', 'VALOR'])
            writer.writerow(['Total Ratings', datos['total_ratings']])
            
            writer.writerow([])
            writer.writerow(['RATINGS POR CALIFICACIÓN'])
            writer.writerow(['Calificación', 'Cantidad'])
            for item in datos['ratings_por_calificacion']:
                writer.writerow([item['rating'], item['cantidad']])
            
            return response
        
        elif formato == 'pdf':
            # TODO: Implementar exportación a PDF con reportlab
            return Response(
                {'detail': 'Exportación PDF en desarrollo'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
    
    @action(detail=False, methods=['get'])
    def historico(self, request):
        """
        GET /api/v1/reports/historico/
        ?fecha_desde=2025-11-01&fecha_hasta=2025-11-30
        
        Histórico por fecha
        """
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        datos = ReportGenerator.historico_por_fecha(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )
        
        return Response(datos)
```

**Registrar en urls.py:**

```python
from .views import ReportViewSet

urlpatterns = [
    ...
    path('reports/', ReportViewSet.as_view({
        'get': 'summary'
    }), name='reports-summary'),
    path('reports/historico/', ReportViewSet.as_view({
        'get': 'historico'
    }), name='reports-historico'),
]
```

#### 2.2.4 Tests para Sprint 2

**Archivo:** `calificacionfiscal/tests.py` (agregar)

```python
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from cuentas.models import Usuario
from parametros.models import Issuer, Instrument
from .models import BulkUpload, TaxRating
from .parsers import BulkUploadParser
from io import StringIO

class BulkUploadParserTest(TestCase):
    
    def setUp(self):
        self.issuer = Issuer.objects.create(codigo='ISSUER1', nombre='Issuer Test')
        self.instrument = Instrument.objects.create(codigo='INST1', nombre='Instrument Test')
        self.usuario = Usuario.objects.create_user(username='test', password='test123')
    
    def test_parser_csv_valido(self):
        """Test parsear CSV válido"""
        csv_content = """issuer_id,instrument_id,rating,fecha_rating,fecha_vencimiento,outlook
1,1,AAA,2025-11-12,2025-12-12,ESTABLE"""
        
        # TODO: Implementar test
        pass
    
    def test_parser_csv_invalido(self):
        """Test parsear CSV con errores"""
        # TODO: Implementar test
        pass

class BulkUploadAPITest(APITestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.usuario = Usuario.objects.create_user(
            username='analista',
            password='test123',
            rol='ANALISTA'
        )
        self.client.force_authenticate(user=self.usuario)
    
    def test_crear_bulk_upload(self):
        """Test crear carga masiva"""
        # TODO: Implementar test
        pass
```

---

## 🎨 SPRINT 3: FRONTEND REACT (2 semanas)

### Objetivo
Crear interfaz web con login, dashboard, CRUDs y carga masiva.

### 3.1 Setup React

**Ya existe:** `frontend/` con React 18 + Vite

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 3.2 Estructura de Componentes

```
src/
├── api/
│   └── client.js          # Configuración axios con base URL y auth
├── context/
│   └── AuthContext.jsx    # Context de autenticación y usuario
├── components/
│   ├── Layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   ├── Auth/
│   │   ├── LoginPage.jsx
│   │   └── PrivateRoute.jsx
│   ├── Dashboard/
│   │   ├── Dashboard.jsx
│   │   └── KPICard.jsx
│   ├── Issuers/
│   │   ├── IssuersList.jsx
│   │   ├── IssuerForm.jsx
│   │   └── IssuerDetail.jsx
│   ├── Instruments/
│   │   ├── InstrumentsList.jsx
│   │   └── InstrumentForm.jsx
│   ├── TaxRatings/
│   │   ├── TaxRatingsList.jsx
│   │   ├── TaxRatingForm.jsx
│   │   └── TaxRatingDetail.jsx
│   ├── BulkUpload/
│   │   ├── BulkUploadForm.jsx
│   │   ├── BulkUploadList.jsx
│   │   └── BulkUploadDetail.jsx
│   ├── Reports/
│   │   ├── ReportsDashboard.jsx
│   │   └── ReportFilters.jsx
│   └── Audit/
│       ├── AuditList.jsx
│       └── AuditDetail.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── NotFoundPage.jsx
│   └── ErrorPage.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useAPI.js
│   └── usePagination.js
├── utils/
│   ├── dateFormat.js
│   ├── validators.js
│   └── constants.js
├── App.jsx
└── main.jsx
```

### 3.3 Componentes Clave

```jsx
// src/api/client.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Interceptor para agregar token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

```jsx
// src/context/AuthContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const response = await client.post('/auth/login', { username, password });
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await client.post('/auth/logout');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await client.get('/auth/me');
      setUser(response.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.4 Páginas Principales

```jsx
// src/pages/LoginPage.jsx - Form login simple
// src/pages/DashboardPage.jsx - KPIs, gráficos, últimas acciones
// src/pages/IssuersPage.jsx - CRUD Issuers
// src/pages/TaxRatingsPage.jsx - CRUD TaxRatings
// src/pages/BulkUploadPage.jsx - Drag & drop, progreso, errores
// src/pages/ReportsPage.jsx - Filtros, exportación
// src/pages/AuditPage.jsx - Tabla auditoría con filtros
```

### 3.5 Testing

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
# Tests básicos con Vitest
```

---

## ✅ SPRINT 4: TESTS + DevOps (2 semanas)

### 4.1 Backend Tests (Python)

```bash
pip install pytest pytest-django pytest-cov
```

**Archivo:** `pytest.ini` (crear en root)

```ini
[pytest]
DJANGO_SETTINGS_MODULE = Nuam.settings
python_files = tests.py test_*.py *_tests.py
```

**Ejemplo:** `cuentas/tests/test_auth.py`

```python
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_login_exitoso():
    User.objects.create_user(username='test', password='test123')
    client = APIClient()
    
    response = client.post('/api/v1/auth/login', {
        'username': 'test',
        'password': 'test123'
    })
    
    assert response.status_code == 200
    assert 'token' in response.data

@pytest.mark.django_db
def test_login_fallido():
    client = APIClient()
    response = client.post('/api/v1/auth/login', {
        'username': 'inexistente',
        'password': 'wrong'
    })
    
    assert response.status_code == 401
```

**Ejecutar tests:**

```bash
pytest  # Todos
pytest cuentas/tests/test_auth.py  # Archivo específico
pytest --cov=.  # Con cobertura
```

### 4.2 Frontend Tests (Jest)

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

**Ejemplo:** `src/components/Auth/__tests__/LoginPage.test.jsx`

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

test('renderiza formulario de login', () => {
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
  
  expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
});

test('envía credenciales en submit', async () => {
  // TODO
});
```

### 4.3 Docker

**Archivo:** `Dockerfile` (crear en root)

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "Nuam.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**Archivo:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: proyecto_nuam
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Nuam290adminexchange@
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    command: >
      sh -c "python manage.py migrate &&
             python manage.py seed_users &&
             gunicorn Nuam.wsgi:application --bind 0.0.0.0:8000"
    ports:
      - "8000:8000"
    environment:
      DEBUG: "False"
      ALLOWED_HOSTS: "localhost,127.0.0.1"
      DB_ENGINE: django.db.backends.postgresql
      DB_NAME: proyecto_nuam
      DB_USER: postgres
      DB_PASSWORD: Nuam290adminexchange@
      DB_HOST: db
      DB_PORT: 5432
    depends_on:
      - db
    volumes:
      - .:/app

  frontend:
    image: node:18
    working_dir: /app/frontend
    command: npm run dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app/frontend
    environment:
      VITE_API_BASE_URL: http://localhost:8000/api/v1

volumes:
  postgres_data:
```

**Ejecutar:**

```bash
docker-compose up -d
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# DB: localhost:5432
```

### 4.4 CI/CD con GitHub Actions

**Archivo:** `.github/workflows/tests.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-django pytest-cov
      
      - name: Run tests
        run: pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 🏗️ ARQUITECTURA ACTUAL

```
proyecto-integrado-nuam/
├── Nuam/                    # Configuración Django
│   ├── settings.py         # Incluye INSTALLED_APPS, MIDDLEWARE, DB, etc
│   ├── urls.py             # Rutas principales (/api/v1/)
│   └── wsgi.py
├── cuentas/                # Autenticación + Auditoría
│   ├── models.py           # Usuario (RBAC), AuditLog
│   ├── views.py            # Auth endpoints, AuditLogViewSet
│   ├── serializers.py      # UsuarioSerializer, AuditLogSerializer
│   ├── urls.py             # Rutas auth
│   ├── signals.py          # 8 signals auto-registro
│   ├── audit_middleware.py # Captura IP/User-Agent
│   └── admin.py            # Admin setup
├── parametros/             # Catálogos
│   ├── models.py           # Issuer, Instrument
│   ├── views.py            # IssuersViewSet, InstrumentsViewSet
│   ├── serializers.py      # Serializers
│   ├── urls.py             # Rutas
│   └── admin.py            # Admin setup
├── calificacionfiscal/     # Ratings + Bulk + Reports (Sprint 2+)
│   ├── models.py           # TaxRating, [BulkUpload, BulkUploadItem, Report]
│   ├── views.py            # TaxRatingViewSet, [BulkUploadViewSet, ReportViewSet]
│   ├── serializers.py      # Serializers
│   ├── urls.py             # Rutas
│   ├── parsers.py          # BulkUploadParser (NUEVO)
│   ├── reports.py          # ReportGenerator (NUEVO)
│   └── admin.py            # Admin setup
├── frontend/               # React + Vite (Sprint 3+)
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── static/                 # Assets estáticos
├── templates/              # Templates Django
├── manage.py
├── requirements.txt        # Dependencias Python
├── pytest.ini              # Config pytest
├── Dockerfile              # Imagen Docker
├── docker-compose.yml      # Orquestación Docker
├── README.md               # Guía principal
├── INDEX.md                # Navegador documentación
├── ROADMAP.md              # Plan detallado Sprints
├── PROJECT_STATUS.md       # Estado actual
├── SPRINT1_SUMMARY.md      # Detalles Sprint 1
├── DEVELOPER_SETUP.md      # Setup para devs
└── HOLA_CABROS.md          # ← TÚ ESTÁS AQUÍ
```

---

## 🛠️ STACK TECNOLÓGICO

### Backend
- **Django 5.2.8** - Framework web
- **Django REST Framework 3.16.1** - API REST
- **django-cors-headers 4.9.0** - CORS
- **PostgreSQL 14+** - Base de datos (producción)
- **SQLite** - Base de datos (desarrollo)
- **psycopg2-binary 2.9.11** - Driver PostgreSQL

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router** - Routing

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **GitHub Actions** - CI/CD
- **Gunicorn** - WSGI server

### Testing
- **pytest** - Tests Python
- **pytest-django** - Plugin Django
- **Vitest** - Tests JavaScript
- **@testing-library/react** - Tests React

---

## 🔑 VARIABLES DE ENTORNO

**Archivo:** `.env` (crear localmente, basado en `.env.example`)

```env
# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql  # o sqlite3
DB_NAME=proyecto_nuam
DB_USER=postgres
DB_PASSWORD=tu-password-aqui
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# API
API_BASE_URL=http://localhost:8000/api/v1

# Email (para notificaciones futuras)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# Redis (para caché futuro)
REDIS_URL=redis://localhost:6379/0

# Timezone
TIME_ZONE=America/Santiago
```

---

## 📚 DEPENDENCIAS ADICIONALES A INSTALAR

### Para Sprint 2 (Carga Masiva + Reportes)
```bash
pip install openpyxl pandas pillow reportlab
```

### Para Sprint 4 (DevOps + Tests)
```bash
pip install pytest pytest-django pytest-cov gunicorn whitenoise
```

### Frontend
```bash
cd frontend
npm install axios react-router-dom chart.js react-chartjs-2
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

---

## 🎯 CRITERIOS DE ACEPTACIÓN POR SPRINT

### Sprint 2 (100% = Completado)
- [ ] Modelo BulkUpload y BulkUploadItem creados
- [ ] Parser CSV/XLSX funcionando con validación por fila
- [ ] Endpoint POST /api/v1/bulk-uploads creado
- [ ] Endpoint GET /api/v1/bulk-uploads/{id}/items funcionando
- [ ] Resumen de errores detallado por fila
- [ ] Modelo Report creado
- [ ] Endpoint GET /api/v1/reports/summary con filtros
- [ ] Exportación a CSV funcionando
- [ ] Tests unitarios para parser (>80% coverage)
- [ ] Tests integración para endpoints

### Sprint 3 (100% = Completado)
- [ ] Componente LoginPage creado y funcional
- [ ] PrivateRoute con redirección a login
- [ ] Dashboard con KPIs (total ratings, últimas cargas, estadísticas)
- [ ] CRUD Issuers (list, create, edit, delete)
- [ ] CRUD Instruments (list, create, edit, delete)
- [ ] CRUD TaxRatings (list, create, edit, delete, detail)
- [ ] Página carga masiva con drag & drop
- [ ] Página reportes con filtros y exportación
- [ ] Página auditoría con tabla filtrada
- [ ] Responsive design (mobile-friendly)
- [ ] Tests React (>60% coverage)

### Sprint 4 (100% = Completado)
- [ ] Cobertura de tests backend >75%
- [ ] Cobertura de tests frontend >60%
- [ ] Dockerfile funcionando
- [ ] docker-compose.yml completo y funcional
- [ ] GitHub Actions CI/CD configurado
- [ ] Tests ejecutándose en cada push
- [ ] Build y push a Docker Hub (opcional)
- [ ] Documentación DevOps actualizada

---

## 🚀 COMANDOS ÚTILES

### Setup Inicial
```bash
# Clonar y setup
git clone https://github.com/Gengardeth/proyecto-integrado-nuam.git
cd proyecto-integrado-nuam
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Editar .env con credenciales reales
```

### Development
```bash
# Backend
python manage.py migrate
python manage.py seed_users
python manage.py runserver

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend
pytest
pytest --cov=.
pytest cuentas/tests/

# Frontend
cd frontend
npm test
npm run test:coverage
```

### Docker
```bash
docker-compose up -d
docker-compose logs -f backend
docker-compose down
```

---

## 📞 CONTACTO Y SOPORTE

**Rama del Proyecto:** `el-Gonzalo-probando-weas`  
**Repositorio:** https://github.com/Gengardeth/proyecto-integrado-nuam  

### Documentación Complementaria
- **README.md** - Guía general
- **DEVELOPER_SETUP.md** - Setup paso a paso
- **ROADMAP.md** - Plan detallado
- **PROJECT_STATUS.md** - Estado actual
- **VERIFICATION_CHECKLIST.md** - Testing manual
- **INDEX.md** - Índice de documentación

---

## ⚠️ NOTAS IMPORTANTES

1. **PostgreSQL:** Si no está disponible, usa SQLite en desarrollo (`django.db.backends.sqlite3`)

2. **Migraciones:** Siempre corre `python manage.py migrate` antes de iniciar

3. **Usuarios Demo:** Los 3 usuarios se crean con `python manage.py seed_users`

4. **CORS:** En producción, cambiar `CORS_ALLOW_ALL_ORIGINS = False` y especificar dominios

5. **Secret Key:** Generar una nueva en producción con:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```

6. **Debug:** Siempre `DEBUG=False` en producción

7. **Auditoría:** Los 8 signals están en `cuentas/signals.py` - Modifica ahí para auditar más modelos

---

**ÚLTIMA ACTUALIZACIÓN:** 12 de noviembre de 2025  
**SPRINT 1 STATUS:** ✅ COMPLETADO  
**PRÓXIMO:** Sprint 2 (Carga Masiva + Reportes)  

🎉 **¡Ahora sí, cabros! Tenemos TODO el contexto para continuar.** 🎉
