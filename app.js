/* =========================================================
   KITCHENFLOW
   Application logic
========================================================= */


/* =========================================================
   DATA
========================================================= */

const defaultData = {
  timers: [],
  presets: [
    {
      id: crypto.randomUUID(),
      name: "Œufs mollets",
      seconds: 360
    },
    {
      id: crypto.randomUUID(),
      name: "Pâtes",
      seconds: 600
    },
    {
      id: crypto.randomUUID(),
      name: "Frites",
      seconds: 240
    }
  ],

  products: [],

  checklists: [
    {
      id: crypto.randomUUID(),
      name: "Mise en place",
      items: [
        { id: crypto.randomUUID(), text: "Préparer le poste", done: false },
        { id: crypto.randomUUID(), text: "Vérifier les produits", done: false },
        { id: crypto.randomUUID(), text: "Vérifier le matériel", done: false }
      ]
    }
  ],

  settings: {
    sound: "bell",
    volume: 70,
    repeat: false,
    dark: false
  }
};


let data = loadData();

let audioContext = null;
let activeOscillators = [];

let timerInterval = null;


/* =========================================================
   STORAGE
========================================================= */

function loadData() {

  try {

    const saved = localStorage.getItem("kitchenflow-data");

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {

    console.error(error);

    return structuredClone(defaultData);
  }
}


function saveData() {

  localStorage.setItem(
    "kitchenflow-data",
    JSON.stringify(data)
  );
}


/* =========================================================
   NAVIGATION
========================================================= */

const screens = [
  "home",
  "timers",
  "products",
  "checklists",
  "settings"
];


function showScreen(name) {

  screens.forEach(screen => {

    const element =
      document.getElementById(`screen-${screen}`);

    if (element) {
      element.classList.toggle(
        "active",
        screen === name
      );
    }

  });


  document.querySelectorAll(".nav-btn").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.screen === name
    );

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


document.querySelectorAll("[data-screen]").forEach(button => {

  button.addEventListener("click", () => {

    showScreen(button.dataset.screen);

  });

});


/* =========================================================
   MODAL
========================================================= */

const modalBackdrop =
  document.getElementById("modalBackdrop");

const modalContent =
  document.getElementById("modalContent");

const modalTitle =
  document.getElementById("modalTitle");

const modalEyebrow =
  document.getElementById("modalEyebrow");


function openModal(title, eyebrow, html) {

  modalTitle.textContent = title;
  modalEyebrow.textContent = eyebrow;

  modalContent.innerHTML = html;

  modalBackdrop.classList.add("open");

}


function closeModal() {

  modalBackdrop.classList.remove("open");

}


document
  .getElementById("closeModal")
  .addEventListener("click", closeModal);


modalBackdrop.addEventListener("click", event => {

  if (event.target === modalBackdrop) {
    closeModal();
  }

});


/* =========================================================
   TIMER HELPERS
========================================================= */

function formatTime(seconds) {

  seconds = Math.max(0, Math.round(seconds));

  const hours = Math.floor(seconds / 3600);

  const minutes =
    Math.floor((seconds % 3600) / 60);

  const secs =
    seconds % 60;


  if (hours > 0) {

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  }


  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


function createTimer(name, seconds, autoStart = true) {

  const timer = {

    id: crypto.randomUUID(),

    name:
      name.trim() || "Nouveau minuteur",

    duration: Math.max(1, seconds),

    remaining: Math.max(1, seconds),

    running: autoStart,

    finished: false,

    lastTick: Date.now()

  };


  data.timers.push(timer);

  saveData();

  renderTimers();

  return timer;
}


/* =========================================================
   TIMER ENGINE
========================================================= */

function startTimerEngine() {

  if (timerInterval) {
    return;
  }


  timerInterval = setInterval(() => {

    let changed = false;

    const now = Date.now();


    data.timers.forEach(timer => {

      if (!timer.running || timer.finished) {
        return;
      }


      const elapsed =
        (now - timer.lastTick) / 1000;


      if (elapsed <= 0) {
        return;
      }


      timer.remaining -= elapsed;

      timer.lastTick = now;

      changed = true;


      if (timer.remaining <= 0) {

        timer.remaining = 0;

        timer.running = false;

        timer.finished = true;

        playTimerSound();

      }

    });


    if (changed) {

      saveData();

      renderTimers();

    }

  }, 250);

}


startTimerEngine();


function toggleTimer(id) {

  const timer =
    data.timers.find(item => item.id === id);

  if (!timer) return;


  if (timer.finished) {

    timer.remaining = timer.duration;
    timer.finished = false;

  }


  timer.running = !timer.running;

  timer.lastTick = Date.now();

  saveData();

  renderTimers();

}


function stopTimer(id) {

  data.timers =
    data.timers.filter(timer => timer.id !== id);

  saveData();

  renderTimers();

}


function resetTimer(id) {

  const timer =
    data.timers.find(item => item.id === id);

  if (!timer) return;


  timer.remaining = timer.duration;
  timer.running = false;
  timer.finished = false;
  timer.lastTick = Date.now();

  saveData();

  renderTimers();

}


/* =========================================================
   TIMER RENDER
========================================================= */

function renderTimers() {

  const container =
    document.getElementById("timersContainer");

  const home =
    document.getElementById("homeTimers");

  const empty =
    document.getElementById("emptyTimers");

  const count =
    document.getElementById("timerCount");


  count.textContent =
    data.timers.filter(t => t.running).length;


  const html =
    data.timers
      .map(timerCard)
      .join("");


  container.innerHTML = html;

  home.innerHTML =
    data.timers
      .filter(timer => timer.running || timer.finished)
      .slice(0, 3)
      .map(timerCard)
      .join("");


  empty.style.display =
    data.timers.length ? "none" : "block";


  attachTimerEvents();

  renderPresets();

}


function timerCard(timer) {

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        (timer.remaining / timer.duration) * 100
      )
    );


  let status = "En pause";

  if (timer.running) {
    status = "En cours";
  }

  if (timer.finished) {
    status = "Terminé";
  }


  let buttonText = "Reprendre";

  if (timer.running) {
    buttonText = "Pause";
  }

  if (timer.finished) {
    buttonText = "Relancer";
  }


  return `

    <article
      class="timer-card ${timer.finished ? "finished" : ""}"
      data-timer-id="${timer.id}"
    >

      <div class="timer-top">

        <div>

          <div class="timer-name">
            ${escapeHtml(timer.name)}
          </div>

          <div class="timer-status">
            ${status}
          </div>

        </div>

      </div>


      <div class="timer-time">
        ${formatTime(timer.remaining)}
      </div>


      <div class="timer-progress">
        <div
          class="timer-progress-bar"
          style="width:${percent}%"
        ></div>
      </div>


      <div class="timer-actions">

        <button
          class="timer-action main"
          data-action="toggle"
        >
          ${buttonText}
        </button>

        <button
          class="timer-action"
          data-action="reset"
        >
          Réinitialiser
        </button>

        <button
          class="timer-action delete"
          data-action="delete"
        >
          Supprimer
        </button>

      </div>

    </article>
  `;
}


