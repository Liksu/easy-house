# hover

A highlight under the pointer — by CSS (`:hover`, `:has()`), without events. Off until named: `hover: true`.

| Option | Default | |
|---|---|---|
| `aim` | `'unit'` | `'unit'` — only the unit under the pointer; `'floor'` — and its floor across the house; `'stack'` — and its stack; `'both'` — a crosshair; `'off'` — nothing but the cursor |
| `stroke` | `'#1e88e5'` | the outline of the unit under the pointer |
| `strokeWidth` | `2` | |
| `fill` | `null` | its fill |
| `line` | `{fill: '#e3f2fd', stroke: null}` | the look of the floor and the stack it aims along |
| `cursor` | `'pointer'` | |

<div id="demo-hover" class="demo-row"></div>

```js live
import {House} from 'easy-house';

for (const aim of ['unit', 'floor', 'stack', 'both']) {
    const figure = document.querySelector('#demo-hover').appendChild(document.createElement('figure'));
    new House(figure.appendChild(document.createElement('div')), {units: 3, floors: 4, entrances: 2, size: 24, hover: {aim}});
    figure.appendChild(document.createElement('figcaption')).textContent = aim;
}
```

The floor and the stack are found by the [marks of the units](../state-and-events.md#finding-units-in-the-drawing):
a duplex lights up on both its floors. The rules go into a `<style>` inside the picture, scoped to it, so houses
on one page may highlight differently.
