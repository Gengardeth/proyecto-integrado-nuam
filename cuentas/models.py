from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class Usuario(AbstractUser):
    ROLES = [
        ('ADMIN', 'Administrador'),
        ('ANALISTA', 'Analista'),
        ('AUDITOR', 'Auditor'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='ANALISTA')
    activo = models.BooleanField(default=True)
    descripcion = models.TextField(blank=True, null=True, help_text="Descripción o notas del usuario")

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

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

    def get_permisos_rbac(self):
        """
        Retorna lista de permisos según el rol del usuario.
        """
        if self.is_admin:
            return [
                'view_calificaciones',
                'create_calificaciones',
                'edit_calificaciones',
                'delete_calificaciones',
                'view_contribuyentes',
                'create_contribuyentes',
                'edit_contribuyentes',
                'delete_contribuyentes',
                'view_reportes',
                'export_datos',
                'manage_usuarios',
                'audit_logs',
            ]
        elif self.is_analista:
            return [
                'view_calificaciones',
                'create_calificaciones',
                'edit_calificaciones',
                'view_contribuyentes',
                'create_contribuyentes',
                'view_reportes',
                'export_datos',
            ]
        elif self.is_auditor:
            return [
                'view_calificaciones',
                'view_contribuyentes',
                'view_reportes',
                'audit_logs',
            ]
        return []

    def has_perm_rbac(self, perm):
        """
        Verifica si el usuario tiene un permiso específico según su rol.
        Ejemplo: usuario.has_perm_rbac('edit_calificaciones')
        """
        return perm in self.get_permisos_rbac()

    def can_edit_calificaciones(self):
        return self.has_perm_rbac('edit_calificaciones')

    def can_delete_calificaciones(self):
        return self.has_perm_rbac('delete_calificaciones')

    def can_manage_usuarios(self):
        return self.has_perm_rbac('manage_usuarios')