function attachTimerEvents() {

  document
    .querySelectorAll("[data-timer-id]")
    .forEach(card => {

      const id =
        card.dataset.timerId;


      card
        .querySelector("[data-action='toggle']")
        ?.addEventListener("click", () => {

          unlockAudio();

          toggleTimer(id);

        });


      card
        .querySelector("[data-action='reset']")
        ?.addEventListener("click", () => {

          resetTimer(id);

        });


      card
        .querySelector("[data-action='delete']")
        ?.addEventListener("click", () => {

          stopTimer(id);

        });

    });

}


/* =========================================================
   NEW TIMER
========================================================= */

function openTimerModal(existing = null) {

  openModal(
    existing ? "Modifier le minuteur" : "Nouveau minuteur",
    existing ? "MODIFIER" : "MINUTEUR",

    `

      <div class="form-group">

        <label>Nom</label>

        <input
          id="timerName"
          class="form-input"
          placeholder="Ex : Frites, steak, sauce..."
          value="${existing ? escapeAttr(existing.name) : ""}"
        >

      </div>


      <div class="form-group">

        <label>Durée</label>

        <div class="duration-grid">

          <input
            id="timerMinutes"
            class="form-input"
            type="number"
            min="0"
            placeholder="Minutes"
            value="${
              existing
                ? Math.floor(existing.duration / 60)
                : 5
            }"
          >

          <input
            id="timerSeconds"
            class="form-input"
            type="number"
            min="0"
            max="59"
            placeholder="Secondes"
            value="${
              existing
                ? existing.duration % 60
                : 0
            }"
          >

        </div>

      </div>


      <div class="form-group">

        <label>Action</label>

        <select
          id="timerAutoStart"
          class="form-input"
        >

          <option value="true">
            Démarrer immédiatement
          </option>

          <option value="false">
            Créer sans démarrer
          </option>

        </select>

      </div>


      <button
        class="primary-btn modal-submit"
        id="saveTimer"
      >
        ${existing ? "Enregistrer" : "Démarrer le minuteur"}
      </button>

    `
  );


  document
    .getElementById("saveTimer")
    .addEventListener("click", () => {

      unlockAudio();


      const name =
        document.getElementById("timerName").value;


      const minutes =
        Number(
          document.getElementById("timerMinutes").value
        ) || 0;


      const seconds =
        Number(
          document.getElementById("timerSeconds").value
        ) || 0;


      const total =
        minutes * 60 + seconds;


      if (total <= 0) {

        alert("Indique une durée.");

        return;

      }


      const autoStart =
        document.getElementById("timerAutoStart").value === "true";


      if (existing) {

        existing.name =
          name.trim() || existing.name;

        existing.duration =
          total;

        existing.remaining =
          total;

        existing.running =
          autoStart;

        existing.finished =
          false;

        existing.lastTick =
          Date.now();

      } else {

        createTimer(
          name,
          total,
          autoStart
        );

      }


      saveData();

      closeModal();

      renderTimers();

    });

}


