# Numbering

## The rules

1. **Continuous.** Section by section, entrance by entrance, floors bottom up, positions in the direction
   of the floor (left to right unless [`numberDirection`](#direction) says otherwise).
2. **`start`** on the house, a section, an entrance or a floor starts that part from its number.
3. **An explicit number** anywhere moves the counter there: the numbers go on from it.
4. **A string that starts with a digit** — `'25/1'`, `'5a'` — is a number written as a string: it is shown
   as it is and takes one step of the counter. With `numericStrings: true` the counter goes to its digits.
5. **Any other string** — `'S'`, `'C'` — is a label: it takes no number.
6. **A unit without a label** gets the next number if it is `enumerable` — flats and kinds of your own are,
   `special` and `empty` units are not.

<div id="demo-rules" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-rules', {
    units: 5,
    floors: 4,
    kinds: {shop: {enumerable: false}},      // a kind of our own: not numbered
    sections: [
        {floors: {1: ['S', 1, 2]}},                                 // a label, then 1, 2
        {floors: {1: [null, 20, 21, {colSpan: 2, kind: 'shop'}]}}   // a hole; 20 moves the counter; a shop takes none
    ]
});
```

<div id="demo-strings" class="demo"></div>

```js live
import {House} from 'easy-house';

// '25/1' and '25/2' take one step each, so the next number is 27; with numericStrings: true it is 26
new House('#demo-strings', {units: 4, floors: {to: 2, 1: [23, 24, '25/1', '25/2']}});
```

## By position or by number

In a floor object, `'@2'` is a **position** and `54` is a **flat number**. By position you design the house, and
the numbers flow; by number you describe the house as it is built, and the numbers stay:

* **`'@2': …` — structure, before the numbering.** A hole, a kind, a span, an explicit number: the numbers
  after it move.
* **`54: {…}` — the flat numbered 54, as you see it, after the numbering.** Its data — `title`, `render`, fields
  of plugins — and anything else too, but no number moves: the flat's own number stays on it or goes unused.

```js
12: {
    '@1': null,                 // position 1: no flat here — the numbers move
    54: {title: 'Office'},      // the flat 54: its data
    mark: 'done'                // anything else is a field of the floor
}
```

| | the numbers move — by position | the numbers stay — by number |
|---|---|---|
| nothing there | `'@3': null` | `10: null` — 10 is not used |
| a blank square | `'@3': {kind: 'empty'}` | `10: {kind: 'empty'}` — 10 is not used |
| a label | `'@3': {label: 'S'}` | `10: {label: 'S'}` — 10 is not used |
| a special unit | `'@3': {kind: 'special'}` — no number | `10: {kind: 'special'}` — keeps 10, is not a flat |
| a span | `'@3': {rowSpan: 2}` — one number for both floors, the numbers after it move | `10: {rowSpan: 2}` — merged: the number above is gone |

* **A span by number** is one of a built house: every cell it takes keeps its number to itself, as merged flats
  do, so it goes any way — `20: {colSpan: -2}`: the flat keeps 20, 19 is gone. A designed span, a penthouse
  with one number however many cells it takes, is written by position. `merged: true` by position is the same
  span of a built house written there.
* **Several by number** are put in one at a time; as no number moves, each one is the number you see.

<div id="demo-bynumber" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-bynumber', {
    units: 4,
    floors: {
        to: 7,
        3: {10: null, 11: {kind: 'empty'}},     // nothing where 10 was, a blank square where 11 was
        5: {19: {rowSpan: 2}},                  // 19 took the flat above it: 23 is gone
        6: {'@2': {rowSpan: 2}}                 // a designed duplex: one number, the numbers after it move
    }
});
```

## Direction

`numberDirection: 'rtl'` numbers a floor right to left; by default it follows `direction`. It cascades down
to a floor, so a snake is a `numberDirection` on every other floor. Positions and rows stay as drawn.

## Ids

Every unit has an `id` — the key of its state, of its events, of `house.unit(id)`. It is its number by
default; a unit without a number has its explicit `id`, or its place: `'1.1.1.4'` (section, entrance, floor,
position).

Where the numbering starts again, the number alone is not a key, and the key grows by what tells the flats apart —
each level with its letter: `s` a section, `e` an entrance, `f` a floor:

| Numbered | Key |
|---|---|
| through the house | `'5'` |
| each section from 1 — two houses in one building, 7 and 7a | `'s2-5'` |
| each entrance from 1, in several sections | `'s2-e1-5'` |
| each entrance from 1, one section | `'e2-5'` |
| back on one entrance: a floor with `-1` | `'f3--1'` |

A level that has one value in the house tells nothing apart and is left out. All the numbers of a house have keys
of one shape. Labels without a number (`'C'`) are keyed apart from the numbers, by the same rule: a concierge in
every section is `'s1-C'`, `'s2-C'`, and the flats keep their numbers. The same number twice on one floor is a
mistake: easy-house warns. A patch by number on a floor (`5: {…}`) uses the number as it is written there.

That is `keys: 'auto'`, the default: one repeated number — a mistake, or a flat numbered by hand — changes the keys
of the whole house. When the data comes from elsewhere, write the shape in the config, and the keys stay as they are:

| `keys` | Key |
|---|---|
| `'auto'` | the number, or with what tells it apart |
| `'number'` | the number, always; a repeated one is a warning |
| `'section'` | `'s2-5'`, always |
| `'entrance'` | `'s1-e2-5'`, always — even in a house of one section |
| `'floor'` | `'s1-e2-f3-5'`, always |

<div id="demo-keys" class="demo"></div>

```js live
import {House} from 'easy-house';

const house = new House('#demo-keys', {
    units: 2,
    floors: 3,
    sections: [{entrances: 2}, {entrances: 2, start: 1}]       // 7 and 7a: each from 1
}, {'s1-5': {reaction: 'yes'}, 's2-5': {reaction: 'no'}});

console.log(house.unit('s2-5').unit.config.label);             // 5
```
