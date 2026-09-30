/* =========================================================
   KITCHENFLOW V2
========================================================= */


/* ---------- DONNÉES DE DÉPART ---------- */

const DEFAULT_CATEGORIES = [

  {
    id: "frites",
    name: "Frites",
    emoji: "🍟"
  },

  {
    id: "viandes",
    name: "Viandes",
    emoji: "🥩"
  },

  {
    id: "escargots",
    name: "Escargots",
    emoji: "🐌"
  },

  {
    id: "sauces",
    name: "Sauces",
    emoji: "🥫"
  }

];


const DEFAULT_PRODUCTS = [

  {
    id: "frites",
    name: "Frites",
    emoji: "🍟",
    category: "frites",
    type: "timer",
    minutes: 4,
    seconds: 0
  },

  {
    id: "bleu",
    name: "Bleu",
    emoji: "🥩",
    category: "viandes",
    type: "timer",
    minutes: 2,
    seconds: 0
  },

  {
    id: "saignant",
    name: "Saignant",
    emoji: "🥩",
    category: "viandes",
    type: "timer",
    minutes: 3,
    seconds: 0
  },

  {
    id: "point",
    name: "À point",
    emoji: "🥩",
    category: "viandes",
    type: "timer",
    minutes: 4,
    seconds: 0
  },

  {
    id: "bien-cuit",
    name: "Bien cuit",
    emoji: "🔥",
    category: "viandes",
    type: "timer",
    minutes: 6,
    seconds: 0
  },

  {
    id: "escargots",
    name: "Escargots",
    emoji: "🐌",
    category: "escargots",
    type: "timer",
    minutes: 8,
    seconds: 0
  },

  {
    id: "barbecue",
    name: "Sauce barbecue",
    emoji: "🥫",
    category: "sauces",
    type: "prep",
    minutes: 0,
    seconds: 0
  },

  {
    id: "maison",
    name: "Sauce maison",
    emoji: "🧄",
    category: "sauces",
    type: "prep",
    minutes: 0,
    seconds: 0
  }

];


const EMOJIS = [

  "🍟","🥩","🍔","🍗","🍖","🌭","🥓","🍳",
  "🐌","🐟","🍤","🦐","🦑","🐙","🍕","🍝",
  "🥔","🥕","🌽","🥦","🥬","🍅","🧅","🧄",
  "🥒","🍆","🫑","🥑","🍚","🍜","🍲","🥣",
  "🥫","🧀","🥖","🍞","🥐","🧈","🥚","🍰",
  "🍪","🍩","🍫","🍯","🍎","🍋","🍊","🍓",
  "🔥","❄️","⚡","⭐","❤️","💥","🌶️","🧂",
  "👨‍🍳","👩‍🍳","🍽️","⏱️","🔔","🔄","✨","💡"
];


/* ---------- ÉTAT ---------- */

let categories =
  load("kf_categories", DEFAULT_CATEGORIES);

let products =
  load("kf_products", DEFAULT_PRODUCTS);

let timers =
  load("kf_timers", []);

let preparations =
  load("kf_preparations", []);

let editingProduct = null;

let editingCategory = null;

let selectedProductEmoji = "🍟";

let selectedCategoryEmoji = "🔥";


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

let soundEnabled = false;

let alarmInterval = null;

let currentAlarmTimer = null;


/*
  Cette fonction doit être déclenchée par un clic utilisateur.
  C'est important sur iPhone/iPad.
*/

async function enableSound() {

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }

    if (
      audioContext.state === "suspended"
    ) {

      await audioContext.resume();

    }

    soundEnabled = true;

    updateSoundButton();

    playBeep(880, .12);

  }

  catch (error) {

    console.error(error);

    alert(
      "Le navigateur n'a pas autorisé le son."
    );

  }

}


function updateSoundButton() {

  const button =
    document.getElementById("soundButton");

  if (soundEnabled) {

    button.textContent =
      "🔊 Son activé";

    button.classList.add("enabled");

  }

  else {

    button.textContent =
      "🔇 Activer le son";

    button.classList.remove("enabled");

  }

}


