# Recipes

Small whole things built of the parts of easy-house — copy one and change it. easy-house draws and tells what was
clicked; a window to answer in is the browser's own [`<dialog>`](https://developer.mozilla.org/docs/Web/HTML/Element/dialog).

## A vote

Click a flat and answer for it. The colours, the percent and the legend are of [reactions](plugins/reactions.md);
`house.update()` redraws only the flat that changed.

<div id="demo-vote" class="demo"></div>

```js live
import {House} from 'easy-house';

const house = new House('#demo-vote', {
    units: 4,
    floors: {to: 9, 1: [1, 2, 3, {kind: 'special', label: 'C', title: 'the concierge'}]},
    reactions: {
        percent: true,
        legend: {line: '{{name}}: {{count}}'},
        names: {yes: 'for', no: 'against', maybe: 'abstained', none: 'no answer'}
    },
    hover: true
}, {2: {reaction: 'yes'}, 7: {reaction: 'no'}, 12: {reaction: 'yes'}, 20: {reaction: 'maybe'}, 31: {reaction: 'yes'}});

// the window: in a form with method="dialog" a button closes it, and its value is the dialog's returnValue
const dialog = document.createElement('dialog');
dialog.innerHTML = `
    <form method="dialog">
        <p>Flat <b class="flat"></b> votes:</p>
        <button value="yes">For</button>
        <button value="no">Against</button>
        <button value="maybe">Abstained</button>
        <button value="clear">No answer</button>
        <button value="">Cancel</button>
    </form>`;
document.querySelector('#demo-vote').append(dialog);

let flat;
house.on('unit:click', ({unit}) => {
    if (!unit.config.enumerable) return;            // the concierge does not vote
    flat = unit.config.id;
    dialog.querySelector('.flat').textContent = unit.config.label;
    dialog.returnValue = '';                        // Esc closes it without a value
    dialog.showModal();
});

dialog.addEventListener('close', () => {
    const answer = dialog.returnValue;
    if (answer === 'clear') house.update({[flat]: null});
    else if (answer) house.update({[flat]: {reaction: answer}});
    // on a real site the answer goes to the server first: fetch(...).then(() => house.update(...))
});
```

## Collecting money

Every flat pays its share. A flat that paid all of it is green, a part — yellow, one that refuses — red; click a flat
to write what it paid, or that it refuses. [reactions](plugins/reactions.md) counts flats, not money: it colours a
flat by its status and counts them in the legend, while the money is counted here — the sum and its percent go to a
progress bar over the house, what every flat paid to the list beside it.

<div id="demo-money" class="demo wide"></div>

```js live
import {House} from 'easy-house';

const share = 500;                                  // what a flat pays
const goal = 40 * share;

// what is known so far, by flat: how much it paid, or that it refuses
const paid = {1: 500, 2: 500, 3: 250, 5: 500, 8: 500, 9: 100, 12: 500, 14: 500, 17: 300, 21: 500, 22: 500, 26: 500, 30: 500, 33: 200, 37: 500};
const refused = new Set(['6', '19']);

// the state of a flat: its status the colours go by, and its amount
const statusOf = flat => refused.has(flat) ? 'refused' : paid[flat] >= share ? 'paid' : paid[flat] > 0 ? 'partly' : null;
const stateOf = flat => statusOf(flat) && {payment: statusOf(flat), amount: paid[flat] ?? 0};
const known = () => [...new Set([...Object.keys(paid), ...refused])].sort((a, b) => a - b);

// the page around the house: a progress bar over it, the list beside it
const stage = document.querySelector('#demo-money');
stage.innerHTML = `
    <p style="text-align: center"><progress max="${goal}"></progress> <b class="total"></b></p>
    <div style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start">
        <div class="house"></div>
        <table><thead><tr><th>Flat</th><th>Paid</th></tr></thead><tbody></tbody></table>
    </div>`;

function show() {
    const collected = Object.values(paid).reduce((sum, amount) => sum + amount, 0);
    stage.querySelector('progress').value = collected;
    stage.querySelector('.total').textContent =
        `${collected.toLocaleString('en')} of ${goal.toLocaleString('en')} — ${Math.round(collected / goal * 100)}%`;
    stage.querySelector('tbody').innerHTML = known().map(flat => `<tr><td>${flat}</td><td>${
        refused.has(flat) ? 'refuses' : paid[flat] < share ? `${paid[flat]} of ${share}` : paid[flat]}</td></tr>`).join('');
}

const house = new House(stage.querySelector('.house'), {
    units: 4,
    floors: 10,
    reactions: {
        field: 'payment',
        fill: true,
        colors: {paid: 'green', partly: 'darkorange', refused: 'red'},
        fills: {paid: 'lightgreen', partly: 'lightyellow', refused: 'pink'},
        names: {paid: 'paid', partly: 'paid a part', refused: 'refuses', none: 'not yet'},
        order: ['paid', 'partly', 'refused', 'none'],
        legend: {line: '{{name}}: {{count}}', keep: []}
    },
    hover: true
}, Object.fromEntries(known().map(flat => [flat, stateOf(flat)])));
show();

const dialog = document.createElement('dialog');
dialog.innerHTML = `
    <form method="dialog">
        <p>Flat <b class="flat"></b> has paid:</p>
        <p><input name="amount" type="number" min="0" step="50"> of ${share}</p>
        <button value="save">Save</button>
        <button value="refuse">Refuses to pay</button>
        <button value="">Cancel</button>
    </form>`;
stage.append(dialog);
const input = dialog.querySelector('[name=amount]');

let flat;
house.on('unit:click', ({unit}) => {
    flat = unit.config.id;
    dialog.querySelector('.flat').textContent = unit.config.label;
    input.value = paid[flat] ?? share;
    dialog.returnValue = '';                        // Esc closes it without a value
    dialog.showModal();
});

dialog.addEventListener('close', () => {
    const answer = dialog.returnValue;
    if (answer === 'save') {
        const amount = Math.max(0, Number(input.value) || 0);
        refused.delete(flat);
        if (amount) paid[flat] = amount;
        else delete paid[flat];
    } else if (answer === 'refuse') {
        refused.add(flat);
        delete paid[flat];
    } else return;
    house.update({[flat]: stateOf(flat)});
    show();
});
```

With both a vote and payments in one house, give the payments [an instance of their own](plugins/reactions.md) —
`{use: reactions, name: 'payments', options: {field: 'payment', …}}` — and each keeps its colours and its legend.
