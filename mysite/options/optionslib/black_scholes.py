
import math

def _norm_cdf(x: float) -> float:
    
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def _norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

def bsm_price(spot: float, strike: float, t: float, r: float, sigma: float, q: float = 0.0, kind: str = "C") -> float:
    if t <= 0 or sigma <= 0 or spot <= 0 or strike <= 0:
        
        intrinsic = max(0.0, (spot - strike) if kind.upper() == "C" else (strike - spot))
        return float(intrinsic)

    d1 = (math.log(spot / strike) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
    d2 = d1 - sigma * math.sqrt(t)

    if kind.upper() == "C":
        return spot * math.exp(-q * t) * _norm_cdf(d1) - strike * math.exp(-r * t) * _norm_cdf(d2)
    else:
        return strike * math.exp(-r * t) * _norm_cdf(-d2) - spot * math.exp(-q * t) * _norm_cdf(-d1)

def greeks(spot: float, strike: float, t: float, r: float, sigma: float, q: float = 0.0, kind: str = "C"):
    
    if t <= 0 or sigma <= 0 or spot <= 0 or strike <= 0:
        return {"delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}

    d1 = (math.log(spot / strike) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
    d2 = d1 - sigma * math.sqrt(t)

    pdf = _norm_pdf(d1)
    disc_q = math.exp(-q * t)
    disc_r = math.exp(-r * t)

    if kind.upper() == "C":
        delta = disc_q * _norm_cdf(d1)
        rho   = t * strike * disc_r * _norm_cdf(d2)
        theta = (-disc_q * spot * pdf * sigma / (2 * math.sqrt(t))
                 - r * strike * disc_r * _norm_cdf(d2)
                 + q * spot * disc_q * _norm_cdf(d1))
    else:
        delta = -disc_q * _norm_cdf(-d1)
        rho   = -t * strike * disc_r * _norm_cdf(-d2)
        theta = (-disc_q * spot * pdf * sigma / (2 * math.sqrt(t))
                 + r * strike * disc_r * _norm_cdf(-d2)
                 - q * spot * disc_q * _norm_cdf(-d1))

    gamma = disc_q * pdf / (spot * sigma * math.sqrt(t))
    vega  = spot * disc_q * pdf * math.sqrt(t)  
    return {"delta": delta, "gamma": gamma, "vega": vega, "theta": theta, "rho": rho}
