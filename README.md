# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Bruskots/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Bruskots/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is shown with its official name, description and grade as PlayStation publishes them, plus a guide written in our own words that cites its sources — what to do, where and how, and when it can be missed. It includes a three-step roadmap to the platinum (about 200 hours, one playthrough), a flag on the one possibly missable trophy, and a checklist that saves your progress in the browser, with filters by kind and grade, a spoiler setting that hides story trophies until you earn them, and export/import of your progress. Static files only: it runs with the network off.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser. No build step, no install, no account.

## How it is built

- `app/index.html` — the page: progress bar, filters, roadmap, missable list, trophy grid, guide detail.
- `app/app.js` — the tracker: loads the trophy data, renders the grid, saves earned trophies and settings in localStorage, exports/imports progress, opens a trophy's guide.
- `app/style.css` — the look: an original dark neon style, no Rockstar logo or game art.
- `app/data/trophies.json` — the official 55 trophies (names, descriptions, grades) with a cited guide, kind, missable flag and roadmap stage each.
- `app/data/roadmap.json` — the three-step roadmap to the platinum and the sources list.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library.
- `screenshots/` — four real renders of the app in a headless browser; the first is the cover.

## Screenshots

1. `1-cover.jpg` — the checklist: official names, descriptions and grades, guides with their sources, earned trophies marked.
2. `2-roadmap.jpg` — the three-step roadmap to the platinum and the cheat/profile warnings.
3. `3-spoilers.jpg` — the spoiler setting at work: story trophies hidden until earned.
4. `4-guide.jpg` — a trophy guide open with its sources: the gold for 100% completion.

## Sources

Trophy names, descriptions and grades: the official PlayStation list as published by Exophase and PSNProfiles (18 Nov 2026). Guides: PowerPyx's GTA 6 Trophy Guide & Roadmap, with GTABase as a second source for the missable-trophy warning. Where no source has yet documented a method, the guide says so honestly instead of inventing a step.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tjz0qq4m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
