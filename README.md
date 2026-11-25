# Who Gifts Who

A gift-exchange name draw for parties, played together on one big screen. [Open the app](https://puwanarty.github.io/who-gifts-who/)

![The reveal screen: the gift box lid has flown off and the name of the person to buy for is shown above the box](docs/screenshot.png)

Open it on a laptop hooked up to a TV. Each guest walks up, taps their own name, and opens a gift box to see who they buy a present for, while the whole room watches. People who came as a couple never draw their partner. The interface is in Thai.

## Features

- **Fair draw:** every valid result is equally likely, and if couples make a draw impossible, the app says so before the party.
- **Gift-box reveal** with a drumroll, a flying lid, and confetti.
- **Scales from a phone to a 4K TV.**
- **Safe to refresh, works offline:** results are fixed when the draw starts and kept in the browser.
- **No server, no account:** names never leave the device.

## Usage

1. Add everyone with **+ เพิ่มคน** (add person), pick each couple under **คู่กับ** (partner), then press **เริ่มจับฉลาก** (start the draw).
2. Each guest taps their name and presses **กดลุ้น** (reveal). **คนต่อไป** (next) returns to the list. Space or Enter also works, so a presentation clicker can run the show.
3. After the last reveal, a summary lists every pair.

Everything is stored in the browser, so use the same one from setup to the end, in a single tab. The top corners hold sound, fullscreen, and **เริ่มใหม่** (start over, keeps the names).

## Development

Vite, React, TypeScript, and Motion, on Node.js 22.

```sh
npm install
npm run dev     # dev server
npm test        # tests; also npm run typecheck and npm run lint
npm run build   # build into dist/
```

Pushes to `main` deploy to GitHub Pages through [the deploy workflow](.github/workflows/deploy.yml). For a fork, set `base` in `vite.config.ts` to your repository name, update the URLs in the `og:` tags in `index.html`, and set **Settings → Pages → Source** to **GitHub Actions**.
