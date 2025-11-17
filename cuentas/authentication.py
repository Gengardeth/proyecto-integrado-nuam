from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF.
    Útil para APIs que manejan CORS y no pueden usar CSRF tokens.
    """
    def enforce_csrf(self, request):
        return  # No hacer nada, omitir verificación CSRF
