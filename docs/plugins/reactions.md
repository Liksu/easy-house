# reactions

Colours a unit by a field of its [state](../state-and-events.md) — the answer of a resident to a vote, a payment,
anything with a few values. It also counts them and may write the percent and the legend.

```js
new House('#house', config, {57: {reaction: 'yes'}, 58: {reaction: 'no'}});
house.update({57: {reaction: 'maybe'}});
```

## The look

| Option | Default | |
|---|---|---|
| `field` | `'reaction'` | the field of the state |
| `colors` | `{yes: 'green', no: 'red', maybe: 'orange', ignore: 'gray', none: 'gray'}` | per reaction: the outline and the label |
| `fills` | `{yes: 'lightgreen', no: 'pink', maybe: 'lightyellow', ignore: 'gainsboro', none: 'gainsboro'}` | per reaction: the fill, with `fill: true` |
| `fill` | `false` | fill the square by the reaction too |
| `always` | `false` | outline the units without a reaction too, in `colors.none` |
| `style` | `{strokeWidth: 2, fontWeight: 'bold'}` | what every unit with a reaction gets besides its colours |
| `styles` | `{}` | any [style](../drawing.md#how-a-unit-looks) per reaction: `{no: {fontSize: 10}, none: {fill: 'white'}}` |

`none` is a unit without a reaction.

<div id="demo-reactions" class="demo-row"></div>

```js live
import {House} from 'easy-house';

const state = {1: {reaction: 'yes'}, 2: {reaction: 'no'}, 6: {reaction: 'maybe'}, 7: {reaction: 'yes'}, 11: {reaction: 'ignore'}};
for (const reactions of [{}, {fill: true, always: true}, {styles: {no: {color: 'black', fontWeight: 'normal'}}}]) {
    const figure = document.querySelector('#demo-reactions').appendChild(document.createElement('figure'));
    new House(figure.appendChild(document.createElement('div')), {units: 4, floors: 3, reactions}, state);
    figure.appendChild(document.createElement('figcaption')).textContent = JSON.stringify(reactions);
}
```

## Counting

The groups are the reactions; a unit without one is in the `none` group.

| Option | Default | |
|---|---|---|
| `synonyms` | `{}` | a reaction counted as another: `{paid: 'yes'}` |
| `none` | `'none'` | the group of the units without a reaction; `null` — they are not counted |
| `counts` | `({unit, reaction}) => reaction != null \|\| unit.config.enumerable` | which units are counted |
| `names` | `{}` | what a group is called: `{yes: 'for'}` |
| `order` | `null` | the groups in this order; by default as in `colors` |

From outside: `count(house)` →
`{total, groups: [{key, name, count, share, percent, color}], yes: {…}, no: {…}, …}`.

## The percent and the legend

Both are text blocks ([text](text.md)) — they take its options: `at`, `x`, `y`, `align`, `valign`, `color`, `font`,
`size`, `scale`, `weight`, `border`, `padding`. Off by default.

| Option | Default | |
|---|---|---|
| `percent` | `null` | `true` or `{show, text, …}`: the share of a group, big and bold, in its colour; by default in a band above the house, at the right |
| `percent.show` | `'yes'` | a group — its share: `78%`; `'count:no'` — its count: `=14`; `'yes/no'` — two counts |
| `percent.text` | — | lines of your own with what was counted: `['{{no.percent}}% against']` |
| `legend` | `null` | `true` or `{line, keep, decimal, …}`: a line per group, columns aligned; by default in a band under the house |
| `legend.line` | `'{{name}}: {{count}} / {{total}} = {{share}}% ≈ {{percent}}%'` | the template of a line: `{{name}}`, `{{key}}`, `{{count}}`, `{{total}}`, `{{share}}` (exact), `{{percent}}` (rounded) |
| `legend.keep` | `['yes']` | groups shown even when empty |
| `legend.decimal` | `2` | digits of `{{share}}` |

Every value in a legend line is padded to the widest value of any group, so the columns stand in line:
`legend: {line: '{{name}}: {{percent}}%'}` gives `  yes: 78%` / `   no: 13%`.

<div id="demo-counted" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-counted', {
    units: 4,
    floors: {to: 5, 5: 2},
    reactions: {
        names: {yes: 'for', no: 'against', none: 'no answer'},
        percent: {at: 'floor:5', y: '50%', valign: 'middle'},   // in the free place of the 5th floor
        legend: true
    }
}, {1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 7: {reaction: 'no'}, 9: {reaction: 'yes'}, 14: {reaction: 'yes'}});
```

## Another field

The same plugin under another name reads another field, and counts and writes its own:

```js
plugins: [...House.plugins, {use: reactions, name: 'payments', options: {field: 'payment', colors: {paid: 'blue'}, legend: true}}]
```
