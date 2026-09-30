/* =========================================================
   KITCHENFLOW
   Application logic
   ========================================================= */


/* ---------------------------------------------------------
   DONNÉES
--------------------------------------------------------- */

const STORAGE_KEY = "kitchenflow_v1";

let data = {
  theme: "light",
  sound: true,
  kitchenName: "KitchenFlow",
  timers: [],
  preparations: [],
  lists: []
};


/* ---------------------------------------------------------
   CHARGEMENT / SAUVEGARDE
--------------------------------------------------------- */

function loadData() {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      data = {
        ...data,
        ...JSON.parse(saved)
      };
    }

  } catch (error) {
    console.log("Impossible de charger les données.");
  }

  applyTheme();
  updateSettings();
}


function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}


/* ---------------------------------------------------------
   NAVIGATION
--------------------------------------------------------- */

function showPage(page) {

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById(page + "Page");

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (page === "home") {
    renderHome();
  }

  if (page === "timers") {
    renderTimers();
  }

  if (page === "preparations") {
    renderPreparations();
  }

  if (page === "lists") {
    renderLists();
  }
}


/* Navigation du menu */

document.querySelectorAll("[data-page]").forEach(button => {

  button.addEventListener("click", () => {

    showPage(button.dataset.page);

  });

});


/* ---------------------------------------------------------
   MINUTEURS
--------------------------------------------------------- */

function openTimerModal() {

  document.getElementById("timerModal")
    .classList.add("open");

  document.getElementById("timerName").focus();
}


function closeModal(id) {

  document.getElementById(id)
    .classList.remove("open");

}


document.querySelectorAll("[data-close]").forEach(button => {

  button.addEventListener("click", () => {
    closeModal(button.dataset.close);
  });

});


document.getElementById("newTimerBtn")
  .addEventListener("click", openTimerModal);


document.getElementById("homeNewTimer")
  .addEventListener("click", openTimerModal);


/* Temps rapides */

document.querySelectorAll(".quick-times button")
  .forEach(button => {

    button.addEventListener("click", () => {

      const total = Number(button.dataset.time);

      document.getElementById("timerMinutes").value =
        Math.floor(total / 60);

      document.getElementById("timerSeconds").value =
        total % 60;

    });

  });


/* Création */

document.getElementById("createTimer")
  .addEventListener("click", createTimer);


function createTimer() {

  let name =
    document.getElementById("timerName").value.trim();

  let minutes =
    Number(document.getElementById("timerMinutes").value) || 0;

  let seconds =
    Number(document.getElementById("timerSeconds").value) || 0;

  const totalSeconds =
    Math.max(1, minutes * 60 + seconds);

  if (!name) {
    name = "Cuisson";
  }

  const timer = {

    id: Date.now(),

    name,

    total: totalSeconds,

    remaining: totalSeconds,

    running: true,

    finished: false,

    createdAt: Date.now(),

    lastUpdate: Date.now()

  };

  data.timers.push(timer);

  saveData();

  closeModal("timerModal");

  document.getElementById("timerName").value = "";

  showPage("timers");

  renderTimers();

}


/* Mise à jour des minuteurs */

function updateTimers() {

  const now = Date.now();

  let changed = false;

  data.timers.forEach(timer => {

    if (!timer.running || timer.finished) {
      return;
    }

    const elapsed =
      Math.floor((now - timer.lastUpdate) / 1000);

    if (elapsed <= 0) {
      return;
    }

    timer.remaining =
      Math.max(0, timer.remaining - elapsed);

    timer.lastUpdate = now;

    changed = true;

    if (timer.remaining <= 0) {

      timer.remaining = 0;
      timer.running = false;
      timer.finished = true;

      playAlarm();

    }

  });

  if (changed) {
    saveData();
    renderTimers();
    renderHome();
  }

}


setInterval(updateTimers, 500);


/* Formatage */

function formatTime(seconds) {

  seconds = Math.max(0, seconds);

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor((seconds % 3600) / 60);

  const secs =
    seconds % 60;

  if (hours > 0) {

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );

  }

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );

}


