/* =====================================================
   KITCHENFLOW
===================================================== */


/* =========================
   OUTILS
========================= */

const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  [...document.querySelectorAll(selector)];


function uid() {

  return Date.now() +
    Math.random()
      .toString(36)
      .slice(2);

}


function escapeHTML(text) {

  return String(text)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}



/* =========================
   DONNÉES
========================= */


const defaultPresets = [

  {
    id: "p1",
    name: "Pâtes",
    seconds: 8 * 60
  },

  {
    id: "p2",
    name: "Œuf mollet",
    seconds: 6 * 60
  },

  {
    id: "p3",
    name: "Frites",
    seconds: 12 * 60
  },

  {
    id: "p4",
    name: "Steak",
    seconds: 4 * 60
  }

];


const defaultProducts = [

  {
    id: "prod1",
    name: "Sauce 1",
    category: "Sauce",
    quantity: "1 litre",
    prepTime: "15 min",
    notes: "Remplacer par tes propres informations."
  },

  {
    id: "prod2",
    name: "Sauce 2",
    category: "Sauce",
    quantity: "1 litre",
    prepTime: "10 min",
    notes: ""
  },

  {
    id: "prod3",
    name: "Garniture 1",
    category: "Garniture",
    quantity: "20 portions",
    prepTime: "20 min",
    notes: ""
  }

];


const defaultChecklists = [

  {
    id: "c1",

    name: "Ouverture",

    items: [

      {
        id: uid(),
        text: "Allumer les équipements",
        done: false
      },

      {
        id: uid(),
        text: "Vérifier les frigos",
        done: false
      },

      {
        id: uid(),
        text: "Préparer le poste",
        done: false
      },

      {
        id: uid(),
        text: "Vérifier les sauces",
        done: false
      }

    ]

  },


  {
    id: "c2",

    name: "Fermeture",

    items: [

      {
        id: uid(),
        text: "Nettoyer le poste",
        done: false
      },

      {
        id: uid(),
        text: "Ranger les produits",
        done: false
      },

      {
        id: uid(),
        text: "Vérifier les frigos",
        done: false
      }

    ]

  }

];


let presets =
  load(
    "kf_presets",
    defaultPresets
  );


let products =
  load(
    "kf_products",
    defaultProducts
  );


let checklists =
  load(
    "kf_checklists",
    defaultChecklists
  );


let activeTimers = [];


let selectedChecklist =
  checklists[0]?.id || null;


let soundEnabled =
  load(
    "kf_sound",
    true
  );



/* =========================
   LOCAL STORAGE
========================= */


function load(key, fallback) {

  try {

    const value =
      localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  }

  catch {

    return fallback;

  }

}


function save(key,value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}



/* =========================
   NAVIGATION
========================= */


$$(".nav-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


$$("[data-page-target]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.pageTarget
        );

      }
    );

  });


function showPage(page) {

  $$(".page")
    .forEach(item =>
      item.classList.remove(
        "active"
      )
    );


  $(`#page-${page}`)
    ?.classList
    .add("active");


  $$(".nav-button")
    .forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === page
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (page === "dashboard")
    renderDashboard();

  if (page === "timers") {

    renderPresets();
    renderTimers();

  }

  if (page === "products")
    renderProducts();

  if (page === "checklists")
    renderChecklists();

}



/* =========================
   HORLOGE
========================= */


function updateClock() {

  const now =
    new Date();


  $("#currentTime")
    .textContent =
    now.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  $("#currentDate")
    .textContent =
    now.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

}


setInterval(
  updateClock,
  1000
);


updateClock();



/* =====================================================
   MINUTEURS
===================================================== */


/* AJOUT */

$("#timerForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        $("#timerName")
          .value
          .trim();


      const minutes =
        Number(
          $("#timerMinutes").value
        ) || 0;


      const seconds =
        Number(
          $("#timerSeconds").value
        ) || 0;


      const total =
        minutes * 60 +
        seconds;


      if (!name) {

        toast(
          "Donne un nom au minuteur"
        );

        return;

      }


      if (total <= 0) {

        toast(
          "Le temps doit être supérieur à zéro"
        );

        return;

      }


      createTimer(
        name,
        total
      );


      $("#timerName").value =
        "";


      $("#timerMinutes").value =
        5;


      $("#timerSeconds").value =
        0;

    }
  );



