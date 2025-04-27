from django.db import models

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

    def __str__(self):
        return self.japanese