document
  .getElementById("addTimerBtn")
  .addEventListener("click", () => openTimerModal());


document
  .getElementById("emptyAddTimer")
  .addEventListener("click", () => openTimerModal());


document
  .getElementById("quickTimerBtn")
  .addEventListener("click", () => openTimerModal());


/* =========================================================
   PRESETS
========================================================= */

function renderPresets() {

  const container =
    document.getElementById("presetList");


  container.innerHTML =
    data.presets.map(preset => `

      <div class="preset">

        <div class="preset-info">

          <strong>
            ${escapeHtml(preset.name)}
          </strong>

          <span>
            ${formatTime(preset.seconds)}
          </span>

        </div>

        <div class="preset-actions">

          <button
            class="mini-btn"
            data-preset-start="${preset.id}"
          >
            ▶
          </button>

          <button
            class="mini-btn"
            data-preset-edit="${preset.id}"
          >
            ✎
          </button>

        </div>

      </div>

    `).join("");


  document
    .querySelectorAll("[data-preset-start]")
    .forEach(button => {

      button.addEventListener("click", () => {

        unlockAudio();

        const preset =
          data.presets.find(
            p => p.id === button.dataset.presetStart
          );

        if (!preset) return;

        createTimer(
          preset.name,
          preset.seconds,
          true
        );

      });

    });


  document
    .querySelectorAll("[data-preset-edit]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const preset =
          data.presets.find(
            p => p.id === button.dataset.presetEdit
          );

        if (!preset) return;

        openPresetModal(preset);

      });

    });

}


function openPresetModal(existing = null) {

  openModal(
    existing ? "Modifier une cuisson" : "Nouvelle cuisson",
    "PRÉRÉGLAGE",

    `

      <div class="form-group">

        <label>Nom</label>

        <input
          id="presetName"
          class="form-input"
          value="${existing ? escapeAttr(existing.name) : ""}"
          placeholder="Ex : Cuisson riz"
        >

      </div>


      <div class="form-group">

        <label>Durée en secondes</label>

        <input
          id="presetSeconds"
          class="form-input"
          type="number"
          min="1"
          value="${existing ? existing.seconds : 300}"
        >

      </div>


      <button
        class="primary-btn modal-submit"
        id="savePreset"
      >
        Enregistrer
      </button>

    `
  );


  document
    .getElementById("savePreset")
    .addEventListener("click", () => {

      const name =
        document.getElementById("presetName").value.trim();

      const seconds =
        Number(
          document.getElementById("presetSeconds").value
        );


      if (!name || seconds <= 0) {

        alert("Complète les informations.");

        return;

      }


      if (existing) {

        existing.name = name;
        existing.seconds = seconds;

      } else {

        data.presets.push({

          id: crypto.randomUUID(),

          name,

          seconds

        });

      }


      saveData();

      closeModal();

      renderPresets();

    });

}


