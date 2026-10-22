// Stacks — the flats one above another (risers in heroes): every unit is filled by the colour of its position on
// the floor, like showRisers in heroes house.js —
// the flats one above another share a colour. The position is where the unit stands: a duplex written
// left to right (`colSpan: 2`) takes the colour of its left cell, right to left (`colSpan: -2`) — of its right one.
// The palette goes round when there are more positions than colours.
//
// It is in House.plugins but off until the house names it: `stacks: true`, or `stacks: {colors: […]}` for a palette
// of its own. It only has a `style` hook and stands before reactions, so a fill by reaction (`reactions: {fill: true}`)
// wins over it, as fillSelected does in heroes.

export default {
    name: 'stacks',
    enabled: false,
    options: {
        colors: '$stacks'       // the palette's: mistyrose, blanchedalmond, lemonchiffon, honeydew, aliceblue (risers in heroes)
    },

    style({unit, options: {colors}}) {
        if (!colors?.length) return null;
        return {fill: colors[(unit.config.path.position - 1) % colors.length]};
    }
};
