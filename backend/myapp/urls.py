from django.urls import path
from .views import EventDetailListView, receive_idx, fetch_facility_info

urlpatterns = [
    path('events/', EventDetailListView.as_view(), name='event-list'),
    path('send-idx/', receive_idx),
    path('fetch-facility-info/', fetch_facility_info, name='fetch_facility_info'),
]