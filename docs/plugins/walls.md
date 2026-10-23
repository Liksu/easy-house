# walls

The body of the building: a wall behind the units of every section, so the house reads as a building and not as a
grid of squares. The [night theme](../themes.md#night) turns it on. Off until named: `walls: true`.

| Option | Default | |
|---|---|---|
| `color` | `'$wall'` | the colour of a wall: the palette's `wall` |
| `padding` | `null` | px around the units; by default half a gap |

A wall follows the units of every floor: from the first unit on a floor to the last, so a short top floor or a tower
is narrower than the floors under it. It goes over the gap between two entrances that both have that floor; an
entrance without it breaks the wall there — a semi-basement under some entrances only. Under an arch there is no wall — the
section starts higher; `walls: null` on a section leaves it without one. The picture keeps room for the padding at its
edges, so a wall is never cut there. A [roof](roof.md) takes the colour of the walls.

<div id="demo-walls" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-walls', {
    units: 3,
    sections: [{floors: 5}, {floors: {from: 2, to: 5}}, {floors: 6, entrances: 2}],
    walls: {color: '#d7dde5', padding: 4}
});
```
