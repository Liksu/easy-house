# Plugins

Everything that is drawn is a plugin, the square of a flat too. A house uses `House.plugins` unless its config
has `plugins` of its own.

| Plugin | On | Draws |
|---|---|---|
| [cells](plugins/cells.md) | ✓ | the square of a unit, its label, its tooltip |
| [stacks](plugins/stacks.md) | `stacks: true` | flats one above another in one colour |
| [walls](plugins/walls.md) | `walls: true` | the body of a section behind its units |
| [floorLabels](plugins/floor-labels.md) | ✓ | floor numbers, their labels and marks |
| [dividers](plugins/dividers.md) | ✓ | hairlines between sections and entrances |
| [reactions](plugins/reactions.md) | ✓ | colours by the state; the percent and the legend |
| [text](plugins/text.md) | `text: {…}` | text blocks |
| [roof](plugins/roof.md) | `roof: true` | a thin strip over every entrance |
| [hover](plugins/hover.md) | `hover: true` | a highlight under the pointer, an aim along the floor or the stack |
| [icon](plugins/icon.md) | add to `plugins` | marks in the corners of units |
| [hole](plugins/hole.md) | add to `plugins` | a flat that is there, with a hole in the house in its place |

`House.plugins` is `[cells, stacks, walls, floorLabels, dividers, reactions, text, roof, hover]`; their order is
the order of layers. Their colours are names of the [palette](themes.md): a theme changes them all.

## Options

The options of a plugin are a key with its name. Written on the house, a section, an entrance, a floor or a
unit, they merge down the way:

```js
{
    cells: {fill: '#eef3f8'},                   // every unit
    floors: {
        to: 9,
        1: {cells: {fill: '#fff3e0'}},          // the ground floor
        5: {19: {cells: {fill: 'gold'}}}        // the flat 19
    }
}
```

A value that is not an object — `true`, a string, a number — leaves the options as they are: it is for the
plugin to read as a field (`21: {oldman: true}`, `34: {debt: 1200}`).

## Switching off and on

`null` or `false` switches a plugin off where it is written — with the room it takes:

```js
{
    floorLabels: null,                  // no floor numbers in the house
    sections: [{}, {stacks: null}],     // no stacks on the second section
    floors: {1: {cells: {numbers: false}}}      // only the labels off, on the ground floor
}
```

Plugins that are off until named are switched on by their name: `stacks: true`, `hover: {aim: 'both'}`,
`text: {…}`.

## A list of your own

`plugins` replaces the defaults — to add to them, spread them:

```js
import {House, icon, hole} from 'easy-house';

const config = {plugins: [...House.plugins, hole, {use: icon, name: 'oldman', options: {icon: '👴🏻'}}]};
```

A list without `cells` has no squares: only what you list is drawn.

## One plugin under several names

`{use: plugin, name, options}` runs a plugin once more, under its own name and with its own options. The name
is the key of everything: its options (`oldman: {…}`), its switch (`oldman: null`), its field on a unit
(`21: {oldman: true}`). See [icon](plugins/icon.md) and [reactions](plugins/reactions.md).

To write one of your own — [Writing a plugin](writing-plugins.md).
