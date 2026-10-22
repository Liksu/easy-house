# How it works

```
config
  │  sized      a size in one word becomes geometry
  ▼
config
  │  resolve    the structure is read, the flats are numbered
  ▼
model
  │  layout     every flat, floor, entrance and section gets its place in pixels
  ▼
geometry
  │  scene      the plugins draw
  ▼
svg-easy-tree nodes
  │  compile    House turns them into elements
  ▼
<svg>
```

Every step is a function exported by the package and works without a browser; only the last one, in `House`,
touches the DOM.

| Step | Function | Knows | Gives |
|---|---|---|---|
| size in one word | `sized(config)` | — | the config with `size: 'xs'` expanded |
| resolve | `resolve(config)` | the structure, the numbering | `{sections, units, warnings}`: every entrance as a grid of floors × positions, every unit with its `id`, `label`, `kind`, `path`, `rect` |
| layout | `layout(model, config, plugins, state)` | pixels, not colours | a `box` for every unit, floor row, entrance and section; the room plugins reserved (gutters, bands); the size of the picture |
| scene | `scene(geometry, plugins, config, state)` | the plugins | a tree of svg-easy-tree nodes: `svg → section → entrance → floor → unit` groups and what the plugins drew |
| compile | `House` | the DOM | the `<svg>` in your element, the events |

`House` runs them all in `draw()`. `house.update()` builds the scene again and lays the new tree over the old
one node by node, so only what changed is replaced in the page.

## svg-easy-tree

The picture is described with [svg-easy-tree](https://www.npmjs.com/package/svg-easy-tree) — a small library
that turns plain objects into SVG elements. A node is

```js
{
    tag: 'rect',                                // the element
    opt: {x: 10, y: 10, width: 35, height: 35, fill: 'whitesmoke'},     // its attributes
    val: '57',                                  // its text (innerHTML)
    sub: [/* child nodes */]
}
```

and that is all a plugin returns. A hook gets the nodes of its levels too (`ctx.unit.node`, `ctx.floor.node`…)
— the groups its nodes go into, which it may add to.

So everything the library draws is a config for svg-easy-tree in the end: easy-house turns *your* config —
sections, floors, numbers, plugins — into *its* config, a tree of nodes, and svg-easy-tree makes the SVG out of
it. You can see that tree: `house.scene`.

## The model

`house.model` is what `resolve` made of the config:

* `sections[]` → `entrances[]`, each with `floors` (the list of floor numbers), `levels` (floor → row of the
  picture), `width` (positions) and `grid` (floor → cells: `unit`, `covered` by a span, `hole`, `empty`);
* `units[]` — every unit with `id`, `label`, `kind`, `enumerable`, `path: {section, entrance, floor, position}`,
  `rect` (the floors and positions it takes) and `fields` (everything written about it);
* `warnings[]`.

`matrix(model)` shows it as the rows you would write by hand — handy in tests.
