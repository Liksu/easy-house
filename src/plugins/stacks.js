// Stacks — the flats one above another (risers in heroes): every unit is filled by the colour of its position on
// the floor, like showRisers in heroes house.js —
// the flats one above another share a colour. The position is where the unit stands: a duplex written
// left to right (`colSpan: 2`) takes the colour of its left cell, right to left (`colSpan: -2`) — of its right one.
// The palette goes round when there are more positions than colours.
//
// It is in House.plugins but off until the house names it: `stacks: true`, or `stacks: {colors: […]}` for a palette
// of its own. A flat may go to another stack — `11: {stacks: 4}` takes the colour of the 4th — or have a colour of its
// own: `11: {stacks: 'gold'}`. It only has a `style` hook and stands before reactions, so a fill by reaction (`reactions: {fill: true}`)
// wins over it, as fillSelected does in heroes.

import {paint} from '../colors.js';

export default {
    name: 'stacks',
    enabled: false,
    options: {
        colors: '$stacks'       // the palette's: the five risers of heroes, then lime, lilac and light cyan
    },

    style({unit, house, options: {colors}}) {
        const own = unit.config.stacks;
        if (typeof own === 'string') return {fill: paint(own, house.colors)};
        if (!colors?.length) return null;
        return {fill: colors[((Number.isInteger(own) && own > 0 ? own : unit.config.path.position) - 1) % colors.length]};
    }
};
