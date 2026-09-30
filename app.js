/* =========================================================
   KitchenOS V3
========================================================= */


/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_DATA = {

    fries: {
        minutes: 3,
        seconds: 0
    },

    presets: [

        {
            id: "blue",
            name: "🔵 Bleu",
            minutes: 2,
            seconds: 0
        },

        {
            id: "rare",
            name: "🔴 Saignant",
            minutes: 3,
            seconds: 0
        },

        {
            id: "medium",
            name: "🟠 À point",
            minutes: 4,
            seconds: 0
        },

        {
            id: "well",
            name: "🟤 Bien cuit",
            minutes: 5,
            seconds: 0
        }

    ],

    checklists: [

        {
            id: "opening",
            name: "Ouverture",

            tasks: [

                "Allumer les équipements",
                "Vérifier la friteuse",
                "Vérifier les stocks",
                "Préparer les sauces",
                "Préparer les légumes",
                "Nettoyer le plan de travail"

            ]
        },

        {
            id: "service",
            name: "Service",

            tasks: [

                "Friteuse OK",
                "Viande disponible",
                "Pain disponible",
                "Sauces disponibles",
                "Légumes disponibles"

            ]
        },

        {
            id: "closing",
            name: "Fermeture",

            tasks: [

                "Éteindre les équipements",
                "Nettoyer la friteuse",
                "Nettoyer les plans",
                "Nettoyer le sol",
                "Sortir les poubelles"

            ]
        }

    ],

    stock: [

        {
            id: "bread",
            name: "Pain burger",
            quantity: "24",
            status: "ok"
        },

        {
            id: "meat",
            name: "Steak haché",
            quantity: "18",
            status: "ok"
        },

        {
            id: "fries",
            name: "Frites",
            quantity: "2 sacs",
            status: "low"
        },

        {
            id: "sauce",
            name: "Sauce burger",
            quantity: "1 bouteille",
            status: "low"
        }

    ]

};


/* =========================================================
   STATE
========================================================= */

let data;

let activeChecklistId;

let timers = [];

let timerCounter = 0;

let friesTimer = {

    remaining: 0,

    running: false,

    interval: null

};

let alarmInterval = null;

let audioContext = null;


/* =========================================================
   STORAGE
========================================================= */

function loadData() {

    const saved =
        localStorage.getItem(
            "kitchenOS_v3"
        );

    if (saved) {

        try {

            data = JSON.parse(saved);

        } catch {

            data =
                structuredClone(
                    DEFAULT_DATA
                );

        }

    } else {

        data =
            structuredClone(
                DEFAULT_DATA
            );

    }

    activeChecklistId =
        localStorage.getItem(
            "kitchenOS_activeChecklist"
        )
        ||
        data.checklists[0]?.id;

}


function saveData() {

    localStorage.setItem(
        "kitchenOS_v3",
        JSON.stringify(data)
    );

    localStorage.setItem(
        "kitchenOS_activeChecklist",
        activeChecklistId
    );

}


loadData();


/* =========================================================
   HELPERS
========================================================= */

function formatTime(seconds) {

    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0")
        +
        ":"
        +
        String(secs).padStart(2, "0")
    );

}


function totalSeconds(minutes, seconds) {

    return (
        Number(minutes || 0) * 60
        +
        Number(seconds || 0)
    );

}


function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent = value;

    return div.innerHTML;

}


function generateId(prefix) {

    return (
        prefix
        +
        "_"
        +
        Date.now()
        +
        "_"
        +
        Math.random()
            .toString(36)
            .slice(2, 7)
    );

}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const now = new Date();

    document.getElementById(
        "clock"
    ).textContent =
        String(
            now.getHours()
        ).padStart(2, "0")
        +
        ":"
        +
        String(
            now.getMinutes()
        ).padStart(2, "0");

}


setInterval(
    updateClock,
    1000
);

