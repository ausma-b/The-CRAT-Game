# The CRAT Game

A papercraft teaching game and readings quiz on **Cyber Routine Activity Theory (CRAT)**. Students walk one online scam from three sides: the offender (Act 1), the target (Act 2) and the guardians (Act 3). They then see their CRAT Map and move to tutor-led class discussion. A separate 30-item quiz covers the three required readings.

It is a static site: no build step, no server, no accounts, and nothing is stored in the browser. Refreshing the page starts again.

## Files

```
index.html        Page shell: fonts, libraries, then the three files below
src/styles.css    All styling (palette tokens at the top)
src/content.js    Everything you might want to reword: READINGS, GAME_SCRIPT, QUIZ_ITEMS
src/app.js        Game and quiz logic, plus the papercraft SVG art
```

## Editing the wording

All text lives in `src/content.js`:

- `READINGS`: the three readings (in-text citation, short title, full APA 7 reference).
- `GAME_SCRIPT`: the landing page, the content note, Acts 1–3, the CRAT Map support box and the discussion prompts.
  - Act 2 has one route per Act 1 opening line, under `act2.routes.A`, `B` and `C`.
  - Each route has its own title, intro, five decisions and near-miss and hooked endings. The Protected ending is shared.
- `QUIZ_ITEMS`: the 30 quiz questions. Each option is `[letter, text, explanation]` and `answer` is the correct letter.

Type plain straight quotes (`"` and `'`) in the content. The app turns them into curly quotes on screen.

## Running it locally

Open `index.html` in a browser. It needs an internet connection to load React, htm and the Google Fonts from their CDNs.

To serve it instead:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Deploying

Any static host works. Two common options:

- **GitHub Pages:** push the repo, then go to *Settings → Pages*. Set the source to the default branch and the root folder.
- **Vercel or Netlify:** import the repo with no build command and the output directory set to the repo root.

## Libraries

These load from CDNs in `index.html`, pinned to exact versions:

- React 18.3.1 and ReactDOM 18.3.1 (cdnjs)
- htm 3.1.1 (jsDelivr), which gives JSX-like templates without a build step
- Google Fonts: IM Fell Double Pica, Alegreya, Special Elite

## Accessibility

- Every choice is a keyboard-reachable button with a visible focus ring.
- Act 3 tokens can be dragged or placed with a tap.
- Quiz feedback uses an icon and a word as well as colour.
- `prefers-reduced-motion` turns off parallax, spinning gears and flying envelopes.

## References

- Clough, J. (2015). Cybercrime. In *Principles of cybercrime* (2nd ed., pp. 3–27). Cambridge University Press. https://doi.org/10.1017/CBO9781139540803.002
- Stalans, L. J., & Donner, C. M. (2018). Explaining why cybercrime occurs: Criminological and psychological theories. In H. Jahankhani (Ed.), *Cyber criminology* (pp. 25–45). Springer. https://doi.org/10.1007/978-3-319-97181-0_2
- Vakhitova, Z. (2024). Cyber routine activity theory. In H. Pontell (Ed.), *Oxford research encyclopedia of criminology and criminal justice*. Oxford University Press. https://doi.org/10.1093/acrefore/9780190264079.013.784
