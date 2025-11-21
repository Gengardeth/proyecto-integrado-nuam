# Generated migration to add RECHAZADO status to BulkUpload

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calificacionfiscal', '0006_change_bulk_upload_tipo_to_utf8'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bulkupload',
            name='estado',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('PROCESANDO', 'Procesando'),
                    ('COMPLETADO', 'Completado'),
                    ('RECHAZADO', 'Rechazado'),
                    ('ERROR', 'Error')
                ],
                default='PENDIENTE',
                max_length=20
            ),
        ),
    ]
