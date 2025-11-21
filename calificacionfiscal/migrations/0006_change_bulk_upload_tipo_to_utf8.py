# Generated migration to update BulkUpload tipo field to UTF-8 only

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calificacionfiscal', '0005_alter_taxrating_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bulkupload',
            name='tipo',
            field=models.CharField(
                choices=[('UTF8', 'UTF-8')],
                max_length=10
            ),
        ),
    ]