updateClock();


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );

        });


    const page =
        document.getElementById(
            "page-" + pageName
        );

    if (page) {

        page.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                    pageName
            );

        });


    if (pageName === "dashboard") {

        renderDashboard();

    }

    if (pageName === "timers") {

        renderTimers();

        renderPresets();

    }

    if (pageName === "checklists") {

        renderChecklists();

    }

    if (pageName === "stock") {

        renderStock();

    }

}


document
    .querySelectorAll(".nav-item")
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


document
    .querySelectorAll(
        "[data-page-link]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.pageLink
                );

            }
        );

    });


/* =========================================================
   AUDIO
========================================================= */

function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext
                ||
                window.webkitAudioContext
            )();

    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

}


function beep(
    frequency = 880,
    duration = .45
) {

    initAudio();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type =
        "square";

    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        .001,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .45,
        audioContext.currentTime + .02
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime + duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime
        +
        duration
    );

}


function testAlarm() {

    initAudio();

    beep(880, .35);

    setTimeout(
        () => beep(660, .35),
        450
    );

    setTimeout(
        () => beep(880, .5),
        900
    );

}


/* =========================================================
   ALARM
========================================================= */

function triggerAlarm(name) {

    initAudio();

    document.getElementById(
        "alarmName"
    ).textContent = name;

    document
        .getElementById(
            "alarmOverlay"
        )
        .classList.add("active");


    beep(880, .4);


    alarmInterval =
        setInterval(
            () => {

                beep(
                    Math.random() > .5
                        ? 880
                        : 660,
                    .4
                );

            },
            1000
        );


    if (navigator.vibrate) {

        navigator.vibrate([
            500,
            250,
            500,
            250,
            1000
        ]);

    }

}


function stopAlarm() {

    clearInterval(
        alarmInterval
    );

    alarmInterval = null;


    document
        .getElementById(
            "alarmOverlay"
        )
        .classList.remove(
            "active"
        );


    if (navigator.vibrate) {

        navigator.vibrate(0);

    }

}


document
    .getElementById(
        "stopAlarmButton"
    )
    .addEventListener(
        "click",
        stopAlarm
    );


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    document
        .getElementById(id)
        .classList.add("active");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("active");

}


document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal(
                    button.dataset.closeModal
                );

            }
        );

    });


document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


/* =========================================================
   FRIES
========================================================= */

function getFriesDuration() {

    return totalSeconds(
        data.fries.minutes,
        data.fries.seconds
    );

}


function renderFries() {

    const duration =
        getFriesDuration();


    document.getElementById(
        "dashboardFriesTime"
    ).textContent =
        formatTime(duration);


    document.getElementById(
        "friesConfiguredTime"
    ).textContent =
        "Temps configuré : "
        +
        formatTime(duration);


    if (
        !friesTimer.running
        &&
        friesTimer.remaining <= 0
    ) {

        friesTimer.remaining =
            duration;

    }


    document.getElementById(
        "friesDisplay"
    ).textContent =
        formatTime(
            friesTimer.remaining
        );

}


function startFries() {

    initAudio();


    if (
        friesTimer.running
    ) {

        return;

    }


    if (
        friesTimer.remaining <= 0
    ) {

        friesTimer.remaining =
            getFriesDuration();

    }


    friesTimer.running =
        true;


    friesTimer.interval =
        setInterval(
            () => {

                friesTimer.remaining--;

                renderFries();


                if (
                    friesTimer.remaining <= 0
                ) {

                    clearInterval(
                        friesTimer.interval
                    );

                    friesTimer.running =
                        false;

                    triggerAlarm(
                        "🍟 Frites"
                    );

                }

            },
            1000
        );

}


function resetFries() {

    clearInterval(
        friesTimer.interval
    );

    friesTimer.running =
        false;

    friesTimer.remaining =
        getFriesDuration();

    renderFries();

}


