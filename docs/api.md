# API

## House

```js
import {House} from 'easy-house';

new House(target, config, state);      // draws into an element
new House(config, state);              // draws into nothing: put house.svg where you want
```

| Argument | |
|---|---|
| `target` | optional: a CSS selector or an element; the `<svg>` is appended to it. Without it the house is drawn into nothing and `house.svg` is yours to put anywhere |
| `config` | the house: [structure](building.md), [numbering](numbering.md), [drawing](drawing.md), [plugins](plugins.md) |
| `state` | optional: the data of the units by id — `{57: {reaction: 'yes'}}` |

### Methods

| Method | Does |
|---|---|
| `update(patch)` | merges `{id: data}` into the state (`null` clears a unit's state) and redraws only what changed |
| `redraw(patch)` | merges the patch into the config and draws the house again; the state and the handlers stay |
| `draw()` | draws the house from `config` and `state` again, from scratch |
| `on(type, handler)` / `off(type, handler)` | subscribes to `unit:click`, `unit:enter`, `unit:leave`; returns the house |
| `unit(id)` | the chain of levels of a unit — `{section, entrance, floor, unit}`, each `{config, box}`, the unit with `state` — as an event handler gets it |
| `elementOf(id)` | the `<g class="unit">` of a unit |
| `emit(type, detail)` | calls the handlers of `type` and dispatches `house:<type>` on the container |

### Properties

| Property | Is |
|---|---|
| `element` | the container, or `null` for a house drawn into nothing |
| `svg` | the `<svg>` drawn in it |
| `config` | the config as given (and as `redraw` changed it) |
| `effective` | the config that is drawn: with its [theme](themes.md) under it and a [size in one word](drawing.md#sizes-in-one-word) expanded |
| `state` | the state by unit id |
| `plugins` | the plugins in use: `config.plugins` or `House.plugins` |
| `model` | what [`resolve`](how-it-works.md#the-model) made of the config; `model.warnings` — what did not fit |
| `layout` | the geometry: the box of every unit, floor, entrance and section, the size of the picture |
| `scene` | the tree of [svg-easy-tree](how-it-works.md#svg-easy-tree) nodes that was compiled |
| `units` | `Map` of unit id → its chain of levels |

### Static

| Property | Is |
|---|---|
| `House.plugins` | the default plugins: `[cells, stacks, walls, floorLabels, dividers, reactions, text, roof, hover]` (`stacks`, `walls`, `text`, `roof` and `hover` are off until named) |

## Functions

The steps of the [pipeline](how-it-works.md), to use without the DOM — in tests, on a server, in tools of your own:

| Function | Gives |
|---|---|
| `resolve(config)` | the model: sections, entrances, the grid of every entrance, the units with their numbers, warnings |
| `matrix(model)` | the model as rows, top floor first: `[[5, 6], [1, 2, 'S']]` per entrance |
| `layout(model, config, plugins, state)` | the geometry |
| `scene(geometry, plugins, config, state)` | the svg-easy-tree nodes |
| `levels(geometry, config, state)` | the chain of levels `house → sections → entrances → floors → units`, each `{config, box}` |
| `sized(config)` | the config with its size in one word expanded |
| `themed(config)` | the config with its theme put under it |
| `paint(value, palette)` | `'$name'` in a value (at any depth) → the colour of the palette |
| `count(house, name?)` | what [reactions](plugins/reactions.md) counted: `{total, groups, yes: {count, share, percent, name, color}, …}` |
| `instances(plugins, config)`, `optionsAt(instance, ...configs)` | the plugins with their names and house options; the options of an instance at a level — for plugins of your own |
| `extend(target, patch)` | the patch merged into a context: plain objects at any depth (what `base(patch)` does) |

## Values

| Value | Is |
|---|---|
| `defaultGeometry` | `{size: 35, gap: 6, entranceGap: 12, sectionGap: 16, padding: 1}` |
| `defaultKinds` | `{flat: {enumerable: true}, special: {enumerable: false}}` |
| `sizes` | the sizes in one word: `{pixel: {size: 1, gap: 0}, …, xl: {size: 14, gap: 3}}` |
| `themes` | the themes by name: `{light, dark, night}`; add your own |
| `colors` | the default palette: `{background, unit, label, wall, …}` |

## Plugins

`cells`, `stacks`, `walls`, `floorLabels`, `dividers`, `reactions`, `text`, `roof`, `hover`, `icon`, `hole` — see
[Plugins](plugins.md).

## Types

The package comes with `index.d.ts`. The config is open: the options of a plugin go under its name at any level,
and the fields plugins read are any keys of a unit or a floor, so keys of plugins of your own are allowed
everywhere. The built-in plugins have their options typed, and a plugin of your own gets its options in its hooks:

```ts
import {House, type Plugin} from 'easy-house';

const stairs: Plugin<{color: string}> = {
    name: 'stairs',
    options: {color: '$text'},
    unit: ({unit, options}) => ({tag: 'rect', opt: {...unit.place('top-left', 6), fill: options.color}})
};
```