document
  .getElementById("managePresetsBtn")
  .addEventListener("click", () => {

    openPresetModal();

  });


/* =========================================================
   PRODUCTS
========================================================= */

function renderProducts() {

  const container =
    document.getElementById("productsContainer");

  const empty =
    document.getElementById("emptyProducts");


  empty.style.display =
    data.products.length ? "none" : "block";


  container.innerHTML =
    data.products
      .map(product => {

        const total =
          product.steps.length;

        const done =
          product.steps.filter(step => step.done).length;

        const percent =
          total
            ? (done / total) * 100
            : 0;


        return `

          <article
            class="product-card"
            data-product-id="${product.id}"
          >

            <div class="product-header">

              <div>

                <div class="product-title">
                  ${escapeHtml(product.name)}
                </div>

                <div class="product-meta">
                  ${done}/${total} étapes terminées
                </div>

              </div>

            </div>


            <div class="product-progress">

              <div style="width:${percent}%"></div>

            </div>


            <div class="product-actions">

              <button
                class="primary"
                data-product-run="${product.id}"
              >
                Commencer
              </button>

              <button
                data-product-edit="${product.id}"
              >
                Modifier
              </button>

              <button
                data-product-delete="${product.id}"
              >
                Supprimer
              </button>

            </div>

          </article>

        `;

      })
      .join("");


  attachProductEvents();

}


function attachProductEvents() {

  document
    .querySelectorAll("[data-product-run]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const product =
          data.products.find(
            p => p.id === button.dataset.productRun
          );

        if (!product) return;

        product.steps.forEach(
          step => step.done = false
        );

        saveData();

        openProductModal(product, true);

      });

    });


  document
    .querySelectorAll("[data-product-edit]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const product =
          data.products.find(
            p => p.id === button.dataset.productEdit
          );

        if (product) {
          openProductModal(product);
        }

      });

    });


  document
    .querySelectorAll("[data-product-delete]")
    .forEach(button => {

      button.addEventListener("click", () => {

        data.products =
          data.products.filter(
            p => p.id !== button.dataset.productDelete
          );

        saveData();

        renderProducts();

      });

    });

}