document
    .getElementById(
        "dashboardFriesButton"
    )
    .addEventListener(
        "click",
        () => {

            showPage("timers");

            startFries();

        }
    );


document
    .getElementById(
        "startFries"
    )
    .addEventListener(
        "click",
        startFries
    );


document
    .getElementById(
        "resetFries"
    )
    .addEventListener(
        "click",
        resetFries
    );


/* =========================================================
   PRESETS
========================================================= */

function renderPresets() {

    const container =
        document.getElementById(
            "presetButtons"
        );

    container.innerHTML = "";


    data.presets.forEach(
        preset => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "preset-button";


            const seconds =
                totalSeconds(
                    preset.minutes,
                    preset.seconds
                );


            button.innerHTML = `
                ${escapeHTML(
                    preset.name
                )}
                <small>
                    ${formatTime(seconds)}
                </small>
            `;


            button.addEventListener(
                "click",
                () => {

                    createTimer(
                        preset.name,
                        seconds
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   GENERIC TIMERS
========================================================= */

function createTimer(
    name,
    duration
) {

    initAudio();


    if (
        !duration ||
        duration <= 0
    ) {

        return;

    }


    const timer = {

        id:
            ++timerCounter,

        name,

        remaining:
            duration,

        running:
            true,

        finished:
            false,

        interval:
            null

    };


    timer.interval =
        setInterval(
            () => {

                if (
                    !timer.running
                ) {

                    return;

                }


                timer.remaining--;


                if (
                    timer.remaining <= 0
                ) {

                    timer.remaining =
                        0;

                    timer.running =
                        false;

                    timer.finished =
                        true;


                    clearInterval(
                        timer.interval
                    );


                    triggerAlarm(
                        timer.name
                    );

                }


                renderTimers();

                renderDashboard();

            },
            1000
        );


    timers.push(timer);


    renderTimers();

    renderDashboard();

}


function pauseTimer(id) {

    const timer =
        timers.find(
            t => t.id === id
        );

    if (!timer) return;

    timer.running =
        !timer.running;

    renderTimers();

}


function addTimerTime(
    id,
    seconds
) {

    const timer =
        timers.find(
            t => t.id === id
        );

    if (!timer) return;


    timer.remaining +=
        seconds;


    if (
        timer.finished
    ) {

        timer.finished =
            false;

        timer.running =
            true;


        timer.interval =
            setInterval(
                () => {

                    if (
                        !timer.running
                    ) return;


                    timer.remaining--;


                    if (
                        timer.remaining <= 0
                    ) {

                        timer.remaining =
                            0;

                        timer.running =
                            false;

                        timer.finished =
                            true;


                        clearInterval(
                            timer.interval
                        );


                        triggerAlarm(
                            timer.name
                        );

                    }


                    renderTimers();

                    renderDashboard();

                },
                1000
            );

    }


    renderTimers();

}


function deleteTimer(id) {

    const timer =
        timers.find(
            t => t.id === id
        );

    if (!timer) return;


    clearInterval(
        timer.interval
    );


    timers =
        timers.filter(
            t => t.id !== id
        );


    renderTimers();

    renderDashboard();

}


function renderTimers() {

    const container =
        document.getElementById(
            "timerList"
        );


    if (!timers.length) {

        container.innerHTML =
            `
            <div class="empty">
                Aucun minuteur actif.
            </div>
            `;

        return;

    }


    container.innerHTML = "";


    timers.forEach(
        timer => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "timer-row"
                +
                (
                    timer.finished
                        ? " finished"
                        : ""
                );


            row.innerHTML = `

                <div>

                    <div class="timer-row-name">
                        ${escapeHTML(
                            timer.name
                        )}
                    </div>

                    <div class="timer-row-time">
                        ${formatTime(
                            timer.remaining
                        )}
                    </div>

                </div>


                <div class="timer-actions">

                    ${
                        timer.finished

                        ?

                        `
                        <button
                            class="timer-action green"
                            data-action="add"
                        >
                            +1m
                        </button>
                        `

                        :

                        `
                        <button
                            class="timer-action"
                            data-action="pause"
                        >
                            ${
                                timer.running
                                    ? "Ⅱ"
                                    : "▶"
                            }
                        </button>
                        `
                    }


                    <button
                        class="timer-action"
                        data-action="30"
                    >
                        +30s
                    </button>


                    <button
                        class="timer-action"
                        data-action="60"
                    >
                        +1m
                    </button>


                    <button
                        class="timer-action red"
                        data-action="delete"
                    >
                        ×
                    </button>

                </div>

            `;


            row
                .querySelectorAll(
                    "[data-action]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const action =
                                    button.dataset.action;


                                if (
                                    action ===
                                    "pause"
                                ) {

                                    pauseTimer(
                                        timer.id
                                    );

                                }

                                else if (
                                    action ===
                                    "delete"
                                ) {

                                    deleteTimer(
                                        timer.id
                                    );

                                }

                                else {

                                    addTimerTime(
                                        timer.id,
                                        action ===
                                            "add"
                                            ? 60
                                            : Number(
                                                action
                                            )
                                    );

                                }

                            }
                        );

                    }
                );


            container.appendChild(
                row
            );

        }
    );


    document.getElementById(
        "activeTimerCount"
    ).textContent =
        timers.filter(
            timer =>
                !timer.finished
        ).length;

}


document
    .querySelectorAll(
        "[data-quick-time]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                createTimer(
                    "Minuteur",
                    Number(
                        button.dataset.quickTime
                    )
                );

            }
        );

    });