/* CRÉATION */

function createTimer(
  name,
  seconds
) {

  const timer = {

    id: uid(),

    name,

    total: seconds,

    remaining: seconds,

    finished: false,

    startedAt: Date.now()

  };


  activeTimers.push(
    timer
  );


  renderTimers();

  renderDashboard();

  toast(
    `${name} lancé`
  );

}



/* TICK GLOBAL */

setInterval(
  () => {

    let changed = false;


    activeTimers
      .forEach(timer => {

        if (
          timer.finished
        )
          return;


        timer.remaining--;

        changed = true;


        if (
          timer.remaining <= 0
        ) {

          timer.remaining = 0;

          timer.finished = true;

          playAlarm();

          toast(
            `⏰ ${timer.name} est terminé !`
          );

        }

      });


    if (changed) {

      renderTimers();

      renderDashboard();

    }

  },
  1000
);



/* AFFICHAGE */

function renderTimers() {

  const container =
    $("#timerList");


  const dashboard =
    $("#dashboardTimers");


  if (!activeTimers.length) {

    container.innerHTML =
      "";

    $("#noTimers")
      .style.display =
      "flex";

    dashboard.innerHTML =
      emptyTimerDashboard();

    updateStats();

    return;

  }


  $("#noTimers")
    .style.display =
    "none";


  container.innerHTML =
    activeTimers
      .map(timerHTML)
      .join("");


  dashboard.innerHTML =
    activeTimers
      .map(
        timer =>
          dashboardTimerHTML(
            timer
          )
      )
      .join("");


  attachTimerEvents();

  updateStats();

}



/* CARTE MINUTEUR */

function timerHTML(timer) {

  const percent =
    timer.total
      ? (
          timer.remaining /
          timer.total
        ) * 100
      : 0;


  return `

    <div
      class="timer-card ${timer.finished ? "finished" : ""}"
      data-id="${timer.id}"
    >

      <div class="timer-top">

        <div>

          <div class="timer-name">

            ${escapeHTML(
              timer.name
            )}

          </div>

          <div class="timer-status">

            ${
              timer.finished
                ? "TERMINÉ"
                : "EN COURS"
            }

          </div>

        </div>

      </div>


      <div class="timer-big">

        ${
          timer.finished
            ? "00:00"
            : formatTime(
                timer.remaining
              )
        }

      </div>


      <div class="timer-progress">

        <div
          class="timer-progress-bar"
          style="width:${percent}%"
        ></div>

      </div>


      <div class="timer-actions">

        ${
          timer.finished
            ? `
              <button
                data-action="restart"
              >
                ↻ Relancer
              </button>
            `
            : `
              <button
                data-action="add30"
              >
                +30s
              </button>

              <button
                data-action="add60"
              >
                +1min
              </button>
            `
        }


        <button
          class="danger"
          data-action="delete"
        >
          ✕
        </button>

      </div>

    </div>

  `;

}



/* DASHBOARD TIMER */

function dashboardTimerHTML(timer) {

  return `

    <div
      class="timer-card"
      data-id="${timer.id}"
    >

      <div class="timer-top">

        <div class="timer-name">

          ${escapeHTML(
            timer.name
          )}

        </div>

        <div class="timer-status">

          ${
            timer.finished
              ? "TERMINÉ"
              : "EN COURS"
          }

        </div>

      </div>


      <div class="timer-big">

        ${
          timer.finished
            ? "00:00"
            : formatTime(
                timer.remaining
              )
        }

      </div>


      <div class="timer-actions">

        ${
          timer.finished

          ? `

            <button
              data-action="restart"
            >
              ↻ Relancer
            </button>

          `

          : `

            <button
              data-action="add30"
            >
              +30s
            </button>

            <button
              data-action="add60"
            >
              +1min
            </button>

          `

        }


        <button
          class="danger"
          data-action="delete"
        >
          ✕
        </button>

      </div>

    </div>

  `;

}



