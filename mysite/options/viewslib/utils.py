from typing import Tuple, Dict, List, Any
from django.http import HttpRequest
from ..optionslib import OptionStrat  

def _to_float(name: str, val: str, errors: List[str]) -> float:
    try:
        return float(val)
    except Exception:
        errors.append(f"invalid '{name}' (must be a number)")
        return 0.0  

def _to_int(name: str, val: str, errors: List[str]) -> int:
    try:
        return int(val)
    except Exception:
        errors.append(f"invalid '{name}' (must be an integer)")
        return 1

def _parse_legs_from_json(raw: str, errors: List[str]) -> List[Dict[str, Any]]:
    import json
    try:
        data = json.loads(raw)
    except Exception:
        errors.append("invalid 'legs' (must be valid JSON array)")
        return []
    if not isinstance(data, list):
        errors.append("invalid 'legs' (must be a JSON array)")
        return []

    legs: List[Dict[str, Any]] = []
    for i, leg in enumerate(data, 1):
        if not isinstance(leg, dict):
            errors.append(f"leg #{i} must be an object")
            continue
        type_ = str(leg.get("type", "")).lower()
        side_in = str(leg.get("side", "")).lower()
        if type_ not in ("call", "put"):
            errors.append(f"leg #{i}: 'type' must be 'call' or 'put'")
            continue
        if side_in in ("long", "+1", "1", "buy"):
            side = 1
        elif side_in in ("short", "-1", "sell"):
            side = -1
        else:
            errors.append(f"leg #{i}: 'side' must be 'long' or 'short'")
            continue
        try:
            K = float(leg.get("K"))
            price = float(leg.get("price"))
        except Exception:
            errors.append(f"leg #{i}: 'K' and 'price' must be numbers")
            continue
        Q = int(leg.get("Q", 1))
        legs.append({"type": type_, "side": side, "K": K, "price": price, "Q": Q})
    return legs

def _parse_indexed_legs(q) -> List[Dict[str, Any]]:

    legs: List[Dict[str, Any]] = []
    for i in range(1, 21):
        t = q.get(f"l{i}_type")
        if not t:
            continue
        type_ = str(t).lower()
        side_in = (q.get(f"l{i}_side") or "").lower()
        side = 1 if side_in in ("long", "+1", "1", "buy") else -1
        try:
            K = float(q.get(f"l{i}_K"))
            price = float(q.get(f"l{i}_price"))
        except Exception:
            # skip silently; the dashboard will show validation from parse_params
            continue
        Q = int(q.get(f"l{i}_Q", 1))
        legs.append({"type": type_, "side": side, "K": K, "price": price, "Q": Q})
    return legs

def parse_params(request: HttpRequest) -> Tuple[Dict[str, Any], List[str]]:
    q = request.GET
    errors: List[str] = []

    name = (q.get("name") or "").strip()

    s0_str = q.get("S0")
    S0 = None
    if s0_str not in (None, ""):
        try:
            S0 = float(s0_str)
        except Exception:
            errors.append("invalid 'S0' (must be a number)")
            S0 = None

    start = q.get("start")
    stop = q.get("stop")
    by = q.get("by")
    if start in (None, ""): errors.append("missing 'start'")
    if stop  in (None, ""): errors.append("missing 'stop'")
    if by    in (None, ""): errors.append("missing 'by'")

    start_v = _to_float("start", start, errors) if start not in (None, "") else 0.0
    stop_v  = _to_float("stop", stop, errors)   if stop  not in (None, "") else 0.0
    by_v    = _to_float("by", by, errors)       if by    not in (None, "") else 1.0

    if by_v <= 0:
        errors.append("'by' must be > 0")
    if stop_v <= start_v:
        errors.append("'stop' must be > 'start'")

    legs: List[Dict[str, Any]] = []
    raw_legs = q.get("legs")
    if raw_legs not in (None, ""):
        legs = _parse_legs_from_json(raw_legs, errors)
    else:
        legs = _parse_indexed_legs(q)

    params = {
        "name": name,                 # may be ""
        "S0": S0 if S0 is not None else 0.0,  # neutral placeholder for title (no preset/default behavior)
        "start": start_v,
        "stop": stop_v,
        "by": by_v,
        "legs": legs,                 # may be empty (zero line)
    }
    return params, errors

def build_strategy_from_params(p: Dict[str, Any]) -> OptionStrat:
    strat = OptionStrat(
        p["name"] or "",  # empty string name is fine
        p["S0"],
        range_kwargs={"start": p["start"], "stop": p["stop"], "by": p["by"]},
    )
    # Add each leg
    for leg in p["legs"]:
        if leg["type"] == "call":
            (strat.long_call if leg["side"] == 1 else strat.short_call)(leg["K"], leg["price"], leg.get("Q", 1))
        elif leg["type"] == "put":
            (strat.long_put  if leg["side"] == 1 else strat.short_put )(leg["K"], leg["price"], leg.get("Q", 1))
    return strat
