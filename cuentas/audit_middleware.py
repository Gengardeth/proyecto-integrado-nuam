from .audit_models import AuditLog
from django.contrib.auth.signals import user_login_failed, user_logged_in, user_logged_out
from django.dispatch import receiver

def get_client_ip(request):
    """Obtiene la IP del cliente desde la request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class AuditMiddleware:
    """Middleware para capturar información de auditoría en requests."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.client_ip = get_client_ip(request)
        request.user_agent = request.META.get('HTTP_USER_AGENT', '')
        response = self.get_response(request)
        return response

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Registra login de usuario."""
    AuditLog.objects.create(
        usuario=user,
        accion='LOGIN',
        modelo='Usuario',
        descripcion=f"Login: {user.username}",
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Registra logout de usuario."""
    if user:
        AuditLog.objects.create(
            usuario=user,
            accion='LOGOUT',
            modelo='Usuario',
            descripcion=f"Logout: {user.username}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
        )

@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    """Registra intentos fallidos de login."""
    AuditLog.objects.create(
        usuario=None,
        accion='LOGIN',
        modelo='Usuario',
        descripcion=f"Login fallido: {credentials.get('username', 'desconocido')}",
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
    )
