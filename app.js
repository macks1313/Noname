/* =========================================
   THE RULES
   ========================================= */

const intro = document.getElementById("intro");
const gameScreen = document.getElementById("gameScreen");
const ending = document.getElementById("ending");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const mysteryButton =
    document.getElementById("mysteryButton");

const buttonText =
    document.getElementById("buttonText");

const ruleNumber =
    document.getElementById("ruleNumber");

const ruleText =
    document.getElementById("ruleText");

const objects =
    document.getElementById("objects");

const notification =
    document.getElementById("notification");

const flash =
    document.getElementById("flash");


/* =========================================
   STATE
   ========================================= */

let actions = 0;

let discoveries = 0;

let rulesFound = 1;

let startedAt = 0;

let lastAction = 0;

let fastClicks = 0;

let patient = true;

let buttonClicks = 0;

let objectClicks = 0;

let suspicious = false;

let rules = [];

let gameFinished = false;


/* =========================================
   SESSION
   ========================================= */

let session =
    Number(
        localStorage.getItem("rules_session") || "0"
    );

session++;

localStorage.setItem(
    "rules_session",
    session
);

document.getElementById("sessionNumber")
    .textContent =
    String(session).padStart(3, "0");


/* =========================================
   START
   ========================================= */

startButton.addEventListener(
    "click",
    startGame
);


function startGame() {

    intro.classList.remove("active");

    gameScreen.classList.add("active");

    startedAt = Date.now();

    setRule(
        "RULE #01",
        "There are no rules."
    );

    setTimeout(() => {

        showNotification(
            "THE EXPERIMENT HAS BEGUN."
        );

    }, 700);

}


/* =========================================
   RULE ENGINE
   ========================================= */

function setRule(number, text) {

    ruleNumber.textContent = number;

    ruleText.style.opacity = "0";

    ruleText.style.transform =
        "translateY(8px)";


    setTimeout(() => {

        ruleText.textContent = text;

        ruleText.style.opacity = "1";

        ruleText.style.transform =
            "translateY(0)";

    }, 180);
}


/* =========================================
   ACTION TRACKING
   ========================================= */

function registerAction() {

    actions++;

    document.getElementById("actions")
        .textContent = actions;


    const now = Date.now();

    if (now - lastAction < 700) {

        fastClicks++;

    }

    lastAction = now;


    if (Date.now() - startedAt < 5000) {

        patient = false;

    }


    checkRules();
}


/* =========================================
   MAIN BUTTON
   ========================================= */

mysteryButton.addEventListener(
    "click",
    () => {

        if (gameFinished) return;

        buttonClicks++;

        registerAction();

        createReaction();

    }
);


function createReaction() {

    const reactions = [

        "Interesting.",

        "Why did you do that?",

        "Again?",

        "You really clicked it.",

        "I saw that.",

        "Okay.",

        "Noted.",

        "That was unexpected.",

        "Keep going.",

        "Are you sure?"

    ];


    if (buttonClicks < reactions.length) {

        buttonText.textContent =
            reactions[buttonClicks - 1];

    }


    mysteryButton.style.transform =
        `translate(-50%, -50%)
         rotate(${random(-4,4)}deg)`;


    setTimeout(() => {

        mysteryButton.style.transform =
            "translate(-50%, -50%)";

    }, 180);


    if (buttonClicks === 3) {

        discoveries++;

        showNotification(
            "DISCOVERY +1"
        );

        setRule(
            "RULE #02",
            "You are allowed to press the button."
        );

    }


    if (buttonClicks === 5) {

        discoveries++;

        createObjects(3);

        setRule(
            "RULE #03",
            "Not everything here is a button."
        );

    }

}


/* =========================================
   RULE CHECKING
   ========================================= */

function checkRules() {

    /* FAST CLICKER */

    if (
        fastClicks >= 5 &&
        rulesFound < 3
    ) {

        rulesFound = 3;

        discoveries++;

        setRule(
            "RULE #04",
            "You click faster when you are uncertain."
        );

        showNotification(
            "THE SITE IS WATCHING YOUR BEHAVIOR."
        );

        createObjects(5);

        return;
    }


    /* PATIENT PLAYER */

    if (
        actions === 1 &&
        Date.now() - startedAt > 15000
    ) {

        discoveries++;

        setRule(
            "RULE #05",
            "Waiting was also an action."
        );

        return;
    }


    /* MANY CLICKS */

    if (
        actions >= 10 &&
        rulesFound < 5
    ) {

        rulesFound = 5;

        discoveries++;

        setRule(
            "RULE #06",
            "There is something you haven't clicked."
        );

        createObjects(7);

        return;
    }


    /* OBJECT DISCOVERY */

    if (
        objectClicks >= 3 &&
        rulesFound < 6
    ) {

        rulesFound = 6;

        discoveries++;

        setRule(
            "RULE #07",
            "You were never told to find them."
        );

        makeButtonDisappear();

        return;
    }


    /* SUSPICION */

    if (
        actions >= 18 &&
        !suspicious
    ) {

        suspicious = true;

        discoveries++;

        setRule(
            "RULE #08",
            "Stop looking for the answer."
        );

        setTimeout(() => {

            createRedObject();

        }, 800);

    }


    /* END */

    if (
        discoveries >= 8 &&
        actions >= 22
    ) {

        finishGame();

    }

}