document
    .getElementById(
        "clearFinished"
    )
    .addEventListener(
        "click",
        () => {

            timers
                .filter(
                    t => t.finished
                )
                .forEach(
                    t =>
                        clearInterval(
                            t.interval
                        )
                );


            timers =
                timers.filter(
                    t => !t.finished
                );


            renderTimers();

            renderDashboard();

        }
    );


/* =========================================================
   CUSTOM TIMER
========================================================= */

document
    .getElementById(
        "openTimerModal"
    )
    .addEventListener(
        "click",
        () => {

            openModal(
                "timerModal"
            );

        }
    );


document
    .querySelector(
        '[data-action="new-timer"]'
    )
    .addEventListener(
        "click",
        () => {

            showPage("timers");

            openModal(
                "timerModal"
            );

        }
    );


document
    .getElementById(
        "createTimerButton"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document.getElementById(
                    "customTimerName"
                ).value.trim()
                ||
                "Minuteur";


            const minutes =
                Number(
                    document.getElementById(
                        "customTimerMinutes"
                    ).value
                ) || 0;


            const seconds =
                Number(
                    document.getElementById(
                        "customTimerSeconds"
                    ).value
                ) || 0;


            const duration =
                totalSeconds(
                    minutes,
                    seconds
                );


            if (
                duration <= 0
            ) {

                alert(
                    "Indique une durée."
                );

                return;

            }


            createTimer(
                name,
                duration
            );


            document.getElementById(
                "customTimerName"
            ).value = "";

            document.getElementById(
                "customTimerMinutes"
            ).value = "";

            document.getElementById(
                "customTimerSeconds"
            ).value = "";


            closeModal(
                "timerModal"
            );

        }
    );


/* =========================================================
   CHECKLISTS
========================================================= */

function getActiveChecklist() {

    return data.checklists.find(
        checklist =>
            checklist.id ===
            activeChecklistId
    );

}


function renderChecklists() {

    renderChecklistTabs();

    renderChecklistMain();

}


