# Drawing

How big the house is and how a unit looks. Where floor numbers, dividers, colours of reactions and marks go
is up to their [plugins](plugins.md).

## Geometry

Every unit is a square; the picture is as big as the house needs — there is no width or height to set. The
`<svg>` gets that size in pixels; to make it fit a column instead, give it CSS:
`svg.easy-house {max-width: 100%; height: auto}` — the proportions are kept.

| Key | Default | |
|---|---|---|
| `size` | `35` | the side of a square, px — or [one word](#sizes-in-one-word) |
| `gap` | `6` | between squares |
| `entranceGap` | `12` | between entrances of a section |
| `sectionGap` | `16` | between sections |
| `padding` | `1` | around the picture, so outlines are not cut |

These are keys of the house config. A duplex or a wide flat takes its cells and the gaps between them. Room for
floor numbers and other things beside a section is added by the plugins that need it.

<div id="demo-geometry" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-geometry', {units: 4, floors: 4, entrances: 2, size: 24, gap: 3, entranceGap: 20});
```

## Sizes in one word

`size: 'xs'` is a small house — a thumbnail for a list of documents: smaller squares and gaps, the squares
filled by their reactions in brighter colours, no outline, and nothing written — no numbers, no floor labels, no
percent and no legend (text a few pixels high would only be a smudge).

| Word | `size` | `gap` |
|---|---|---|
| `pixel` | 1 | 0 |
| `icon` | 2 | 0 |
| `xxs` | 3 | 0 |
| `xs` (`extraSmall`) | 4 | 1 |
| `s` (`small`) | 7 | 2 |
| `m` (`middle`) | 9 | 2 |
| `l` (`large`) | 11 | 3 |
| `xl` (`extraLarge`) | 14 | 3 |

The geometry and the colours of the word are defaults, the config may change them: `{size: 'xs', gap: 2}`,
`{size: 'xs', reactions: {fills: {yes: 'gold'}}}`. The text stays off whatever the config says. The config with the
word expanded is `house.effective`.

## How a unit looks

The square and its label are drawn by [`cells`](plugins/cells.md). How it looks — its **style** — is built
before it is drawn, in layers, each over the one before:

1. the options of `cells`: `fill`, `stroke`, `strokeWidth`, `color` (of the label), `font`, `fontSize`,
   `fontWeight`;
2. the `style` hooks of the other plugins, in the order of `plugins`: [`stacks`](plugins/stacks.md) — the fill
   by position, [`reactions`](plugins/reactions.md) — the outline, the label and the fill by the state;
3. a `render` that patches it: `base({style: {fill: 'gold'}})`.

Options go by the plugin's name and merge down the levels, so a section, a floor or a single flat may look
different:

<div id="demo-look" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-look', {
    units: 4,
    cells: {fill: '#eef3f8', color: '#456'},              // the whole house
    floors: {
        to: 5,
        1: {cells: {fill: '#fff3e0'}},                    // the ground floor
        5: {19: {cells: {fill: 'gold', fontWeight: 'bold'}}}      // one flat
    }
});
```

`cells: {numbers: false}` hides the labels; `title` of a unit becomes its tooltip.

## Text and marks

* Floor numbers, their marks and labels — [`floorLabels`](plugins/floor-labels.md).
* Lines between sections and entrances — [`dividers`](plugins/dividers.md).
* Marks in the corners of units — [`icon`](plugins/icon.md).
* Text anywhere in the picture — [`text`](plugins/text.md).
* A highlight under the pointer — [`hover`](plugins/hover.md).
* The colours of all of them, and themes — [Themes and colors](themes.md).
