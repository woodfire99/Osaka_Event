from django.urls import path
from .views import StationSearchView, EventDetailListView,  RentInfoByStationView, recommend_stations, fetch_events_by_station, photo_proxy, receive_idx, fetch_facilities
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('events/', EventDetailListView.as_view(), name='event-list'),
    path('send-idx/', receive_idx),
    path('facilities/', fetch_facilities, name='fetch_facilities'),
    path('photo-proxy/', photo_proxy, name='photo_proxy'),
    path('events-by-station/', fetch_events_by_station, name='fetch_events_by_station'),
    path('recommend/', recommend_stations, name='recommend_stations'),
    path('rent-by-station/', RentInfoByStationView.as_view(), name='rent-by-station'),
    path('search-stations/', StationSearchView.as_view()),
    ]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)