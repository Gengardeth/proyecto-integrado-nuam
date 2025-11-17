#!/bin/bash

# Script de inicio para contenedor Django

set -e

echo "Esperando a PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL iniciado"

echo "Ejecutando migraciones..."
python manage.py migrate --noinput

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear

echo "Creando superusuario si no existe..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@nuam.com', 'admin123', rol='ADMIN')
    print('Superusuario creado')
else:
    print('Superusuario ya existe')
END

echo "Iniciando servidor..."
exec "$@"