function emptyTimerDashboard() {

  return `

    <div class="empty-state">

      <div>
        ⏱
      </div>

      <strong>
        Aucun minuteur
      </strong>

      <span>
        Le prochain est prêt à être lancé.
      </span>

    </div>

  `;

}



/* ACTIONS */

function attachTimerEvents() {

  $$("[data-action]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const card =
            button.closest(
              "[data-id]"
            );


          const id =
            card.dataset.id;


          const timer =
            activeTimers.find(
              item =>
                item.id === id
            );


          if (!timer)
            return;


          const action =
            button.dataset.action;


          if (
            action === "add30"
          ) {

            timer.remaining += 30;

            timer.total =
              Math.max(
                timer.total,
                timer.remaining
              );

          }


          if (
            action === "add60"
          ) {

            timer.remaining += 60;

            timer.total =
              Math.max(
                timer.total,
                timer.remaining
              );

          }


          if (
            action === "restart"
          ) {

            timer.remaining =
              timer.total;

            timer.finished =
              false;

          }


          if (
            action === "delete"
          ) {

            activeTimers =
              activeTimers.filter(
                item =>
                  item.id !== id
              );

          }


          renderTimers();

          renderDashboard();

        }
      );

    });

}



/* FORMAT TEMPS */

function formatTime(seconds) {

  const min =
    Math.floor(
      seconds / 60
    )
      .toString()
      .padStart(2,"0");


  const sec =
    Math.floor(
      seconds % 60
    )
      .toString()
      .padStart(2,"0");


  return `${min}:${sec}`;

}



/* ALARME */

function playAlarm() {

  if (!soundEnabled)
    return;


  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    const ctx =
      new AudioContext();


    const oscillator =
      ctx.createOscillator();


    const gain =
      ctx.createGain();


    oscillator.frequency.value =
      880;


    oscillator.connect(
      gain
    );


    gain.connect(
      ctx.destination
    );


    gain.gain.value =
      0.12;


    oscillator.start();


    setTimeout(
      () => {

        oscillator.stop();

        ctx.close();

      },
      700
    );

  }

  catch {}

}



/* =====================================================
   PRÉRÉGLAGES
===================================================== */


function renderPresets() {

  const grid =
    $("#presetGrid");


  grid.innerHTML =
    presets.map(
      preset => `

        <div
          class="preset"
          data-id="${preset.id}"
        >

          <button
            class="preset-main"
            data-preset-start="${preset.id}"
          >

            <strong>

              ${escapeHTML(
                preset.name
              )}

            </strong>

            <span class="preset-time">

              ${formatTime(
                preset.seconds
              )}

            </span>

          </button>


          <div class="preset-actions">

            <button
              data-preset-edit="${preset.id}"
            >
              Modifier
            </button>


            <button
              data-preset-delete="${preset.id}"
            >
              Supprimer
            </button>

          </div>

        </div>

      `
    )
    .join("");


  $$("[data-preset-start]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const preset =
            presets.find(
              item =>
                item.id ===
                button.dataset.presetStart
            );


          if (!preset)
            return;


          createTimer(
            preset.name,
            preset.seconds
          );

        }
      );

    });


  $$("[data-preset-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          presets =
            presets.filter(
              item =>
                item.id !==
                button.dataset.presetDelete
            );


          save(
            "kf_presets",
            presets
          );


          renderPresets();

          toast(
            "Préréglage supprimé"
          );

        }
      );

    });


  $$("[data-preset-edit]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const preset =
            presets.find(
              item =>
                item.id ===
                button.dataset.presetEdit
            );


          if (!preset)
            return;


          const name =
            prompt(
              "Nom du minuteur",
              preset.name
            );


          if (!name)
            return;


          const minutes =
            prompt(
              "Minutes",
              Math.floor(
                preset.seconds / 60
              )
            );


          const seconds =
            prompt(
              "Secondes",
              preset.seconds % 60
            );


          preset.name =
            name.trim();


          preset.seconds =
            Number(minutes) * 60 +
            Number(seconds);


          save(
            "kf_presets",
            presets
          );


          renderPresets();

          toast(
            "Préréglage modifié"
          );

        }
      );

    });

}



