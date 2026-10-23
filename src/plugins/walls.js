// The body of the building: a wall behind the units of every section, so the house reads as a building and not as
// a grid of squares — the night theme turns it on. Off until named: `walls: true`.
//
// A wall follows the units of every floor, with `padding` around them: from the first unit on a floor to the last,
// so a short top floor or a tower is narrower than the floors under it. It goes over the gap between two entrances
// that both have that floor; an entrance without it breaks the wall there (a semi-basement under some entrances only).
// Under an arch there is no wall — the section starts higher. `walls: null` on a section leaves it without one. Walls
// are put first into their sections, so they are behind. The picture keeps room for the padding at its edges.
import {optionsAt} from '../plugins.js';

export default {
    name: 'walls',
    enabled: false,
    options: {
        color: '$wall',
        padding: null           // px around the units; by default half a gap
    },

    gutters({options, geometry}) {
        return [{side: 'around', width: options.padding ?? geometry.gap / 2}];
    },

    house({house, name, options}) {
        const {size, gap} = house.layout.geometry;
        const step = size + gap;
        for (const section of house.sections) {
            const own = optionsAt({name, options, palette: house.colors}, section.config);
            if (!own) continue;
            const padding = own.padding ?? gap / 2;

            // every row of every entrance: from its first unit to its last
            const rows = new Map();     // top → [{entrance, left, right}], entrances in the order they are drawn
            section.entrances.forEach((entrance, order) => {
                for (const unit of entrance.floors.flatMap(floor => floor.units)) {
                    const {x, y, width, height} = unit.box;
                    for (let top = y; top < y + height; top += step) {
                        if (!rows.has(top)) rows.set(top, []);
                        const row = rows.get(top);
                        const part = row.find(part => part.entrance === order);
                        if (part) [part.left, part.right] = [Math.min(part.left, x), Math.max(part.right, x + width)];
                        else row.push({entrance: order, left: x, right: x + width});
                    }
                }
            });

            // a row's pieces of neighbouring entrances are one piece: the wall goes over the gap between them
            const pieces = new Map([...rows].map(([top, parts]) => [top, parts.sort((a, b) => a.entrance - b.entrance)
                .reduce((joined, part) => {
                    const last = joined.at(-1);
                    if (last && part.entrance === last.entrance + 1) Object.assign(last, {entrance: part.entrance, right: part.right});
                    else joined.push({...part});
                    return joined;
                }, [])]));

            // a piece meets the rows over and under it in the middle of the gap where they overlap; pieces of one width
            // one over another are one rect
            const overlaps = (top, {left, right}) => (pieces.get(top) ?? []).some(other => other.left < right && other.right > left);
            const rects = [];
            for (const top of [...pieces.keys()].sort((a, b) => a - b)) {
                for (const piece of pieces.get(top)) {
                    const above = overlaps(top - step, piece);
                    const bottom = top + size + (overlaps(top + step, piece) ? gap / 2 : padding);
                    const same = above && rects.find(rect => rect.next === top && rect.left === piece.left && rect.right === piece.right);
                    if (same) Object.assign(same, {bottom, next: top + step});
                    else rects.push({left: piece.left, right: piece.right, y: top - (above ? gap / 2 : padding), bottom, next: top + step});
                }
            }

            section.node.sub.unshift(...rects.map(({left, right, y, bottom}) => ({tag: 'rect', opt: {
                class: 'wall',
                x: left - padding,
                y,
                width: right - left + 2 * padding,
                height: bottom - y,
                fill: own.color
            }})));
        }
        return null;
    }
};
