from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from parametros.models import Issuer, Instrument
from .models import TaxRating, BulkUpload, BulkUploadItem

User = get_user_model()


class TaxRatingCRUDTests(TestCase):
    """Tests para operaciones CRUD de TaxRating"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            rol='ANALISTA'
        )
        self.client.force_authenticate(user=self.user)
        
        # Crear issuer e instrument de prueba
        self.issuer = Issuer.objects.create(
            codigo='TEST',
            nombre='Test Issuer',
            rut='12345678-9',
            activo=True
        )
        
        self.instrument = Instrument.objects.create(
            codigo='INST001',
            nombre='Test Instrument',
            tipo='BONO',
            issuer=self.issuer,
            activo=True
        )
    
    def test_create_tax_rating(self):
        """Debería crear una calificación tributaria exitosamente"""
        data = {
            'issuer': self.issuer.id,
            'instrument': self.instrument.id,
            'rating': 'AAA',
            'outlook': 'STABLE',
            'fecha': '2025-11-17',
            'fuente': 'Manual',
            'comentarios': 'Test rating creation'
        }
        
        response = self.client.post('/api/v1/tax-ratings/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 'AAA')
        self.assertEqual(response.data['outlook'], 'STABLE')
        self.assertEqual(TaxRating.objects.count(), 1)
    
    def test_create_tax_rating_missing_required_fields(self):
        """Debería fallar al crear sin campos requeridos"""
        data = {
            'rating': 'AAA'
            # Falta issuer, instrument, fecha, etc.
        }
        
        response = self.client.post('/api/v1/tax-ratings/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(TaxRating.objects.count(), 0)
    
    def test_list_tax_ratings(self):
        """Debería listar todas las calificaciones"""
        # Crear varias calificaciones
        TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        
        response = self.client.get('/api/v1/tax-ratings/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_get_tax_rating_detail(self):
        """Debería obtener el detalle de una calificación específica"""
        rating = TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            outlook='POSITIVE',
            fecha=timezone.now().date(),
            fuente='Manual',
            comentarios='Test detail'
        )
        
        response = self.client.get(f'/api/v1/tax-ratings/{rating.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 'AAA')
        self.assertEqual(response.data['outlook'], 'POSITIVE')
        self.assertEqual(response.data['comentarios'], 'Test detail')
    
    def test_update_tax_rating(self):
        """Debería actualizar una calificación existente"""
        rating = TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        
        update_data = {
            'issuer': self.issuer.id,
            'instrument': self.instrument.id,
            'rating': 'AA',
            'outlook': 'NEGATIVE',
            'fecha': '2025-11-17',
            'fuente': 'Manual',
            'comentarios': 'Updated rating'
        }
        
        response = self.client.put(f'/api/v1/tax-ratings/{rating.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 'AA')
        self.assertEqual(response.data['outlook'], 'NEGATIVE')
        
        # Verificar en BD
        rating.refresh_from_db()
        self.assertEqual(rating.rating, 'AA')
        self.assertEqual(rating.outlook, 'NEGATIVE')
    
    def test_partial_update_tax_rating(self):
        """Debería actualizar parcialmente una calificación"""
        rating = TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        
        update_data = {
            'outlook': 'POSITIVE'
        }
        
        response = self.client.patch(f'/api/v1/tax-ratings/{rating.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['outlook'], 'POSITIVE')
        self.assertEqual(response.data['rating'], 'AAA')  # No cambia
    
    def test_delete_tax_rating(self):
        """Debería eliminar una calificación"""
        rating = TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        
        response = self.client.delete(f'/api/v1/tax-ratings/{rating.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(TaxRating.objects.count(), 0)
    
    def test_estadisticas_endpoint(self):
        """Debería devolver estadísticas de calificaciones"""
        # Crear múltiples calificaciones con diferentes ratings
        TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AAA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        TaxRating.objects.create(
            issuer=self.issuer,
            instrument=self.instrument,
            rating='AA',
            fecha=timezone.now().date(),
            fuente='Manual'
        )
        
        response = self.client.get('/api/v1/tax-ratings/estadisticas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('por_rating', response.data)
        self.assertEqual(response.data['total'], 3)
    
    def test_ultimas_calificaciones_endpoint(self):
        """Debería devolver las últimas calificaciones ordenadas por fecha"""
        # Crear calificaciones con diferentes fechas
        for i in range(5):
            TaxRating.objects.create(
                issuer=self.issuer,
                instrument=self.instrument,
                rating='AAA',
                fecha=timezone.now().date(),
                fuente='Manual'
            )
        
        response = self.client.get('/api/v1/tax-ratings/ultimas/?limit=3')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)


class BulkUploadTests(TestCase):
    """Tests para carga masiva de calificaciones"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123',
            rol='ADMIN'
        )
        self.client.force_authenticate(user=self.user)
        
        # Crear issuer e instrument para las cargas
        self.issuer = Issuer.objects.create(
            codigo='ABC',
            nombre='ABC Corp',
            rut='11111111-1',
            activo=True
        )
        
        self.instrument = Instrument.objects.create(
            codigo='BOND001',
            nombre='Corporate Bond',
            tipo='BONO',
            issuer=self.issuer,
            activo=True
        )
    
    def test_create_bulk_upload(self):
        """Debería crear un registro de carga masiva"""
        data = {
            'archivo': 'test_upload.csv',
            'total_registros': 10
        }
        
        response = self.client.post('/api/v1/bulk-uploads/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BulkUpload.objects.count(), 1)
        self.assertEqual(response.data['estado'], 'PENDING')
    
    def test_list_bulk_uploads(self):
        """Debería listar las cargas masivas del usuario"""
        BulkUpload.objects.create(
            usuario=self.user,
            archivo='upload1.csv',
            total_registros=5
        )
        BulkUpload.objects.create(
            usuario=self.user,
            archivo='upload2.csv',
            total_registros=10
        )
        
        response = self.client.get('/api/v1/bulk-uploads/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_get_bulk_upload_detail(self):
        """Debería obtener detalle de una carga específica"""
        upload = BulkUpload.objects.create(
            usuario=self.user,
            archivo='test.csv',
            total_registros=5
        )
        
        response = self.client.get(f'/api/v1/bulk-uploads/{upload.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['archivo'], 'test.csv')
        self.assertEqual(response.data['total_registros'], 5)
    
    def test_bulk_upload_items_list(self):
        """Debería listar los items de una carga masiva"""
        upload = BulkUpload.objects.create(
            usuario=self.user,
            archivo='test.csv',
            total_registros=3
        )
        
        # Crear items
        BulkUploadItem.objects.create(
            bulk_upload=upload,
            fila=1,
            datos_raw={'rating': 'AAA'},
            estado='SUCCESS'
        )
        BulkUploadItem.objects.create(
            bulk_upload=upload,
            fila=2,
            datos_raw={'rating': 'AA'},
            estado='ERROR',
            mensaje_error='Invalid data'
        )
        
        response = self.client.get(f'/api/v1/bulk-uploads/{upload.id}/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_filter_bulk_upload_items_by_estado(self):
        """Debería filtrar items por estado"""
        upload = BulkUpload.objects.create(
            usuario=self.user,
            archivo='test.csv',
            total_registros=3
        )
        
        BulkUploadItem.objects.create(
            bulk_upload=upload,
            fila=1,
            datos_raw={'rating': 'AAA'},
            estado='SUCCESS'
        )
        BulkUploadItem.objects.create(
            bulk_upload=upload,
            fila=2,
            datos_raw={'rating': 'AA'},
            estado='ERROR',
            mensaje_error='Error message'
        )
        
        # Filtrar solo errores
        response = self.client.get(f'/api/v1/bulk-uploads/{upload.id}/items/?estado=ERROR')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['estado'], 'ERROR')
    
    def test_resumen_bulk_uploads(self):
        """Debería devolver resumen de cargas del usuario"""
        BulkUpload.objects.create(
            usuario=self.user,
            archivo='upload1.csv',
            total_registros=10,
            estado='PENDING'
        )
        BulkUpload.objects.create(
            usuario=self.user,
            archivo='upload2.csv',
            total_registros=5,
            registros_procesados=5,
            estado='COMPLETED'
        )
        BulkUpload.objects.create(
            usuario=self.user,
            archivo='upload3.csv',
            total_registros=8,
            registros_con_error=3,
            estado='COMPLETED'
        )
        
        response = self.client.get('/api/v1/bulk-uploads/resumen/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertEqual(response.data['total'], 3)

