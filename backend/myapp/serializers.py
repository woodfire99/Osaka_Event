from rest_framework import serializers
from .models import EventDetail,StationInfo,RentInfo

class RentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentInfo
        fields = ['station', 'line', 'room_type', 'rent_price']


class EventDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventDetail
        fields = '__all__'

class StationInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationInfo
        fields = ['number', 'japanese', 'english', 'korean', 'station_code']
