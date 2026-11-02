# Archery Score Equalify (ase)

Calculates target face sizes so archers of different levels shoot about the same score.
The lowest scorer shoots the official 40 cm face, everyone else gets a smaller one, and the
faces can be saved as a PDF to print at real size.

Built with [Quasar](https://quasar.dev) (Vue 3, TypeScript), in English and Hungarian.
The previous jQuery/Bulma version is kept in [`legacy/`](legacy/).

## Development

```bash
npm install
npm run dev        # http://localhost:9000
npm run typecheck
npm run lint
```

## Build

```bash
npm run build      # output: dist/spa
```

The build uses relative paths, so `dist/spa` can be served from any folder.

## Deploy

```bash
npm run deploy -- --dry-run   # build and show what would change on the server
npm run deploy                # build, show the changes, ask, then copy
```

`scripts/deploy.sh` builds the app, adds `legacy/` (served under `/ase/legacy/`), and
copies it with rsync to `pi@rebegin.ddns.net:/var/www/ase` (SSH port 48627). The folder belongs
to root, so rsync runs with `sudo` there. Files not in the build are deleted, except a `.git`
folder. Set `DEPLOY_HOST`, `DEPLOY_PORT` or `DEPLOY_PATH` to deploy elsewhere.

## How it works

`src/simulation/equalify.ts` holds the model, ported from the legacy page:

- Arrows land uniformly inside a circle (the archer's grouping radius); a round is 30 arrows.
- An archer's grouping radius is the average radius at which simulated rounds on the 40 cm
  face score within ±5 of their score.
- A higher scorer's face radius is the average face size on which their grouping scores
  within ±5 of the lowest archer's score.

Scores from 125 to 300 can be calculated; even arrows spread over the whole 40 cm face
average about 115 points.

## Structure

- `src/simulation/` – simulation and target face rings, no UI code
- `src/stores/archers.ts` – archer list and results (Pinia)
- `src/services/archerRepository.ts` – where archers are saved; local storage now, meant to
  be replaced by a server-backed one when user accounts are added
- `src/services/pdf.ts` – PDF with vector target faces at real size (jsPDF, Roboto embedded
  for Hungarian letters)
- `src/components/` – archer card, +/- number input, target face, charts, paginated panels
- `src/i18n/` – English and Hungarian texts
