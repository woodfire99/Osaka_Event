from django.urls import path
from .views import EventDetailListView, fetch_events_by_station, photo_proxy, receive_idx, fetch_facilities

urlpatterns = [
    path('events/', EventDetailListView.as_view(), name='event-list'),
    path('send-idx/', receive_idx),
    path('facilities/', fetch_facilities, name='fetch_facilities'),
    path('photo-proxy/', photo_proxy, name='photo_proxy'),
    path('events-by-station/', fetch_events_by_station, name='fetch_events_by_station'),
    ]