const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  [...document.querySelectorAll(selector)];



/* =========================
   DONNÉES
========================= */


const defaultTasks = [

  {
    id: 1,
    title: "Définir ma priorité du jour",
    tag: "Important",
    done: false
  },

  {
    id: 2,
    title: "Faire une chose qui fait avancer mes projets",
    tag: "Travail",
    done: false
  },

  {
    id: 3,
    title: "Prendre 20 minutes pour moi",
    tag: "Perso",
    done: false
  }

];


let tasks =
  JSON.parse(
    localStorage.getItem("moment_tasks")
  ) || defaultTasks;


let filter = "all";


let focusId =
  Number(
    localStorage.getItem("moment_focus")
  ) || 0;


let seconds =
  Number(
    localStorage.getItem("moment_timer")
  ) || 1500;


let timerRunning = false;


let timerInterval = null;


let timerPreset = 25;


let noteTimer;



/* =========================
   SAUVEGARDE
========================= */


function saveTasks() {

  localStorage.setItem(
    "moment_tasks",
    JSON.stringify(tasks)
  );

}



/* =========================
   TÂCHES
========================= */


function renderTasks() {

  const list =
    $("#taskList");


  const visible =
    tasks.filter(task => {

      if (filter === "done") {

        return task.done;

      }


      if (filter === "open") {

        return !task.done;

      }


      return true;

    });


  list.innerHTML =
    visible.map(task => `

      <div
        class="task ${task.done ? "done" : ""}"
        data-id="${task.id}"
      >

        <button class="check">

          ${task.done ? "✓" : ""}

        </button>


        <span class="task-title">

          ${escapeHtml(task.title)}

        </span>


        <div>

          <span class="tag">

            ${escapeHtml(task.tag)}

          </span>


          <button class="delete">

            ×

          </button>

        </div>

      </div>

    `).join("");


  $("#emptyState").style.display =
    visible.length
      ? "none"
      : "block";


  updateProgress();

  updateFocus();

}



/* =========================
   PROGRESSION
========================= */


function updateProgress() {

  const total =
    tasks.length;


  const done =
    tasks.filter(
      task => task.done
    ).length;


  const percent =
    total
      ? Math.round(
          done / total * 100
        )
      : 0;


  $("#doneCount").textContent =
    done;


  $("#totalCount").textContent =
    total;


  $("#progressPercent").textContent =
    percent + "%";


  $("#progressRing").style.background = `

    conic-gradient(

      var(--accent)
      ${percent * 3.6}deg,

      rgba(255,255,255,.07)
      ${percent * 3.6}deg

    )

  `;


  if (percent === 100) {

    $("#progressMessage").textContent =
      "Tout est terminé. Profite de ta journée.";

  }

  else if (percent >= 66) {

    $("#progressMessage").textContent =
      "Tu es dans le dernier tiers. Continue.";

  }

  else if (percent >= 33) {

    $("#progressMessage").textContent =
      "Ça avance. Garde le rythme.";

  }

  else {

    $("#progressMessage").textContent =
      "Commence par une petite victoire.";

  }

}



/* =========================
   PRIORITÉ
========================= */


function updateFocus() {

  let task =
    tasks.find(
      item =>
        item.id === focusId &&
        !item.done
    );


  if (!task) {

    task =
      tasks.find(
        item => !item.done
      );

  }


  focusId =
    task
      ? task.id
      : 0;


  localStorage.setItem(
    "moment_focus",
    focusId
  );


  $("#focusText").textContent =
    task
      ? task.title
      : "Tout est fait. Rien ne presse.";


  $("#focusBtn").textContent =
    task
      ? "Commencer cette priorité →"
      : "Ajouter une nouvelle tâche";

}



/* =========================
   AJOUT TÂCHE
========================= */


function addTask(
  title,
  tag
) {

  tasks.unshift({

    id: Date.now(),

    title: title,

    tag: tag,

    done: false

  });


  saveTasks();

  renderTasks();

  toast("Tâche ajoutée");

}



/* =========================
   FORMULAIRE
========================= */


$("#taskForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const input =
        $("#taskInput");


      const title =
        input.value.trim();


      if (!title) {

        input.focus();

        return;

      }


      addTask(
        title,
        $("#taskTag").value
      );


      input.value = "";


      input.focus();

    }
  );



/* =========================
   CLIQUE TÂCHE
========================= */


$("#taskList")
  .addEventListener(
    "click",
    event => {

      const row =
        event.target.closest(".task");


      if (!row) return;


      const id =
        Number(row.dataset.id);


      if (
        event.target.closest(".check")
      ) {

        const task =
          tasks.find(
            item => item.id === id
          );


        task.done =
          !task.done;


        saveTasks();

        renderTasks();

      }


      if (
        event.target.closest(".delete")
      ) {

        tasks =
          tasks.filter(
            item => item.id !== id
          );


        saveTasks();

        renderTasks();

        toast("Tâche supprimée");

      }

    }
  );



/* =========================
   FILTRES
========================= */


$$(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        $$(".filter")
          .forEach(item =>
            item.classList.remove(
              "active"
            )
          );


        button.classList.add(
          "active"
        );


        filter =
          button.dataset.filter;


        renderTasks();

      }
    );

  });



/* =========================
   BOUTON PRIORITÉ
========================= */