/* Affichage minuteurs */

function renderTimers() {

  const container =
    document.getElementById("timerList");

  if (!data.timers.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏱️</div>
        <strong>Aucun minuteur</strong>
        <span>Ajoute ton premier minuteur.</span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    data.timers
      .slice()
      .reverse()
      .map(timerHTML)
      .join("");

  attachTimerEvents();

}


function timerHTML(timer) {

  const progress =
    timer.total > 0
      ? ((timer.total - timer.remaining) / timer.total) * 100
      : 0;

  let status = "";

  if (timer.finished) {
    status = "TERMINÉ";
  } else if (timer.running) {
    status = "EN COURS";
  } else {
    status = "EN PAUSE";
  }

  return `

    <article
      class="timer-card ${timer.finished ? "finished" : ""}"
      data-id="${timer.id}"
    >

      <div class="timer-top">

        <div>
          <div class="eyebrow">${status}</div>
          <div class="timer-name">${escapeHTML(timer.name)}</div>
        </div>

        <div>${timer.finished ? "🔔" : "⏱️"}</div>

      </div>

      <div class="timer-time">
        ${formatTime(timer.remaining)}
      </div>

      <div class="progress">
        <div
          class="progress-bar"
          style="width:${progress}%"
        ></div>
      </div>

      <div class="timer-actions">

        ${
          timer.finished

          ? `
            <button data-action="restart">
              ↻ Recommencer
            </button>
          `

          : `
            <button data-action="pause">
              ${timer.running ? "Ⅱ Pause" : "▶ Reprendre"}
            </button>
          `
        }

        <button
          class="stop"
          data-action="delete"
        >
          Supprimer
        </button>

      </div>

    </article>
  `;
}


function attachTimerEvents() {

  document.querySelectorAll(".timer-card")
    .forEach(card => {

      const id =
        Number(card.dataset.id);

      card.querySelectorAll("[data-action]")
        .forEach(button => {

          button.addEventListener("click", () => {

            const action =
              button.dataset.action;

            handleTimerAction(id, action);

          });

        });

    });

}


function handleTimerAction(id, action) {

  const timer =
    data.timers.find(t => t.id === id);

  if (!timer) return;


  if (action === "pause") {

    timer.running = !timer.running;
    timer.lastUpdate = Date.now();

  }


  if (action === "restart") {

    timer.remaining = timer.total;
    timer.running = true;
    timer.finished = false;
    timer.lastUpdate = Date.now();

  }


  if (action === "delete") {

    data.timers =
      data.timers.filter(t => t.id !== id);

  }


  saveData();

  renderTimers();
  renderHome();

}


/* ---------------------------------------------------------
   PAGE ACCUEIL
--------------------------------------------------------- */

function renderHome() {

  const activeTimers =
    data.timers.filter(t => !t.finished);

  document.getElementById("timerCount")
    .textContent = activeTimers.length;

  const container =
    document.getElementById("homeTimers");

  if (!activeTimers.length) {

    container.classList.add("empty");

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏱️</div>
        <strong>Aucun minuteur actif</strong>
        <span>Lance une cuisson pour la voir apparaître ici.</span>
      </div>
    `;

    return;
  }

  container.classList.remove("empty");

  container.innerHTML =
    activeTimers
      .slice()
      .reverse()
      .map(timerHTML)
      .join("");

  attachTimerEvents();

}


/* ---------------------------------------------------------
   PRÉPARATIONS
--------------------------------------------------------- */

document.getElementById("newPrepBtn")
  .addEventListener("click", () => {

    document.getElementById("prepModal")
      .classList.add("open");

  });


document.getElementById("createPrep")
  .addEventListener("click", createPreparation);


function createPreparation() {

  const name =
    document.getElementById("prepName")
      .value.trim();

  const raw =
    document.getElementById("prepSteps")
      .value.trim();

  if (!name) {
    alert("Donne un nom à ta préparation.");
    return;
  }

  const steps =
    raw
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

  data.preparations.push({

    id: Date.now(),

    name,

    steps

  });

  saveData();

  document.getElementById("prepName").value = "";
  document.getElementById("prepSteps").value = "";

  closeModal("prepModal");

  renderPreparations();

}


function renderPreparations() {

  const container =
    document.getElementById("prepList");

  if (!data.preparations.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <strong>Aucune préparation</strong>
        <span>Crée tes recettes et procédures.</span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    data.preparations
      .slice()
      .reverse()
      .map(prep => `

        <article class="prep-card">

          <h3>${escapeHTML(prep.name)}</h3>

          ${
            prep.steps.length
              ? `
                <ol>
                  ${prep.steps
                    .map(step =>
                      `<li>${escapeHTML(step)}</li>`
                    )
                    .join("")}
                </ol>
              `
              : `
                <p style="color:var(--muted)">
                  Aucune étape.
                </p>
              `
          }

          <div class="card-actions">

            <button
              data-delete-prep="${prep.id}"
            >
              Supprimer
            </button>

          </div>

        </article>

      `)
      .join("");


  document.querySelectorAll("[data-delete-prep]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.deletePrep);

        data.preparations =
          data.preparations
            .filter(x => x.id !== id);

        saveData();

        renderPreparations();

      });

    });

}


/* ---------------------------------------------------------
   LISTES
--------------------------------------------------------- */

document.getElementById("newListBtn")
  .addEventListener("click", () => {

    document.getElementById("listModal")
      .classList.add("open");

  });


document.getElementById("createList")
  .addEventListener("click", createList);


function createList() {

  const name =
    document.getElementById("listName")
      .value.trim();

  const firstTask =
    document.getElementById("firstTask")
      .value.trim();

  if (!name) {
    alert("Donne un nom à ta liste.");
    return;
  }

  const tasks = [];

  if (firstTask) {

    tasks.push({

      id: Date.now(),

      text: firstTask,

      done: false

    });

  }

  data.lists.push({

    id: Date.now(),

    name,

    tasks

  });

  saveData();

  document.getElementById("listName").value = "";
  document.getElementById("firstTask").value = "";

  closeModal("listModal");

  renderLists();

}


function renderLists() {

  const container =
    document.getElementById("listsContainer");

  if (!data.lists.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✓</div>
        <strong>Aucune liste</strong>
        <span>Crée une liste de mise en place.</span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    data.lists
      .map(list => `

        <article
          class="list-card"
          data-list="${list.id}"
        >

          <h3>${escapeHTML(list.name)}</h3>

          <div class="tasks">

            ${
              list.tasks.length
                ? list.tasks.map(task => `

                    <div class="task ${task.done ? "done" : ""}">

                      <input
                        type="checkbox"
                        ${task.done ? "checked" : ""}
                        data-task-check="${list.id}"
                        data-task-id="${task.id}"
                      >

                      <span>
                        ${escapeHTML(task.text)}
                      </span>

                      <button
                        class="delete-task"
                        data-task-delete="${list.id}"
                        data-task-id="${task.id}"
                      >
                        ×
                      </button>

                    </div>

                  `).join("")

                : `
                  <p style="color:var(--muted)">
                    Aucune tâche.
                  </p>
                `
            }

          </div>

          <div class="task-add">

            <input
              type="text"
              placeholder="Ajouter une tâche..."
              data-task-input="${list.id}"
            >

            <button
              data-task-add="${list.id}"
            >
              +
            </button>

          </div>

          <div class="card-actions">

            <button data-delete-list="${list.id}">
              Supprimer la liste
            </button>

          </div>

        </article>

      `)
      .join("");


  /* Checkbox */

  document.querySelectorAll("[data-task-check]")
    .forEach(input => {

      input.addEventListener("change", () => {

        const listId =
          Number(input.dataset.taskCheck);

        const taskId =
          Number(input.dataset.taskId);

        const list =
          data.lists.find(x => x.id === listId);

        if (!list) return;

        const task =
          list.tasks.find(x => x.id === taskId);

        if (!task) return;

        task.done = input.checked;

        saveData();

        renderLists();

      });

    });


  /* Suppression tâche */

  document.querySelectorAll("[data-task-delete]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const listId =
          Number(button.dataset.taskDelete);

        const taskId =
          Number(button.dataset.taskId);

        const list =
          data.lists.find(x => x.id === listId);

        if (!list) return;

        list.tasks =
          list.tasks.filter(
            task => task.id !== taskId
          );

        saveData();

        renderLists();

      });

    });


  /* Ajouter tâche */

  document.querySelectorAll("[data-task-add]")
    .forEach(button => {

      button.addEventListener("click", () => {

        addTask(
          Number(button.dataset.taskAdd)
        );

      });

    });


  /* Entrée clavier */

  document.querySelectorAll("[data-task-input]")
    .forEach(input => {

      input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

          addTask(
            Number(input.dataset.taskInput)
          );

        }

      });

    });


  /* Supprimer liste */

  document.querySelectorAll("[data-delete-list]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.deleteList);

        data.lists =
          data.lists.filter(x => x.id !== id);

        saveData();

        renderLists();

      });

    });

}


function addTask(listId) {

  const input =
    document.querySelector(
      `[data-task-input="${listId}"]`
    );

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  const list =
    data.lists.find(x => x.id === listId);

  if (!list) return;

  list.tasks.push({

    id: Date.now(),

    text,

    done: false

  });

  saveData();

  renderLists();

}


/* ---------------------------------------------------------
   SONNERIE
--------------------------------------------------------- */

let audioContext = null;


function playAlarm() {

  if (!data.sound) {
    return;
  }

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }

    const now =
      audioContext.currentTime;

    for (let i = 0; i < 4; i++) {

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.value =
        i % 2 === 0 ? 880 : 660;

      gain.gain.setValueAtTime(
        0,
        now + i * .35
      );

      gain.gain.linearRampToValueAtTime(
        .35,
        now + i * .35 + .03
      );

      gain.gain.exponentialRampToValueAtTime(
        .001,
        now + i * .35 + .3
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(now + i * .35);
      oscillator.stop(now + i * .35 + .32);

    }

  } catch (error) {

    console.log("Audio non disponible.");

  }

}


/* Test son */

document.getElementById("testSound")
  .addEventListener("click", () => {

    playAlarm();

  });


/* ---------------------------------------------------------
   RÉGLAGES
--------------------------------------------------------- */

function applyTheme() {

  document.body.classList.toggle(
    "dark",
    data.theme === "dark"
  );

  document.getElementById("themeBtn")
    .textContent =
      data.theme === "dark" ? "🌙" : "☀️";

}


function toggleTheme() {

  data.theme =
    data.theme === "dark"
      ? "light"
      : "dark";

  saveData();

  applyTheme();

}


document.getElementById("themeBtn")
  .addEventListener("click", toggleTheme);


document.getElementById("settingsTheme")
  .addEventListener("click", toggleTheme);


document.getElementById("soundToggle")
  .addEventListener("click", () => {

    data.sound = !data.sound;

    saveData();

    updateSettings();

  });


document.getElementById("kitchenName")
  .addEventListener("input", event => {

    data.kitchenName =
      event.target.value;

    saveData();

  });


function updateSettings() {

  document.getElementById("kitchenName")
    .value = data.kitchenName || "";

  document.getElementById("soundToggle")
    .classList.toggle(
      "active",
      data.sound
    );

}


/* Reset */

document.getElementById("resetApp")
  .addEventListener("click", () => {

    const confirmReset =
      confirm(
        "Supprimer toutes les données de KitchenFlow ?"
      );

    if (!confirmReset) return;

    localStorage.removeItem(STORAGE_KEY);

    location.reload();

  });


/* ---------------------------------------------------------
   UTILITAIRE
--------------------------------------------------------- */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ---------------------------------------------------------
   INITIALISATION
--------------------------------------------------------- */

loadData();

renderHome();

renderTimers();

renderPreparations();

renderLists();
