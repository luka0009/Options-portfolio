import numpy as np
from .instruments import Option
from .plotting import plot_payoff

class OptionStrat:
    def __init__(self, name, S0, range_kwargs=None):
        self.name = str(name)
        self.S0 = float(S0)

        if range_kwargs:
            start = float(range_kwargs.get('start', 0))
            stop  = float(range_kwargs.get('stop', 2 * S0))
            by    = float(range_kwargs.get('by', 1))
            self.STs = np.arange(start, stop, by)
        else:
            self.STs = np.arange(0, self.S0 * 2, 1)

        self.payoffs = np.zeros_like(self.STs, dtype=float)
        self.instruments = []

    # legs
    def long_call(self, K, C, Q=1):
        self.payoffs += (np.maximum(self.STs - float(K), 0.0) - float(C)) * int(Q)
        self._add('call', K, C, +1, Q)

    def short_call(self, K, C, Q=1):
        self.payoffs += (-(np.maximum(self.STs - float(K), 0.0)) + float(C)) * int(Q)
        self._add('call', K, C, -1, Q)

    def long_put(self, K, P, Q=1):
        self.payoffs += (np.maximum(float(K) - self.STs, 0.0) - float(P)) * int(Q)
        self._add('put', K, P, +1, Q)

    def short_put(self, K, P, Q=1):
        self.payoffs += (-(np.maximum(float(K) - self.STs, 0.0)) + float(P)) * int(Q)
        self._add('put', K, P, -1, Q)

    def _add(self, type_, K, price, side, Q):
        o = Option(type_, K, price, side)
        for _ in range(int(Q)):
            self.instruments.append(o)

    # metrics
    def _net_premium(self):
        c = 0.0
        for o in self.instruments:
            c += o.price if o.side == 1 else -o.price
        return float(c)

    def _breakevens(self):
        x, y = self.STs, self.payoffs
        bes = []
        for i in range(1, len(x)):
            if (y[i-1] <= 0 <= y[i]) or (y[i-1] >= 0 >= y[i]):
                x0, x1 = x[i-1], x[i]
                y0, y1 = y[i-1], y[i]
                if y1 == y0:
                    bes.append(float(x0))
                else:
                    xi = x0 + (0 - y0) * (x1 - x0) / (y1 - y0)
                    bes.append(float(xi))
        return sorted({round(b, 6) for b in bes})

    def metrics(self):
        return {
            "max_profit": float(self.payoffs.max()),
            "max_loss": float(self.payoffs.min()),
            "net_premium": self._net_premium(),
            "breakevens": self._breakevens(),
        }

    def describe_text(self):
        m = self.metrics()
        bes = ", ".join(f"{b:.2f}" for b in m["breakevens"]) if m["breakevens"] else "—"
        return (
            f"Max profit: {m['max_profit']:.2f}; "
            f"Max loss: {m['max_loss']:.2f}; "
            f"Net premium: {m['net_premium']:.2f}; "
            f"Break-evens: {bes}."
        )

    def describe(self):
        m = self.metrics()
        print(f"Max Profit: ${round(m['max_profit'], 3)}")
        print(f"Max loss: ${round(m['max_loss'], 3)}")
        print(f"Cost of entering position ${round(m['net_premium'], 3)}")

    # keep the same .plot() API by delegating
    def plot(self, **params):
        return plot_payoff(self, **params)
