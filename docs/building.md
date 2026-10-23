# Describing a house

## Levels

A house is made of **sections** — parts of their own height, side by side; a section has **entrances**; an
entrance has **floors**; a floor has **units** — flats, shops, a concierge. One section and one entrance are
implied, so a plain house is `{units, floors}`.

```js
{
    units: 4,                       // positions on a floor
    floors: 9,                      // or {from, to, <floor>: how it differs}
    sections: [{…}, {…}],           // or a number; a section may say anything a house says
    entrances: 2                    // or [{…}, {…}]
}
```

Any key may be written on the house, a section or an entrance; the lower one overrides the upper one, objects
merge at any depth. Not inherited are `sections`, `entrances`, a numbering `start` and a level's own `render`.

<div id="demo-levels" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-levels', {
    units: 4,
    floors: 5,
    sections: [
        {entrances: 2},
        {floors: 9, units: 3}       // taller, three flats on a floor
    ]
});
```

## Positions

An entrance is a grid: its floors are rows, its **positions** are columns, numbered from 1 at the left. A floor
has `units` positions; the widest floor sets the width of the entrance. A position is a place, not a flat: it
stays where it is when the numbers change.

* `22: 3` takes three positions from the aligned edge: positions 1–3, or 3–5 with `align: 'right'`.
* `'@4': {…}` writes position 4 of a floor — a hole, a kind, a span, an explicit number.
* A span takes the positions it covers and stands at the position where it is written.
* A **stack** is one position on every floor: [stacks](plugins/stacks.md), `hover: {aim: 'stack'}`.
* A unit knows its position: `unit.config.path.position`; in the drawing — `data-position`, `data-positions`.
* Positions go left to right, as drawn, whatever the direction of the numbering.

<div id="demo-positions" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-positions', {
    units: 5,
    floors: {
        to: 4,
        1: {'@2': null, '@5': {label: 'C'}},     // position 2 — a hole, position 5 — the concierge
        4: {units: 3, align: 'right'}            // positions 3–5 on the top floor
    },
    stacks: true                                 // a colour per position
});
```

## Floors

`floors` is a number or an object. `floors: 9` is `{from: 1, to: 9}`; in the object, a key that is a floor
number says how that floor differs. Objects of different levels merge: `floors: 9` on the house and
`floors: {9: 3}` on a section work together.

| Value of a floor | Means |
|---|---|
| `3` | three positions are taken, from the aligned edge |
| `{…}` | only what differs: `'@2'` — a position (structure), `54` — the flat numbered 54 (its data), anything else — a field of the floor |
| `[1, 2, 3, 'S', 'C']` | the whole row, by hand; the tail is empty |
| `null` | no units on this floor |

A floor object may carry its row in `units` with fields beside it: `{units: [1, 2, 3, 'S', 'C'], mark: 'done'}`.

