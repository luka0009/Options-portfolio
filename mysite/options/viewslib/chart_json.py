from django.http import JsonResponse
from .utils import parse_params, build_strategy_from_params

def payoff_json(request):
    params, errors = parse_params(request)
    if errors:
        return JsonResponse({"errors": errors}, status=400)
    strat = build_strategy_from_params(params)
    
    return JsonResponse({
        "name": params.get("name", ""),
        "S0": params.get("S0", 0.0),
        "x": strat.STs.tolist(),
        "y": strat.payoffs.tolist(),
        "metrics": strat.metrics(),       
        "desc": strat.describe_text(),
    })
