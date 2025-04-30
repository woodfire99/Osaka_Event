from django.db import models
from django.contrib.postgres.fields import ArrayField

class EventDetail(models.Model):
    url = models.TextField(unique=True)
    title = models.TextField(null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    date = models.TextField(null=True, blank=True)
    image = models.TextField(null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    nearest_station = models.JSONField(null=True, blank=True)  # 여러 개 저장 가능
    district_name = models.CharField(max_length=100, null=True, blank=True)  # 구 이름
    lat = models.FloatField(null=True, blank=True)   # 추가
    lng = models.FloatField(null=True, blank=True)   # 추가
    ai_summary =  models.TextField(null=True)

    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'event_details' 
        managed = False  

class StationInfo(models.Model):
    number = models.IntegerField()
    japanese = models.CharField(max_length=255)
    english = models.CharField(max_length=255)
    korean = models.CharField(max_length=255)
    station_code = models.CharField(max_length=50, null=True, blank=True)
    ai_summary = models.TextField(null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)  # 🔥 추가
    lng = models.FloatField(null=True, blank=True)  # 🔥 추가
    photo_reference = models.CharField(max_length=255, null=True, blank=True)
    mood = ArrayField(models.CharField(max_length=30), null=True, blank=True)

    def __str__(self):
        return self.japanese

class FacilityInfo(models.Model):
    name = models.CharField(max_length=255, unique=True)  # 시설 이름
    address = models.CharField(max_length=1000, blank=True, null=True)
    rating = models.FloatField(blank=True, null=True)
    photo_reference = models.TextField(blank=True, null=True)
    lat = models.FloatField(blank=True, null=True)
    lng = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # 처음 등록 시간
    updated_at = models.DateTimeField(auto_now=True)      # 업데이트 시간

    def __str__(self):
        return self.name

class NearbyFacility(models.Model):
    station = models.ForeignKey('StationInfo', on_delete=models.CASCADE, related_name='facilities')
    name = models.CharField(max_length=255)        # 시설 이름
    address = models.CharField(max_length=1000, blank=True)  # 주소 (없을 수도 있어서 blank=True)
    rating = models.FloatField(null=True, blank=True)       # 평점 (0~5점, 없을 수도 있음)
    place_id = models.CharField(max_length=255, blank=True) # 구글 Place ID (필요하면 활용)
    photo_reference = models.CharField(max_length=1000, blank=True) # 사진 가져올 때 필요한 photo_reference
    created_at = models.DateTimeField(auto_now_add=True)    # 최초 저장시간
    updated_at = models.DateTimeField(auto_now=True)        # 업데이트 시간

    def __str__(self):
        return f"{self.name} ({self.station.japanese})"
    
class RentInfo(models.Model):
    line = models.CharField(max_length=50)
    room_type = models.CharField(max_length=20)
    station = models.CharField(max_length=50)
    rent_price = models.FloatField(null=True, blank=True)