| Field of a floor | |
|---|---|
| `units` | positions taken, or the whole row |
| `align` | `'left'` or `'right'`: the edge `units` count from |
| `label` | written instead of the floor number: `'P'` ([floorLabels](plugins/floor-labels.md)) |
| `mark` | a sign in front of the floor number: `'done'` |
| `start` | the numbering starts here from this number |
| `numberDirection` | `'ltr'` or `'rtl'` on this floor |
| `render` | the floor draws itself, see [below](#a-level-that-draws-itself) |

Floors below the first one are `-1`, `-2`…; there is no floor 0 unless it is written, so `-1` stands right under
`1`. With `groundFloor: 0` (most of Europe) the ground floor is `0`.

## Units

An item of a row, or the value of a position, is a **slot**:

| Slot | Means |
|---|---|
| `null` | a hole: no unit here |
| `57` | a flat numbered 57; the counter goes on from it |
| `'25/1'` | a number written as a string (it starts with a digit): one step of the counter |
| `'S'` | a label (no digit first): it takes no number |
| `{…}` | a unit described in full — the fields below |

| Field of a unit | |
|---|---|
| `label` | what is written on it: a number, a number as a string, a label; without it the unit gets the next number. A function is a `draw` |
| `draw` | `ctx => nodes` — drawn in the square instead of the label: a flag, a sign; see [cells](plugins/cells.md#draw) |
| `kind` | its [kind](#kinds): `'flat'` by default |
| `title` | its tooltip |
| `id` | its key for the state and the events; its number by default |
| `enumerable` | whether it takes a number when it has no `label`: flats do, `special` units do not |
| `colSpan`, `rowSpan` | how many positions and floors it takes, see [spans](#spans) |
| `merged` | a span of flats merged in a built house: the numbering does not move |
| `render` | a drawing of its own, see [cells](plugins/cells.md#render) |
| `cells`, `stacks`, `reactions`, … | options of a plugin for this unit, by the plugin's name: `{cells: {fill: 'gold'}}` |
| `hole`, `oldman`, `debt`, … | a field a plugin reads, by the plugin's name: `{hole: true}`, `{debt: 1200}` |

### Kinds

A **kind** is a preset of fields, like a CSS class: `{kind: 'salon'}` takes everything the kind says, and the
unit's own fields win. Every unit is a `flat` first, then its kind, then itself. `kinds` may be written on any
level.

<div id="demo-kinds" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-kinds', {
    units: 5,
    kinds: {
        salon: {label: 'S', title: 'Beauty salon', cells: {fill: 'mistyrose'}},
        concierge: {label: 'C', title: 'Concierge'}
    },
    floors: {to: 5, 1: {'@4': {kind: 'salon'}, '@5': {kind: 'concierge'}}}
});
```

Built in: `flat` — numbered; `special` — anything else that is drawn as a unit but not numbered: a shop, a
concierge, a technical room. A kind of your own is one line: `kinds: {shop: {enumerable: false}}`.

### Spans

A unit may take several cells, as in an HTML table; the sign is the direction: `colSpan: 2` — this position and
the next one, `-2` — and the previous one; `rowSpan: 2` — this floor and the one above (a duplex), `-2` — and the
one below.

A span is **designed** — a penthouse is one flat however many cells it takes, so the numbers after it move — or
**merged**: two flats of a built house became one, every cell keeps its number to itself, nothing moves
(`merged: true`). By number or by position — see [Numbering](numbering.md#by-position-or-by-number).

<div id="demo-spans" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-spans', {
    units: 4,
    kinds: {shop: {enumerable: false}},
    floors: {
        to: 6,
        1: {'@3': {colSpan: 2, kind: 'shop', label: 'Shop'}},  // a shop on two positions, not numbered
        3: {10: {colSpan: -2, merged: true}},       // 9 and 10 merged: the flat keeps 10, 9 is gone
        4: {'@2': {rowSpan: 2}},                    // a duplex up
        6: {'@4': {rowSpan: -2}}                    // a duplex written on its upper floor
    }
});
```

## Different heights, arches, slopes

A section may start higher — an arch under it — or stand higher or lower as a whole: `base`, a slope. Floor
numbers are written where a floor first appears.

<div id="demo-shapes" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-shapes', {
    units: 3,
    sections: [
        {floors: 6},
        {floors: {from: 3, to: 6}},                 // an arch under the 1st and 2nd floors
        {floors: 6, base: 1},                       // a slope: one row higher
        {floors: {from: -1, to: 7}, base: 1}        // and a floor below the ground
    ]
});
```

## A level that draws itself

`render` of a section, an entrance or a floor replaces the drawing of that place. It gets the same context as
plugins and `base()` — the usual drawing, to wrap it instead. A parking floor with spots of its own:

<div id="demo-parking" class="demo"></div>

```js live
import {House} from 'easy-house';

const parking = ({floor}) => {
    const {x, y, width, height} = floor.box;
    const spots = 6, gap = 2, w = (width - gap * (spots - 1)) / spots;
    return Array.from({length: spots}, (_, i) => ({tag: 'rect', opt: {x: x + i * (w + gap), y, width: w, height, fill: '#e8eef5'}}));
};

new House('#demo-parking', {units: 3, floors: {from: -1, to: 4, '-1': {units: 0, render: parking, label: 'P'}}});
```

## Right to left

`direction: 'rtl'` puts sections and entrances right to left, and the numbers on a floor too. `numberDirection`
turns only the numbers; on every other floor it makes a snake.

<div id="demo-rtl" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-rtl', {
    units: 3,
    entrances: 2,
    direction: 'rtl',
    floors: {to: 4, 2: {numberDirection: 'ltr'}, 4: {numberDirection: 'ltr'}}     // a snake
});
```