function playBeep(
  frequency = 880,
  duration = .18
) {

  if (!soundEnabled) return;

  if (!audioContext) return;

  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  oscillator.type = "square";

  oscillator.frequency.value =
    frequency;

  const now =
    audioContext.currentTime;

  gain.gain.setValueAtTime(
    .001,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    .35,
    now + .015
  );

  gain.gain.exponentialRampToValueAtTime(
    .001,
    now + duration
  );

  oscillator.connect(gain);

  gain.connect(
    audioContext.destination
  );

  oscillator.start(now);

  oscillator.stop(
    now + duration + .02
  );

}


function playAlarmSound() {

  if (!soundEnabled) return;

  playBeep(880,.16);

  setTimeout(
    () => playBeep(660,.16),
    180
  );

  setTimeout(
    () => playBeep(880,.16),
    360
  );

}


function startAlarm(timer) {

  currentAlarmTimer = timer;

  const overlay =
    document.getElementById(
      "alarmOverlay"
    );

  document.getElementById(
    "alarmEmoji"
  ).textContent =
    timer.emoji;

  document.getElementById(
    "alarmName"
  ).textContent =
    timer.name;

  overlay.classList.add("show");

  playAlarmSound();

  if (alarmInterval) {

    clearInterval(
      alarmInterval
    );

  }

  alarmInterval =
    setInterval(
      playAlarmSound,
      900
    );

}


function stopAlarm() {

  if (alarmInterval) {

    clearInterval(
      alarmInterval
    );

    alarmInterval = null;

  }

  const overlay =
    document.getElementById(
      "alarmOverlay"
    );

  overlay.classList.remove("show");

  if (currentAlarmTimer) {

    timers =
      timers.filter(
        t =>
          t.id !==
          currentAlarmTimer.id
      );

    save();

    currentAlarmTimer = null;

    renderAll();

  }

}


document
  .getElementById("soundButton")
  .addEventListener(
    "click",
    enableSound
  );


document
  .getElementById("testSound")
  .addEventListener(
    "click",
    async () => {

      if (!soundEnabled) {

        await enableSound();

      }

      if (soundEnabled) {

        playAlarmSound();

      }

    }
  );


document
  .getElementById("stopAlarm")
  .addEventListener(
    "click",
    stopAlarm
  );


/* =========================================================
   NAVIGATION
========================================================= */

document
  .querySelectorAll(".navButton")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.screen;

        document
          .querySelectorAll(".screen")
          .forEach(
            screen =>
              screen.classList.remove(
                "active"
              )
          );

        document
          .getElementById(target)
          .classList.add("active");


        document
          .querySelectorAll(".navButton")
          .forEach(
            b =>
              b.classList.remove(
                "active"
              )
          );

        button.classList.add("active");

        renderAll();

        window.scrollTo(
          0,
          0
        );

      }
    );

  });


/* =========================================================
   RENDU PRODUITS
========================================================= */

function renderProducts() {

  const container =
    document.getElementById(
      "categories"
    );

  container.innerHTML = "";


  categories.forEach(
    category => {

      const list =
        products.filter(
          product =>
            product.category ===
            category.id
        );


      if (!list.length) return;


      const section =
        document.createElement("section");

      section.className =
        "category";


      section.innerHTML = `

        <div class="categoryHeader">

          <div class="categoryTitle">
            ${category.emoji}
            ${escapeHTML(category.name)}
          </div>

        </div>

        <div class="productGrid"></div>

      `;


      const grid =
        section.querySelector(
          ".productGrid"
        );


      list.forEach(
        product => {

          const button =
            document.createElement(
              "button"
            );

          button.className =
            "productButton " +
            (
              product.type === "prep"
                ? "prep"
                : ""
            );


          let info;


          if (
            product.type === "timer"
          ) {

            info =
              "⏱️ " +
              formatTime(
                product.minutes * 60 +
                product.seconds
              );

          }

          else {

            info =
              "🔄 Ajouter à refaire";

          }


          button.innerHTML = `

            <div class="productEmoji">
              ${product.emoji}
            </div>

            <div>

              <div class="productName">
                ${escapeHTML(product.name)}
              </div>

              <div class="productInfo">
                ${info}
              </div>

            </div>

          `;


          button.addEventListener(
            "click",
            () =>
              activateProduct(
                product
              )
          );


          grid.appendChild(
            button
          );

        }
      );


      container.appendChild(
        section
      );

    }
  );

}


/* =========================================================
   ACTIVATION
========================================================= */

