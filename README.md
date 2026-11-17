# Lady Briefington — Briefsville

A first playable front-end prototype for Lady Briefington's surreal life-simulation world.

## What works in this prototype
- Responsive Briefsville hub with five clickable locations.
- Character status indicators (energy, mood, confidence, hygiene, money).
- Player-triggered activities and short narrative reactions.
- Town-gossip event feed.
- Save state in the browser using localStorage.

## Important limitations
This is a front-end prototype, not yet an autonomous AI agent. The character does not run in the background, publish to Instagram, or make independent decisions while the site is closed. The current save is local to the browser/device.

## Preview with GitHub Pages
1. Open the repository Settings.
2. Open Pages.
3. Under Build and deployment, choose Deploy from a branch.
4. Select the `main` branch and `/(root)`, then Save.
5. GitHub will show the published URL when deployment is ready.

## Next development milestones
1. Replace the temporary CSS character with approved, consistent character artwork.
2. Build the world as a richer explorable scene.
3. Add journal, inventory, artwork and shop screens.
4. Add a secure backend for persistent world state and autonomous AI decisions.
5. Add a human approval workflow and connect Instagram scheduling through Metricool.

Never put API keys or Instagram credentials in this repository's front-end code.