function renderChecklistTabs() {

    const container =
        document.getElementById(
            "checklistTabs"
        );


    container.innerHTML = "";


    data.checklists.forEach(
        checklist => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "checklist-tab"
                +
                (
                    checklist.id ===
                    activeChecklistId
                        ? " active"
                        : ""
                );


            button.textContent =
                checklist.name;


            button.addEventListener(
                "click",
                () => {

                    activeChecklistId =
                        checklist.id;

                    saveData();

                    renderChecklists();

                    renderDashboard();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


function renderChecklistMain() {

    const checklist =
        getActiveChecklist();


    if (!checklist) {

        return;

    }


    document.getElementById(
        "currentChecklistName"
    ).textContent =
        checklist.name;


    const completed =
        checklist.tasks.filter(
            task =>
                task.done
        ).length;


    document.getElementById(
        "currentChecklistStats"
    ).textContent =
        completed
        +
        " / "
        +
        checklist.tasks.length
        +
        " tâches terminées";


    const percentage =
        checklist.tasks.length
            ? Math.round(
                completed /
                checklist.tasks.length
                *
                100
            )
            : 0;


    document.getElementById(
        "checklistProgress"
    ).innerHTML = `

        <div class="progress-bar">

            <div
                class="progress-fill"
                style="width:${percentage}%"
            ></div>

        </div>

        <div class="progress-text">

            <span>
                Progression
            </span>

            <b>
                ${percentage}%
            </b>

        </div>
    `;


    const items =
        document.getElementById(
            "checklistItems"
        );


    items.innerHTML = "";


    if (
        !checklist.tasks.length
    ) {

        items.innerHTML =
            `
            <div class="empty">
                Cette checklist est vide.
            </div>
            `;

        return;

    }


    checklist.tasks.forEach(
        (task, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "check-item"
                +
                (
                    task.done
                        ? " done"
                        : ""
                );


            row.innerHTML = `

                <input
                    class="check-box"
                    type="checkbox"
                    ${
                        task.done
                            ? "checked"
                            : ""
                    }
                >

                <span class="check-text">
                    ${escapeHTML(
                        task.text
                    )}
                </span>

                <button
                    class="delete-task"
                >
                    ×
                </button>

            `;


            row
                .querySelector(
                    ".check-box"
                )
                .addEventListener(
                    "change",
                    event => {

                        task.done =
                            event.target.checked;

                        saveData();

                        renderChecklistMain();

                        renderDashboard();

                    }
                );


            row
                .querySelector(
                    ".delete-task"
                )
                .addEventListener(
                    "click",
                    () => {

                        checklist.tasks.splice(
                            index,
                            1
                        );

                        saveData();

                        renderChecklistMain();

                        renderDashboard();

                    }
                );


            items.appendChild(
                row
            );

        }
    );

}


document
    .getElementById(
        "addTaskButton"
    )
    .addEventListener(
        "click",
        addChecklistTask
    );


document
    .getElementById(
        "newTaskInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                addChecklistTask();

            }

        }
    );


function addChecklistTask() {

    const input =
        document.getElementById(
            "newTaskInput"
        );


    const text =
        input.value.trim();


    if (!text) {

        return;

    }


    const checklist =
        getActiveChecklist();


    checklist.tasks.push({

        text,

        done: false

    });


    input.value = "";

    saveData();

    renderChecklistMain();

    renderDashboard();

}


document
    .getElementById(
        "newChecklistButton"
    )
    .addEventListener(
        "click",
        createChecklist
    );


function createChecklist() {

    const name =
        prompt(
            "Nom de la nouvelle checklist :"
        );


    if (
        !name ||
        !name.trim()
    ) {

        return;

    }


    const checklist = {

        id:
            generateId(
                "checklist"
            ),

        name:
            name.trim(),

        tasks: []

    };


    data.checklists.push(
        checklist
    );


    activeChecklistId =
        checklist.id;


    saveData();

    renderChecklists();

    renderDashboard();

}


document
    .getElementById(
        "deleteChecklistButton"
    )
    .addEventListener(
        "click",
        deleteCurrentChecklist
    );


function deleteCurrentChecklist() {

    if (
        data.checklists.length <= 1
    ) {

        alert(
            "Il faut garder au moins une checklist."
        );

        return;

    }


    const checklist =
        getActiveChecklist();


    if (
        !confirm(
            `Supprimer "${checklist.name}" ?`
        )
    ) {

        return;

    }


    data.checklists =
        data.checklists.filter(
            list =>
                list.id !==
                checklist.id
        );


    activeChecklistId =
        data.checklists[0].id;


    saveData();

    renderChecklists();

    renderDashboard();

}


/* =========================================================
   STOCK
========================================================= */

function renderStock() {

    const container =
        document.getElementById(
            "stockGrid"
        );


    container.innerHTML = "";


    if (
        !data.stock.length
    ) {

        container.innerHTML =
            `
            <div class="empty">
                Aucun produit enregistré.
            </div>
            `;

        return;

    }


    data.stock.forEach(
        product => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "stock-card";


            card.innerHTML = `

                <span
                    class="stock-status
                    ${product.status}">
                </span>

                <div class="stock-name">
                    ${escapeHTML(
                        product.name
                    )}
                </div>

                <div class="stock-quantity">
                    ${escapeHTML(
                        product.quantity
                    )}
                </div>

                <div class="stock-actions">

                    <button data-status="ok">
                        OK
                    </button>

                    <button data-status="low">
                        Faible
                    </button>

                    <button data-status="out">
                        Rupture
                    </button>

                    <button data-delete="true">
                        ×
                    </button>

                </div>
            `;


            card
                .querySelectorAll(
                    "[data-status]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                product.status =
                                    button.dataset.status;

                                saveData();

                                renderStock();

                                renderDashboard();

                            }
                        );

                    }
                );


            card
                .querySelector(
                    "[data-delete]"
                )
                .addEventListener(
                    "click",
                    () => {

                        data.stock =
                            data.stock.filter(
                                item =>
                                    item.id !==
                                    product.id
                            );

                        saveData();

                        renderStock();

                        renderDashboard();

                    }
                );


            container.appendChild(
                card
            );

        }
    );

}


