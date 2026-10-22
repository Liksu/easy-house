# icon

A small mark in a corner of a unit: a pensioner, a flat rented out, a debt. The mechanics are the same for any
mark, so it is one plugin used under several names, each with its own settings:

```js
plugins: [
    ...House.plugins,
    {use: icon, name: 'oldman', options: {icon: '👴🏻', title: 'a pensioner'}},
    {use: icon, name: 'rental', options: {icon: '💰', title: 'rented out'}}
]
```

| Option | Default | |
|---|---|---|
| `icon` | `'•'` | the mark: a character, an emoji |
| `corner` | `'bottom-right'` | `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `size` | `null` | px; by default 0.36 of the square |
| `color` | `null` | the fill of a text mark (emoji have colours of their own) |
| `font` | `null` | |
| `title` | `null` | the tooltip of the mark |
| `units` | `[]` | the ids of the units that get the mark |

A unit gets the mark when its id is in `units`, or when it has the instance's name as a field:
`21: {rental: true}`. Its own options go by the same name: `62: {oldman: {icon: '👵🏻'}}`. Marks of different
instances in one corner stand side by side, not on top of each other.

<div id="demo-icon" class="demo"></div>

```js live
import {House, icon} from 'easy-house';

new House('#demo-icon', {
    units: 4,
    floors: {to: 5, 2: {6: {rental: true}}, 4: {14: {oldman: {icon: '👵🏻'}}}},
    plugins: [
        ...House.plugins,
        {use: icon, name: 'oldman', options: {icon: '👴🏻', title: 'a pensioner'}},
        {use: icon, name: 'rental', options: {icon: '💰', title: 'rented out'}}
    ],
    oldman: {units: [3, 6, 11, 17]}
});
```
