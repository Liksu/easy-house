# Themes and colors

## The palette

Every colour the built-in plugins use has a name. The defaults of the plugins do not say `'whitesmoke'` but
`'$unit'` — "the colour of a unit in this house's palette". Change the palette, and every plugin that uses that colour
follows:

```js
{colors: {unit: 'ivory', label: '#556'}}
```

Use a colour of the palette anywhere an option takes a colour — `'$name'`:

```js
{cells: {stroke: '$yes'}, floors: {5: {cells: {fill: '$yesFill'}}}}
```

In a plugin of your own the palette is `house.colors`: `{fill: house.colors.highlight}`.

| Name | Default | Used for |
|---|---|---|
| `background` | `null` | the background of the picture; `null` — transparent |
| `unit` | `whitesmoke` | the square of a unit |
| `label` | `gray` | what is written on it |
| `wall` | `#e9ecef` | the body of a section ([walls](plugins/walls.md)) and its [roof](plugins/roof.md) |
| `floorLabel` | `#555` | floor numbers |
| `sectionLine`, `entranceLine` | `#999`, `#ccc` | the lines between sections and entrances |
| `text` | `#333` | text blocks, the percent, the legend |
| `yes`, `no`, `maybe`, `ignore`, `none` | `green`, `red`, `orange`, `gray`, `gray` | reactions: the outline and the label |
| `yesFill`, `noFill`, `maybeFill`, `ignoreFill`, `noneFill` | `lightgreen`, `pink`, `lightyellow`, `gainsboro`, `gainsboro` | reactions: the fill |
| `yesBright`, `noBright`, `maybeBright` | `mediumseagreen`, `salmon`, `orange` | reactions on a [small house](drawing.md#sizes-in-one-word) |
| `glow` | `null` | a light around a unit with a reaction |
| `stacks` | five pastel colours | [stacks](plugins/stacks.md), by position |
| `highlight`, `aim` | `#1e88e5`, `#e3f2fd` | [hover](plugins/hover.md): the outline, the floor and the stack |
| `hole`, `holeLine` | `#fff5f5`, `#c66` | [hole](plugins/hole.md) |

`background` is a key of the house too: `{background: '$unit'}` or any colour.

## Themes

A theme is a config of its own put under yours: a palette first of all, and the options a look needs besides
colours. What your config says itself wins: `{theme: 'dark', colors: {unit: '#333'}}`.

| Theme | |
|---|---|
| `light` | the default |
| `dark` | the same house, readable on a dark page |
| `night` | the house at night: dark walls and windows; the windows of the flats that said yes are lit with a warm light, those that said maybe are dim |

<div id="demo-themes" class="demo-row"></div>

```js live
import {House} from 'easy-house';

const state = {1: {reaction: 'yes'}, 2: {reaction: 'no'}, 6: {reaction: 'maybe'}, 7: {reaction: 'yes'}, 11: {reaction: 'yes'}};
for (const theme of ['light', 'dark', 'night']) {
    const figure = document.querySelector('#demo-themes').appendChild(document.createElement('figure'));
    new House(figure.appendChild(document.createElement('div')), {units: 4, floors: 4, theme, stacks: theme === 'dark'}, state);
    figure.appendChild(document.createElement('figcaption')).textContent = theme;
}
```

### Night

At night a flat is a window: the [walls](plugins/walls.md) give the house its body, the windows are dark, and a
reaction lights one — `yes` brightly, with a glow, `maybe` dimly. Click a window to light it or to turn the light off:

<div id="demo-night" class="demo"></div>

```js live
import {House} from 'easy-house';

const lit = {3: {reaction: 'yes'}, 6: {reaction: 'yes'}, 9: {reaction: 'maybe'}, 14: {reaction: 'yes'}, 15: {reaction: 'yes'}, 22: {reaction: 'yes'}};
const house = new House('#demo-night', {units: 4, sections: [{floors: 6}, {floors: 7, entrances: 2}], theme: 'night'}, lit);

house.on('unit:click', ({unit}) => {
    house.update({[unit.config.id]: unit.state.reaction === 'yes' ? null : {reaction: 'yes'}});
});
```

The night look is the palette (`yesFill` — a warm light, `glow` — its halo, `unit` — a dark window) and three options:
`walls: true`, and for reactions `fill: true`, no outline, `styles: {yes: {glow: '$glow'}}`. Any of them can be
changed — `colors: {yesFill: '#9fd3ff', glow: 'rgba(120, 190, 255, 0.5)'}` turns the light cold.

## A theme of your own

A theme may be an object — the same as a config:

```js
const sepia = {
    colors: {background: '#f4ecd8', unit: '#e6d5b0', label: '#7a5c3a', floorLabel: '#7a5c3a', wall: '#d9c49b'},
    walls: true
};

new House('#house', {units: 4, floors: 9, theme: sepia});
```

To add it to the names, put it into `themes` — `themes.sepia = sepia` — then `theme: 'sepia'` works.
