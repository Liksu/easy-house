# Writing a plugin

A plugin is an object: a `name`, default `options` and hooks. Put it into `plugins`, set its options by its name.

```js
const debt = {
    name: 'debt',
    options: {color: 'crimson', threshold: 0},
    unit({unit, name, options}) { … }
};

new House('#house', {plugins: [...House.plugins, debt], debt: {threshold: 100}});
```

`enabled: false` makes a plugin come with the house but stay off until the config names it, as `stacks` does.

## Hooks

| Hook | Called | Returns |
|---|---|---|
| `style(ctx)` | for every unit, before it is drawn | a part of its look — `{fill, stroke, strokeWidth, color, font, fontSize, fontWeight}`; later plugins win, empty values do not count |
| `render(ctx)` | for every unit: the unit itself | nodes; `ctx.base(patch)` — the drawing of the plugins before it |
| `unit(ctx)` | for every unit, over it | nodes; `ctx.unit.place(corner, w, h)` — the next free place in a corner |
| `floor(ctx)`, `entrance(ctx)`, `section(ctx)`, `house(ctx)` | for every level, over its children | nodes |
| `gutters(ctx)` | once, before the layout | room beside sections or entrances, or bands above or below the house |
| `mark(ctx)` | for every floor | a sign in front of its number |

The nodes are [svg-easy-tree](how-it-works.md#svg-easy-tree) nodes — `{tag, opt, val, sub}` — a node, an array of
them, or nothing. They go into the group of their level after its children, so they paint on top.

## The context (ctx)

Every hook is called with one argument — the **context**, `ctx` in these docs: an object that says where the hook
is and what is known there. Its fields are the same for every hook; a hook gets the levels down to its own.

```js
{
    house:    {config, box, node, layout, state, colors, sections},
    section:  {config, box, node, gutters, entrances},
    entrance: {config, box, node, frame, gutters, floors},
    floor:    {config, box, node, units},
    unit:     {config, box, node, state, place},
    name,       // the name of this instance
    options,    // its options at this level
    style,      // in unit hooks: the look so far
    gutters,    // in section and entrance hooks: the room this instance reserved there; in the house hook — its bands
    base        // in render: the drawing it wraps
}
```

A hook gets the chain down to its level: `section` gets `house` and `section`, `unit` gets all five.

* **`config`** — everything known about the level: its settings after the cascade, and for a unit its fields and
  what was computed — `id`, `label`, `kind`, `enumerable`, `path: {section, entrance, floor, position}`, `rect`;
  for a floor — `floor` and `level`.
* **`box`** — `{x, y, width, height}` where the level is drawn, in the coordinates of the whole picture (no group is
  moved), so what you draw by it lands exactly there. `entrance.frame` — the box with its gutters.
* **`node`** — the group of the level in the tree; you may add to any group up the chain.
* **`state`** — the data of a unit from the house's state, `{}` when there is none; `house.state` — all of it.
* **`house.colors`** — the [palette](themes.md): the colours by name. Default options may name them too —
  `options: {color: '$text'}` — they come to the hook as colours.
* **children** — `house.sections → section.entrances → entrance.floors → floor.units`: a plugin may walk the
  house (`dividers` takes the boxes of entrances this way).

## A mark over a unit

<div id="demo-unit-hook" class="demo"></div>

```js live
import {House} from 'easy-house';

// a red dot in the corner of a flat with a debt over the threshold
const debt = {
    name: 'debt',
    options: {color: 'crimson', threshold: 0},
    unit({unit, name, options}) {
        if (!(unit.config[name] > options.threshold)) return null;
        const place = unit.place('top-right', 7);          // next to the marks of other plugins
        return {tag: 'circle', opt: {cx: place.x + 3.5, cy: place.y + 3.5, r: 3.5, fill: options.color}};
    }
};

new House('#demo-unit-hook', {
    units: 4,
    floors: {to: 5, 3: {9: {debt: 1200}, 10: {debt: 40}}, 4: {14: {debt: 300}}},
    plugins: [...House.plugins, debt],
    debt: {threshold: 100}
});
```

## The look of a unit

A `style` hook changes how a unit looks without drawing it: the square is drawn by `cells` afterwards.

<div id="demo-style-hook" class="demo"></div>

```js live
import {House} from 'easy-house';

// the corner flats, darker
const corners = {
    name: 'corners',
    style: ({unit, entrance}) => [1, entrance.config.units].includes(unit.config.path.position) && {fill: '#dbe4ee'}
};

new House('#demo-style-hook', {units: 5, floors: 4, plugins: [...House.plugins, corners]});
```

## A sign in front of a floor number :id=mark

<div id="demo-mark-hook" class="demo"></div>

```js live
import {House} from 'easy-house';

// a door in front of the floors with an exit to the roof
const exits = {
    name: 'exits',
    mark: ({floor}) => floor.config.exit && {text: '🚪', title: 'an exit to the roof'}
};

new House('#demo-mark-hook', {
    units: 3,
    floors: {to: 5, 5: {exit: true}, 3: {exit: true, mark: 'done'}},
    plugins: [...House.plugins, exits]
});
```

A `mark` hook gets `{section, entrance, floor}` (each with its `config`), `name` and `options`, and returns a text,
`{text, title, color, class}`, an array of them, or nothing. [floorLabels](plugins/floor-labels.md) puts the marks of
all plugins in front of the number, in the order of `plugins`, and counts them in its room.

## Room of its own

A `gutters` hook asks for room before the layout: `{section, entrance?, side: 'left' | 'right', width}` beside a
section or an entrance, `{side: 'top' | 'bottom', height, width?}` — a band over the whole house, or
`{side: 'around', width}` — the plugin draws that far outside the units ([walls](plugins/walls.md)), and the picture
keeps that much room on its every side, counting the room that is there anyway. It gets the
model (`sections`, in the order they are drawn), `geometry`, `state`, `name`, `options` and `marks(section,
entrance, floor)`. The hook of the level gets its room back with coordinates in `ctx.gutters`.
