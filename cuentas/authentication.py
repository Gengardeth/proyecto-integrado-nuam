from rest_framework.authentication import SessionAuthentication
from rest_framework import exceptions


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF.
    Útil para APIs que manejan CORS y no pueden usar CSRF tokens.
    """
    def enforce_csrf(self, request):
        return  # No hacer nada, omitir verificación CSRF
    
    def authenticate(self, request):
        """
        Autenticar usando sesión de Django, pero sin lanzar excepción si no hay sesión.
        """
        user = getattr(request._request, 'user', None)
        
        # Si no hay usuario autenticado, devolver None en lugar de lanzar excepción
        if not user or not user.is_authenticated:
            return None
        
        # Si hay usuario autenticado, devolverlo
        return (user, None)
