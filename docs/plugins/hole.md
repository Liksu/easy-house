# hole

A flat that is there — its number, its data, its events — with a hole in the house in its place: a destroyed
flat. Different from `10: null`, where there is nothing at all and the number is not used.

Add it to `plugins` and mark a flat with its name: `18: {hole: true}`.

| Option | Default | |
|---|---|---|
| `fill` | `'#fff5f5'` | |
| `stroke` | `'#c66'` | the dashed outline, and the colour of the label |
| `dash` | `'3 3'` | |
| `note` | `null` | a short text under the number: a year |

<div id="demo-hole" class="demo"></div>

```js live
import {House, hole} from 'easy-house';

new House('#demo-hole', {
    units: 4,
    floors: {
        to: 6,
        3: {10: null},                                  // nothing here: 10 is not used
        4: {14: {hole: true, title: 'destroyed'}},      // the flat 14 is there, with a hole in its place
        5: {19: {hole: {note: '2022'}}}
    },
    plugins: [...House.plugins, hole]
});
```
