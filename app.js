const STORAGE_KEY = "gardenPlanV1";

const VEGETABLE_ICONS = {
  tomato: "🍅",
  carrot: "🥕",
  lettuce: "🥬",
  cucumber: "🥒",
  pepper: "🫑",
  potato: "🥔",
  onion: "🧅",
  garlic: "🧄",
  broccoli: "🥦",
  cabbage: "🥬",
  kale: "🥬",
  spinach: "🥬",
  beet: "🫜",
  radish: "🫜",
  corn: "🌽",
  pea: "🫛",
  bean: "🫘",
  pumpkin: "🎃",
  squash: "🎃",
  zucchini: "🥒",
  strawberry: "🍓",
  blueberry: "🫐",
  herb: "🌿",
};

const FALLBACK_ICON = "🌱";
const layout = [
  { type: "bed", id: "bed-a", rows: 8, cols: 4, variant: "4x8" },
  { type: "bed", id: "bed-b", rows: 8, cols: 4, variant: "4x8" },
  { type: "tree", id: "pear-1", label: "Pear Tree", fruitIcon: "🍐" },
  { type: "tree", id: "pear-2", label: "Pear Tree", fruitIcon: "🍐" },
  { type: "bed", id: "bed-c", rows: 8, cols: 2, variant: "2x8" },
  { type: "tree", id: "cherry", label: "Cherry Tree", fruitIcon: "🍒" },
  { type: "bed", id: "bed-d", rows: 8, cols: 4, variant: "4x8" },
  { type: "bed", id: "bed-e", rows: 8, cols: 4, variant: "4x8" },
];

const garden = document.querySelector(".garden");
const dialog = document.getElementById("plot-dialog");
const form = document.getElementById("plot-form");
const plotTitle = document.getElementById("plot-title");
const vegTypeInput = document.getElementById("veg-type");
const dateInput = document.getElementById("plant-date");
const cancelBtn = document.getElementById("cancel-btn");
const clearBtn = document.getElementById("clear-btn");
const legendList = document.getElementById("legend-list");

let activePlotId = null;
const plan = loadPlan();

renderLayout();
renderLegend();

cancelBtn.addEventListener("click", () => dialog.close("cancel"));

clearBtn.addEventListener("click", () => {
  if (!activePlotId) return;
  delete plan[activePlotId];
  savePlan();
  updatePlot(activePlotId);
  dialog.close("clear");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!activePlotId) return;

  const vegetable = vegTypeInput.value.trim().toLowerCase();
  const plantedDate = dateInput.value;
  if (!vegetable || !plantedDate) return;

  plan[activePlotId] = {
    vegetable,
    plantedDate,
    updatedAt: new Date().toISOString(),
  };

  savePlan();
  updatePlot(activePlotId);
  dialog.close("save");
});

function renderLayout() {
  layout.forEach((section) => {
    if (section.type === "tree") {
      const tree = document.createElement("figure");
      tree.className = "tree";
      tree.innerHTML = `
        <span class="tree__icon-wrap" aria-hidden="true">
          <span class="tree__emoji">🌳</span>
          <span class="tree__fruit">${section.fruitIcon}</span>
        </span>
        <figcaption class="tree__label">${section.label}</figcaption>
      `;
      garden.appendChild(tree);
      return;
    }

    const bed = document.createElement("section");
    bed.className = `bed bed--${section.variant}`;
    bed.setAttribute("aria-label", `${section.id} garden bed`);

    for (let row = 1; row <= section.rows; row += 1) {
      for (let col = 1; col <= section.cols; col += 1) {
        const plotId = `${section.id}-r${row}c${col}`;
        const plot = document.createElement("button");
        plot.className = "plot";
        plot.type = "button";
        plot.dataset.plotId = plotId;

        plot.addEventListener("click", () => openEditor(plotId));

        bed.appendChild(plot);
        updatePlot(plotId);
      }
    }

    garden.appendChild(bed);
  });
}

function openEditor(plotId) {
  activePlotId = plotId;
  const current = plan[plotId];

  plotTitle.textContent = `Planting details for ${plotId}`;
  vegTypeInput.value = current?.vegetable ?? "";
  dateInput.value = current?.plantedDate ?? "";

  dialog.showModal();
}

function updatePlot(plotId) {
  const plot = document.querySelector(`[data-plot-id="${plotId}"]`);
  if (!plot) return;

  const current = plan[plotId];
  if (!current) {
    plot.textContent = "";
    plot.title = `Empty plot (${plotId})`;
    return;
  }

  const icon = iconForVegetable(current.vegetable);
  plot.textContent = icon;
  plot.title = `${titleCase(current.vegetable)} — planted ${current.plantedDate}`;
}

function renderLegend() {
  Object.entries(VEGETABLE_ICONS).forEach(([vegetable, icon]) => {
    const li = document.createElement("li");
    li.textContent = `${icon} ${titleCase(vegetable)}`;
    legendList.appendChild(li);
  });

  const fallback = document.createElement("li");
  fallback.textContent = `${FALLBACK_ICON} Other / unknown vegetable`;
  legendList.appendChild(fallback);
}

function iconForVegetable(vegetable) {
  return VEGETABLE_ICONS[vegetable.toLowerCase()] ?? FALLBACK_ICON;
}

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePlan() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function titleCase(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
