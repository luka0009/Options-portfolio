import numpy as np

class Option:
    """side: +1 long, -1 short; type_: 'call' | 'put'."""
    def __init__(self, type_, K, price, side):
        self.type = type_
        self.K = float(K)
        self.price = float(price)
        self.side = int(side)

    def __repr__(self):
        side = 'long' if self.side == 1 else 'short'
        return f'Option(type={self.type}, K={self.K}, price={self.price}, side={side})'
