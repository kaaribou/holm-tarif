/* HOLM HP/HC — carte heures creuses / heures pleines — https://github.com/kaaribou/holm-tarif — licence MIT */
(() => {
  const VERSION = "1.1.0";
  const fmt = (v, d = 4) => (v === null || v === undefined || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("fr-FR", { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d }));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hex2rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return undefined; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (a) => (Array.isArray(a) ? "#" + a.map((v) => Number(v).toString(16).padStart(2, "0")).join("") : a);
  const DEF = { hc: "#2e7d32", hp: "#e64a19", bleu: "#2f6fd6", blanc: "#8d99a8", rouge: "#d8433b" };
  const TCOL = { Bleu: "bleu", Blanc: "blanc", Rouge: "rouge" };
  // Tempo : lignes de prix par couleur
  const TROWS = ["bleu", "blanc", "rouge"].flatMap((c) => [[`prix_${c}_hc`, `${c[0].toUpperCase() + c.slice(1)} · heures creuses`, "€/kWh", 4, "mdi:circle", c, true],
    [`prix_${c}_hp`, `${c[0].toUpperCase() + c.slice(1)} · heures pleines`, "€/kWh", 4, "mdi:circle", c, false]]);
  const GROUPS = { base: "Prix, taxes et abonnement", tempo_bleu: "Tempo · jours Bleus", tempo_blanc: "Tempo · jours Blancs", tempo_rouge: "Tempo · jours Rouges" };
  // attribut du capteur Tarif actuel -> libellé, unité affichée, décimales, icône
  const ROWS = [
    ["prix_hc", "Heures creuses", "€/kWh", 4, "mdi:leaf"],
    ["prix_hp", "Heures pleines", "€/kWh", 4, "mdi:fire"],
    ["abonnement_mensuel", "Abonnement", "€/mois", 2, "mdi:calendar-month"],
    ["cspe", "CSPE / accise", "€/kWh", 5, "mdi:bank-outline"],
    ["tcfe", "TCFE", "€/kWh", 5, "mdi:bank-outline"],
    ["prix_rachat", "Rachat du surplus", "€/kWh", 4, "mdi:solar-power-variant"],
    ["taxe_revente", "Taxe sur la revente", "€/kWh", 4, "mdi:percent-outline"],
  ];

  // plages « 14:58-16:58, 23:28-05:28 » -> début de la période en cours (barre d'avancement)
  const parseRanges = (t) => String(t || "").split(",").map((p) => p.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/)).filter(Boolean)
    .map((m) => [(+m[1] * 60 + +m[2]) % 1440, (+m[3] * 60 + +m[4]) % 1440]);
  const inHC = (min, rs) => rs.some(([a, b]) => (a < b ? min >= a && min < b : min >= a || min < b));
  const periodStart = (now, rs) => {
    const cur = inHC(now.getHours() * 60 + now.getMinutes(), rs);
    for (let back = 1; back <= 2880; back++) {
      const t = new Date(now.getTime() - back * 60000);
      if (inHC(t.getHours() * 60 + t.getMinutes(), rs) !== cur) return new Date(t.getTime() + 60000);
    }
    return null;
  };

  class HolmTarifCard extends HTMLElement {
    static getConfigElement() { return document.createElement("holm-tarif-card-editor"); }
    static getStubConfig(hass) { return { entity: HolmTarifCard.findEntity(hass) || "" }; }
    static findEntity(hass) {
      if (!hass) return null;
      return Object.keys(hass.states).find((e) => e.startsWith("binary_sensor.") && hass.states[e].attributes.plages_hc !== undefined && hass.states[e].attributes.prochaine_periode !== undefined) || null;
    }
    setConfig(c) {
      this._c = { show_details: false, show_progress: true, show_settings: true, background: "always", color_mode: "tempo", ...c };
      this._c.colors = { ...DEF, ...(c.colors || {}) };
      if (this.shadowRoot) this._render();
    }
    set hass(h) {
      this._hass = h;
      if (!this.shadowRoot) { this.attachShadow({ mode: "open" }); this._build(); }
      const ent = this._entity(), st = ent && h.states[ent], ps = this._priceSensor();
      const tom = h.states["sensor.tempo_couleur_demain"];
      const key = [st && st.state, st && st.attributes.prochaine_bascule, st && st.attributes.tarif, st && st.attributes.plages_hc, st && st.attributes.couleur, tom && tom.state, ps && JSON.stringify(ps.attributes)].join("|");
      if (key !== this._key) { this._key = key; this._render(); }
    }
    connectedCallback() { this._tick = setInterval(() => this._render(), 30000); }
    disconnectedCallback() { clearInterval(this._tick); }
    getCardSize() { return this._c && this._c.show_details ? 5 : 2; }
    getGridOptions() { return { columns: 6, min_columns: 4, rows: "auto" }; }
    _entity() { return this._c.entity || HolmTarifCard.findEntity(this._hass); }
    _priceSensor() {
      const h = this._hass; if (!h) return null;
      const id = Object.keys(h.states).find((e) => e.startsWith("sensor.") && h.states[e].attributes.reglages !== undefined && h.states[e].attributes.prix_hc !== undefined);
      return id ? h.states[id] : null;
    }
    _admin() { return !!(this._hass && this._hass.user && this._hass.user.is_admin); }
    _build() {
      this.shadowRoot.innerHTML = `<style>${HolmTarifCard.css()}</style><ha-card><div class="bg"></div>
        <div class="main" id="main"></div><div class="det" id="det"></div><div class="set" id="set"></div></ha-card>`;
      const r = this.shadowRoot;
      r.getElementById("main").addEventListener("click", (e) => {
        if (e.target.closest(".gear")) { e.stopPropagation(); return this._openSettings(); }
        const ent = this._entity(); if (!ent) return;
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: ent }, bubbles: true, composed: true }));
      });
      r.getElementById("det").addEventListener("click", (e) => {
        const row = e.target.closest("[data-k]"); if (!row || e.target.closest("input,button")) return;
        this._edit(row);
      });
      // les touches tapées dans la carte ne doivent pas déclencher les raccourcis du tableau de bord
      ["keydown", "keyup"].forEach((ev) => r.getElementById("set").addEventListener(ev, (e) => e.stopPropagation()));
    }
    _render() {
      if (!this.shadowRoot || !this._c || !this._hass) return;
      const card = this.shadowRoot.querySelector("ha-card"), main = this.shadowRoot.getElementById("main"), det = this.shadowRoot.getElementById("det");
      const ent = this._entity(), st = ent && this._hass.states[ent];
      if (!st) { main.innerHTML = `<div class="miss">Intégration HOLM HP/HC introuvable : choisissez son capteur « Heures creuses ».</div>`; det.innerHTML = ""; return; }
      const a = st.attributes, hc = st.state === "on";
      const tday = TCOL[a.couleur] || null, tomSt = this._hass.states["sensor.tempo_couleur_demain"], ttom = tomSt ? TCOL[tomSt.state] || null : null;
      const col = tday && this._c.color_mode === "tempo" ? this._c.colors[tday] : hc ? this._c.colors.hc : this._c.colors.hp;
      const bg = this._c.background, filled = bg === "always" || (bg === "hc" && hc) || (bg === "hp" && !hc);
      card.style.setProperty("--c", col);
      card.classList.toggle("hc", hc);
      card.classList.toggle("filled", filled);
      const next = a.prochaine_bascule ? new Date(a.prochaine_bascule) : null, now = new Date();
      let label = "";
      if (next) {
        const mins = Math.max(0, Math.ceil((next - now) / 60000));
        const hh = String(next.getHours()).padStart(2, "0"), mm = String(next.getMinutes()).padStart(2, "0");
        const dur = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
        label = `${esc(a.prochaine_periode || "")} dans ${dur} <span class="at">(à ${hh}h${mm})</span>`;
      }
      let prog = "";
      if (this._c.show_progress && next && a.source !== "compteur") {
        const start = periodStart(now, parseRanges(a.plages_hc));
        if (start && next > start) prog = `<div class="bar"><i style="width:${Math.min(100, Math.max(0, ((now - start) / (next - start)) * 100)).toFixed(1)}%"></i></div>`;
      }
      const gear = this._c.show_settings && this._admin() ? `<button class="gear" title="Réglages : heures creuses et tarifs"><ha-icon icon="mdi:cog-outline"></ha-icon></button>` : "";
      const tempo = a.couleur !== undefined ? `<div class="tp"><span class="tc"><i style="background:${tday ? this._c.colors[tday] : "transparent"}"></i>Jour ${esc(a.couleur)}</span>${ttom ? `<span class="tc dim">Demain <i style="background:${this._c.colors[ttom]}"></i>${esc(tomSt.state)}</span>` : ""}</div>` : "";
      card.classList.toggle("tblanc", tday === "blanc" && this._c.color_mode === "tempo");
      main.innerHTML = `<div class="ico"><ha-icon icon="${hc ? "mdi:leaf-circle-outline" : "mdi:fire-circle"}"></ha-icon></div>
        <div class="txt">${tempo}<div class="nm">${esc(this._c.name || (hc ? "Heures creuses" : "Heures pleines"))}</div>
        <div class="pr">${fmt(a.tarif)} <small>€/kWh</small></div><div class="lb">${label}</div>${prog}</div>${gear}`;
      if (!this._c.show_details) { det.innerHTML = ""; det.style.display = "none"; return; }
      det.style.display = "";
      if (this._editing) return;
      const ps = this._priceSensor(), pa = (ps && ps.attributes) || {}, ents = pa.reglages || {};
      const can = this._admin();
      det.innerHTML = `<div class="rng"><ha-icon icon="mdi:clock-outline"></ha-icon>Heures creuses : ${esc(a.plages_hc || "—")}</div>
        ${(pa.prix_bleu_hc !== undefined ? [...TROWS, ...ROWS.slice(2)] : ROWS).filter(([k]) => pa[k] !== undefined && pa[k] !== null).map(([k, l, u, d, ic, tc, thc]) => {
          const cur = tc ? tc === tday && thc === hc : (k === "prix_hc" && hc) || (k === "prix_hp" && !hc);
          return `<div class="row${cur ? " cur" : ""}${can ? " ed" : ""}" data-k="${k}" data-ent="${esc(ents[k] || "")}" ${can ? 'title="Toucher pour modifier"' : ""}>
          <ha-icon icon="${ic}" ${tc ? `style="color:${this._c.colors[tc]}"` : ""}></ha-icon><span class="l">${l}</span><span class="v">${fmt(pa[k], d)} <small>${u}</small></span>${can ? '<ha-icon class="pen" icon="mdi:pencil-outline"></ha-icon>' : ""}</div>`; }).join("")}`;
    }
    // modification rapide d'un prix (entités « nombre » de l'intégration)
    _edit(row) {
      if (!this._admin()) return;
      const ent = row.dataset.ent, st = ent && this._hass.states[ent]; if (!st) return;
      this._editing = true;
      const v = row.querySelector(".v");
      v.innerHTML = `<input type="number" step="any" min="0" value="${esc(st.state)}"><button class="ok">OK</button>`;
      const inp = v.querySelector("input");
      inp.focus(); inp.select();
      const done = (save) => {
        if (!this._editing) return;
        this._editing = false;
        const n = parseFloat(String(inp.value).replace(",", "."));
        if (save && !isNaN(n) && n >= 0 && String(n) !== st.state) this._hass.callService("number", "set_value", { entity_id: ent, value: n });
        this._key = ""; this._render();
      };
      inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
      inp.addEventListener("blur", () => setTimeout(() => done(true), 150));
      v.querySelector(".ok").addEventListener("click", (e) => { e.stopPropagation(); done(true); });
    }
    // ---- réglages : plages heures creuses, prix, taxes, abonnement ----
    async _openSettings() {
      const box = this.shadowRoot.getElementById("set");
      if (box.classList.contains("on")) return this._closeSettings();
      box.classList.add("on");
      box.innerHTML = `<div class="sh">Chargement…</div>`;
      try { this._cfg = await this._hass.callWS({ type: "holm_tarif/get" }); }
      catch (e) { box.innerHTML = `<div class="sh err">${esc(e.message || e)}</div>`; return; }
      this._draft = { ranges: this._cfg.ranges.map((r) => [...r]), prices: Object.fromEntries(this._cfg.prices.map((p) => [p.key, p.value])) };
      this._drawSettings();
    }
    _closeSettings() { const box = this.shadowRoot.getElementById("set"); box.classList.remove("on"); box.innerHTML = ""; }
    _drawSettings(msg = "") {
      const box = this.shadowRoot.getElementById("set"), d = this._draft;
      box.innerHTML = `
        <div class="sh"><ha-icon icon="mdi:clock-outline"></ha-icon>Heures creuses</div>
        <div class="rgs">${d.ranges.map(([a, b], i) => `<div class="rg" data-i="${i}"><span>de</span><input type="time" data-f="0" value="${a}"><span>à</span><input type="time" data-f="1" value="${b}">
          <button class="ib del" title="Supprimer cette plage" ${d.ranges.length < 2 ? "disabled" : ""}><ha-icon icon="mdi:close"></ha-icon></button></div>`).join("")}</div>
        <button class="add"><ha-icon icon="mdi:plus"></ha-icon>Ajouter une plage</button>
        ${((list) => Object.keys(GROUPS).filter((g) => list.some((p) => (p.group || "base") === g)).map((g) => `
        <div class="sh"><ha-icon icon="${g === "base" ? "mdi:cash-multiple" : "mdi:circle"}" ${g !== "base" ? `style="color:${this._c.colors[g.slice(6)]}"` : ""}></ha-icon>${GROUPS[g]}</div>
        <div class="pgs">${list.filter((p) => (p.group || "base") === g).map((p) => `<label class="pg"><span>${esc(g === "base" ? p.name : p.name.replace(/^Prix Tempo \S+ /, ""))}${p.link ? `<i title="Relié à ${esc(p.link)} : cette entrée est mise à jour aussi">relié</i>` : ""}</span>
          <span class="in"><input type="number" step="any" min="0" data-k="${p.key}" value="${d.prices[p.key] ?? ""}"><small>${p.unit === "EUR" ? "€/mois" : "€/kWh"}</small></span></label>`).join("")}</div>`).join(""))(
          // en Tempo, les prix HC / HP simples ne servent pas : on ne montre que les prix Tempo
          this._cfg.tariff === "tempo" ? this._cfg.prices.filter((p) => !["price_hc", "price_hp"].includes(p.key)) : this._cfg.prices)}
        ${this._cfg.tempo ? `<div class="tsrc">Couleur du jour : ${esc(this._cfg.tempo.source || "aucune source (réglage de l'intégration)")}</div>` : ""}
        ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        <div class="acts"><button class="cancel">Annuler</button><button class="save"><ha-icon icon="mdi:content-save-outline"></ha-icon>Enregistrer</button></div>`;
      box.querySelectorAll(".rg input").forEach((inp) => inp.addEventListener("change", () => { d.ranges[+inp.closest(".rg").dataset.i][+inp.dataset.f] = inp.value; }));
      box.querySelectorAll(".rg .del").forEach((b) => b.addEventListener("click", () => { d.ranges.splice(+b.closest(".rg").dataset.i, 1); this._drawSettings(); }));
      box.querySelector(".add").addEventListener("click", () => { d.ranges.push(["12:00", "14:00"]); this._drawSettings(); });
      box.querySelectorAll(".pg input").forEach((inp) => inp.addEventListener("input", () => { const n = parseFloat(String(inp.value).replace(",", ".")); d.prices[inp.dataset.k] = isNaN(n) ? null : n; }));
      box.querySelector(".cancel").addEventListener("click", () => this._closeSettings());
      box.querySelector(".save").addEventListener("click", () => this._saveSettings());
    }
    async _saveSettings() {
      const d = this._draft;
      if (d.ranges.some(([a, b]) => !a || !b || a === b)) return this._drawSettings("Chaque plage doit avoir une heure de début et une heure de fin différentes.");
      const prices = {};
      for (const p of this._cfg.prices) { const v = d.prices[p.key]; if (v !== null && v !== undefined && v !== p.value) { if (v < 0) return this._drawSettings("Un prix ne peut pas être négatif."); prices[p.key] = v; } }
      const same = JSON.stringify(d.ranges) === JSON.stringify(this._cfg.ranges);
      const btn = this.shadowRoot.querySelector(".set .save"); if (btn) { btn.disabled = true; btn.textContent = "Enregistrement…"; }
      try {
        await this._hass.callWS({ type: "holm_tarif/set", ...(same ? {} : { ranges: d.ranges }), ...(Object.keys(prices).length ? { prices } : {}) });
        this._closeSettings();
      } catch (e) { this._drawSettings(`Enregistrement impossible : ${e.message || e}`); }
    }
    static css() {
      return `
      :host { display:block; }
      ha-card { display:block; position:relative; overflow:hidden; --c:#607d8b; transition: box-shadow .5s; }
      .bg { position:absolute; inset:0; opacity:0; pointer-events:none; transition: opacity .5s, background .5s;
        background: linear-gradient(135deg, color-mix(in srgb, var(--c) 78%, #000) 0%, var(--c) 55%, color-mix(in srgb, var(--c) 70%, #fff) 100%); }
      ha-card.filled { color:#fff; box-shadow: 0 0 14px color-mix(in srgb, var(--c) 50%, transparent); }
      ha-card.filled .bg { opacity:1; }
      .main, .det, .set { position:relative; }
      .main { display:flex; align-items:center; gap:12px; padding:10px 14px; cursor:pointer; }
      .ico ha-icon { --mdc-icon-size:34px; display:block; color: var(--c); }
      ha-card.filled .ico ha-icon { color: rgba(255,255,255,.88); }
      ha-card.hc .ico ha-icon { animation: sway 6s ease-in-out infinite; }
      ha-card:not(.hc) .ico ha-icon { animation: flick 2.4s ease-in-out infinite; }
      @keyframes sway { 50% { transform: rotate(-8deg); } }
      @keyframes flick { 50% { transform: scale(1.06); filter: brightness(1.15); } }
      .txt { flex:1; min-width:0; }
      .nm { font-size:11px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; color: var(--c); }
      ha-card.filled .nm { color: inherit; opacity:.92; }
      .pr { font-size:20px; font-weight:800; line-height:1.2; font-variant-numeric: tabular-nums; }
      .pr small { font-size:12px; font-weight:600; opacity:.8; }
      .lb { font-size:11px; opacity:.88; line-height:1.3; }
      .at { opacity:.8; }
      .bar { height:3px; margin-top:6px; border-radius:2px; background: color-mix(in srgb, var(--c) 25%, transparent); overflow:hidden; }
      .bar i { display:block; height:100%; background: var(--c); border-radius:2px; transition: width .6s; }
      ha-card.filled .bar { background: rgba(255,255,255,.25); } ha-card.filled .bar i { background: rgba(255,255,255,.9); }
      .gear { align-self:flex-start; border:0; background:none; color:inherit; opacity:.6; cursor:pointer; padding:2px; border-radius:50%; }
      .gear:hover { opacity:1; background: rgba(127,127,127,.18); }
      .gear ha-icon { --mdc-icon-size:18px; display:block; }
      .det { background: rgba(0,0,0,.14); padding:6px 8px 8px; }
      ha-card.filled .det { background: rgba(0,0,0,.22); }
      .rng { display:flex; align-items:center; gap:6px; font-size:11.5px; opacity:.88; padding:2px 6px 6px; }
      .rng ha-icon { --mdc-icon-size:14px; }
      .row { display:flex; align-items:center; gap:8px; padding:5px 6px; border-radius:8px; font-size:13px; }
      .row.ed { cursor:pointer; } .row.ed:hover { background: rgba(127,127,127,.15); }
      .row.cur { background: rgba(127,127,127,.2); font-weight:700; }
      .row ha-icon { --mdc-icon-size:16px; opacity:.85; }
      .row .l { flex:1; }
      .row .v { font-variant-numeric: tabular-nums; display:flex; align-items:center; gap:4px; }
      .row .v small { opacity:.75; font-size:11px; }
      .row .pen { --mdc-icon-size:14px; opacity:0; } .row:hover .pen { opacity:.7; }
      input { padding:4px 6px; border-radius:6px; border:1px solid rgba(127,127,127,.35); font:inherit; background: var(--card-background-color, #fff); color: var(--primary-text-color, #222); }
      .row input { width:90px; text-align:right; }
      button.ok, .acts button, .add { border:0; border-radius:8px; padding:5px 10px; font:inherit; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }
      button.ok { background:#fff; color:#222; padding:3px 8px; }
      .set { display:none; padding:8px 12px 12px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); border-top:1px solid rgba(127,127,127,.25); }
      .set.on { display:block; }
      .sh { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.4px; margin:8px 0 6px; color: var(--c); }
      .sh ha-icon { --mdc-icon-size:16px; } .sh.err { color: var(--error-color, #e53935); text-transform:none; }
      .rg { display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:13px; }
      .rg input { width:96px; }
      .ib { border:0; background:none; color:inherit; cursor:pointer; padding:3px; border-radius:50%; opacity:.7; }
      .ib:disabled { opacity:.25; cursor:default; } .ib ha-icon { --mdc-icon-size:16px; display:block; }
      .add { background: rgba(127,127,127,.15); color:inherit; font-weight:600; font-size:12.5px; }
      .add ha-icon, .acts ha-icon { --mdc-icon-size:16px; }
      .pgs { display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:6px 12px; }
      .pg { display:flex; flex-direction:column; gap:3px; font-size:12px; }
      .pg i { font-style:normal; font-size:10px; margin-left:6px; padding:0 5px; border-radius:6px; background: color-mix(in srgb, var(--c) 25%, transparent); }
      .pg .in { display:flex; align-items:center; gap:6px; } .pg input { width:110px; text-align:right; } .pg small { opacity:.7; }
      .msg { margin-top:8px; font-size:12.5px; color: var(--error-color, #e53935); }
      .acts { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
      .acts .cancel { background: rgba(127,127,127,.15); color:inherit; }
      .acts .save { background: var(--c); color:#fff; }
      .acts button:disabled { opacity:.6; }
      .tp { display:flex; flex-wrap:wrap; gap:4px 10px; margin-bottom:3px; font-size:11px; font-weight:700; }
      .tc { display:inline-flex; align-items:center; gap:5px; } .tc.dim { opacity:.8; font-weight:600; }
      .tc i { width:9px; height:9px; border-radius:50%; box-shadow: 0 0 0 1.5px currentColor; }
      ha-card.tblanc .nm, ha-card.tblanc .sh { color: var(--primary-text-color); }
      ha-card.tblanc.filled .nm { color: inherit; }
      .tsrc { margin-top:8px; font-size:11.5px; opacity:.75; }
      .miss { padding:10px 14px; font-size:13px; color: var(--primary-text-color); }
      @media (prefers-reduced-motion: reduce) { .ico ha-icon { animation:none !important; } }`;
    }
  }

  class HolmTarifCardEditor extends HTMLElement {
    setConfig(c) { this._config = { ...c }; this._update(); }
    set hass(h) { this._hass = h; this._update(); }
    _update() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.schema = [
          { name: "entity", selector: { entity: { domain: "binary_sensor" } } },
          { name: "name", selector: { text: {} } },
          { name: "background", selector: { select: { mode: "dropdown", options: [
            { value: "always", label: "Toujours" }, { value: "hc", label: "En heures creuses seulement" },
            { value: "hp", label: "En heures pleines seulement" }, { value: "never", label: "Jamais (fond du thème)" }] } } },
          { type: "grid", name: "", schema: [{ name: "c_hc", selector: { color_rgb: {} } }, { name: "c_hp", selector: { color_rgb: {} } }] },
          { type: "expandable", title: "Option Tempo", icon: "mdi:circle-half-full", flatten: true, schema: [
            { name: "color_mode", selector: { select: { mode: "dropdown", options: [{ value: "tempo", label: "Couleur du jour Tempo" }, { value: "period", label: "Heures creuses / heures pleines" }] } } },
            { type: "grid", name: "", schema: [{ name: "c_bleu", selector: { color_rgb: {} } }, { name: "c_blanc", selector: { color_rgb: {} } }, { name: "c_rouge", selector: { color_rgb: {} } }] },
          ] },
          { type: "grid", name: "", schema: [{ name: "show_details", selector: { boolean: {} } }, { name: "show_progress", selector: { boolean: {} } }, { name: "show_settings", selector: { boolean: {} } }] },
        ];
        const L = { entity: "Capteur « Heures creuses » (automatique si vide)", name: "Titre (sinon Heures creuses / Heures pleines)", background: "Fond coloré",
          show_details: "Afficher les tarifs et l'abonnement", show_progress: "Barre d'avancement de la période", show_settings: "Bouton Réglages (administrateurs)",
          c_hc: "Couleur — heures creuses", c_hp: "Couleur — heures pleines", color_mode: "Couleur de la carte en Tempo",
          c_bleu: "Couleur — jour Bleu", c_blanc: "Couleur — jour Blanc", c_rouge: "Couleur — jour Rouge" };
        this._form.computeLabel = (s) => L[s.name] || s.name;
        this._form.addEventListener("value-changed", (ev) => {
          const v = { ...ev.detail.value }, out = { ...this._config }, colors = { ...(this._config.colors || {}) };
          for (const [k, val] of Object.entries(v)) {
            if (k.startsWith("c_")) { if (val) colors[k.slice(2)] = rgb2hex(val); else delete colors[k.slice(2)]; continue; }
            if (val === "" || val === undefined || val === null) delete out[k]; else out[k] = val;
          }
          if (Object.keys(colors).length) out.colors = colors; else delete out.colors;
          if (!out.show_details) delete out.show_details;
          if (out.show_progress !== false) delete out.show_progress;
          if (out.show_settings !== false) delete out.show_settings;
          if (out.background === "always") delete out.background;
          if (out.color_mode === "tempo") delete out.color_mode;
          this._config = out;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: out }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      const c = this._config, d = { show_details: false, show_progress: true, show_settings: true, background: "always", color_mode: "tempo", ...c };
      for (const [k, v] of Object.entries(c.colors || {})) d["c_" + k] = hex2rgb(v);
      delete d.colors;
      this._form.hass = this._hass;
      this._form.data = d;
    }
  }

  if (!customElements.get("holm-tarif-card")) customElements.define("holm-tarif-card", HolmTarifCard);
  if (!customElements.get("holm-tarif-card-editor")) customElements.define("holm-tarif-card-editor", HolmTarifCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-tarif-card"))
    window.customCards.push({ type: "holm-tarif-card", name: "HOLM HP/HC", description: "Heures creuses / heures pleines : période, tarif en cours, prochaine bascule, tarifs et réglages.", preview: true });
  console.info(`%c HOLM-HP/HC %c ${VERSION} `, "background:#2e7d32;color:#fff;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();
