# roof

A roof over every entrance: a thin strip above its top floor, from the middle of the first unit there to the middle
of the last one, so a tower gets a roof of its own width. Off until named: `roof: true`.

| Option | Default | |
|---|---|---|
| `color` | `null` | the colour of the strip; by default the colour of the walls there — `walls: {color}`, or the palette's `wall` |
| `height` | `2` | px, the thickness of the strip |
| `offset` | `null` | px between the strip and the top floor; by default a gap |

Room is taken above the house only for the tallest entrances; a lower entrance has its roof in the empty space over
it. `roof: null` on a section or an entrance leaves it without a roof.

<div id="demo-roof" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-roof', {
    units: 3,
    sections: [{floors: 5}, {floors: 4, entrances: 2}, {floors: 6, roof: {height: 4, offset: 3, color: '#adb5bd'}}],
    walls: {color: '#d7dde5'},
    roof: true
});
```

In `House.plugins` it comes after `text`, so its band is the one next to the house and a title above stays clear of
it. In a list of your own keep it after the plugins that take room above the house.
