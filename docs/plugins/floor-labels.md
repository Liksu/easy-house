# floorLabels

Floor numbers beside the house. There is room for them only where there is something to write.

| Option | Default | |
|---|---|---|
| `at` | `'house'` | `'house'` — where a floor first appears; `'section'` — at every section; `'entrance'` — at every entrance |
| `mode` | `'compact'` | with `at: 'house'`: `'compact'` — the new floors of a section are written over the empty space of its neighbour; `'gutter'` — room is reserved, and mirrored on the other side of the gap |
| `format` | ``floor => `${floor}:` `` | the text of a floor number |
| `marks` | `{done: '✓', progress: '⏳', extinguisher: '🧯'}` | what a floor's `mark` is written as |
| `color` | `'#555'` | |
| `font` | `'verdana, sans-serif'` | |
| `fontSize` | `null` | px; by default 0.34 of the square |

## Where

With `at: 'house'` the first section labels its floors; a taller (or lower) section to the right labels only the
floors the others do not have. In the `compact` mode those numbers stand over the neighbour's empty space, left of
the divider between the sections, and no room is taken; in the `gutter` mode they get room of their own, and the
same room is left on the other side of the gap so the divider stays in the middle. `at: 'section'` and
`'entrance'` repeat the numbers at every section or entrance.

<div id="demo-labels" class="demo-row"></div>

```js live
import {House} from 'easy-house';

const config = {units: 3, sections: [{floors: 3}, {floors: 5}]};
for (const floorLabels of [{}, {mode: 'gutter'}, {at: 'section'}, {at: 'entrance'}]) {
    const figure = document.querySelector('#demo-labels').appendChild(document.createElement('figure'));
    new House(figure.appendChild(document.createElement('div')), {...config, floorLabels});
    figure.appendChild(document.createElement('figcaption')).textContent = JSON.stringify(floorLabels);
}
```

Switched off on a section or an entrance (`sections: [{floorLabels: null}, {}]`), it takes no room there, and at
`'house'` its floors are labelled by the next section.

## Fields of a floor

* **`label`** — written instead of the number, as it is: `floors: {'-1': {label: 'P'}}`.
* **`mark`** — in front of the number: `floors: {21: {mark: 'done'}}` → `✓ 21:`; several — an array. An unknown
  mark is written as it is.

<div id="demo-marks" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-marks', {
    units: 3,
    floors: {from: -1, to: 4, '-1': {label: 'P'}, 1: {mark: 'extinguisher'}, 2: {mark: ['done', 'progress']}, 4: {mark: '★'}}
});
```

Any plugin may put a sign of its own in front of a floor number — its [`mark` hook](../writing-plugins.md#mark).