function openProductModal(existing = null, running = false) {

  const steps =
    existing
      ? existing.steps
      : [
          {
            id: crypto.randomUUID(),
            text: "",
            done: false
          }
        ];


  openModal(
    running
      ? existing.name
      : existing
        ? "Modifier la préparation"
        : "Nouvelle préparation",

    running ? "PRÉPARATION" : "PROCÉDURE",

    `

      <div class="form-group">

        <label>Nom</label>

        <input
          id="productName"
          class="form-input"
          value="${existing ? escapeAttr(existing.name) : ""}"
          placeholder="Ex : Sauce burger"
        >

      </div>


      <div class="form-group">

        <label>Étapes</label>

        <div
          id="stepBuilder"
          class="step-builder"
        >

          ${
            steps
              .map(step => `

                <div class="step-line">

                  <input
                    class="form-input step-input"
                    value="${escapeAttr(step.text)}"
                    placeholder="Étape..."
                  >

                  <button
                    class="remove-step"
                    type="button"
                  >
                    ×
                  </button>

                </div>

              `)
              .join("")
          }

        </div>


        <button
          class="add-step"
          id="addStep"
          type="button"
        >
          ＋ Ajouter une étape
        </button>

      </div>


      <button
        class="primary-btn modal-submit"
        id="saveProduct"
      >
        ${running ? "Terminer" : "Enregistrer"}
      </button>

    `
  );


  const builder =
    document.getElementById("stepBuilder");


  function attachRemoveButtons() {

    builder
      .querySelectorAll(".remove-step")
      .forEach(button => {

        button.onclick = () => {

          button.parentElement.remove();

        };

      });

  }


  attachRemoveButtons();


  document
    .getElementById("addStep")
    .addEventListener("click", () => {

      const line =
        document.createElement("div");

      line.className = "step-line";

      line.innerHTML = `

        <input
          class="form-input step-input"
          placeholder="Étape..."
        >

        <button
          class="remove-step"
          type="button"
        >
          ×
        </button>

      `;

      builder.appendChild(line);

      attachRemoveButtons();

    });


  if (running) {

    renderRunningProduct(existing, builder);

  }


  document
    .getElementById("saveProduct")
    .addEventListener("click", () => {

      const name =
        document.getElementById("productName").value.trim();


      const inputs =
        [...builder.querySelectorAll(".step-input")];


      const newSteps =
        inputs
          .map(input => input.value.trim())
          .filter(Boolean)
          .map((text, index) => ({

            id:
              existing?.steps[index]?.id
              || crypto.randomUUID(),

            text,

            done:
              existing?.steps[index]?.done || false

          }));


      if (!name) {

        alert("Donne un nom à la préparation.");

        return;

      }


      if (existing) {

        existing.name = name;
        existing.steps = newSteps;

      } else {

        data.products.push({

          id: crypto.randomUUID(),

          name,

          steps: newSteps

        });

      }


      saveData();

      closeModal();

      renderProducts();

    });

}


function renderRunningProduct(product, builder) {

  builder
    .querySelectorAll(".step-line")
    .forEach((line, index) => {

      const input =
        line.querySelector("input");


      if (!product.steps[index]) {
        return;
      }


      input.style.textDecoration =
        product.steps[index].done
          ? "line-through"
          : "none";


      input.addEventListener("click", () => {

        product.steps[index].done =
          !product.steps[index].done;

        saveData();

        input.style.textDecoration =
          product.steps[index].done
            ? "line-through"
            : "none";

      });

    });

}


document
  .getElementById("addProductBtn")
  .addEventListener("click", () => openProductModal());


document
  .getElementById("emptyAddProduct")
  .addEventListener("click", () => openProductModal());


/* =========================================================
   CHECKLISTS
========================================================= */

function renderChecklists() {

  const container =
    document.getElementById("checklistsContainer");

  const empty =
    document.getElementById("emptyChecklists");


  empty.style.display =
    data.checklists.length
      ? "none"
      : "block";


  container.innerHTML =
    data.checklists
      .map(list => {

        const done =
          list.items.filter(item => item.done).length;


        return `

          <article
            class="checklist-card"
            data-list-id="${list.id}"
          >

            <div class="checklist-title">
              ${escapeHtml(list.name)}
            </div>

            <div class="checklist-count">
              ${done}/${list.items.length} terminées
            </div>


            <div class="check-items">

              ${
                list.items
                  .map(item => `

                    <label
                      class="check-item ${
                        item.done ? "done" : ""
                      }"
                    >

                      <input
                        type="checkbox"
                        data-check-item="${item.id}"
                        ${
                          item.done
                            ? "checked"
                            : ""
                        }
                      >

                      <span>
                        ${escapeHtml(item.text)}
                      </span>

                    </label>

                  `)
                  .join("")
              }

            </div>


            <div class="check-actions">

              <button
                data-check-edit="${list.id}"
              >
                Modifier
              </button>

              <button
                data-check-reset="${list.id}"
              >
                Réinitialiser
              </button>

              <button
                data-check-delete="${list.id}"
              >
                Supprimer
              </button>

            </div>

          </article>

        `;

      })
      .join("");


  attachChecklistEvents();

}


