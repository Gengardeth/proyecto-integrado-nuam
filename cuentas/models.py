from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROLES = [
        ('ADMIN', 'Administrador'),
        ('ANALISTA', 'Analista'),
        ('AUDITOR', 'Auditor'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='ANALISTA')

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    @property
    def is_admin(self):
        return self.rol == 'ADMIN'

    @property
    def is_analista(self):
        return self.rol == 'ANALISTA'

    @property
    def is_auditor(self):
        return self.rol == 'AUDITOR'

    def has_perm_rbac(self, perm):
        """
        Permisos básicos por rol. Ejemplo de uso: usuario.has_perm_rbac('edit_taxrating')
        """
        if self.is_admin:
            return True  # Admin puede todo
        if self.is_analista:
            return perm in ['view', 'edit_taxrating', 'bulk_upload', 'report']
        if self.is_auditor:
            return perm in ['view', 'audit']
        return False