$("#focusBtn")
  .addEventListener(
    "click",
    () => {

      const openTasks =
        tasks.filter(
          task => !task.done
        );


      if (!openTasks.length) {

        $("#taskInput").focus();

        return;

      }


      const currentIndex =
        openTasks.findIndex(
          task =>
            task.id === focusId
        );


      const nextIndex =
        (currentIndex + 1)
        % openTasks.length;


      focusId =
        openTasks[nextIndex].id;


      localStorage.setItem(
        "moment_focus",
        focusId
      );


      updateFocus();

      toast("Priorité sélectionnée");

    }
  );



/* =========================
   HORLOGE
========================= */


function updateClock() {

  const now =
    new Date();


  $("#clock").textContent =
    now.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  $("#dateLabel").textContent =
    now
      .toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          day: "numeric",
          month: "long"
        }
      )
      .toUpperCase();


  const hour =
    now.getHours();


  if (hour < 5) {

    $("#greeting").textContent =
      "Bonne nuit.";

  }

  else if (hour < 12) {

    $("#greeting").textContent =
      "Bonjour.";

  }

  else if (hour < 18) {

    $("#greeting").textContent =
      "Bon après-midi.";

  }

  else {

    $("#greeting").textContent =
      "Bonsoir.";

  }


  $("#timezone").textContent =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone;

}


setInterval(
  updateClock,
  1000
);


updateClock();



/* =========================
   MINUTEUR
========================= */


function drawTimer() {

  const minutes =
    Math.floor(
      seconds / 60
    )
    .toString()
    .padStart(2, "0");


  const secs =
    (seconds % 60)
    .toString()
    .padStart(2, "0");


  $("#timerDisplay").textContent =
    `${minutes}:${secs}`;


  localStorage.setItem(
    "moment_timer",
    seconds
  );

}



/* DÉMARRER / PAUSE */


$("#timerStart")
  .addEventListener(
    "click",
    () => {

      if (timerRunning) {

        clearInterval(
          timerInterval
        );


        timerRunning =
          false;


        $("#timerStart")
          .textContent =
          "Reprendre";


        return;

      }


      timerRunning =
        true;


      $("#timerStart")
        .textContent =
        "Pause";


      timerInterval =
        setInterval(
          () => {

            if (seconds <= 0) {

              clearInterval(
                timerInterval
              );


              timerRunning =
                false;


              $("#timerStart")
                .textContent =
                "Démarrer";


              toast(
                "Session terminée ✓"
              );


              return;

            }


            seconds--;

            drawTimer();

          },
          1000
        );

    }
  );



/* PASSER */


$("#timerSkip")
  .addEventListener(
    "click",
    () => {

      seconds =
        timerPreset * 60;


      drawTimer();

    }
  );



/* RESET TIMER */


$("#resetTimer")
  .addEventListener(
    "click",
    () => {

      clearInterval(
        timerInterval
      );


      timerRunning =
        false;


      seconds =
        timerPreset * 60;


      $("#timerStart")
        .textContent =
        "Démarrer";


      drawTimer();

    }
  );



/* PRÉRÉGLAGES */


$$(".presets button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        $$(".presets button")
          .forEach(item =>
            item.classList.remove(
              "selected"
            )
          );


        button.classList.add(
          "selected"
        );


        timerPreset =
          Number(
            button.dataset.min
          );


        clearInterval(
          timerInterval
        );


        timerRunning =
          false;


        seconds =
          timerPreset * 60;


        $("#timerStart")
          .textContent =
          "Démarrer";


        drawTimer();

      }
    );

  });



/* =========================
   NOTES
========================= */


const note =
  $("#note");


note.value =
  localStorage.getItem(
    "moment_note"
  ) || "";


note.addEventListener(
  "input",
  () => {

    clearTimeout(
      noteTimer
    );


    $("#saveState")
      .textContent =
      "enregistrement…";


    noteTimer =
      setTimeout(
        () => {

          localStorage.setItem(
            "moment_note",
            note.value
          );


          $("#saveState")
            .textContent =
            "sauvegardé";

        },
        350
      );

  }
);



/* =========================
   MODE CLAIR / SOMBRE
========================= */


$("#themeBtn")
  .addEventListener(
    "click",
    () => {

      document.body
        .classList
        .toggle("light");


      localStorage.setItem(
        "moment_theme",

        document.body
          .classList
          .contains("light")
          ? "light"
          : "dark"
      );

    }
  );


if (
  localStorage.getItem(
    "moment_theme"
  ) === "light"
) {

  document.body
    .classList
    .add("light");

}



/* =========================
   RESET COMPLET
========================= */


$("#resetBtn")
  .addEventListener(
    "click",
    () => {

      const confirmation =
        confirm(
          "Réinitialiser les tâches et la note ?"
        );


      if (!confirmation)
        return;


      localStorage.removeItem(
        "moment_tasks"
      );


      localStorage.removeItem(
        "moment_note"
      );


      tasks =
        defaultTasks.map(
          task => ({
            ...task
          })
        );


      note.value = "";


      renderTasks();


      toast(
        "Données réinitialisées"
      );

    }
  );



/* =========================
   NOTIFICATION
========================= */


function toast(message) {

  const element =
    $("#toast");


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  setTimeout(
    () => {

      element.classList.remove(
        "show"
      );

    },
    1800
  );

}



/* =========================
   SÉCURITÉ HTML
========================= */


function escapeHtml(text) {

  return text.replace(
    /[&<>"']/g,

    character => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    })[character]

  );

}



/* =========================
   INITIALISATION
========================= */


drawTimer();

renderTasks();
