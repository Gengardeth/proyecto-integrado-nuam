from django.apps import AppConfig


class CuentasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cuentas'
    
    def ready(self):
        """Carga los signals cuando la app está lista."""
        import cuentas.signals
        import cuentas.audit_middleware
