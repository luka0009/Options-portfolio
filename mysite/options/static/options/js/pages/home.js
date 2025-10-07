import { qs } from "app/utils";
import { newLeg, renderLegs, serializeLegsToHidden, readInitialLegsFromQuery } from "app/legs";
import { fetchAndDrawChart } from "app/chart";

export function bootstrapHome() {
    const state = { legs: [] };

    const initLegs = readInitialLegsFromQuery();
    state.legs = (initLegs && initLegs.length) ? initLegs : [newLeg()];
    renderLegs(state);

    const addBtn = qs("#add-leg");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            state.legs.push(newLeg());
            renderLegs(state);
        });
    }

    const form = qs("#params-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            const start = Number(qs("#start")?.value);
            const stop = Number(qs("#stop")?.value);
            const by = Number(qs("#by")?.value);

            const stopEl = qs("#stop");
            let effectiveStop = Number(stopEl?.value);

            const biggestK = state.legs
                .map(l => Number(l.K))
                .filter(Number.isFinite)
                .reduce((max, n) => Math.max(max, n), -Infinity);

            if (Number.isFinite(biggestK) && biggestK !== -Infinity) {
                const mustExceed = biggestK * 1.3;
                if (!(effectiveStop > 0 && effectiveStop > mustExceed)) {
                    effectiveStop = biggestK * 1.7;
                    if (stopEl) stopEl.value = String(effectiveStop);
                }
            }

            if (!(by > 0)) {
                e.preventDefault();
                alert("Please ensure: step > 0");
                return; 1
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


    const hasDomain = !!(qs("#start")?.value && qs("#stop")?.value && qs("#by")?.value);
    if (hasDomain && qs("#payoffCanvas") && form?.dataset.jsonUrl && window.Chart) {
        fetchAndDrawChart();
    }
}


// scales: {
//     x: {
//         type: "linear",
//         title: { display: true, text: "Underlying price at expiry (S_T)" },
//         grid: { color: "rgba(255,255,255,.08)" },
//         ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
//     },
//     y: {
//         title: { display: true, text: "Profit / Loss" },
//         grid: { color: "rgba(255,255,255,.08)" },
//         ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text") }
//     }
//     y: {
//         ticks: { beginAtZero: true },
//         grid: {
//             color: (ctx) => ctx.tick.value === 0 ? "rgba(255, 255, 255, 1)" : "rgba(255,255,255,.08)",
//             lineWidth: (ctx) => ctx.tick.value === 0 ? 1 : 0.5,
//             borderDash: (ctx) => ctx.tick.value === 0 ? [6, 4] : undefined,
//         }
//     }
// }