/* MODAL PRÉRÉGLAGE */

$("#addPresetBtn")
  .addEventListener(
    "click",
    () => {

      openModal(
        "presetModal"
      );

    }
  );


$("#presetForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        $("#presetName")
          .value
          .trim();


      const minutes =
        Number(
          $("#presetMinutes").value
        ) || 0;


      const seconds =
        Number(
          $("#presetSeconds").value
        ) || 0;


      const total =
        minutes * 60 +
        seconds;


      if (
        !name ||
        total <= 0
      ) {

        toast(
          "Nom et durée obligatoires"
        );

        return;

      }


      presets.push({

        id: uid(),

        name,

        seconds: total

      });


      save(
        "kf_presets",
        presets
      );


      renderPresets();

      closeModal(
        "presetModal"
      );


      event.target.reset();

      toast(
        "Préréglage créé"
      );

    }
  );



/* =====================================================
   PRODUITS
===================================================== */


function renderProducts() {

  const search =
    $("#productSearch")
      .value
      .toLowerCase()
      .trim();


  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search) ||

        product.category
          .toLowerCase()
          .includes(search) ||

        product.notes
          .toLowerCase()
          .includes(search)
    );


  $("#productGrid").innerHTML =
    filtered
      .map(productHTML)
      .join("");


  $("#noProducts")
    .style.display =
      filtered.length
        ? "none"
        : "flex";


  attachProductEvents();


  updateStats();

}


function productHTML(product) {

  return `

    <article
      class="product-card"
      data-product="${product.id}"
    >

      <span class="product-category">

        ${escapeHTML(
          product.category
        )}

      </span>


      <h3>

        ${escapeHTML(
          product.name
        )}

      </h3>


      <div class="product-meta">

        ${escapeHTML(
          product.quantity ||
          "Quantité non définie"
        )}

        ·

        ${escapeHTML(
          product.prepTime ||
          "Temps non défini"
        )}

      </div>


      ${
        product.notes
          ? `

            <div class="product-notes">

              ${escapeHTML(
                product.notes
              )}

            </div>

          `
          : ""
      }


      <div class="product-actions">

        <button
          class="repeat"
          data-repeat="${product.id}"
        >
          ↻ À refaire
        </button>


        <button
          data-edit-product="${product.id}"
        >
          Modifier
        </button>


        <button
          data-delete-product="${product.id}"
        >
          ×
        </button>

      </div>

    </article>

  `;

}



/* RECHERCHE */

$("#productSearch")
  .addEventListener(
    "input",
    renderProducts
  );



/* AJOUT PRODUIT */

$("#addProductBtn")
  .addEventListener(
    "click",
    () => {

      openModal(
        "productModal"
      );

    }
  );


$("#productForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      products.push({

        id: uid(),

        name:
          $("#productName")
            .value
            .trim(),

        category:
          $("#productCategory")
            .value,

        quantity:
          $("#productQuantity")
            .value
            .trim(),

        prepTime:
          $("#productPrepTime")
            .value
            .trim(),

        notes:
          $("#productNotes")
            .value
            .trim()

      });


      save(
        "kf_products",
        products
      );


      renderProducts();

      renderDashboard();

      closeModal(
        "productModal"
      );


      event.target.reset();

      toast(
        "Produit créé"
      );

    }
  );



/* ACTIONS PRODUITS */

