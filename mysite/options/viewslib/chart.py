# options/viewslib/chart.py
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from django.http import HttpResponse
from django.views.decorators.cache import never_cache
from .utils import parse_params, build_strategy_from_params

@never_cache
def option_payoff_png(request):
    params, errors = parse_params(request)
    if errors:
        return HttpResponse("Bad Request: " + "; ".join(errors), status=400, content_type="text/plain")

    strat = build_strategy_from_params(params)
    fig = strat.plot(color="white", linewidth=2)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return HttpResponse(buf.getvalue(), content_type="image/png")
