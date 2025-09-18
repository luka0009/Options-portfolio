from django.shortcuts import render
from ..optionslib.black_scholes import bsm_price, greeks

def _to_float(v, default=None):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default

def pricing(request):
    S = _to_float(request.GET.get("spot"))
    K = _to_float(request.GET.get("strike"))
    T = _to_float(request.GET.get("ttm_years"))
    r_in = request.GET.get("rate")
    q_in = request.GET.get("div_yield")
    vol_in = request.GET.get("vol")
    kind = (request.GET.get("kind") or "C").upper()

    def pct_to_dec(x):
        if x is None:
            return None
        x = str(x).strip()
        try:
            val = float(x)

            return val/100.0 if abs(val) > 1.0 else val
        except ValueError:
            return None

    r = pct_to_dec(r_in)
    q = pct_to_dec(q_in)
    sigma = pct_to_dec(vol_in)

    price = None
    greek_vals = None
    error = None

    if all(v is not None for v in [S, K, T, r, sigma]):
        try:
            price = bsm_price(S, K, T, r, sigma, q or 0.0, kind)
            greek_vals = greeks(S, K, T, r, sigma, q or 0.0, kind)
        except Exception as e:
            error = f"Could not compute price: {e}"
    is_call = (kind == "C")
    is_put = (kind == "P")

    context = {
    "spot": request.GET.get("spot"),
    "strike": request.GET.get("strike"),
    "ttm_years": request.GET.get("ttm_years"),
    "rate": r_in,
    "div_yield": q_in,
    "vol": vol_in,
    "kind": kind,
    "is_call": is_call,
    "is_put": is_put,
    "price": round(price, 6) if price is not None else None,
    "greeks": greek_vals,
    "error": error,
}
    return render(request, "options/pricing.html", context)
