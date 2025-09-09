// options/static/options/js/home.js

// ---------- helpers ----------
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const LEG_CONTAINER_ID = "legs-list";
const HIDDEN_JSON_ID = "legs_json";

function newLeg(init = {}) {
    return {
        type: init.type || "",      // 'call' | 'put'
        side: init.side || "",      // 'long' | 'short'
        K: init.K ?? "",      // number
        price: init.price ?? "",      // number (premium)
        Q: init.Q ?? 1,       // integer
    };
}

// ---------- legs UI ----------
function renderLegs(state) {
    const wrap = qs(`#${LEG_CONTAINER_ID}`);
    if (!wrap) return;
    wrap.innerHTML = "";

    state.legs.forEach((leg, idx) => {
        const card = document.createElement("div");
        card.className = "leg";
        card.dataset.index = idx;

        card.innerHTML = `
      <div class="leg-head">
        <div class="leg-title">Leg ${idx + 1}</div>
        <div>
          ${idx === 0 ? "" : `<button type="button" class="btn danger remove-leg">Delete</button>`}
        </div>
      </div>

      <div class="leg-grid">
        <label class="group">
          <span>Action</span>
          <select data-field="side" required>
            <option value="" ${!leg.side ? "selected" : ""} disabled hidden>Choose…</option>
            <option value="long"  ${leg.side === "long" ? "selected" : ""}>Long</option>
            <option value="short" ${leg.side === "short" ? "selected" : ""}>Short</option>
          </select>
        </label>

        <label class="group">
          <span>Type</span>
          <select data-field="type" required>
            <option value="" ${!leg.type ? "selected" : ""} disabled hidden>Choose…</option>
            <option value="call" ${leg.type === "call" ? "selected" : ""}>Call</option>
            <option value="put"  ${leg.type === "put" ? "selected" : ""}>Put</option>
          </select>
        </label>

        <label class="group">
          <span>Strike (K)</span>
          <input type="number" step="any" data-field="K" value="${leg.K}" required>
        </label>

        <label class="group">
          <span>Premium</span>
          <input type="number" step="any" data-field="price" value="${leg.price}" required>
        </label>

        <label class="group">
          <span>Qty</span>
          <input type="number" step="1" min="1" data-field="Q" value="${leg.Q}">
        </label>
      </div>
    `;

        // Bind field changes to state
        qsa("[data-field]", card).forEach(el => {
            el.addEventListener("input", () => {
                const f = el.getAttribute("data-field");
                state.legs[idx][f] =
                    f === "Q" ? Math.max(1, parseInt(el.value || "1", 10))
                        : (f === "K" || f === "price") ? (el.value === "" ? "" : Number(el.value))
                            : el.value;
            });
        });

        // Delete (only for legs > 1)
        const del = qs(".remove-leg", card);
        if (del) {
            del.addEventListener("click", () => {
                state.legs.splice(idx, 1);
                renderLegs(state); // re-render (renumbers titles)
            });
        }

        // Append and style selects/options to match card bg
        wrap.appendChild(card);
        const css = getComputedStyle(document.documentElement);
        const panelBG = (css.getPropertyValue("--panel-2") || css.getPropertyValue("--panel")).trim();
        const textCol = css.getPropertyValue("--text").trim();
        qsa("select", card).forEach(s => { s.style.backgroundColor = panelBG; s.style.color = textCol; });
        qsa("option", card).forEach(o => { o.style.backgroundColor = panelBG; o.style.color = textCol; });
    });
}

function serializeLegsToHidden(state) {
    const ok = l =>
        (l.type === "call" || l.type === "put") &&
        (l.side === "long" || l.side === "short") &&
        Number.isFinite(Number(l.K)) &&
        Number.isFinite(Number(l.price)) &&
        parseInt(l.Q || 1, 10) > 0;

    const legs = state.legs
        .map(l => ({
            type: l.type,
            side: l.side,
            K: Number(l.K),
            price: Number(l.price),
            Q: Math.max(1, parseInt(l.Q || 1, 10)),
        }))
        .filter(ok);

    const hidden = qs(`#${HIDDEN_JSON_ID}`);
    if (hidden) hidden.value = JSON.stringify(legs);
}

