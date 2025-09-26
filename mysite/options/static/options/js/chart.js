import { qs } from "./utils.js";

let payoffChart = null;

export function drawCanvasChart(ctx, data) {
  const ds = {
    label: data.name || "Payoff",
    data: data.x.map((x, i) => ({ x, y: data.y[i] })),
    borderColor: "whitesmoke",
    borderWidth: 3,
    fill: false,
    tension: 0,
    pointRadius: 0
  };


  const zeroLine = {
    label: "Zero",
    data: [{ x: Math.min(...data.x), y: 0 }, { x: Math.max(...data.x), y: 0 }],
    borderColor: "rgba(255,255,255,.7)",
    borderWidth: 1.5,
    borderDash: [6, 4],
    pointRadius: 0, hitRadius: 0, hoverRadius: 0
  };

  if (payoffChart) payoffChart.destroy();
  payoffChart = new Chart(ctx, {
    type: "line",
    data: { datasets: [zeroLine, ds] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Underlying price at expiry (S_T)" },
          grid: { color: "rgba(255,255,255,.08)" },
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
        },
        y: {
          ticks: { beginAtZero: true },
          title: { display: true, text: "Profit / Loss" },
          grid: {
            color: "rgba(255,255,255,.08)"
          },
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `Payoff Diagram ${data.name ? `: ${data.name}` : ''}`,
          padding: {
            top: 10,
            bottom: 20
          },
          position: 'top',
          align: 'center',
          color: 'white',
          font: {
            size: 18
          }
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `S_T: ${items[0].parsed.x}`,
            label: (ctx) => `Payoff: ${Number(ctx.parsed.y).toFixed(2)}`
          }
        }
      },
      elements: { point: { radius: 0 } }
    }
  });
}

export function fetchAndDrawChart() {
  const form = qs("#params-form");
  const canvas = qs("#payoffCanvas");
  if (!form || !canvas || !window.Chart) return;

  const baseUrl = form.dataset.jsonUrl;
  if (!baseUrl) return;

  const url = baseUrl + (location.search ? location.search + "&" : "?") + "cb=" + Date.now();

  fetch(url)
    .then(r => r.json())
    .then(d => {
      if (d.errors) {
        console.warn("payoff.json errors:", d.errors);
        return;
      }
      drawCanvasChart(canvas.getContext("2d"), d);
    })
    .catch(err => console.error("payoff.json failed", err));
}
