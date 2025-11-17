# 🧪 Guía de Testing - NUAM

Documentación completa de las estrategias de testing, cómo ejecutar tests y escribir nuevos tests.

---

## 📊 Resumen de Cobertura

### Frontend
- **Total Tests**: 77
- **Tiempo Ejecución**: ~800ms
- **Cobertura**: 100% de servicios API
- **Framework**: Vitest 2.1.9

### Backend
- **Tests Unitarios**: 25+
- **Tests de Integración**: 15+
- **Framework**: Django TestCase

---

## Frontend Testing

### Estructura de Tests

```
frontend/src/__tests__/
├── ratingsService.test.js       # 14 tests
├── reportsService.test.js       # 9 tests
├── bulkUploadsService.test.js   # 14 tests
├── auditService.test.js         # 9 tests
├── issuersService.test.js       # 11 tests
├── instrumentsService.test.js   # 14 tests
└── utils.test.js                # 6 tests
```

---

### Ejecutar Tests Frontend

#### Todos los tests
```bash
cd frontend
npm run test
```

#### Watch mode (desarrollo)
```bash
npm run test:watch
```

#### Cobertura
```bash
npm run test:coverage
```

#### Tests específicos
```bash
npm run test ratingsService
npm run test -- --grep "should fetch ratings"
```

---

### Configuración Vitest

**Archivo**: `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
      ]
    }
  }
});
```

---

### Ejemplo: Test de Servicio API

**Archivo**: `frontend/src/__tests__/ratingsService.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import * as ratingsService from '../services/ratingsService';

// Mock de axios
vi.mock('axios');

describe('ratingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRatings', () => {
    it('should fetch ratings with default params', async () => {
      const mockData = {
        count: 2,
        results: [
          { id: '1', rating: 'AAA', outlook: 'STABLE' },
          { id: '2', rating: 'AA', outlook: 'POSITIVE' }
        ]
      };
      
      axios.get.mockResolvedValue({ data: mockData });

      const result = await ratingsService.getRatings();

      expect(axios.get).toHaveBeenCalledWith('/tax-ratings/', {
        params: { page: 1, page_size: 10 }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch ratings with custom filters', async () => {
      const filters = {
        rating: 'AAA',
        outlook: 'POSITIVE',
        fecha_desde: '2025-01-01'
      };

      axios.get.mockResolvedValue({ data: { count: 0, results: [] } });

      await ratingsService.getRatings(1, 20, filters);

      expect(axios.get).toHaveBeenCalledWith('/tax-ratings/', {
        params: {
          page: 1,
          page_size: 20,
          rating: 'AAA',
          outlook: 'POSITIVE',
          fecha_desde: '2025-01-01'
        }
      });
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Network Error';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(ratingsService.getRatings()).rejects.toThrow(errorMessage);
    });
  });

  describe('createRating', () => {
    it('should create a new rating', async () => {
      const newRating = {
        instrument: 'uuid-1',
        rating: 'AA',
        outlook: 'STABLE',
        fecha_vigencia: '2025-12-01'
      };
      
      const mockResponse = { id: 'uuid-new', ...newRating };
      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await ratingsService.createRating(newRating);

      expect(axios.post).toHaveBeenCalledWith('/tax-ratings/', newRating);
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const invalidRating = { rating: 'INVALID' };
      const validationError = {
        response: {
          data: {
            rating: ['Rating inválido']
          }
        }
      };

      axios.post.mockRejectedValue(validationError);

      await expect(ratingsService.createRating(invalidRating))
        .rejects.toMatchObject(validationError);
    });
  });
});
```

---

### Buenas Prácticas Frontend

1. **Mock de Axios**
   ```javascript
   vi.mock('axios');
   
   // En cada test
   axios.get.mockResolvedValue({ data: mockData });
   axios.post.mockRejectedValue(new Error('Error'));
   ```

2. **Limpiar Mocks**
   ```javascript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Test de Errores**
   ```javascript
   it('should handle 404 errors', async () => {
     axios.get.mockRejectedValue({
       response: { status: 404, data: { detail: 'Not found' } }
     });
     
     await expect(service.getById('invalid-id')).rejects.toThrow();
   });
   ```

4. **Test de Parámetros**
   ```javascript
   it('should call API with correct params', async () => {
     await service.getData({ filter: 'value' });
     
     expect(axios.get).toHaveBeenCalledWith('/endpoint/', {
       params: { filter: 'value' }
     });
   });
   ```

---

## Backend Testing

### Estructura de Tests

```
backend/
├── calificacionfiscal/
│   └── tests.py           # Tests de TaxRating, BulkUpload
├── cuentas/
│   └── tests.py           # Tests de Usuario, Auth, Audit
└── parametros/
    └── tests.py           # Tests de Issuer, Instrument