function readInitialLegsFromQuery() {
    try {
        const el = qs("#initial-legs-json");
        if (!el) return null;
        const txt = (el.textContent || "").trim();
        if (!txt) return null;
        const arr = JSON.parse(txt);
        if (Array.isArray(arr) && arr.length) {
            return arr.map(l => newLeg(l));
        }
    } catch (_) { }
    return null;
}

// canvas chart 
let payoffChart = null;

function drawCanvasChart(ctx, data) {
    const ds = {
        label: data.name || "Payoff",
        data: data.x.map((x, i) => ({ x, y: data.y[i] })),
        borderWidth: 2,
        fill: false,
        tension: 0,
    };

    if (payoffChart) payoffChart.destroy();
    payoffChart = new Chart(ctx, {
        type: "line",
        data: { datasets: [ds] },
        options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            maintainAspectRatio: false,
            parsing: false,
            scales: {
                x: {
                    type: "linear",
                    title: { display: true, text: "Underlying price at expiry (S_T)" },
                    grid: { color: "rgba(255,255,255,.08)" },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
                },
                y: {
                    title: { display: true, text: "Profit / Loss" },
                    grid: { color: "rgba(255,255,255,.08)" },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
                }
                // y: {
                //     ticks: { beginAtZero: true },
                //     grid: {
                //         color: (ctx) => ctx.tick.value === 0 ? "rgba(255, 255, 255, 1)" : "rgba(255,255,255,.08)",
                //         lineWidth: (ctx) => ctx.tick.value === 0 ? 1 : 0.5,
                //         borderDash: (ctx) => ctx.tick.value === 0 ? [6, 4] : undefined,
                //     }
                // }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `Underlying: ${items[0].parsed.x.toFixed(2)}`,
                        label: (ctx) => `Payoff: ${Number(ctx.parsed.y).toFixed(2)}`
                    }
                }
            },
            elements: { point: { radius: 0 } }
        }
    });
}

function fetchAndDrawChart() {
    const form = qs("#params-form");
    const canvas = qs("#payoffCanvas");
    if (!form || !canvas || !window.Chart) return;

    const baseUrl = form.dataset.jsonUrl; // "/payoff.json"
    if (!baseUrl) return;

    const url = baseUrl + (location.search ? location.search + "&" : "?") + "cb=" + Date.now();

    fetch(url)
        .then(r => r.json())
        .then(d => {
            if (d.errors) {
                console.warn("payoff.json errors:", d.errors);
                return;
            }
            const ctx = canvas.getContext("2d");
            drawCanvasChart(ctx, d);
        })
        .catch(err => console.error("payoff.json failed", err));
}

// ---------- bootstrap ----------
document.addEventListener("DOMContentLoaded", () => {
    const state = { legs: [] };

    // init legs: from query (?legs=…) or one blank leg
    const initLegs = readInitialLegsFromQuery();
    state.legs = (initLegs && initLegs.length) ? initLegs : [newLeg()];
    renderLegs(state);

    // add leg button
    const addBtn = qs("#add-leg");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            state.legs.push(newLeg());
            renderLegs(state);
        });
    }

    // submit handling
    const form = qs("#params-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            const start = Number(qs("#start")?.value);
            const stop = Number(qs("#stop")?.value);
            const by = Number(qs("#by")?.value);

            if (!(stop > start) || !(by > 0)) {
                e.preventDefault();
                alert("Please ensure: start < stop and step > 0");
                return;
            }

            const first = state.legs[0];
            const firstOk = first && first.type && first.side &&
                first.K !== "" && first.price !== "";
            if (!firstOk) {
                e.preventDefault();
                alert("Please fill the first leg (action, type, strike, premium).");
                return;
            }

            serializeLegsToHidden(state);
        });
    }

    // draw canvas after load if domain fields present (and page has the canvas)
    const hasDomain = !!(qs("#start")?.value && qs("#stop")?.value && qs("#by")?.value);
    if (hasDomain && qs("#payoffCanvas") && form?.dataset.jsonUrl && window.Chart) {
        fetchAndDrawChart();
    }
});
