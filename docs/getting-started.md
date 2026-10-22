# Getting started

## The first house

A house needs a place to draw in — a selector or an element — and a config. Five flats on a floor, nine floors:

<div id="demo-first" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-first', {units: 5, floors: 9});
```

The picture is as big as the house: every flat is a square of `size` pixels (35) with a `gap` (6) between them.
The flats are numbered floor by floor, bottom up, left to right; the floor numbers stand on the left.

## Only what differs

The config says what an ordinary floor is, and then only how some floors differ. Here the ground floor has a
salon and a concierge instead of two flats, and the top floor has three flats:

<div id="demo-differs" class="demo"></div>

```js live
import {House} from 'easy-house';

new House('#demo-differs', {
    units: 5,
    floors: {
        to: 9,
        1: [1, 2, 3, 'S', 'C'],     // the whole row: 'S' and 'C' are labels, they take no number
        9: 3                        // three flats on the 9th floor
    }
});
```

The same keys work on a section or an entrance; a lower level overrides the one above. More in
[Describing a house](building.md).

## State

The config is the building. What changes — answers to a vote, payments, debts — is the **state**, by flat number.
The built-in [reactions](plugins/reactions.md) plugin colours a flat by its `reaction`; `house.update` changes the
state and redraws only what changed. Click a flat:

<div id="demo-state" class="demo"></div>

```js live
import {House} from 'easy-house';

const config = {units: 4, floors: 5, hover: true};
const state = {1: {reaction: 'yes'}, 6: {reaction: 'no'}, 11: {reaction: 'maybe'}};
const house = new House('#demo-state', config, state);

const next = {yes: 'no', no: 'maybe', maybe: null};
house.on('unit:click', ({unit}) => {
    const reaction = unit.state.reaction === undefined ? 'yes' : next[unit.state.reaction];
    house.update({[unit.config.id]: reaction ? {reaction} : null});     // null clears the state
});
```

## Events

A flat answers `unit:click`, `unit:enter` and `unit:leave`. A handler gets the flat and everything around it — its
floor, entrance and section — and decides what to do: a card, a dialog of your own, a request to a server.

<div id="demo-events" class="demo"></div>

```js live
import {House} from 'easy-house';

const stage = document.querySelector('#demo-events');
const card = document.createElement('p');
const idle = 'Nothing is happening: point at a flat.';
card.textContent = idle;

const house = new House(stage.appendChild(document.createElement('div')), {units: 3, floors: 4, entrances: 2});
stage.append(card);

house.on('unit:enter', ({unit, entrance, floor}) => {
    card.textContent = `Flat ${unit.config.label}: entrance ${entrance.config.index}, floor ${floor.config.floor}`;
});
house.on('unit:leave', () => card.textContent = idle);
```

The same events bubble on the container as DOM events with a `house:` prefix: `house:unit:click`. More in
[State and events](state-and-events.md).

## Changing the config

`house.redraw(patch)` merges the patch into the config and draws the house again; the state and the handlers stay.

```js
house.redraw({stacks: true});                   // colour the stacks
house.redraw({floors: {5: {mark: 'done'}}});    // a mark in front of the 5th floor
house.redraw({floorLabels: null});              // no floor numbers
```

## Small houses

A size in one word draws a small house, a thumbnail: squares filled by their reactions and nothing written.

<div id="demo-sizes" class="demo-row"></div>

```js live
import {House} from 'easy-house';

const state = {1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 5: {reaction: 'no'}, 9: {reaction: 'yes'}, 14: {reaction: 'maybe'}};
for (const size of ['icon', 'xs', 's', 'm', 'xl']) {
    const place = document.querySelector('#demo-sizes').appendChild(document.createElement('div'));
    new House(place, {units: 5, floors: 9, size}, state);
}
```

More in [Drawing](drawing.md#sizes-in-one-word).