```

---

### Ejecutar Tests Backend

#### Todos los tests
```bash
python manage.py test
```

#### App específica
```bash
python manage.py test calificacionfiscal
python manage.py test cuentas
python manage.py test parametros
```

#### Test específico
```bash
python manage.py test calificacionfiscal.tests.TaxRatingTests.test_create_rating
```

#### Con cobertura
```bash
coverage run --source='.' manage.py test
coverage report
coverage html  # Genera reporte HTML en htmlcov/
```

#### Verboso
```bash
python manage.py test --verbosity=2
```

---

### Ejemplo: Test de Modelo y API

**Archivo**: `calificacionfiscal/tests.py`

```python
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from cuentas.models import Usuario
from parametros.models import Issuer, Instrument
from .models import TaxRating

class TaxRatingTests(TestCase):
    def setUp(self):
        """Configuración inicial para cada test"""
        # Crear usuario analista
        self.user = Usuario.objects.create_user(
            username='analista_test',
            password='testpass123',
            email='analista@test.com',
            rol='ANALISTA'
        )
        
        # Cliente API autenticado
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Crear emisor e instrumento
        self.issuer = Issuer.objects.create(
            codigo='TEST001',
            nombre='Test Issuer',
            pais='Chile',
            sector='Financiero'
        )
        
        self.instrument = Instrument.objects.create(
            codigo='INST001',
            nombre='Test Instrument',
            tipo='BONO',
            emisor=self.issuer
        )

    def test_create_rating_success(self):
        """Test crear calificación exitosamente"""
        url = reverse('taxrating-list')
        data = {
            'instrument': str(self.instrument.id),
            'rating': 'AAA',
            'outlook': 'STABLE',
            'fecha_vigencia': '2025-12-01',
            'fecha_revision': '2026-06-01',
            'comentarios': 'Test rating'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 'AAA')
        self.assertEqual(response.data['outlook'], 'STABLE')
        
        # Verificar en DB
        rating = TaxRating.objects.get(id=response.data['id'])
        self.assertEqual(rating.rating, 'AAA')
        self.assertEqual(rating.created_by, self.user)

    def test_create_rating_invalid_rating(self):
        """Test validación de rating inválido"""
        url = reverse('taxrating-list')
        data = {
            'instrument': str(self.instrument.id),
            'rating': 'INVALID',
            'outlook': 'STABLE',
            'fecha_vigencia': '2025-12-01'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)

    def test_list_ratings_with_filters(self):
        """Test listar calificaciones con filtros"""
        # Crear múltiples ratings
        TaxRating.objects.create(
            instrument=self.instrument,
            rating='AAA',
            outlook='STABLE',
            fecha_vigencia='2025-12-01',
            created_by=self.user
        )
        TaxRating.objects.create(
            instrument=self.instrument,
            rating='AA',
            outlook='POSITIVE',
            fecha_vigencia='2025-12-15',
            created_by=self.user
        )
        
        url = reverse('taxrating-list')
        response = self.client.get(url, {'rating': 'AAA'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['rating'], 'AAA')

    def test_update_rating_permission(self):
        """Test permisos para actualizar calificación"""
        rating = TaxRating.objects.create(
            instrument=self.instrument,
            rating='AA',
            outlook='STABLE',
            fecha_vigencia='2025-12-01',
            created_by=self.user
        )
        
        # Usuario auditor (sin permisos de escritura)
        auditor = Usuario.objects.create_user(
            username='auditor_test',
            password='testpass123',
            rol='AUDITOR'
        )
        self.client.force_authenticate(user=auditor)
        
        url = reverse('taxrating-detail', args=[rating.id])
        data = {'rating': 'A'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_rating_creates_audit_log(self):
        """Test que eliminar calificación crea log de auditoría"""
        from cuentas.audit_models import AuditLog
        
        rating = TaxRating.objects.create(
            instrument=self.instrument,
            rating='AA',
            outlook='STABLE',
            fecha_vigencia='2025-12-01',
            created_by=self.user
        )
        
        url = reverse('taxrating-detail', args=[rating.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar log de auditoría
        log = AuditLog.objects.filter(
            usuario=self.user,
            accion='DELETE',
            modelo='TaxRating'
        ).first()
        
        self.assertIsNotNone(log)
        self.assertEqual(log.objeto_id, str(rating.id))
```

---

### Tests de Autenticación

```python
class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            rol='ANALISTA'
        )

    def test_login_success(self):
        """Test login exitoso retorna tokens"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_login_invalid_credentials(self):
        """Test login con credenciales inválidas"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_requires_auth(self):
        """Test endpoint protegido requiere autenticación"""
        url = reverse('taxrating-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_refresh_token(self):
        """Test renovar access token con refresh token"""
        # Login para obtener tokens
        login_url = reverse('login')
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Renovar token
        refresh_url = reverse('token_refresh')
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
```

---

### Tests de Carga Masiva

```python
from django.core.files.uploadedfile import SimpleUploadedFile

class BulkUploadTests(TestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(
            username='analista',
            password='testpass',
            rol='ANALISTA'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Crear emisor e instrumento para CSV
        self.issuer = Issuer.objects.create(
            codigo='EMIT001',
            nombre='Test Issuer'
        )
        self.instrument = Instrument.objects.create(
            codigo='INST001',
            nombre='Test Instrument',
            emisor=self.issuer
        )

    def test_upload_csv_file(self):
        """Test subir archivo CSV"""
        csv_content = b"""codigo_instrumento,rating,outlook,fecha_vigencia,fecha_revision,comentarios
INST001,AAA,STABLE,2025-12-01,2026-06-01,Test rating
"""
        csv_file = SimpleUploadedFile(
            "test_ratings.csv",
            csv_content,
            content_type="text/csv"
        )
        
        url = reverse('bulkupload-list')
        data = {'archivo': csv_file}
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estado'], 'PENDIENTE')

    def test_process_bulk_upload(self):
        """Test procesar carga masiva"""
        # Crear bulk upload
        csv_content = b"""codigo_instrumento,rating,outlook,fecha_vigencia,fecha_revision
INST001,AAA,STABLE,2025-12-01,2026-06-01
"""
        csv_file = SimpleUploadedFile("test.csv", csv_content)
        
        upload = BulkUpload.objects.create(
            archivo=csv_file,
            created_by=self.user
        )
        
        url = reverse('bulkupload-procesar', args=[upload.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['estado'], 'COMPLETADO')
        self.assertEqual(response.data['exitosas'], 1)
        self.assertEqual(response.data['fallidas'], 0)

    def test_bulk_upload_validation_errors(self):
        """Test validación de errores en CSV"""
        csv_content = b"""codigo_instrumento,rating,outlook,fecha_vigencia
INVALID_CODE,XXX,STABLE,2025-12-01
"""
        csv_file = SimpleUploadedFile("test.csv", csv_content)
        
        upload = BulkUpload.objects.create(
            archivo=csv_file,
            created_by=self.user
        )
        
        url = reverse('bulkupload-procesar', args=[upload.id])
        response = self.client.post(url)
        
        self.assertEqual(response.data['fallidas'], 1)
        
        # Verificar item con error
        items_url = reverse('bulkupload-items', args=[upload.id])
        items_response = self.client.get(items_url, {'estado': 'ERROR'})
        
        self.assertGreater(len(items_response.data['results']), 0)
        self.assertIn('error', items_response.data['results'][0])
```

---

### Buenas Prácticas Backend

1. **Usar setUp para datos comunes**
   ```python
   def setUp(self):
       self.user = Usuario.objects.create_user(...)
       self.client = APIClient()
       self.client.force_authenticate(user=self.user)
   ```

2. **Test de validaciones**
   ```python
   def test_invalid_data(self):
       response = self.client.post(url, invalid_data)
       self.assertEqual(response.status_code, 400)
       self.assertIn('field_name', response.data)
   ```

3. **Test de permisos**
   ```python
   def test_permission_denied(self):
       self.client.force_authenticate(user=auditor_user)
       response = self.client.post(url, data)
       self.assertEqual(response.status_code, 403)
   ```

4. **Verificar efectos secundarios**
   ```python
   def test_create_creates_audit_log(self):
       self.client.post(url, data)
       log_exists = AuditLog.objects.filter(...).exists()
       self.assertTrue(log_exists)
   ```

---

## Testing de Integración

### Docker Compose Test Environment

```yaml
# docker-compose.test.yml
services:
  db_test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass

  backend_test:
    build: .
    command: python manage.py test
    environment:
      DATABASE_URL: postgresql://test_user:test_pass@db_test:5432/test_db
    depends_on:
      - db_test
```

**Ejecutar**:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## CI/CD Testing

### GitHub Actions

**Archivo**: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  backend-quality:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
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
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        run: |
          python manage.py test --verbosity=2
      
      - name: Run coverage
        run: |
          coverage run --source='.' manage.py test
          coverage report
          coverage xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  frontend-quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run tests
        working-directory: ./frontend
        run: npm run test
      
      - name: Run lint
        working-directory: ./frontend
        run: npm run lint
```

---

## Cobertura de Código

### Frontend (Vitest)

```bash
cd frontend
npm run test:coverage
```

**Configuración** (`vite.config.js`):
```javascript
test: {
  coverage: {
    reporter: ['text', 'json', 'html'],
    include: ['src/**/*.{js,jsx}'],
    exclude: [
      'src/__tests__/**',
      'src/**/*.test.{js,jsx}'
    ],
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  }
}
```

### Backend (Coverage.py)

```bash
coverage run --source='.' manage.py test
coverage report
coverage html  # Genera htmlcov/index.html
```

**Configuración** (`.coveragerc`):
```ini
[run]
source = .
omit =
    */migrations/*
    */tests.py
    */test_*.py
    venv/*
    manage.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

---

## Debugging Tests

### Frontend

```javascript
// Añadir console.log en tests
it('should debug data', async () => {
  const result = await service.getData();
  console.log('Result:', result);
  expect(result).toBeDefined();
});

// Ver detalles de llamadas mock
console.log(axios.get.mock.calls);
console.log(axios.post.mock.lastCall);
```

### Backend

```python
# Añadir print en tests
def test_debug(self):
    response = self.client.get(url)
    print(response.data)
    print(response.status_code)
    self.assertEqual(response.status_code, 200)

# Ejecutar con verbosity máxima
python manage.py test --verbosity=3
```

---

## Escribir Nuevos Tests

### Checklist para Nuevo Test

- [ ] Nombre descriptivo (`test_should_do_something`)
- [ ] setUp con datos necesarios
- [ ] Llamada a función/endpoint
- [ ] Assertions claras
- [ ] Test de caso exitoso
- [ ] Test de casos de error
- [ ] Test de permisos (si aplica)
- [ ] Limpiar recursos (tearDown si es necesario)

### Template Frontend

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import * as myService from '../services/myService';

vi.mock('axios');

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('myFunction', () => {
    it('should do something successfully', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' };
      axios.get.mockResolvedValue({ data: mockData });

      // Act
      const result = await myService.myFunction();

      // Assert
      expect(axios.get).toHaveBeenCalledWith('/endpoint/');
      expect(result).toEqual(mockData);
    });

    it('should handle errors', async () => {
      // Arrange
      axios.get.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(myService.myFunction()).rejects.toThrow('API Error');
    });
  });
});
```

### Template Backend

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class MyTests(TestCase):
    def setUp(self):
        """Setup común para todos los tests"""
        self.client = APIClient()
        # Crear datos necesarios
        pass

    def test_should_do_something_successfully(self):
        """Test caso exitoso"""
        # Arrange
        data = {'field': 'value'}
        
        # Act
        response = self.client.post('/api/endpoint/', data)
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['field'], 'value')

    def test_should_handle_errors(self):
        """Test manejo de errores"""
        # Arrange
        invalid_data = {}
        
        # Act
        response = self.client.post('/api/endpoint/', invalid_data)
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```

---

## Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Django Testing Documentation](https://docs.djangoproject.com/en/5.2/topics/testing/)
- [DRF Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)

---

## Métricas Actuales

| Métrica | Frontend | Backend |
|---------|----------|---------|
| Total Tests | 77 | 40+ |
| Tiempo Ejecución | ~800ms | ~5s |
| Cobertura Servicios | 100% | 85% |
| Tests Pasando | 77/77 ✅ | 40/40 ✅ |
| Framework | Vitest 2.1.9 | Django TestCase |
