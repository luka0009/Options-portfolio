const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const LEG_CONTAINER_ID = "legs-list";
const HIDDEN_JSON_ID = "legs_json";

function newLeg(init = {}) {
    return {
        type: init.type || "",       // 'call' | 'put'
        side: init.side || "",       // 'long' | 'short'
        K: init.K ?? "",
        price: init.price ?? "",
        Q: init.Q ?? 1,
    };
}

function renderLegs(state) {
    const wrap = qs(`#${LEG_CONTAINER_ID}`);
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

        // Wire changes
        qsa("[data-field]", card).forEach(el => {
            el.addEventListener("input", () => {
                const f = el.getAttribute("data-field");
                state.legs[idx][f] =
                    f === "Q" ? parseInt(el.value || "1", 10)
                        : f === "K" || f === "price" ? (el.value === "" ? "" : Number(el.value))
                            : el.value;
            });
        });

        // Delete (only appears for idx > 0)
        const delBtn = qs(".remove-leg", card);
        if (delBtn) {
            delBtn.addEventListener("click", () => {
                state.legs.splice(idx, 1);
                renderLegs(state); // re-render -> renumber
            });
        }

        wrap.appendChild(card);

        const css = getComputedStyle(document.documentElement);
        const panelBG = (css.getPropertyValue('--panel-2') || css.getPropertyValue('--panel')).trim();
        const textCol = css.getPropertyValue('--text').trim();

        qsa("option", card).forEach(o => {
            o.style.backgroundColor = panelBG;
            o.style.color = textCol;
        });
    });
}

function serializeLegsToHidden(state) {

    const legs = state.legs
        .map(l => ({
            type: l.type,
            side: l.side,
            K: Number(l.K),
            price: Number(l.price),
            Q: parseInt(l.Q || 1, 10)
        }))
        .filter(l =>
            (l.type === "call" || l.type === "put") &&
            (l.side === "long" || l.side === "short") &&
            Number.isFinite(l.K) && Number.isFinite(l.price) && l.Q > 0
        );

    qs(`#${HIDDEN_JSON_ID}`).value = JSON.stringify(legs);
}

function readInitialLegsFromQuery() {

    try {
        const el = qs("#initial-legs-json");
        if (!el) return null;
        const txt = el.textContent.trim();
        if (!txt) return null;
        const arr = JSON.parse(txt);
        if (Array.isArray(arr) && arr.length) {
            return arr.map(l => newLeg(l));
        }
    } catch (_) { }
    return null;
}

document.addEventListener("DOMContentLoaded", () => {
    const state = { legs: [] };

    const init = readInitialLegsFromQuery();
    state.legs = (init && init.length) ? init : [newLeg()];

    renderLegs(state);


    qs("#add-leg").addEventListener("click", () => {
        state.legs.push(newLeg());
        renderLegs(state);
    });

    const form = qs("#params-form");
    form.addEventListener("submit", (e) => {
        const start = Number(qs("#start").value);
        const stop = Number(qs("#stop").value);
        const by = Number(qs("#by").value);
        if (!(stop > start) || !(by > 0)) {
            e.preventDefault();
            alert("Please ensure: start < stop and step > 0");
            return;
        }
        // Keep at least first leg filled: require type/side/K/price
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
});