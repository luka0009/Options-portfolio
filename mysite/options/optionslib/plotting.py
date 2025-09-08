import matplotlib.pyplot as plt


def plot_payoff(obj, **params):
    """obj is an OptionStrat with .STs and .payoffs; returns a Figure."""
    fig, ax = plt.subplots(figsize=(7, 4))
    fig.patch.set_facecolor('#002b36')
    ax.set_facecolor('#002b36')

    ax.plot(obj.STs, obj.payoffs, **params)
    ax.set_title(f"Payoff Diagram: {obj.name}", color='white')

    ax.axhline(0, color='white', linestyle='--', linewidth=1)
    ax.set_xlabel(r'$S_T$', color="white")
    ax.set_ylabel('Profit in $', color="white")

    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    for spine in ax.spines.values():
        spine.set_color('white')
    return fig
