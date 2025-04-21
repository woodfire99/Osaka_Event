from django.db import models

class EventDetail(models.Model):
    url = models.TextField(unique=True)
    title = models.TextField(null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    date = models.TextField(null=True, blank=True)
    image = models.TextField(null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'event_details' 