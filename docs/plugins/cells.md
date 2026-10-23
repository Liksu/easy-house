# cells

The square of a unit and its label — the base renderer, like a cell renderer of a data grid. It is the first
of `House.plugins`, so the other plugins draw over it or wrap it.

| Option | Default | |
|---|---|---|
| `numbers` | `true` | write the label of a unit on its square |
| `fill` | `'whitesmoke'` | the fill of the square |
| `stroke` | `null` | its outline: a colour, or none |
| `strokeWidth` | `2` | the width of the outline |
| `color` | `'gray'` | the colour of the label |
| `font` | `'arial, sans-serif'` | the font of the label |
| `fontSize` | `null` | px; by default 0.4 of the square |
| `fontWeight` | `null` | `'bold'`… |

The options are the first layer of the [style](../drawing.md#how-a-unit-looks) of a unit: plugins after it
change what they need (`stacks` the fill, `reactions` the outline and the label), then `cells` draws the square
by the style. A `title` of a unit is its tooltip.

<div id="demo-cells" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-cells', {
    units: 4,
    cells: {fill: '#f1f5f9', color: '#475569', font: 'Georgia, serif'},
    floors: {to: 4, 1: {'@4': {label: 'Office', title: 'The office of the housing association', cells: {fill: '#e0f2fe', fontSize: 9}}}}
});
```

## draw

A unit's `draw` is drawn in its square instead of the label — a flag, a sign, a little picture; the square, its
fill and outline stay. It gets the same context as a plugin's hook, `unit.box` among it, and returns
[svg-easy-tree](../how-it-works.md#svg-easy-tree) nodes. A function written in `label` is the same: it goes to `draw`,
and the unit is as one without a label — a flat gets its number.

<div id="demo-draw" class="demo"></div>

```js live
import {House} from 'easy-house';

// the flag of Ukraine in the middle of a square
const flag = ({unit: {box}}) => {
    const width = box.width * 0.6, height = width * 2 / 3;
    const x = box.x + (box.width - width) / 2, y = box.y + (box.height - height) / 2;
    return [
        {tag: 'rect', opt: {x, y, width, height: height / 2, fill: '#0057b7'}},
        {tag: 'rect', opt: {x, y: y + height / 2, width, height: height / 2, fill: '#ffd700'}}
    ];
};

new House('#demo-draw', {units: 4, floors: {to: 3, 3: {'@2': {kind: 'special', colSpan: 2, label: flag}}}});
```

## render

A unit, a kind or `kinds.flat` may have its own `render`. They wrap each other like layers — the most specific
one is called, its `base(patch)` is the next, more general one, down to the square:

```js
kinds: {
    flat: {render: ({unit, base}) => base(String(unit.config.label).endsWith('7') ? {style: {color: 'crimson'}} : {})},
    salon: {label: 'S', render: ({base}) => base({style: {fill: 'pink'}})}
}
```

`patch` changes the context for what is below: `{style: {…}}` the look, `{unit: {config: {label: '★'}}}` the
unit. A `render` that does not call `base` draws everything itself.
