# Generated by Django 5.2 on 2025-04-22 06:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0003_alter_eventdetail_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventdetail',
            name='district_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='eventdetail',
            name='nearest_station',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
