import { qs, qsa } from "./utils.js";

export const LEG_CONTAINER_ID = "legs-list";
export const HIDDEN_JSON_ID = "legs_json";

export function newLeg(init = {}) {
    return {
        type: init.type || "",
        side: init.side || "",
        K: init.K ?? "",
        price: init.price ?? "",
        Q: init.Q ?? 1,
    };
}

export function renderLegs(state) {
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
        <div>${idx === 0 ? "" : `<button type="button" class="btn danger remove-leg">Delete</button>`}</div>
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

        qsa("[data-field]", card).forEach(el => {
            el.addEventListener("input", () => {
                const f = el.getAttribute("data-field");
                state.legs[idx][f] =
                    f === "Q" ? Math.max(1, parseInt(el.value || "1", 10))
                        : (f === "K" || f === "price") ? (el.value === "" ? "" : Number(el.value))
                            : el.value;
            });
        });

        const del = qs(".remove-leg", card);
        if (del) {
            del.addEventListener("click", () => {
                state.legs.splice(idx, 1);
                renderLegs(state);
            });
        }

        wrap.appendChild(card);

        const css = getComputedStyle(document.documentElement);
        const panelBG = (css.getPropertyValue("--panel-2") || css.getPropertyValue("--panel")).trim();
        const textCol = css.getPropertyValue("--text").trim();
        qsa("select", card).forEach(s => { s.style.backgroundColor = panelBG; s.style.color = textCol; });
        qsa("option", card).forEach(o => { o.style.backgroundColor = panelBG; o.style.color = textCol; });
    });
}

export function serializeLegsToHidden(state) {
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

export function readInitialLegsFromQuery() {
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
