from datetime import datetime
from django.utils import timezone
from django.shortcuts import render
from options.optionslib.black_scholes import bsm_price, greeks

DATE_FMT = "%Y-%m-%d"


def _to_float(x):
    try:
        if x is None or x == "":
            return None
        return float(str(x).strip())
    except Exception:
        return None


def _percent_str(x):
    try:
        return f"{100 * x:.2f}%"
    except Exception:
        return "—"


def _parse_percent_maybe(x):
    if x is None:
        return None
    s = str(x).strip().rstrip("%")
    v = _to_float(s)
    if v is None:
        return None
    if abs(v) > 1:
        return v / 100.0
    return v


def _t_from_inputs(days_to_expiry, expiry_date_str):
    if days_to_expiry is not None:
        try:
            d = int(days_to_expiry)
            return max(0.0, d / 365.25)
        except Exception:
            pass
    if expiry_date_str:
        try:
            expiry_dt = datetime.strptime(expiry_date_str, DATE_FMT)
            expiry_dt = timezone.make_aware(expiry_dt, timezone.get_current_timezone())
            expiry_dt = expiry_dt.replace(hour=23, minute=59, second=59)
            secs = max(0.0, (expiry_dt - timezone.now()).total_seconds())
            return secs / (365.25 * 24 * 3600)
        except Exception:
            pass
    return None


def _normalize_kind(x):
    if x is None:
        return "call"
    s = str(x).strip().lower()
    if s in {"c", "call", "1", "true"}:
        return "call"
    if s in {"p", "put", "-1", "false"}:
        return "put"
    return "call"


def pricing(request):
    context = {}

    if request.method == "POST":
        spot_in = request.POST.get("spot")
        strike_in = request.POST.get("strike")
        vol_in = request.POST.get("vol", "20.0")
        rate_in = request.POST.get("rate", "2.0")
        q_in = request.POST.get("div_yield")
        days_in = request.POST.get("days_to_expiry")
        date_in = request.POST.get("expiry_date")
        raw_kind = request.POST.get("kind", "call")
        kind = _normalize_kind(raw_kind)
        lib_kind = "c" if kind == "call" else "p"

        S = _to_float(spot_in)
        K = _to_float(strike_in)
        sigma = _parse_percent_maybe(vol_in)
        r = _parse_percent_maybe(rate_in)
        q = _parse_percent_maybe(q_in)
        T = _t_from_inputs(days_in, date_in)

        if r is None:
            r = 0.0
        if q is None:
            q = 0.0

        missing = []
        if S is None:
            missing.append("spot")
        if K is None:
            missing.append("strike")
        if sigma is None:
            missing.append("volatility")
        if T is None:
            missing.append("expiry (days or date)")

        if missing:
            context["error"] = "Please provide: " + ", ".join(missing)
        else:
            try:
                price = bsm_price(
                    spot=S, strike=K, t=T, r=r, sigma=sigma, q=q, kind=lib_kind
                )
                greek_vals = greeks(
                    spot=S, strike=K, t=T, r=r, sigma=sigma, q=q, kind=lib_kind
                )

                context.update(
                    {
                        "price": f"{price:.6f}",
                        "t_years": f"{T:.6f}",
                        "vol_fmt": _percent_str(sigma),
                        "rate_fmt": _percent_str(r),
                        "div_fmt": _percent_str(q),
                        "greeks": {g: f"{v:.6f}" for g, v in greek_vals.items()},
                    }
                )
            except Exception as ex:
                context["error"] = f"Could not compute price: {ex}"

        # Always repopulate inputs for form
        context.update(
            {
                "spot": spot_in,
                "strike": strike_in,
                "vol": vol_in,
                "rate": rate_in,
                "div_yield": q_in,
                "days_to_expiry": days_in,
                "expiry_date": date_in,
                "kind": kind,
            }
        )

    return render(request, "options/pricing.html", context)