document
    .getElementById(
        "addStockButton"
    )
    .addEventListener(
        "click",
        () => {

            openModal(
                "stockModal"
            );

        }
    );


document
    .getElementById(
        "createStockButton"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document.getElementById(
                    "stockName"
                ).value.trim();


            const quantity =
                document.getElementById(
                    "stockQuantity"
                ).value.trim();


            const status =
                document.getElementById(
                    "stockStatus"
                ).value;


            if (!name) {

                alert(
                    "Indique un produit."
                );

                return;

            }


            data.stock.push({

                id:
                    generateId(
                        "stock"
                    ),

                name,

                quantity:
                    quantity ||
                    "À préciser",

                status

            });


            document.getElementById(
                "stockName"
            ).value = "";


            document.getElementById(
                "stockQuantity"
            ).value = "";


            saveData();

            closeModal(
                "stockModal"
            );

            renderStock();

            renderDashboard();

        }
    );


/* =========================================================
   NOTES
========================================================= */

const notes =
    document.getElementById(
        "serviceNotes"
    );


notes.value =
    localStorage.getItem(
        "kitchenOS_notes"
    )
    ||
    "";


notes.addEventListener(
    "input",
    () => {

        localStorage.setItem(
            "kitchenOS_notes",
            notes.value
        );

    }
);


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    renderFries();


    const timerContainer =
        document.getElementById(
            "dashboardTimers"
        );


    const activeTimers =
        timers.filter(
            timer =>
                !timer.finished
        );


    if (
        !activeTimers.length
    ) {

        timerContainer.innerHTML =
            `
            <div class="empty">
                Aucun minuteur actif.
            </div>
            `;

    } else {

        timerContainer.innerHTML =
            "";


        activeTimers
            .slice(0, 3)
            .forEach(
                timer => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "panel";


                    card.innerHTML = `

                        <div class="panel-header">

                            <strong>
                                ${escapeHTML(
                                    timer.name
                                )}
                            </strong>

                            <button
                                class="small-link"
                                data-open-timers
                            >
                                Ouvrir
                            </button>

                        </div>

                        <div
                            style="
                                font-size:32px;
                                font-weight:1000;
                            "
                        >
                            ${formatTime(
                                timer.remaining
                            )}
                        </div>
                    `;


                    card
                        .querySelector(
                            "[data-open-timers]"
                        )
                        .addEventListener(
                            "click",
                            () => {

                                showPage(
                                    "timers"
                                );

                            }
                        );


                    timerContainer.appendChild(
                        card
                    );

                }
            );

    }


    document.getElementById(
        "activeTimerCount"
    ).textContent =
        activeTimers.length;


    /* checklist */


    const checklist =
        getActiveChecklist();


    if (checklist) {

        document.getElementById(
            "dashboardChecklistName"
        ).textContent =
            checklist.name;


        const completed =
            checklist.tasks.filter(
                task =>
                    task.done
            ).length;


        const total =
            checklist.tasks.length;


        const percentage =
            total
                ? Math.round(
                    completed /
                    total
                    *
                    100
                )
                : 0;


        document.getElementById(
            "dashboardChecklistProgress"
        ).innerHTML = `

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width:${percentage}%"
                ></div>

            </div>

            <div class="progress-text">

                <span>
                    ${completed} / ${total}
                </span>

                <b>
                    ${percentage}%
                </b>

            </div>
        `;

    }


    /* stock */


    const stockContainer =
        document.getElementById(
            "dashboardStock"
        );


    const low =
        data.stock.filter(
            product =>
                product.status ===
                "low"
        ).length;


    const out =
        data.stock.filter(
            product =>
                product.status ===
                "out"
        ).length;


    stockContainer.innerHTML = `

        <div
            style="
                display:flex;
                gap:10px;
            "
        >

            <div
                style="
                    flex:1;
                    background:var(--panel-hover);
                    padding:14px;
                    border-radius:10px;
                "
            >

                <b>
                    ${data.stock.length}
                </b>

                <small
                    style="
                        display:block;
                        color:var(--muted);
                        margin-top:4px;
                    "
                >
                    Produits
                </small>

            </div>


            <div
                style="
                    flex:1;
                    background:rgba(251,191,36,.1);
                    padding:14px;
                    border-radius:10px;
                "
            >

                <b>
                    ${low}
                </b>

                <small
                    style="
                        display:block;
                        color:var(--muted);
                        margin-top:4px;
                    "
                >
                    Faibles
                </small>

            </div>


            <div
                style="
                    flex:1;
                    background:rgba(248,113,113,.1);
                    padding:14px;
                    border-radius:10px;
                "
            >

                <b>
                    ${out}
                </b>

                <small
                    style="
                        display:block;
                        color:var(--muted);
                        margin-top:4px;
                    "
                >
                    Ruptures
                </small>

            </div>

        </div>
    `;

}


