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
   `special` units are not.

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

In a floor object, `'@2'` is a **position** and `54` is a **flat number**:

* **`'@2': …` — structure, before the numbering.** A hole, a kind, a span, an explicit number: the numbers
  after it move.
* **`54: {…}` — the flat numbered 54, as you see it, after the numbering.** Its data: `title`, `render`,
  fields of plugins. A `label`, a `kind` or an `id` would change its own number, so they go by position.

```js
12: {
    '@1': null,                 // position 1: no flat here — the numbers move
    54: {title: 'Office'},      // the flat 54: its data
    mark: 'done'                // anything else is a field of the floor
}
```

* **`10: null`** — a hole where 10 was: there is nothing there, 10 is not used, no other number moves.
* **A span by number** — `19: {rowSpan: 2}` is the span at the position of 19. A designed span may go only
  forward in the numbering (up, and along the floor), so the numbers before it and its own stay. Several of
  them are put in one at a time, so the number of the next one is the number you see.
* **`merged: true`** — flats merged in a built house keep the numbering, so such a span goes any way:
  `20: {colSpan: -2, merged: true}` — the flat keeps 20, 19 is gone.

<div id="demo-bynumber" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-bynumber', {
    units: 4,
    floors: {
        to: 7,
        3: {10: null},                          // a hole: 10 is not used
        5: {19: {rowSpan: 2}},                  // a duplex 19, by its number
        6: {21: {rowSpan: 2}}                   // and another one — 21 as it is after the first
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

Where the numbering starts again, the number alone is not a key, and the key grows by what tells the flats apart:

| Numbered | Key |
|---|---|
| through the house | `'5'` |
| each section from 1 — two houses in one building, 7 and 7a | `'2-5'`: section-flat |
| each entrance from 1, in several sections | `'2-1-5'`: section-entrance-flat |
| each entrance from 1, one section | `'2-5'`: entrance-flat |

A level that has one value in the house tells nothing apart and is left out. All the numbers of a house have keys
of one shape. Labels without a number (`'C'`) are keyed apart from the numbers, by the same rule: a concierge in
every section is `'1-C'`, `'2-C'`, and the flats keep their numbers. The same number twice on one floor is a
mistake: easy-house warns. A patch by number on a floor (`5: {…}`) uses the number as it is written there.

<div id="demo-keys" class="demo"></div>

```js live
import {House} from 'easy-house';

const house = new House('#demo-keys', {
    units: 2,
    floors: 3,
    sections: [{entrances: 2}, {entrances: 2, start: 1}]       // 7 and 7a: each from 1
}, {'1-5': {reaction: 'yes'}, '2-5': {reaction: 'no'}});

console.log(house.unit('2-5').unit.config.label);              // 5
```