function activateProduct(
  product
) {

  if (
    product.type === "prep"
  ) {

    addPreparation(
      product
    );

    return;

  }


  const duration =
    product.minutes * 60 +
    product.seconds;


  if (duration <= 0) {

    alert(
      "Ce bouton n'a pas de durée."
    );

    return;

  }


  /*
    Si le son n'a pas encore été activé,
    on avertit clairement.
  */

  if (!soundEnabled) {

    const activate =
      confirm(
        "Le son n'est pas activé.\n\n" +
        "Active-le maintenant pour être certain " +
        "d'entendre les alarmes."
      );


    if (activate) {

      enableSound();

    }

  }


  const timer = {

    id:
      Date.now() +
      Math.random(),

    productId:
      product.id,

    name:
      product.name,

    emoji:
      product.emoji,

    total:
      duration,

    remaining:
      duration,

    endTime:
      Date.now() +
      duration * 1000,

    finished:
      false

  };


  timers.push(
    timer
  );

  save();

  renderAll();

}


/* =========================================================
   MINUTEURS
========================================================= */

function updateTimers() {

  let changed = false;


  timers.forEach(
    timer => {

      if (
        timer.finished
      ) return;


      const remaining =
        Math.max(
          0,
          Math.ceil(
            (
              timer.endTime -
              Date.now()
            ) / 1000
          )
        );


      if (
        remaining !==
        timer.remaining
      ) {

        timer.remaining =
          remaining;

        changed = true;

      }


      if (
        remaining <= 0 &&
        !timer.finished
      ) {

        timer.finished = true;

        changed = true;

        startAlarm(
          timer
        );

        if (
          navigator.vibrate
        ) {

          navigator.vibrate(
            [
              400,
              150,
              400,
              150,
              700
            ]
          );

        }

      }

    }
  );


  if (changed) {

    save();

    renderTimers();

  }

}


setInterval(
  updateTimers,
  250
);


/* =========================================================
   AFFICHAGE DES MINUTEURS
========================================================= */

function renderTimers() {

  const container =
    document.getElementById(
      "timers"
    );


  const count =
    timers.filter(
      timer =>
        !timer.finished
    ).length;


  document.getElementById(
    "activeCount"
  ).textContent =
    count;


  if (!timers.length) {

    container.innerHTML = `

      <div class="noTimers">
        Aucun minuteur en cours.
      </div>

    `;

    return;

  }


  container.innerHTML = "";


  timers
    .slice()
    .reverse()
    .forEach(
      timer => {

        const card =
          document.createElement(
            "div"
          );


        let className =
          "timerCard";


        if (
          timer.finished
        ) {

          className +=
            " finished";

        }

        else if (
          timer.remaining <= 30
        ) {

          className +=
            " warning";

        }


        card.className =
          className;


        const progress =
          timer.finished
            ? 100
            : Math.min(
                100,
                (
                  (
                    timer.total -
                    timer.remaining
                  ) /
                  timer.total
                ) * 100
              );


        card.innerHTML = `

          <div class="timerEmoji">
            ${timer.emoji}
          </div>

          <div>

            <div class="timerName">
              ${escapeHTML(timer.name)}
            </div>

            <div class="timerValue">

              ${
                timer.finished
                  ? "🔔 FINI"
                  : formatTime(
                      timer.remaining
                    )
              }

            </div>

            <div class="progressTrack">

              <div
                class="progress"
                style="width:${progress}%"
              ></div>

            </div>

          </div>

          <button class="timerStop">
            ${
              timer.finished
                ? "✓"
                : "×"
            }
          </button>

        `;


        card
          .querySelector(
            ".timerStop"
          )
          .addEventListener(
            "click",
            () => {

              if (
                timer.finished
              ) {

                if (
                  currentAlarmTimer &&
                  currentAlarmTimer.id ===
                    timer.id
                ) {

                  stopAlarm();

                }

                else {

                  removeTimer(
                    timer.id
                  );

                }

              }

              else {

                removeTimer(
                  timer.id
                );

              }

            }
          );


        container.appendChild(
          card
        );

      }
    );

}


function removeTimer(
  id
) {

  timers =
    timers.filter(
      timer =>
        timer.id !== id
    );

  save();

  renderAll();

}


/* =========================================================
   PREPARATIONS
========================================================= */

