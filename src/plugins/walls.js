// The body of the building: a wall behind the units of every section, so the house reads as a building and not as
// a grid of squares — the night theme turns it on. Off until named: `walls: true`.
//
// A wall follows the units of every floor, with `padding` around them: from the first unit on a floor to the last,
// over the gaps between entrances, so a short top floor or a tower is narrower than the floors under it. Under an arch
// there is no wall — the section starts higher. `walls: null` on a section leaves it without one. Walls are put first
// into their sections, so they are behind. The picture keeps room for the padding at its edges.
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

            // every row of the section: from its first unit to its last, whichever entrance they are in
            const rows = new Map();
            for (const unit of section.entrances.flatMap(entrance => entrance.floors.flatMap(floor => floor.units))) {
                const {x, y, width, height} = unit.box;
                for (let top = y; top < y + height; top += step) {
                    const row = rows.get(top);
                    rows.set(top, row ? [Math.min(row[0], x), Math.max(row[1], x + width)] : [x, x + width]);
                }
            }

            // rows one over another meet in the middle of the gap; rows of one width in a run are one rect
            const rects = [];
            for (const top of [...rows.keys()].sort((a, b) => a - b)) {
                const [left, right] = rows.get(top);
                const above = rows.has(top - step);
                const bottom = top + size + (rows.has(top + step) ? gap / 2 : padding);
                const last = rects.at(-1);
                if (above && last.left === left && last.right === right) last.bottom = bottom;
                else rects.push({left, right, y: top - (above ? gap / 2 : padding), bottom});
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
