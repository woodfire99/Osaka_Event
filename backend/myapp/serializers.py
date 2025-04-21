from rest_framework import serializers
from .models import EventDetail

class EventDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventDetail
        fields = '__all__'
