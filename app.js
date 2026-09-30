document.addEventListener("DOMContentLoaded", function () {

    console.log("THE RULES : JavaScript loaded");


    /* ================================= */
    /* ÉLÉMENTS */
    /* ================================= */

    const intro =
        document.getElementById("intro");

    const game =
        document.getElementById("game");

    const end =
        document.getElementById("end");

    const begin =
        document.getElementById("begin");

    const again =
        document.getElementById("again");

    const actionButton =
        document.getElementById("actionButton");

    const ruleNumber =
        document.getElementById("ruleNumber");

    const rule =
        document.getElementById("rule");

    const arena =
        document.getElementById("arena");

    const message =
        document.getElementById("message");


    /* ================================= */
    /* VARIABLES */
    /* ================================= */

    let actions = 0;

    let discoveries = 0;

    let ruleCount = 1;

    let buttonClicks = 0;

    let objectClicks = 0;

    let fastClicks = 0;

    let lastClick = 0;

    let finished = false;


    /* ================================= */
    /* SESSION */
    /* ================================= */

    let session =
        Number(
            localStorage.getItem(
                "theRulesSession"
            ) || 0
        );

    session++;

    localStorage.setItem(
        "theRulesSession",
        session
    );

    document.getElementById(
        "session"
    ).textContent =
        String(session).padStart(3, "0");


    /* ================================= */
    /* CHANGER D'ÉCRAN */
    /* ================================= */

    function showScreen(screen) {

        intro.classList.remove("active");

        game.classList.remove("active");

        end.classList.remove("active");

        screen.classList.add("active");
    }


    /* ================================= */
    /* BEGIN */
    /* ================================= */

    begin.addEventListener(
        "click",
        function () {

            console.log("BEGIN clicked");

            showScreen(game);

            setRule(
                1,
                "There are no rules."
            );

            notify(
                "THE EXPERIMENT HAS BEGUN."
            );

        }
    );


    /* ================================= */
    /* BOUTON */
    /* ================================= */

    actionButton.addEventListener(
        "click",
        function () {

            if (finished) {
                return;
            }

            actions++;

            buttonClicks++;

            updateStats();

            detectSpeed();

            buttonReaction();

            checkProgress();

        }
    );


    /* ================================= */
    /* RÉACTION DU BOUTON */
    /* ================================= */

    function buttonReaction() {

        const texts = [

            "DO SOMETHING",

            "INTERESTING.",

            "AGAIN?",

            "I SAW THAT.",

            "NOTED.",

            "WHY?",

            "KEEP GOING.",

            "REALLY?",

            "OKAY.",

            "YOU'RE STILL HERE."

        ];


        const index =
            Math.min(
                buttonClicks,
                texts.length - 1
            );


        actionButton.textContent =
            texts[index];


        /* PREMIÈRE DÉCOUVERTE */

        if (
            buttonClicks === 2
        ) {

            discoveries++;

            setRule(
                2,
                "You are allowed to press the button."
            );

            notify(
                "DISCOVERY +1"
            );
        }


        /* APPARITION DES OBJETS */

        if (
            buttonClicks === 4
        ) {

            discoveries++;

            setRule(
                3,
                "Not everything here is a button."
            );

            createObjects(4);
        }


        /* ENCORE PLUS D'OBJETS */

        if (
            buttonClicks === 7
        ) {

            discoveries++;

            setRule(
                4,
                "Something is hiding here."
            );

            createObjects(5);
        }

    }


    /* ================================= */
    /* VITESSE */
    /* ================================= */

    function detectSpeed() {

        const now =
            Date.now();


        if (
            lastClick !== 0 &&
            now - lastClick < 700
        ) {

            fastClicks++;

        }


        lastClick = now;
    }


    /* ================================= */
    /* CRÉER DES OBJETS */
    /* ================================= */

    function createObjects(amount) {

        for (
            let i = 0;
            i < amount;
            i++
        ) {

            const object =
                document.createElement("div");


            object.className =
                "object";


            object.style.left =
                random(5, 95) + "%";


            object.style.top =
                random(5, 90) + "%";


            object.addEventListener(
                "click",
                function () {

                    if (
                        object.dataset.clicked
                    ) {
                        return;
                    }


                    object.dataset.clicked =
                        "true";


                    object.style.opacity =
                        "0";


                    object.style.transform =
                        "scale(.2)";


                    objectClicks++;

                    discoveries++;

                    actions++;

                    updateStats();


                    notify(
                        "YOU FOUND SOMETHING."
                    );


                    if (
                        objectClicks === 1
                    ) {

                        setRule(
                            5,
                            "You found something."
                        );

                    }


                    if (
                        objectClicks === 2
                    ) {

                        setRule(
                            6,
                            "There are more."
                        );

                    }


                    if (
                        objectClicks === 3
                    ) {

                        setRule(
                            7,
                            "You were never told to find them."
                        );

                        createRedObject();

                    }


                    setTimeout(
                        function () {

                            object.remove();

                        },
                        250
                    );

                }
            );


            arena.appendChild(
                object
            );

        }

    }


    /* ================================= */
    /* OBJET ROUGE */
    /* ================================= */

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
            function () {

                discoveries++;

                actions++;

                updateStats();


                setRule(
                    8,
                    "You weren't supposed to touch that."
                );


                notify(
                    "THAT WAS A MISTAKE."
                );


                object.remove();

            }
        );


        arena.appendChild(
            object
        );

    }


    /* ================================= */
    /* PROGRESSION */
    /* ================================= */

    function checkProgress() {


        if (
            fastClicks >= 4 &&
            ruleCount < 9
        ) {

            setRule(
                9,
                "You click faster when you're uncertain."
            );

            notify(
                "THE SITE NOTICED."
            );

        }


        if (
            actions >= 12 &&
            ruleCount < 10
        ) {

            setRule(
                10,
                "There is something you haven't found."
            );

            createObjects(5);

        }


        if (
            discoveries >= 8 &&
            actions >= 18
        ) {

            finish();

        }

    }


    /* ================================= */
    /* RÈGLE */
    /* ================================= */

    function setRule(
        number,
        text
    ) {

        ruleCount =
            Math.max(
                ruleCount,
                number
            );


        ruleNumber.textContent =
            "RULE #" +
            String(number).padStart(
                2,
                "0"
            );


        rule.textContent =
            text;


        document.getElementById(
            "rules"
        ).textContent =
            ruleCount;

    }


    /* ================================= */
    /* STATS */
    /* ================================= */

    function updateStats() {

        document.getElementById(
            "actions"
        ).textContent =
            actions;


        document.getElementById(
            "discoveries"
        ).textContent =
            discoveries;


        document.getElementById(
            "rules"
        ).textContent =
            ruleCount;

    }


    /* ================================= */
    /* FIN */
    /* ================================= */

    function finish() {

        if (finished) {
            return;
        }


        finished = true;


        document.getElementById(
            "finalActions"
        ).textContent =
            actions;


        document.getElementById(
            "finalDiscoveries"
        ).textContent =
            discoveries;


        document.getElementById(
            "finalRules"
        ).textContent =
            ruleCount;


        let text =
            "You interacted with the experiment long enough for it to start reacting to you.";


        if (
            fastClicks >= 5
        ) {

            text =
                "You kept clicking faster and faster. The experiment noticed your behavior.";

        }
        else if (
            objectClicks >= 3
        ) {

            text =
                "You explored instead of simply following the obvious path.";

        }


        document.getElementById(
            "endText"
        ).textContent =
            text;


        showScreen(end);

    }


    /* ================================= */
    /* AGAIN */
    /* ================================= */

    again.addEventListener(
        "click",
        function () {

            location.reload();

        }
    );


    /* ================================= */
    /* MESSAGE */
    /* ================================= */

    let messageTimer;


    function notify(text) {

        message.textContent =
            text;


        message.classList.add(
            "visible"
        );


        clearTimeout(
            messageTimer
        );


        messageTimer =
            setTimeout(
                function () {

                    message.classList.remove(
                        "visible"
                    );

                },
                1600
            );

    }


    /* ================================= */
    /* RANDOM */
    /* ================================= */

    function random(
        min,
        max
    ) {

        return Math.floor(
            Math.random() *
            (max - min + 1)
        ) + min;

    }


    console.log(
        "THE RULES : READY"
    );

});