function addPreparation(
  product
) {

  const existing =
    preparations.find(
      item =>
        item.productId ===
        product.id
    );


  if (existing) {

    existing.quantity++;

  }

  else {

    preparations.push({

      id:
        Date.now() +
        Math.random(),

      productId:
        product.id,

      name:
        product.name,

      emoji:
        product.emoji,

      quantity: 1

    });

  }


  save();

  renderAll();

}


function removePreparation(
  id
) {

  preparations =
    preparations.filter(
      item =>
        item.id !== id
    );

  save();

  renderAll();

}


function renderPreparations() {

  const list =
    document.getElementById(
      "prepList"
    );

  const full =
    document.getElementById(
      "prepFullList"
    );


  document.getElementById(
    "prepCount"
  ).textContent =
    preparations.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );


  if (!preparations.length) {

    const empty = `

      <div class="noTimers">
        ✅ Rien à refaire pour le moment.
      </div>

    `;

    list.innerHTML =
      empty;

    full.innerHTML =
      empty;

    return;

  }


  const createHTML =
    item => `

      <div class="prepItem">

        <div class="prepEmoji">
          ${item.emoji}
        </div>

        <div class="prepName">
          ${escapeHTML(item.name)}
        </div>

        ${
          item.quantity > 1
            ? `
              <div class="prepQuantity">
                ×${item.quantity}
              </div>
            `
            : ""
        }

        <button
          class="doneButton"
          data-id="${item.id}"
        >
          ✓ Fait
        </button>

      </div>

    `;


  list.innerHTML =
    preparations
      .map(createHTML)
      .join("");


  full.innerHTML =
    preparations
      .map(createHTML)
      .join("");


  document
    .querySelectorAll(
      ".doneButton"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            removePreparation(
              Number(
                button.dataset.id
              )
            )
        );

      }
    );

}


/* =========================================================
   CONFIGURATION
========================================================= */

function renderSettings() {

  renderCategorySettings();

  renderProductSettings();

}


function renderCategorySettings() {

  const container =
    document.getElementById(
      "categorySettings"
    );


  container.innerHTML = "";


  categories.forEach(
    category => {

      const count =
        products.filter(
          product =>
            product.category ===
            category.id
        ).length;


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "settingRow";


      row.innerHTML = `

        <div class="settingEmoji">
          ${category.emoji}
        </div>

        <div class="settingInfo">

          <strong>
            ${escapeHTML(category.name)}
          </strong>

          <small>
            ${count} bouton(s)
          </small>

        </div>

        <button
          class="iconButton editCategory"
        >
          ✏️
        </button>

        <button
          class="iconButton deleteButton deleteCategory"
        >
          🗑️
        </button>

      `;


      row
        .querySelector(
          ".editCategory"
        )
        .addEventListener(
          "click",
          () =>
            openEditCategory(
              category
            )
        );


      row
        .querySelector(
          ".deleteCategory"
        )
        .addEventListener(
          "click",
          () =>
            deleteCategory(
              category
            )
        );


      container.appendChild(
        row
      );

    }
  );

}


