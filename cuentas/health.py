from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class HealthView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'API NUAM en funcionamiento',
        }, status=status.HTTP_200_OK)
