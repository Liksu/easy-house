# dividers

Hairlines in the middle of the gaps — between sections and between entrances of a section. A line stays one
device pixel wide at any scale.

| Option | Default | |
|---|---|---|
| `sections` | `'#999'` | the colour of a line between sections; `null` — none |
| `entrances` | `'#ccc'` | between entrances of a section |
| `extent` | `'overlap'` | `'overlap'` — only as high as the two neighbours overlap; `'full'` — as tall as both together |

<div id="demo-dividers" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-dividers', {
    units: 3,
    sections: [{floors: 4, entrances: 2}, {floors: 6}],
    dividers: {sections: 'steelblue', extent: 'full'}
});
```