function attachChecklistEvents() {

  document
    .querySelectorAll("[data-check-item]")
    .forEach(input => {

      input.addEventListener("change", () => {

        const card =
          input.closest("[data-list-id]");

        const list =
          data.checklists.find(
            l => l.id === card.dataset.listId
          );

        if (!list) return;


        const item =
          list.items.find(
            i => i.id === input.dataset.checkItem
          );

        if (!item) return;


        item.done =
          input.checked;

        saveData();

        renderChecklists();

      });

    });


  document
    .querySelectorAll("[data-check-edit]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const list =
          data.checklists.find(
            l => l.id === button.dataset.checkEdit
          );

        if (list) {
          openChecklistModal(list);
        }

      });

    });


  document
    .querySelectorAll("[data-check-reset]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const list =
          data.checklists.find(
            l => l.id === button.closest("[data-list-id]").dataset.listId
          );

        if (!list) return;


        list.items.forEach(
          item => item.done = false
        );

        saveData();

        renderChecklists();

      });

    });


  document
    .querySelectorAll("[data-check-delete]")
    .forEach(button => {

      button.addEventListener("click", () => {

        data.checklists =
          data.checklists.filter(
            list =>
              list.id !== button.dataset.checkDelete
          );

        saveData();

        renderChecklists();

      });

    });

}


function openChecklistModal(existing = null) {

  const items =
    existing?.items?.length
      ? existing.items
      : [
          {
            id: crypto.randomUUID(),
            text: "",
            done: false
          }
        ];


  openModal(
    existing
      ? "Modifier la checklist"
      : "Nouvelle checklist",

    "CHECKLIST",

    `

      <div class="form-group">

        <label>Nom</label>

        <input
          id="checklistName"
          class="form-input"
          placeholder="Ex : Fermeture"
          value="${
            existing
              ? escapeAttr(existing.name)
              : ""
          }"
        >

      </div>


      <div class="form-group">

        <label>Tâches</label>

        <div
          id="checklistBuilder"
          class="step-builder"
        >

          ${
            items
              .map(item => `

                <div class="step-line">

                  <input
                    class="form-input checklist-input"
                    value="${escapeAttr(item.text)}"
                    placeholder="Tâche..."
                  >

                  <button
                    class="remove-step"
                    type="button"
                  >
                    ×
                  </button>

                </div>

              `)
              .join("")
          }

        </div>


        <button
          class="add-step"
          id="addChecklistItem"
          type="button"
        >
          ＋ Ajouter une tâche
        </button>

      </div>


      <button
        class="primary-btn modal-submit"
        id="saveChecklist"
      >
        Enregistrer
      </button>

    `
  );


  const builder =
    document.getElementById("checklistBuilder");


  function attachRemove() {

    builder
      .querySelectorAll(".remove-step")
      .forEach(button => {

        button.onclick = () => {

          button.parentElement.remove();

        };

      });

  }


  attachRemove();


  document
    .getElementById("addChecklistItem")
    .addEventListener("click", () => {

      const line =
        document.createElement("div");

      line.className = "step-line";

      line.innerHTML = `

        <input
          class="form-input checklist-input"
          placeholder="Tâche..."
        >

        <button
          class="remove-step"
          type="button"
        >
          ×
        </button>

      `;

      builder.appendChild(line);

      attachRemove();

    });


  document
    .getElementById("saveChecklist")
    .addEventListener("click", () => {

      const name =
        document
          .getElementById("checklistName")
          .value
          .trim();


      const inputs =
        [...builder.querySelectorAll(".checklist-input")];


      const newItems =
        inputs
          .map(input => input.value.trim())
          .filter(Boolean)
          .map((text, index) => ({

            id:
              existing?.items[index]?.id
              || crypto.randomUUID(),

            text,

            done:
              existing?.items[index]?.done
              || false

          }));


      if (!name) {

        alert("Donne un nom à la checklist.");

        return;

      }


      if (existing) {

        existing.name = name;
        existing.items = newItems;

      } else {

        data.checklists.push({

          id: crypto.randomUUID(),

          name,

          items: newItems

        });

      }


      saveData();

      closeModal();

      renderChecklists();

    });

}


document
  .getElementById("addChecklistBtn")
  .addEventListener(
    "click",
    () => openChecklistModal()
  );


document
  .getElementById("emptyAddChecklist")
  .addEventListener(
    "click",
    () => openChecklistModal()
  );


