from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),                  
    path("payoff.png", views.option_payoff_png, name="option_payoff_png"),
    path("dashboard/", views.dashboard, name="dashboard"),  
    path("pricing/", views.pricing, name='pricing'),
     path("payoff.json", views.payoff_json, name="payoff_json")
]