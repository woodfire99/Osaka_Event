# Generated by Django 5.2 on 2025-04-28 11:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0006_stationinfo'),
    ]

    operations = [
        migrations.CreateModel(
            name='FacilityInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('address', models.CharField(blank=True, max_length=500, null=True)),
                ('rating', models.FloatField(blank=True, null=True)),
                ('photo_reference', models.TextField(blank=True, null=True)),
                ('lat', models.FloatField(blank=True, null=True)),
                ('lng', models.FloatField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
