from django.urls import path
from .views import EventDetailListView

urlpatterns = [
    path('events/', EventDetailListView.as_view(), name='event-list'),
]
