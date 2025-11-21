"""
Manejadores de excepciones personalizadas para DRF.
"""
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Manejador de excepciones personalizado que formatea mensajes de permiso.
    """
    from rest_framework.views import exception_handler
    
    # Primero obtener la respuesta estándar de DRF
    response = exception_handler(exc, context)
    
    # Si es un error de permiso (403), mejorar el mensaje
    if isinstance(exc, PermissionError):
        return Response(
            {'detail': str(exc)},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Si la respuesta es 403 pero no tenemos mensaje específico
    if response and response.status_code == status.HTTP_403_FORBIDDEN:
        if isinstance(response.data, dict):
            if 'detail' not in response.data or not response.data['detail']:
                response.data = {
                    'detail': 'No tiene los privilegios para realizar esta acción.'
                }
    
    return response