/* =========================================================
   SETTINGS
========================================================= */

document
    .getElementById(
        "settingsButton"
    )
    .addEventListener(
        "click",
        () => {

            renderSettings();

            openModal(
                "settingsModal"
            );

        }
    );


function renderSettings() {

    document.getElementById(
        "settingsFriesMinutes"
    ).value =
        data.fries.minutes;


    document.getElementById(
        "settingsFriesSeconds"
    ).value =
        data.fries.seconds;


    renderPresetSettings();

}


document
    .getElementById(
        "saveFriesSettings"
    )
    .addEventListener(
        "click",
        () => {

            data.fries.minutes =
                Number(
                    document.getElementById(
                        "settingsFriesMinutes"
                    ).value
                ) || 0;


            data.fries.seconds =
                Math.min(
                    59,
                    Number(
                        document.getElementById(
                            "settingsFriesSeconds"
                        ).value
                    ) || 0
                );


            saveData();

            resetFries();

            renderFries();

            alert(
                "Temps des frites enregistré."
            );

        }
    );


function renderPresetSettings() {

    const container =
        document.getElementById(
            "presetSettingsList"
        );


    container.innerHTML = "";


    data.presets.forEach(
        (preset, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "setting-item";


            row.innerHTML = `

                <input
                    value="${escapeHTML(
                        preset.name
                    )}"
                    data-name
                >

                <input
                    type="number"
                    min="0"
                    value="${preset.minutes}"
                    data-minutes
                >

                <input
                    type="number"
                    min="0"
                    max="59"
                    value="${preset.seconds}"
                    data-seconds
                >

                <button data-delete>
                    Supprimer
                </button>

            `;


            row
                .querySelector(
                    "[data-name]"
                )
                .addEventListener(
                    "change",
                    event => {

                        preset.name =
                            event.target.value;

                        saveData();

                        renderPresets();

                    }
                );


            row
                .querySelector(
                    "[data-minutes]"
                )
                .addEventListener(
                    "change",
                    event => {

                        preset.minutes =
                            Number(
                                event.target.value
                            ) || 0;

                        saveData();

                        renderPresets();

                    }
                );


            row
                .querySelector(
                    "[data-seconds]"
                )
                .addEventListener(
                    "change",
                    event => {

                        preset.seconds =
                            Math.min(
                                59,
                                Number(
                                    event.target.value
                                ) || 0
                            );

                        saveData();

                        renderPresets();

                    }
                );


            row
                .querySelector(
                    "[data-delete]"
                )
                .addEventListener(
                    "click",
                    () => {

                        data.presets.splice(
                            index,
                            1
                        );

                        saveData();

                        renderPresetSettings();

                        renderPresets();

                    }
                );


            container.appendChild(
                row
            );

        }
    );

}


