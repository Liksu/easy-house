# text

Lines of text in the picture, tied to a place of the house. It writes the lines it is given and knows nothing
about what they mean. Off until named: `text: {…}`.

| Option | Default | |
|---|---|---|
| `at` | `'house'` | `'house'`, `'section:2'`, `'floor:7'` (its row across the house), or `'top'` / `'bottom'` — a band of its own above or below the house |
| `x`, `y` | `0` | inside that place: px from the near edge, negative — from the far edge, `'50%'` — of its size |
| `align` | `'left'` | `left`, `center`, `right` — which side of the text `x` is |
| `valign` | `'top'` | `top`, `middle`, `bottom` — which side `y` is |
| `color` | `'#333'` | |
| `font` | `'arial, sans-serif'` | |
| `size` | `null` | px; by default 0.4 of the square, times `scale` |
| `scale` | `1` | |
| `weight` | `null` | |
| `lineHeight` | `1.3` | |
| `border` | `null` | `'1px dashed silver'` — around the text |
| `padding` | `4` | between the text and the border, and inside a band |
| `text` | `[]` | the lines |

A line is a string, or `{value, color, size, weight, font}`; a `value` that is an array is one line of parts, each
with a look of its own. Spaces are kept.

<div id="demo-text" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-text', {
    units: 4,
    floors: {to: 5, 5: 2},
    text: {
        at: 'top', x: '50%', align: 'center',
        text: [
            {value: 'Roof repair', weight: 'bold'},
            ['vote until ', {value: 'November 1', color: 'crimson'}]
        ]
    }
});
```

A band (`at: 'top'` or `'bottom'`) takes room of its own and the picture grows; any other place draws over the
house — the free space of a short floor is a good one: `at: 'floor:5', x: '100%', align: 'right'`.

Several blocks — the plugin under several names: `{use: text, name: 'title', options: {…}}`.

## For plugins of your own

The drawing is exported for plugins with text of their own (as [reactions](reactions.md) writes its percent and
legend), as `textBlock`: `lines(raw)` — lines as parts, `band(lines, options, geometry)` — a reservation for the
`gutters` hook, `block(lines, options, {house, bands, name})` — the nodes, `fill(template, data)` —
`'{{yes.percent}}%'` with values, `defaults` — the options above.

```js
import {textBlock} from 'easy-house';

const note = {
    name: 'note',
    options: {...textBlock.defaults, at: 'bottom'},
    gutters: ({options, geometry}) => [textBlock.band(textBlock.lines(['a note']), options, geometry)],
    house: ({house, options, gutters}) => textBlock.block(textBlock.lines(['a note']), options, {house, bands: gutters, name: 'note'})
};
```
