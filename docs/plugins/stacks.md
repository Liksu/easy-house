# stacks

A stack is the flats one above another — the same [position](../building.md#positions) of an entrance on every
floor. `stacks` fills every unit with the colour of its position, so the stacks are seen at a glance.

Off until named: `stacks: true`.

| Option | Default | |
|---|---|---|
| `colors` | `['mistyrose', 'blanchedalmond', 'lemonchiffon', 'honeydew', 'aliceblue', '#f2ffe0', '#f6ebff', 'lightcyan']` | by position, round and round |

A unit takes the colour of the position it stands at: a duplex written left to right (`colSpan: 2`) — of its
left cell, right to left (`colSpan: -2`) — of its right one. `stacks` is before `reactions` in `House.plugins`, so
a fill by reaction (`reactions: {fill: true}`) wins over it.

<div id="demo-stacks" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-stacks', {
    units: 4,
    floors: {to: 6, 2: {'@1': {colSpan: 2}}, 4: {'@4': {colSpan: -2}}, 5: {'@2': {rowSpan: 2}}},
    stacks: true
});
```

A palette of your own: `stacks: {colors: ['#ff9aa2', '#ffdac1', '#fff5a5', '#b5ead7', '#c7ceea']}`; off on a
section: `sections: [{}, {stacks: null}]`.

## One flat

A flat may be in another stack than its position says, or have a colour of its own — a number or a string in
`stacks` on the flat:

```js
floors: {
    3: {11: {stacks: 4}},               // flat 11 takes the colour of the 4th stack
    5: {19: {stacks: 'gold'}}           // flat 19 is gold; a name of the palette too: '$highlight'
}
```