document
    .getElementById(
        "addPresetButton"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document.getElementById(
                    "newPresetName"
                ).value.trim();


            const minutes =
                Number(
                    document.getElementById(
                        "newPresetMinutes"
                    ).value
                ) || 0;


            const seconds =
                Math.min(
                    59,
                    Number(
                        document.getElementById(
                            "newPresetSeconds"
                        ).value
                    ) || 0
                );


            if (
                !name ||
                totalSeconds(
                    minutes,
                    seconds
                ) <= 0
            ) {

                alert(
                    "Indique un nom et une durée."
                );

                return;

            }


            data.presets.push({

                id:
                    generateId(
                        "preset"
                    ),

                name,

                minutes,

                seconds

            });


            document.getElementById(
                "newPresetName"
            ).value = "";

            document.getElementById(
                "newPresetMinutes"
            ).value = "";

            document.getElementById(
                "newPresetSeconds"
            ).value = "";


            saveData();

            renderPresetSettings();

            renderPresets();

        }
    );


document
    .getElementById(
        "resetAppButton"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Réinitialiser complètement KitchenOS ?"
                )
            ) {

                return;

            }


            localStorage.removeItem(
                "kitchenOS_v3"
            );

            localStorage.removeItem(
                "kitchenOS_activeChecklist"
            );

            localStorage.removeItem(
                "kitchenOS_notes"
            );


            location.reload();

        }
    );


/* =========================================================
   DASHBOARD SHORTCUTS
========================================================= */

document
    .querySelector(
        '[data-action="steak"]'
    )
    .addEventListener(
        "click",
        () => {

            showPage("timers");

        }
    );


document
    .querySelector(
        '[data-action="checklist"]'
    )
    .addEventListener(
        "click",
        () => {

            showPage("checklists");

        }
    );


/* =========================================================
   INIT
========================================================= */

friesTimer.remaining =
    getFriesDuration();

renderFries();

renderPresets();

renderTimers();

renderChecklists();

renderStock();

renderDashboard();
