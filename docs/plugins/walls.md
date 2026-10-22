# walls

The body of the building: a wall behind the units of every section, so the house reads as a building and not as a
grid of squares. The [night theme](../themes.md#night) turns it on. Off until named: `walls: true`.

| Option | Default | |
|---|---|---|
| `color` | `'$wall'` | the colour of a wall: the palette's `wall` |
| `padding` | `null` | px around the units; by default half a gap |

A wall covers the units of a section, with the gaps between its entrances; under an arch there is no wall — the
section starts higher. The picture keeps room for the padding at its edges, so a wall is never cut there. A
[roof](roof.md) takes the colour of the walls.

<div id="demo-walls" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-walls', {
    units: 3,
    sections: [{floors: 5}, {floors: {from: 2, to: 5}}, {floors: 6, entrances: 2}],
    walls: {color: '#d7dde5', padding: 4}
});
```