function attachProductEvents() {

  $$("[data-repeat]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.repeat
            );


          if (!product)
            return;


          createTimer(
            product.name,
            5 * 60
          );


          toast(
            `${product.name} relancé`
          );

        }
      );

    });


  $$("[data-delete-product]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            !confirm(
              "Supprimer ce produit ?"
            )
          )
            return;


          products =
            products.filter(
              product =>
                product.id !==
                button.dataset.deleteProduct
            );


          save(
            "kf_products",
            products
          );


          renderProducts();

          renderDashboard();

          toast(
            "Produit supprimé"
          );

        }
      );

    });


  $$("[data-edit-product]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.editProduct
            );


          if (!product)
            return;


          const name =
            prompt(
              "Nom",
              product.name
            );


          if (!name)
            return;


          product.name =
            name.trim();


          product.quantity =
            prompt(
              "Quantité",
              product.quantity
            ) || product.quantity;


          product.prepTime =
            prompt(
              "Temps de préparation",
              product.prepTime
            ) || product.prepTime;


          product.notes =
            prompt(
              "Notes",
              product.notes
            ) ?? product.notes;


          save(
            "kf_products",
            products
          );


          renderProducts();

          renderDashboard();

          toast(
            "Produit modifié"
          );

        }
      );

    });

}



/* =====================================================
   CHECKLISTS
===================================================== */


function renderChecklists() {

  const tabs =
    $("#checklistTabs");


  tabs.innerHTML =
    checklists
      .map(
        checklist => `

          <button
            class="checklist-tab ${
              checklist.id ===
              selectedChecklist
                ? "active"
                : ""
            }"
            data-checklist-id="${checklist.id}"
          >

            ${escapeHTML(
              checklist.name
            )}

          </button>

        `
      )
      .join("");


  $$(".checklist-tab")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedChecklist =
            button.dataset.checklistId;


          renderChecklists();

        }
      );

    });


  renderChecklistContent();

}



function renderChecklistContent() {

  const checklist =
    checklists.find(
      item =>
        item.id ===
        selectedChecklist
    );


  if (!checklist) {

    $("#checklistContent")
      .innerHTML =
      `
        <div class="empty-state">
          <strong>
            Crée une checklist
          </strong>
        </div>
      `;

    return;

  }


  const done =
    checklist.items
      .filter(
        item => item.done
      ).length;


  $("#checklistContent")
    .innerHTML = `

      <div class="checklist-header">

        <div>

          <div class="eyebrow">
            LISTE
          </div>

          <h2>
            ${escapeHTML(
              checklist.name
            )}
          </h2>

        </div>


        <div class="checklist-progress">

          ${done}/${checklist.items.length}

        </div>

      </div>


      <div class="check-items">

        ${
          checklist.items.length

          ? checklist.items
              .map(
                item => `

                  <div
                    class="check-item ${
                      item.done
                        ? "done"
                        : ""
                    }"
                    data-check-id="${item.id}"
                  >

                    <button
                      class="check-box"
                    >

                      ${
                        item.done
                          ? "✓"
                          : ""
                      }

                    </button>


                    <span class="check-label">

                      ${escapeHTML(
                        item.text
                      )}

                    </span>


                    <button
                      class="remove-item"
                    >
                      ×
                    </button>

                  </div>

                `
              )
              .join("")

          : `

            <div class="empty-state">

              <strong>
                Checklist vide
              </strong>

              <span>
                Ajoute ton premier élément.
              </span>

            </div>

          `

        }

      </div>


      <div class="add-check">

        <input
          id="newCheckItem"
          placeholder="Ajouter un élément..."
        >


        <button
          id="addCheckItem"
        >
          +
        </button>

      </div>

    `;


  attachChecklistEvents();

}



/* CHECKLIST ACTIONS */

function attachChecklistEvents() {

  const checklist =
    checklists.find(
      item =>
        item.id ===
        selectedChecklist
    );


  if (!checklist)
    return;


  $$(".check-item")
    .forEach(row => {

      row.addEventListener(
        "click",
        event => {

          const id =
            row.dataset.checkId;


          const item =
            checklist.items.find(
              x =>
                x.id === id
            );


          if (
            event.target.closest(
              ".remove-item"
            )
          ) {

            checklist.items =
              checklist.items.filter(
                x =>
                  x.id !== id
              );

          }

          else {

            item.done =
              !item.done;

          }


          save(
            "kf_checklists",
            checklists
          );


          renderChecklistContent();

        }
      );

    });


  $("#addCheckItem")
    ?.addEventListener(
      "click",
      addChecklistItem
    );


  $("#newCheckItem")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          addChecklistItem();

        }

      }
    );

}



