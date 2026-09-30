let coins = 0;
let heading = 0;
let day = 1;

const messages = [
    "La mer est calme... mais quelque chose approche.",
    "Un navire a été aperçu à l'horizon.",
    "Une île inconnue apparaît sur la carte.",
    "Le vent vient de changer.",
    "Tu entends quelque chose sous l'eau.",
    "Un vieux marin affirme avoir vu un trésor ici.",
    "La brume se lève. Il vaut mieux continuer.",
    "Quelqu'un t'observe depuis la côte."
];

const ship = document.getElementById("ship");
const compass = document.getElementById("compass");
const headingText = document.getElementById("heading");
const message = document.getElementById("message");
const coordinates = document.getElementById("coordinates");
const coinsText = document.getElementById("coins");
const dayText = document.getElementById("day");
const missionText = document.getElementById("mission");
const discover = document.getElementById("discover");


function randomNumber(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function explore() {

    /*
     * Nouvelle direction
     */

    heading = randomNumber(0, 359);

    headingText.textContent =
        String(heading).padStart(3, "0") + "°";


    /*
     * Faire tourner l'aiguille
     */

    const needle =
        document.querySelector(".needle");

    needle.style.transform =
        `translate(-50%, -50%) rotate(${heading}deg)`;


    /*
     * Déplacer le bateau
     */

    const x = randomNumber(15, 78);
    const y = randomNumber(20, 75);

    ship.style.left = x + "%";
    ship.style.top = y + "%";

    ship.style.transform =
        `rotate(${randomNumber(-12, 12)}deg)`;


    /*
     * Nouvelles coordonnées
     */

    const coordX =
        randomNumber(10, 99);

    const coordY =
        randomNumber(10, 99);

    coordinates.textContent =
        `X ${String(coordX).padStart(3, "0")} · Y ${String(coordY).padStart(3, "0")}`;


    /*
     * Message aléatoire
     */

    const randomMessage =
        messages[
            randomNumber(0, messages.length - 1)
        ];

    message.textContent =
        randomMessage;


    /*
     * Récompense occasionnelle
     */

    if (Math.random() < 0.35) {

        const found =
            randomNumber(1, 7);

        coins += found;

        coinsText.textContent =
            coins;

        message.textContent +=
            ` Tu trouves ${found} pièce${found > 1 ? "s" : ""} d'or.`;
    }


    /*
     * Faire avancer le jour
     */

    if (Math.random() < 0.25) {

        day++;

        dayText.textContent =
            String(day).padStart(2, "0");
    }


    /*
     * Mission
     */

    if (coins >= 20) {

        missionText.textContent =
            "TRÉSOR";

    } else if (coins >= 10) {

        missionText.textContent =
            "EN COURS";

    }

}


/*
 * Bouton
 */

discover.addEventListener(
    "click",
    explore
);


/*
 * Première exploration automatique
 */

setTimeout(() => {

    explore();

}, 800);
