from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Issuer, Instrument

User = get_user_model()


class IssuerCRUDTests(TestCase):
    """Tests para operaciones CRUD de Issuer (Emisor)"""
    
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
    
    def test_create_issuer(self):
        """Debería crear un emisor exitosamente"""
        data = {
            'codigo': 'TEST',
            'nombre': 'Test Corporation',
            'rut': '12345678-9',
            'pais': 'Chile',
            'activo': True
        }
        
        response = self.client.post('/api/v1/issuers/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['codigo'], 'TEST')
        self.assertEqual(response.data['nombre'], 'Test Corporation')
        self.assertEqual(Issuer.objects.count(), 1)
    
    def test_create_issuer_missing_required_fields(self):
        """Debería fallar al crear sin campos requeridos"""
        data = {
            'nombre': 'Test Corp'
            # Falta codigo, rut, pais
        }
        
        response = self.client.post('/api/v1/issuers/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Issuer.objects.count(), 0)
    
    def test_create_issuer_duplicate_codigo(self):
        """Debería fallar al intentar crear emisor con código duplicado"""
        Issuer.objects.create(
            codigo='ABC',
            nombre='ABC Corp',
            rut='11111111-1',
            pais='Chile'
        )
        
        data = {
            'codigo': 'ABC',  # Duplicado
            'nombre': 'Another Corp',
            'rut': '22222222-2',
            'pais': 'Chile'
        }
        
        response = self.client.post('/api/v1/issuers/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Issuer.objects.count(), 1)
    
    def test_list_issuers(self):
        """Debería listar todos los emisores"""
        Issuer.objects.create(
            codigo='ABC',
            nombre='ABC Corp',
            rut='11111111-1',
            pais='Chile'
        )
        Issuer.objects.create(
            codigo='XYZ',
            nombre='XYZ Inc',
            rut='22222222-2',
            pais='Argentina'
        )
        
        response = self.client.get('/api/v1/issuers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_active_issuers(self):
        """Debería filtrar emisores activos"""
        Issuer.objects.create(
            codigo='ACTIVE',
            nombre='Active Corp',
            rut='11111111-1',
            activo=True
        )
        Issuer.objects.create(
            codigo='INACTIVE',
            nombre='Inactive Corp',
            rut='22222222-2',
            activo=False
        )
        
        response = self.client.get('/api/v1/issuers/?activo=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que solo devuelve activos
        for issuer in response.data['results']:
            self.assertTrue(issuer.get('activo', True))
    
    def test_get_issuer_detail(self):
        """Debería obtener el detalle de un emisor específico"""
        issuer = Issuer.objects.create(
            codigo='TEST',
            nombre='Test Corporation',
            rut='12345678-9',
            pais='Chile'
        )
        
        response = self.client.get(f'/api/v1/issuers/{issuer.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['codigo'], 'TEST')
        self.assertEqual(response.data['rut'], '12345678-9')
    
    def test_update_issuer(self):
        """Debería actualizar un emisor existente"""
        issuer = Issuer.objects.create(
            codigo='TEST',
            nombre='Test Corp',
            rut='12345678-9',
            pais='Chile'
        )
        
        update_data = {
            'codigo': 'TEST',
            'nombre': 'Updated Corporation',
            'rut': '12345678-9',
            'pais': 'Argentina',
            'activo': False
        }
        
        response = self.client.put(f'/api/v1/issuers/{issuer.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Updated Corporation')
        self.assertEqual(response.data['pais'], 'Argentina')
        self.assertFalse(response.data['activo'])
        
        # Verificar en BD
        issuer.refresh_from_db()
        self.assertEqual(issuer.nombre, 'Updated Corporation')
    
    def test_partial_update_issuer(self):
        """Debería actualizar parcialmente un emisor"""
        issuer = Issuer.objects.create(
            codigo='TEST',
            nombre='Test Corp',
            rut='12345678-9',
            activo=True
        )
        
        update_data = {
            'activo': False
        }
        
        response = self.client.patch(f'/api/v1/issuers/{issuer.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['activo'])
        self.assertEqual(response.data['nombre'], 'Test Corp')  # No cambia
    
    def test_delete_issuer(self):
        """Debería eliminar un emisor"""
        issuer = Issuer.objects.create(
            codigo='DELETE',
            nombre='To Delete Corp',
            rut='99999999-9',
            pais='Chile'
        )
        
        response = self.client.delete(f'/api/v1/issuers/{issuer.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Issuer.objects.count(), 0)


class InstrumentCRUDTests(TestCase):
    """Tests para operaciones CRUD de Instrument (Instrumento)"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='testuser2',
            email='test@example.com',
            password='testpass123',
            rol='ANALISTA'
        )
        self.client.force_authenticate(user=self.user)
        
        # Crear issuer para los instrumentos
        self.issuer = Issuer.objects.create(
            codigo='ABC',
            nombre='ABC Corporation',
            rut='12345678-9',
            activo=True
        )
    
    def test_create_instrument(self):
        """Debería crear un instrumento exitosamente"""
        data = {
            'codigo': 'BOND001',
            'nombre': 'Corporate Bond',
            'tipo': 'BONO',
            'issuer': self.issuer.id,
            'activo': True
        }
        
        response = self.client.post('/api/v1/instruments/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['codigo'], 'BOND001')
        self.assertEqual(response.data['tipo'], 'BONO')
        self.assertEqual(Instrument.objects.count(), 1)
    
    def test_create_instrument_missing_required_fields(self):
        """Debería fallar al crear sin campos requeridos"""
        data = {
            'nombre': 'Test Instrument'
            # Falta codigo, tipo, issuer
        }
        
        response = self.client.post('/api/v1/instruments/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Instrument.objects.count(), 0)
    
    def test_create_instrument_invalid_tipo(self):
        """Debería fallar con tipo de instrumento inválido"""
        data = {
            'codigo': 'INV001',
            'nombre': 'Invalid Instrument',
            'tipo': 'INVALID_TYPE',
            'issuer': self.issuer.id
        }
        
        response = self.client.post('/api/v1/instruments/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_instrument_all_tipos(self):
        """Debería crear instrumentos de todos los tipos válidos"""
        tipos_validos = ['BONO', 'ACCION', 'FONDO_MUTUO', 'DERIVADO', 'OTRO']
        
        for tipo in tipos_validos:
            data = {
                'codigo': f'{tipo}_001',
                'nombre': f'{tipo} Test',
                'tipo': tipo,
                'issuer': self.issuer.id
            }
            
            response = self.client.post('/api/v1/instruments/', data)
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['tipo'], tipo)
        
        self.assertEqual(Instrument.objects.count(), len(tipos_validos))
    
    def test_list_instruments(self):
        """Debería listar todos los instrumentos"""
        Instrument.objects.create(
            codigo='BOND001',
            nombre='Corporate Bond',
            tipo='BONO',
            issuer=self.issuer
        )
        Instrument.objects.create(
            codigo='STOCK001',
            nombre='Common Stock',
            tipo='ACCION',
            issuer=self.issuer
        )
        
        response = self.client.get('/api/v1/instruments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_active_instruments(self):
        """Debería filtrar instrumentos activos"""
        Instrument.objects.create(
            codigo='ACTIVE',
            nombre='Active Instrument',
            tipo='BONO',
            issuer=self.issuer,
            activo=True
        )
        Instrument.objects.create(
            codigo='INACTIVE',
            nombre='Inactive Instrument',
            tipo='ACCION',
            issuer=self.issuer,
            activo=False
        )
        
        response = self.client.get('/api/v1/instruments/?activo=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for instrument in response.data['results']:
            self.assertTrue(instrument.get('activo', True))
    
    def test_get_instrument_detail(self):
        """Debería obtener el detalle de un instrumento específico"""
        instrument = Instrument.objects.create(
            codigo='BOND001',
            nombre='Corporate Bond',
            tipo='BONO',
            issuer=self.issuer
        )
        
        response = self.client.get(f'/api/v1/instruments/{instrument.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['codigo'], 'BOND001')
        self.assertEqual(response.data['tipo'], 'BONO')
    
    def test_update_instrument(self):
        """Debería actualizar un instrumento existente"""
        instrument = Instrument.objects.create(
            codigo='BOND001',
            nombre='Corporate Bond',
            tipo='BONO',
            issuer=self.issuer
        )
        
        update_data = {
            'codigo': 'BOND001',
            'nombre': 'Updated Bond Name',
            'tipo': 'BONO',
            'issuer': self.issuer.id,
            'activo': False
        }
        
        response = self.client.put(f'/api/v1/instruments/{instrument.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Updated Bond Name')
        self.assertFalse(response.data['activo'])
        
        # Verificar en BD
        instrument.refresh_from_db()
        self.assertEqual(instrument.nombre, 'Updated Bond Name')
    
    def test_partial_update_instrument(self):
        """Debería actualizar parcialmente un instrumento"""
        instrument = Instrument.objects.create(
            codigo='STOCK001',
            nombre='Common Stock',
            tipo='ACCION',
            issuer=self.issuer,
            activo=True
        )
        
        update_data = {
            'activo': False
        }
        
        response = self.client.patch(f'/api/v1/instruments/{instrument.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['activo'])
        self.assertEqual(response.data['nombre'], 'Common Stock')  # No cambia
    
    def test_delete_instrument(self):
        """Debería eliminar un instrumento"""
        instrument = Instrument.objects.create(
            codigo='DELETE001',
            nombre='To Delete',
            tipo='OTRO',
            issuer=self.issuer
        )
        
        response = self.client.delete(f'/api/v1/instruments/{instrument.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Instrument.objects.count(), 0)
    
    def test_instrument_issuer_relationship(self):
        """Debería mantener la relación correcta con el issuer"""
        instrument = Instrument.objects.create(
            codigo='REL001',
            nombre='Relationship Test',
            tipo='BONO',
            issuer=self.issuer
        )
        
        response = self.client.get(f'/api/v1/instruments/{instrument.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['issuer'], self.issuer.id)