function addChecklistItem() {

  const input =
    $("#newCheckItem");


  const text =
    input.value.trim();


  if (!text)
    return;


  const checklist =
    checklists.find(
      item =>
        item.id ===
        selectedChecklist
    );


  checklist.items.push({

    id: uid(),

    text,

    done: false

  });


  save(
    "kf_checklists",
    checklists
  );


  renderChecklistContent();

  input.focus();

}



/* NOUVELLE CHECKLIST */

$("#addChecklistBtn")
  .addEventListener(
    "click",
    () => {

      openModal(
        "checklistModal"
      );

    }
  );


$("#checklistForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        $("#checklistName")
          .value
          .trim();


      if (!name)
        return;


      const checklist = {

        id: uid(),

        name,

        items: []

      };


      checklists.push(
        checklist
      );


      selectedChecklist =
        checklist.id;


      save(
        "kf_checklists",
        checklists
      );


      renderChecklists();

      closeModal(
        "checklistModal"
      );


      event.target.reset();

      toast(
        "Checklist créée"
      );

    }
  );



/* =====================================================
   DASHBOARD
===================================================== */


function renderDashboard() {

  renderTimers();

  renderDashboardProducts();

  updateStats();

}


function renderDashboardProducts() {

  const container =
    $("#dashboardProducts");


  container.innerHTML =
    products
      .slice(0,8)
      .map(
        product => `

          <div class="repeat-card">

            <strong>
              ${escapeHTML(
                product.name
              )}
            </strong>

            <small>
              ${escapeHTML(
                product.category
              )}
            </small>


            <button
              data-dashboard-repeat="${product.id}"
            >

              ↻ À refaire

            </button>

          </div>

        `
      )
      .join("");


  $$("[data-dashboard-repeat]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.dashboardRepeat
            );


          if (!product)
            return;


          createTimer(
            product.name,
            5 * 60
          );

          toast(
            `${product.name} relancé`
          );

        }
      );

    });

}



/* STATISTIQUES */

function updateStats() {

  $("#runningCount")
    .textContent =
    activeTimers
      .filter(
        timer =>
          !timer.finished
      ).length;


  $("#productCount")
    .textContent =
    products.length;


  let done = 0;


  checklists
    .forEach(
      checklist => {

        done +=
          checklist.items
            .filter(
              item =>
                item.done
            ).length;

      }
    );


  $("#todayDone")
    .textContent =
    done;

}



/* =====================================================
   MODALS
===================================================== */


function openModal(id) {

  $("#" + id)
    .classList
    .remove("hidden");

}


function closeModal(id) {

  $("#" + id)
    .classList
    .add("hidden");

}


$$("[data-close]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        closeModal(
          button.dataset.close
        );

      }
    );

  });


$$(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          modal.classList.add(
            "hidden"
          );

        }

      }
    );

  });



/* =====================================================
   SON / THÈME
===================================================== */


$("#soundBtn")
  .addEventListener(
    "click",
    () => {

      soundEnabled =
        !soundEnabled;


      save(
        "kf_sound",
        soundEnabled
      );


      $("#soundBtn")
        .textContent =
        soundEnabled
          ? "🔊"
          : "🔇";

    }
  );


$("#soundBtn")
  .textContent =
  soundEnabled
    ? "🔊"
    : "🔇";



$("#themeBtn")
  .addEventListener(
    "click",
    () => {

      document.body
        .classList
        .toggle("light");

    }
  );



/* =====================================================
   TOAST
===================================================== */


let toastTimeout;


function toast(message) {

  const element =
    $("#toast");


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    toastTimeout
  );


  toastTimeout =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      2200
    );

}



/* =====================================================
   INITIALISATION
===================================================== */


renderDashboard();

renderPresets();

renderProducts();

renderChecklists();

updateStats();