/* =========================================================
   AUDIO
========================================================= */

function unlockAudio() {

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }


    if (audioContext.state === "suspended") {

      audioContext.resume();

    }

  } catch (error) {

    console.error(error);

  }

}


function playTone(
  frequency,
  duration,
  delay = 0
) {

  if (!audioContext) {
    unlockAudio();
  }

  if (!audioContext) return;


  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();


  oscillator.type = "sine";

  oscillator.frequency.value =
    frequency;


  const volume =
    data.settings.volume / 100;


  gain.gain.setValueAtTime(
    0,
    audioContext.currentTime + delay
  );


  gain.gain.linearRampToValueAtTime(
    volume * 0.35,
    audioContext.currentTime + delay + .02
  );


  gain.gain.exponentialRampToValueAtTime(
    .001,
    audioContext.currentTime + delay + duration
  );


  oscillator.connect(gain);

  gain.connect(audioContext.destination);


  oscillator.start(
    audioContext.currentTime + delay
  );


  oscillator.stop(
    audioContext.currentTime +
    delay +
    duration +
    .05
  );

}


function playTimerSound() {

  unlockAudio();


  const type =
    data.settings.sound;


  if (type === "beep") {

    playTone(880, .8);

  }


  if (type === "double") {

    playTone(880, .35, 0);

    playTone(880, .35, .5);

  }


  if (type === "bell") {

    playTone(660, .8, 0);

    playTone(880, 1, .12);

  }


  if (type === "alarm") {

    playTone(900, .3, 0);

    playTone(650, .3, .35);

    playTone(900, .3, .7);

    playTone(650, .3, 1.05);

  }


  if (data.settings.repeat) {

    setTimeout(() => {

      const stillFinished =
        data.timers.some(
          timer =>
            timer.finished
        );


      if (stillFinished) {

        playTimerSound();

      }

    }, 3000);

  }

}


/* =========================================================
   SETTINGS
========================================================= */

const soundSelect =
  document.getElementById("soundSelect");

const volumeSlider =
  document.getElementById("volumeSlider");

const volumeLabel =
  document.getElementById("volumeLabel");

const repeatSound =
  document.getElementById("repeatSound");

const darkMode =
  document.getElementById("darkMode");


function loadSettingsUI() {

  soundSelect.value =
    data.settings.sound;

  volumeSlider.value =
    data.settings.volume;

  volumeLabel.textContent =
    `${data.settings.volume}%`;

  repeatSound.checked =
    data.settings.repeat;

  darkMode.checked =
    data.settings.dark;

  applyTheme();

}


soundSelect.addEventListener("change", () => {

  data.settings.sound =
    soundSelect.value;

  saveData();

});


volumeSlider.addEventListener("input", () => {

  data.settings.volume =
    Number(volumeSlider.value);

  volumeLabel.textContent =
    `${data.settings.volume}%`;

  saveData();

});


repeatSound.addEventListener("change", () => {

  data.settings.repeat =
    repeatSound.checked;

  saveData();

});


darkMode.addEventListener("change", () => {

  data.settings.dark =
    darkMode.checked;

  saveData();

  applyTheme();

});


document
  .getElementById("themeBtn")
  .addEventListener("click", () => {

    data.settings.dark =
      !data.settings.dark;

    darkMode.checked =
      data.settings.dark;

    saveData();

    applyTheme();

  });


function applyTheme() {

  document.body.classList.toggle(
    "dark",
    data.settings.dark
  );

}


/* =========================================================
   RESET
========================================================= */

document
  .getElementById("resetApp")
  .addEventListener("click", () => {

    const confirmReset =
      confirm(
        "Supprimer toutes les données de KitchenFlow ?"
      );


    if (!confirmReset) {
      return;
    }


    data =
      structuredClone(defaultData);

    saveData();

    renderAll();

    loadSettingsUI();

  });


/* =========================================================
   UTILS
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttr(value) {

  return escapeHtml(value);

}


/* =========================================================
   INITIAL RENDER
========================================================= */

function renderAll() {

  renderTimers();

  renderProducts();

  renderChecklists();

  renderPresets();

}


loadSettingsUI();

renderAll();
