# State and events

## State

The config describes the building. Data about the flats — how a resident voted, whether a flat has paid, a
debt — is kept separately, in the **state**: an object keyed by the flat number, `{57: {reaction: 'yes', debt: 120}}`.
(The key is the flat's `id`: its number, or — where the numbering starts again — the number with what tells it
apart, `'s2-5'`; see [Numbering](numbering.md#ids).) Plugins read a flat's data as `unit.state`.

```js
const house = new House('#house', config, {57: {reaction: 'yes'}});

house.update({57: {reaction: 'no'}});   // merges into the state of 57
house.update({57: null});               // clears it
```

`update` builds the picture again and replaces only what differs in the page: a new reaction of one flat replaces
its square and its label; the groups, the classes you put on them and the handlers stay.

What is drawn from the state is up to the plugins: [reactions](plugins/reactions.md) colours by a field of it,
counts it and may write the percent and the legend; a plugin of your own may read any field.

## Events

| Event | When |
|---|---|
| `unit:click` | a unit is clicked |
| `unit:enter` | the pointer comes onto a unit (from its square to its label is not leaving) |
| `unit:leave` | the pointer leaves it |

A handler gets one object:

```js
{type, house, section, entrance, floor, unit, element, event}
```

— the chain of levels, as a plugin gets it (each with `config` and `box`, the unit with its `state`), the `House`,
the unit's `<g>` and the browser event. The same object goes out as a DOM event on the container, with a `house:`
prefix, for code that has no `house` at hand:

```js
house.on('unit:click', ({unit}) => open(unit.config.id));
container.addEventListener('house:unit:click', ({detail: {unit}}) => open(unit.config.id));
```

There are no dialogs: what happens on a click is yours.

## Finding units in the drawing

The group of every unit is marked with where it is:

| Attribute | |
|---|---|
| `data-unit` | its id |
| `data-section`, `data-entrance` | its section and entrance |
| `data-floor`, `data-position` | where it is written |
| `data-floors`, `data-positions` | all the floors and positions it takes, space-separated: a duplex is found on both its floors |

```js
house.svg.querySelectorAll('[data-floors~="5"]');                                          // the 5th floor
house.svg.querySelectorAll('[data-section="1"][data-entrance="2"][data-positions~="3"]');  // a stack
house.unit(57);         // its chain of levels, as a handler gets it
house.elementOf(57);    // its <g>
```

The [hover](plugins/hover.md) plugin aims along the floor and the stack by these marks.

## Changing the config

`house.redraw(patch)` merges the patch into the config — objects at any depth, arrays and other values replace,
`null` or `false` switch a plugin off — and draws the house again. The state and the handlers of `house.on` stay;
classes you put on elements do not, the elements are new.

```js
house.redraw({stacks: true, floors: {5: {mark: 'done'}}});
```

## Without an element

A house does not need a place in the page to be drawn: `new House(config, state)` draws into nothing, and
`house.svg` is the picture to put wherever you want. `redraw` puts the new picture in place of the old one, wherever
that is; the DOM events (`house:unit:click`…) bubble from the picture.

```js
const house = new House({units: 4, floors: 9});
document.querySelector('#card').append(house.svg);
```

All methods of a house — [API](api.md).
