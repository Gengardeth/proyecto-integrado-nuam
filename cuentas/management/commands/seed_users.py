from django.core.management.base import BaseCommand
from cuentas.models import Usuario

class Command(BaseCommand):
    help = 'Crea usuarios demo para roles RBAC'

    def handle(self, *args, **options):
        users = [
            {'username': 'admin', 'email': 'admin@nuam.cl', 'rol': 'ADMIN', 'password': 'admin123'},
            {'username': 'analista', 'email': 'analista@nuam.cl', 'rol': 'ANALISTA', 'password': 'analista123'},
            {'username': 'auditor', 'email': 'auditor@nuam.cl', 'rol': 'AUDITOR', 'password': 'auditor123'},
        ]
        for u in users:
            if not Usuario.objects.filter(username=u['username']).exists():
                user = Usuario.objects.create_user(
                    username=u['username'],
                    email=u['email'],
                    rol=u['rol'],
                    password=u['password']
                )
                self.stdout.write(self.style.SUCCESS(f"Usuario creado: {user.username} ({user.rol})"))
            else:
                self.stdout.write(self.style.WARNING(f"Usuario ya existe: {u['username']}"))
