from django.shortcuts import render

def pricing(request):
    return render(request, "options/pricing.html")
