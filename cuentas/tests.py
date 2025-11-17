from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from datetime import timedelta
from .models import Usuario
from .audit_models import AuditLog


class AuditLogDateFilterTests(TestCase):
	def setUp(self):
		self.admin = Usuario.objects.create_user(username='admin', password='pass1234', rol='ADMIN')
		self.client = APIClient()
		self.client.force_authenticate(user=self.admin)
		# Crear logs y luego ajustar timestamps (auto_now_add requiere sobrescritura posterior)
		self.today = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
		self.log_hoy = AuditLog.objects.create(usuario=self.admin, accion='LOGIN', modelo='Usuario', descripcion='Hoy')
		self.log_ayer = AuditLog.objects.create(usuario=self.admin, accion='UPDATE', modelo='Usuario', descripcion='Ayer')
		self.log_dos_dias = AuditLog.objects.create(usuario=self.admin, accion='DELETE', modelo='Usuario', descripcion='Hace dos días')
		# Ajustar fechas
		self.log_hoy.creado_en = self.today
		self.log_hoy.save(update_fields=['creado_en'])
		self.log_ayer.creado_en = self.today - timedelta(days=1)
		self.log_ayer.save(update_fields=['creado_en'])
		self.log_dos_dias.creado_en = self.today - timedelta(days=2)
		self.log_dos_dias.save(update_fields=['creado_en'])

	def test_filter_desde(self):
		fecha_desde = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')
		url = reverse('audit-log-list')
		response = self.client.get(url, {'fecha_desde': fecha_desde})
		self.assertEqual(response.status_code, 200)
		# Debe incluir hoy y ayer pero no hace dos días
		descriptions = [r['descripcion'] for r in response.data['results']]
		self.assertIn('Hoy', descriptions)
		self.assertIn('Ayer', descriptions)
		self.assertNotIn('Hace dos días', descriptions)

	def test_filter_hasta(self):
		fecha_hasta = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')
		url = reverse('audit-log-list')
		response = self.client.get(url, {'fecha_hasta': fecha_hasta})
		self.assertEqual(response.status_code, 200)
		descriptions = [r['descripcion'] for r in response.data['results']]
		# Debe incluir ayer y hace dos días, excluir hoy
		self.assertIn('Ayer', descriptions)
		self.assertIn('Hace dos días', descriptions)
		self.assertNotIn('Hoy', descriptions)

	def test_filter_rango(self):
		fecha_desde = (timezone.now() - timedelta(days=2)).strftime('%Y-%m-%d')
		fecha_hasta = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')
		url = reverse('audit-log-list')
		response = self.client.get(url, {'fecha_desde': fecha_desde, 'fecha_hasta': fecha_hasta})
		self.assertEqual(response.status_code, 200)
		descriptions = [r['descripcion'] for r in response.data['results']]
		self.assertIn('Ayer', descriptions)
		self.assertIn('Hace dos días', descriptions)
		self.assertNotIn('Hoy', descriptions)