function renderProductSettings() {

  const container =
    document.getElementById(
      "productSettings"
    );


  container.innerHTML = "";


  products.forEach(
    product => {

      const category =
        categories.find(
          category =>
            category.id ===
            product.category
        );


      const info =
        product.type === "timer"
          ? "⏱️ " +
            formatTime(
              product.minutes * 60 +
              product.seconds
            )
          : "🔄 À refaire";


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "settingRow";


      row.innerHTML = `

        <div class="settingEmoji">
          ${product.emoji}
        </div>

        <div class="settingInfo">

          <strong>
            ${escapeHTML(product.name)}
          </strong>

          <small>

            ${
              category
                ? category.emoji +
                  " " +
                  escapeHTML(
                    category.name
                  )
                : ""
            }

            •
            ${info}

          </small>

        </div>

        <button
          class="iconButton editProduct"
        >
          ✏️
        </button>

        <button
          class="iconButton deleteButton deleteProduct"
        >
          🗑️
        </button>

      `;


      row
        .querySelector(
          ".editProduct"
        )
        .addEventListener(
          "click",
          () =>
            openEditProduct(
              product
            )
        );


      row
        .querySelector(
          ".deleteProduct"
        )
        .addEventListener(
          "click",
          () =>
            deleteProduct(
              product
            )
        );


      container.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   PRODUIT — MODALE
========================================================= */

document
  .getElementById("addProduct")
  .addEventListener(
    "click",
    () =>
      openProductModal()
  );


document
  .getElementById("productType")
  .addEventListener(
    "change",
    updateDurationVisibility
  );


function openProductModal(
  product = null
) {

  editingProduct =
    product;


  document.getElementById(
    "productModalTitle"
  ).textContent =
    product
      ? "Modifier le bouton"
      : "Nouveau bouton";


  document.getElementById(
    "productName"
  ).value =
    product
      ? product.name
      : "";


  document.getElementById(
    "productMinutes"
  ).value =
    product
      ? product.minutes
      : 4;


  document.getElementById(
    "productSeconds"
  ).value =
    product
      ? product.seconds
      : 0;


  document.getElementById(
    "productType"
  ).value =
    product
      ? product.type
      : "timer";


  selectedProductEmoji =
    product
      ? product.emoji
      : "🍟";


  fillCategorySelect(
    product
      ? product.category
      : categories[0]?.id
  );


  renderEmojiPicker();

  updateDurationVisibility();

  openModal(
    "productModal"
  );

}


function openEditProduct(
  product
) {

  openProductModal(
    product
  );

}


function fillCategorySelect(
  selected
) {

  const select =
    document.getElementById(
      "productCategory"
    );


  select.innerHTML =
    categories
      .map(
        category => `

          <option
            value="${category.id}"
            ${
              category.id === selected
                ? "selected"
                : ""
            }
          >
            ${category.emoji}
            ${escapeHTML(category.name)}
          </option>

        `
      )
      .join("");

}


function updateDurationVisibility() {

  const type =
    document.getElementById(
      "productType"
    ).value;


  document.getElementById(
    "durationFields"
  ).style.display =
    type === "timer"
      ? "block"
      : "none";

}


document
  .getElementById("saveProduct")
  .addEventListener(
    "click",
    saveProduct
  );


function saveProduct() {

  const name =
    document.getElementById(
      "productName"
    ).value.trim();


  if (!name) {

    alert(
      "Donne un nom au bouton."
    );

    return;

  }


  let minutes =
    Number(
      document.getElementById(
        "productMinutes"
      ).value
    ) || 0;


  let seconds =
    Number(
      document.getElementById(
        "productSeconds"
      ).value
    ) || 0;


  minutes +=
    Math.floor(
      seconds / 60
    );


  seconds =
    seconds % 60;


  const category =
    document.getElementById(
      "productCategory"
    ).value;


  const type =
    document.getElementById(
      "productType"
    ).value;


  if (editingProduct) {

    editingProduct.name =
      name;

    editingProduct.category =
      category;

    editingProduct.type =
      type;

    editingProduct.emoji =
      selectedProductEmoji;

    editingProduct.minutes =
      minutes;

    editingProduct.seconds =
      seconds;

  }

  else {

    products.push({

      id:
        "product-" +
        Date.now(),

      name,

      category,

      type,

      emoji:
        selectedProductEmoji,

      minutes,

      seconds

    });

  }


  save();

  closeModal(
    "productModal"
  );

  renderAll();

}


/* =========================================================
   CATEGORIES
========================================================= */

document
  .getElementById("addCategory")
  .addEventListener(
    "click",
    () =>
      openCategoryModal()
  );


function openCategoryModal(
  category = null
) {

  editingCategory =
    category;


  document.getElementById(
    "categoryModalTitle"
  ).textContent =
    category
      ? "Modifier la catégorie"
      : "Nouvelle catégorie";


  document.getElementById(
    "categoryName"
  ).value =
    category
      ? category.name
      : "";


  selectedCategoryEmoji =
    category
      ? category.emoji
      : "🔥";


  renderCategoryEmojiPicker();

  openModal(
    "categoryModal"
  );

}


function openEditCategory(
  category
) {

  openCategoryModal(
    category
  );

}


document
  .getElementById("saveCategory")
  .addEventListener(
    "click",
    saveCategory
  );


function saveCategory() {

  const name =
    document.getElementById(
      "categoryName"
    ).value.trim();


  if (!name) {

    alert(
      "Donne un nom à la catégorie."
    );

    return;

  }


  if (editingCategory) {

    editingCategory.name =
      name;

    editingCategory.emoji =
      selectedCategoryEmoji;

  }

  else {

    categories.push({

      id:
        "category-" +
        Date.now(),

      name,

      emoji:
        selectedCategoryEmoji

    });

  }


  save();

  closeModal(
    "categoryModal"
  );

  renderAll();

}


function deleteCategory(
  category
) {

  const productsInCategory =
    products.filter(
      product =>
        product.category ===
        category.id
    );


  if (
    productsInCategory.length
  ) {

    alert(
      "Impossible de supprimer cette catégorie tant qu'elle contient des boutons."
    );

    return;

  }


  if (
    confirm(
      "Supprimer " +
      category.name +
      " ?"
    )
  ) {

    categories =
      categories.filter(
        c =>
          c.id !== category.id
      );

    save();

    renderAll();

  }

}


/* =========================================================
   SUPPRESSION PRODUIT
========================================================= */

function deleteProduct(
  product
) {

  if (
    !confirm(
      "Supprimer « " +
      product.name +
      " » ?"
    )
  ) {

    return;

  }


  products =
    products.filter(
      p =>
        p.id !== product.id
    );


  save();

  renderAll();

}


/* =========================================================
   EMOJIS
========================================================= */

function renderEmojiPicker() {

  const container =
    document.getElementById(
      "emojiPicker"
    );


  container.innerHTML = "";


  EMOJIS.forEach(
    emoji => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "emojiChoice" +
        (
          emoji ===
          selectedProductEmoji
            ? " selected"
            : ""
        );


      button.textContent =
        emoji;


      button.type =
        "button";


      button.addEventListener(
        "click",
        () => {

          selectedProductEmoji =
            emoji;

          renderEmojiPicker();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


function renderCategoryEmojiPicker() {

  const container =
    document.getElementById(
      "categoryEmojiPicker"
    );


  container.innerHTML = "";


  EMOJIS.forEach(
    emoji => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "emojiChoice" +
        (
          emoji ===
          selectedCategoryEmoji
            ? " selected"
            : ""
        );


      button.textContent =
        emoji;

      button.type =
        "button";


      button.addEventListener(
        "click",
        () => {

          selectedCategoryEmoji =
            emoji;

          renderCategoryEmojiPicker();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   MODALES
========================================================= */

document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () =>
          closeModal(
            button.dataset.close
          )
      );

    }
  );


function openModal(id) {

  document
    .getElementById(id)
    .classList.add(
      "open"
    );

}


function closeModal(id) {

  document
    .getElementById(id)
    .classList.remove(
      "open"
    );

}


document
  .querySelectorAll(".modal")
  .forEach(
    modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            modal
          ) {

            closeModal(
              modal.id
            );

          }

        }
      );

    }
  );


/* =========================================================
   OUTILS
========================================================= */

function formatTime(
  seconds
) {

  seconds =
    Math.max(
      0,
      Math.floor(seconds)
    );


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  return (
    String(minutes)
      .padStart(2,"0")
    +
    ":"
    +
    String(secs)
      .padStart(2,"0")
  );

}


function escapeHTML(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function load(
  key,
  fallback
) {

  try {

    const data =
      localStorage.getItem(
        key
      );


    return data
      ? JSON.parse(data)
      : structuredClone(
          fallback
        );

  }

  catch {

    return structuredClone(
      fallback
    );

  }

}


function save() {

  localStorage.setItem(
    "kf_categories",
    JSON.stringify(
      categories
    )
  );

  localStorage.setItem(
    "kf_products",
    JSON.stringify(
      products
    )
  );

  localStorage.setItem(
    "kf_timers",
    JSON.stringify(
      timers
    )
  );

  localStorage.setItem(
    "kf_preparations",
    JSON.stringify(
      preparations
    )
  );

}


/* =========================================================
   RENDU GLOBAL
========================================================= */

function renderAll() {

  renderProducts();

  renderTimers();

  renderPreparations();

  renderSettings();

}


/* =========================================================
   MODE SOMBRE
========================================================= */

function initDarkMode() {

  const saved =
    localStorage.getItem(
      "kf_dark"
    );


  if (
    saved === "true"
  ) {

    document.body.classList.add(
      "dark"
    );

  }

}


/* =========================================================
   LANCEMENT
========================================================= */

initDarkMode();

renderEmojiPicker();

renderCategoryEmojiPicker();

renderAll();

updateSoundButton();