/* =========================================
   OBJECTS
   ========================================= */

function createObjects(amount) {

    for (let i = 0; i < amount; i++) {

        const object =
            document.createElement("div");

        object.className = "object";


        if (Math.random() > .75) {

            object.classList.add("square");

        }


        const x =
            random(5, 95);

        const y =
            random(10, 90);


        object.style.left = x + "%";

        object.style.top = y + "%";


        object.addEventListener(
            "click",
            () => {

                if (
                    object.dataset.clicked
                ) return;


                object.dataset.clicked =
                    "true";

                object.style.transform =
                    "scale(0)";

                object.style.opacity =
                    "0";


                objectClicks++;

                discoveries++;

                registerAction();


                showNotification(
                    "OBJECT DISCOVERED"
                );


                if (
                    objectClicks === 1
                ) {

                    setRule(
                        "RULE #09",
                        "You found something."
                    );

                }

                if (
                    objectClicks === 2
                ) {

                    setRule(
                        "RULE #10",
                        "There are more."
                    );

                }


                setTimeout(() => {

                    object.remove();

                }, 250);

            }
        );


        objects.appendChild(object);

    }

}


/* =========================================
   RED OBJECT
   ========================================= */

function createRedObject() {

    const object =
        document.createElement("div");

    object.className =
        "object red";


    object.style.left =
        random(10, 90) + "%";


    object.style.top =
        random(10, 90) + "%";


    object.addEventListener(
        "click",
        () => {

            discoveries++;

            registerAction();

            flashScreen();

            setRule(
                "RULE #11",
                "You weren't supposed to touch that."
            );

            showNotification(
                "THAT WAS A MISTAKE."
            );


            object.remove();

        }
    );


    objects.appendChild(object);

}


/* =========================================
   BUTTON DISAPPEARS
   ========================================= */

function makeButtonDisappear() {

    mysteryButton.classList.add(
        "hidden"
    );


    setRule(
        "RULE #12",
        "The button was never important."
    );


    setTimeout(() => {

        createObjects(10);

        showNotification(
            "LOOK AROUND."
        );

    }, 1000);

}


/* =========================================
   RANDOM MOVEMENT
   ========================================= */

document.addEventListener(
    "mousemove",
    event => {

        if (!gameScreen.classList.contains("active"))
            return;


        const x =
            event.clientX /
            window.innerWidth;


        const y =
            event.clientY /
            window.innerHeight;


        mysteryButton.style.marginLeft =
            `${(x - .5) * 8}px`;


        mysteryButton.style.marginTop =
            `${(y - .5) * 8}px`;

    }
);


/* =========================================
   TOUCH
   ========================================= */

let touchStart = 0;

document.addEventListener(
    "touchstart",
    () => {

        touchStart = Date.now();

    },
    { passive: true }
);


document.addEventListener(
    "touchend",
    () => {

        if (
            gameScreen.classList.contains("active") &&
            Date.now() - touchStart > 2000
        ) {

            showNotification(
                "YOU HELD YOUR FINGER THERE."
            );

        }

    },
    { passive: true }
);


/* =========================================
   ENDING
   ========================================= */

function finishGame() {

    if (gameFinished) return;

    gameFinished = true;


    gameScreen.classList.remove(
        "active"
    );


    ending.classList.add(
        "active"
    );


    document.getElementById(
        "finalActions"
    ).textContent = actions;


    document.getElementById(
        "finalRules"
    ).textContent = rulesFound;


    document.getElementById(
        "finalDiscoveries"
    ).textContent = discoveries;


    let endingText;


    if (fastClicks >= 8) {

        endingText =
            "You kept pushing. The experiment noticed. Most people stop much earlier.";

    } else if (objectClicks >= 4) {

        endingText =
            "You explored instead of simply following instructions. That changed the experiment.";

    } else {

        endingText =
            "You discovered the rules by interacting with them. The interesting part is that there was never a correct way to play.";

    }


    document.getElementById(
        "endingText"
    ).textContent = endingText;


    flashScreen();

}


/* =========================================
   RESTART
   ========================================= */

restartButton.addEventListener(
    "click",
    () => {

        location.reload();

    }
);


/* =========================================
   NOTIFICATION
   ========================================= */

let notificationTimer;


function showNotification(text) {

    notification.textContent = text;

    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(() => {

            notification.classList.remove(
                "show"
            );

        }, 1800);

}


/* =========================================
   FLASH
   ========================================= */

function flashScreen() {

    flash.classList.remove(
        "active"
    );


    void flash.offsetWidth;


    flash.classList.add(
        "active"
    );

}


/* =========================================
   RANDOM
   ========================================= */

function random(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}
