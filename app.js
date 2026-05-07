// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TOTAL    = 960_000_000; // ARS  (~USD 800.000 al TC $1.200)
const USD_RATE = 1_200;

// ─── DATA ─────────────────────────────────────────────────────────────────────

const categories = [
  {
    label: "Lo que necesita la gente",
    items: [
      {
        emoji: "👩‍🏫",
        name:  "Salario docente",
        price: 738_115,
        hint:  "Maestra de grado PBA, abril 2026",
      },
      {
        emoji: "👴",
        name:  "Jubilación mínima",
        price: 369_601,
        hint:  "ANSES, marzo 2026",
      },
      {
        emoji: "🧺",
        name:  "Canasta básica familiar",
        price: 1_360_299,
        hint:  "CBT para familia tipo, INDEC ene 2026",
      },
      {
        emoji: "🥛",
        name:  "Litro de leche",
        price: 1_681,
        hint:  "Precio promedio supermercado, abr 2026",
      },
      {
        emoji: "📚",
        name:  "Libro de texto",
        price: 15_000,
        hint:  "Primaria, precio promedio",
      },
      {
        emoji: "💊",
        name:  "Ibuprofeno x 20",
        price: 3_200,
        hint:  "Genérico, farmacia",
      },
    ],
  },
  {
    label: "Lo que él sí pudo comprar",
    items: [
      {
        emoji: "🏊",
        name:  "Cascada en la pileta",
        price: 294_000_000,
        hint:  "Obra Indio Cuá — contratista declaró USD 245k en efectivo",
      },
      {
        emoji: "🏡",
        name:  "Casa en country",
        price: 144_000_000,
        hint:  "Indio Cuá, USD 120k escriturados (nov 2024)",
      },
      {
        emoji: "🏢",
        name:  "Depto en Caballito",
        price: 276_000_000,
        hint:  "Miró al 500, USD 230k (nov 2025)",
      },
      {
        emoji: "✈️",
        name:  "Vacaciones en Aruba",
        price: 17_608_800,
        hint:  "4 pasajes 1ra clase + estadía, USD 14.674 (dic 2024)",
      },
      {
        emoji: "🏨",
        name:  "Noche en Llao Llao",
        price: 986_399,
        hint:  "Hotel spa 5 estrellas, Bariloche",
      },
      {
        emoji: "🚙",
        name:  "Jeep Compass 2021",
        price: 30_000_000,
        hint:  "Origen de fondos declarado: 'venta de activos'",
      },
    ],
  },
  {
    label: "Cosas graciosas",
    items: [
      {
        emoji: "🎮",
        name:  "PlayStation 5",
        price: 1_500_000,
        hint:  "PS5 Slim con lectora, 2026",
      },
      {
        emoji: "🚗",
        name:  "Fiat Uno usado",
        price: 3_500_000,
        hint:  "Un clásico del pueblo argentino",
      },
      {
        emoji: "🛁",
        name:  "Jacuzzi importado",
        price: 4_800_000,
        hint:  "Como el de Indio Cuá",
      },
      {
        emoji: "🧑‍⚖️",
        name:  "Hora de abogado",
        price: 150_000,
        hint:  "Penalista top, Comodoro Py",
      },
      {
        emoji: "🛋️",
        name:  "Colchón pa' los dólares",
        price: 8_000,
        hint:  "Para guardar los USD 42.500 declarados",
      },
      {
        emoji: "🗂️",
        name:  "DDJJ honesta",
        price: 0,
        hint:  "Precio: $0. Disponibilidad: muy escasa.",
      },
    ],
  },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

/** @type {number[][]} counts[categoryIndex][itemIndex] */
let counts = categories.map((cat) => cat.items.map(() => 0));
let spent  = 0;

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

/**
 * Full ARS amount with thousands separators.
 * @param {number} n
 * @returns {string}
 */
function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

/**
 * Compact ARS amount (B / M / K suffix).
 * @param {number} n
 * @returns {string}
 */
function fmtCompact(n) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return fmt(n);
}

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────

/** @param {string} id @returns {HTMLElement} */
const $ = (id) => document.getElementById(id);

// ─── UI UPDATERS ──────────────────────────────────────────────────────────────

function updateTopbar() {
  const remaining = TOTAL - spent;
  const pct       = Math.min(100, (spent / TOTAL) * 100);

  const balEl = $("balance");
  balEl.textContent = fmt(remaining);
  balEl.classList.toggle("low", remaining < TOTAL * 0.15);

  const fillEl = $("progress-fill");
  fillEl.style.width = pct.toFixed(2) + "%";
  fillEl.classList.toggle("done", pct >= 100);

  $("pct-label").textContent =
    pct.toFixed(1) +
    "% gastado  ·  USD " +
    Math.round(remaining / USD_RATE).toLocaleString("es-AR") +
    " restantes";

  $("banner").style.display = pct >= 100 ? "block" : "none";
}

