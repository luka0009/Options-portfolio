from django.shortcuts import render
from django.utils.timezone import now
from .utils import parse_params, build_strategy_from_params

def home(request):
    params, errors = parse_params(request)
    ctx = {
        "params": params,
        "errors": errors,
        "ready": False,
        "cb": int(now().timestamp()),
        "metrics": None,
        "desc_text": "",
    }
    if not errors and request.GET:
        strat = build_strategy_from_params(params)
        ctx["metrics"] =   strat.metrics()
        ctx["desc_text"] = strat.describe_text()
        ctx["ready"] = True
    return render(request, "options/home.html", ctx)