function updateReceipt() {
  const bodyEl = $("receipt-body");

  const lines = categories.flatMap((cat, ci) =>
    cat.items
      .map((item, ii) => ({ item, count: counts[ci][ii], sub: counts[ci][ii] * item.price }))
      .filter((l) => l.count > 0)
  );

  if (!lines.length) {
    bodyEl.innerHTML = '<div id="receipt-empty">Todavía no gastaste nada 👀</div>';
    return;
  }

  const rows = lines
    .map(
      (l) => `
      <div class="r-line">
        <div class="r-name">
          ${l.item.emoji} ${l.item.name}
          <span>× ${l.count}</span>
        </div>
        <div class="r-amt">${fmtCompact(l.sub)}</div>
      </div>`
    )
    .join("");

  const total = `
    <div id="receipt-total-row">
      <div id="receipt-total-label">Total gastado</div>
      <div id="receipt-total-val">${fmt(spent)}</div>
    </div>`;

  bodyEl.innerHTML = rows + total;
}

/**
 * Re-renders a single card's dynamic parts after a quantity change.
 * @param {number} ci  Category index
 * @param {number} ii  Item index
 */
function refreshCard(ci, ii) {
  const card = document.getElementById(`c-${ci}-${ii}`);
  const item = categories[ci].items[ii];
  const qty  = counts[ci][ii];

  // Animated counter
  const qEl = card.querySelector(".item-qty");
  qEl.textContent = qty;
  qEl.classList.remove("pop");
  void qEl.offsetWidth; // force reflow to restart animation
  qEl.classList.add("pop");

  // Button states
  card.querySelector(".ctrl-btn.minus").disabled =
    qty === 0;
  card.querySelector(".ctrl-btn.plus").disabled =
    item.price > 0 && spent + item.price > TOTAL;

  // Subtotal
  card.querySelector(".item-subtotal").textContent =
    qty > 0 ? fmt(qty * item.price) : "";

  // Highlight if any quantity bought
  card.classList.toggle("bought", qty > 0);
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

/**
 * Increment item count.
 * @param {number} ci  Category index
 * @param {number} ii  Item index
 */
function add(ci, ii) {
  const item = categories[ci].items[ii];
  if (item.price > 0 && spent + item.price > TOTAL) return;

  counts[ci][ii]++;
  spent += item.price;

  refreshCard(ci, ii);
  updateTopbar();
  updateReceipt();
}

/**
 * Decrement item count (no-op if already zero).
 * @param {number} ci  Category index
 * @param {number} ii  Item index
 */
function sub(ci, ii) {
  if (counts[ci][ii] === 0) return;

  counts[ci][ii]--;
  spent -= categories[ci].items[ii].price;

  refreshCard(ci, ii);
  updateTopbar();
  updateReceipt();
}

/** Reset all quantities and totals to zero. */
function resetAll() {
  counts = categories.map((cat) => cat.items.map(() => 0));
  spent  = 0;

  document.querySelectorAll(".item-card").forEach((card) => {
    card.querySelector(".item-qty").textContent      = "0";
    card.querySelector(".item-subtotal").textContent = "";
    card.querySelector(".ctrl-btn.minus").disabled   = true;
    card.querySelector(".ctrl-btn.plus").disabled    = false;
    card.classList.remove("bought");
  });

  updateTopbar();
  updateReceipt();
}

// ─── INITIAL RENDER ───────────────────────────────────────────────────────────

function render() {
  const wrap = $("items-wrap");
  wrap.innerHTML = "";

  categories.forEach((cat, ci) => {
    // Section heading
    const lbl       = document.createElement("div");
    lbl.className   = "section-label";
    lbl.textContent = cat.label;
    wrap.appendChild(lbl);

    // Item grid
    const grid      = document.createElement("div");
    grid.className  = "items-grid";

    cat.items.forEach((item, ii) => {
      const card    = document.createElement("div");
      card.className = "item-card";
      card.id        = `c-${ci}-${ii}`;

      const priceStr = item.price === 0 ? "gratis" : fmt(item.price);

      card.innerHTML = `
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">${priceStr}</div>
        <div class="item-qty">0</div>
        <div class="item-controls">
          <button class="ctrl-btn minus" onclick="sub(${ci},${ii})" disabled>−</button>
          <button class="ctrl-btn plus"  onclick="add(${ci},${ii})">+</button>
        </div>
        <div class="item-subtotal"></div>
        <div class="item-hint">${item.hint}</div>
      `;

      grid.appendChild(card);
    });

    wrap.appendChild(grid);
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────

render();
updateTopbar();
