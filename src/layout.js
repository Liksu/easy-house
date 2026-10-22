// Model → geometry: a box for every unit, hole, floor row, entrance and section, and the size of the picture.
// Pure and DOM-free; knows pixels, not colours. Sections stand on common ground, `base` lifts (or lowers) a section.
// Plugins may reserve room beside a section or an entrance (gutters): the room exists only if someone asked for it.
import {instances, optionsAt} from './plugins.js';

export const defaultGeometry = {
    size: 35,           // a unit square, as in heroes house.js
    gap: 6,             // between units
    entranceGap: 12,    // between entrances of a section
    sectionGap: 16,     // between sections
    padding: 1          // around the picture, so strokes are not clipped
};

/**
 * @param {{sections: Array}} model — the result of resolve()
 * @param {Object} [config] — the house config: geometry, direction, plugin options
 * @param {Array<Object>} [plugins] — plugins that may reserve gutters
 * @param {Object} [state] — the data of the units by id: a plugin may take room by it (the legend of reactions)
 */
export function layout(model, config = {}, plugins = [], state = {}) {
    const geometry = pick(defaultGeometry, config);
    const {size, gap, entranceGap, sectionGap, padding} = geometry;
    const step = size + gap;

    // visual order: right to left when asked; numbering keeps its own order
    const ordered = rtl(config) ? [...model.sections].reverse() : model.sections;
    const sectionsInOrder = ordered.map(section => ({
        section,
        entrances: rtl(section.config) ? [...section.entrances].reverse() : section.entrances
    }));

    const gutters = reserve(plugins, config, {model, sections: sectionsInOrder, geometry, state});
    // bands: room above or below the whole house ({side: 'top' | 'bottom', height, width}) — a legend, a title
    const bandsOf = side => gutters.filter(gutter => gutter.side === side);
    const heightOf = bands => bands.reduce((sum, band) => sum + band.height, 0);
    const widthOf = list => list.reduce((sum, gutter) => sum + gutter.width, 0);
    // around: a plugin draws that far outside the units (walls) — the picture keeps that much room on every side,
    // counting the room that is there anyway (floor labels, bands)
    const around = Math.max(0, ...gutters.filter(gutter => gutter.side === 'around').map(gutter => gutter.width));
    const extra = room => Math.max(0, around - padding - room);
    const above = heightOf(bandsOf('top')) + extra(heightOf(bandsOf('top')));
    const below = heightOf(bandsOf('bottom')) + extra(heightOf(bandsOf('bottom')));

    const levels = model.sections.flatMap(section => section.entrances.flatMap(entrance => [...entrance.levels.values()]));
    const top = levels.length ? Math.max(...levels) : 0;
    const bottom = levels.length ? Math.min(...levels) : 0;
    const rowY = level => padding + above + (top - level) * step;

    const units = [];
    // the room on the left of the first section's units and on the right of the last one's
    const sideOf = (index, side) => {
        const {section, entrances} = sectionsInOrder.at(index) ?? {};
        const entrance = entrances?.at(side === 'left' ? 0 : -1);
        return widthOf(gutters.filter(gutter => gutter.section === section?.index && gutter.side === side &&
            (gutter.entrance == null || gutter.entrance === entrance?.index)));
    };
    let x = padding + extra(sideOf(0, 'left'));

    // places the gutters of one side at the current x and moves x past them
    const place = (list, side) => list.filter(gutter => gutter.side === side).map(gutter => {
        const placed = {...gutter, x};
        x += gutter.width;
        return placed;
    });

    const sections = sectionsInOrder.map(({section, entrances: inOrder}, s) => {
        if (s) x += sectionGap;
        const sectionLeft = x;
        const own = gutters.filter(gutter => gutter.section === section.index && gutter.entrance == null);
        const left = place(own, 'left');

        const entrances = inOrder.map((entrance, e) => {
            if (e) x += entranceGap;
            const frameLeft = x;
            const mine = gutters.filter(gutter => gutter.section === section.index && gutter.entrance === entrance.index);
            const before = place(mine, 'left');

            const unitsLeft = x;
            const width = Math.max(0, entrance.width * step - gap);
            x += width;
            const after = place(mine, 'right');

            const levelOf = floor => entrance.levels.get(floor);
            const boxOf = ({floors: [from, to], cols: [first, last]}) => ({
                x: unitsLeft + first * step,
                y: rowY(levelOf(to)),
                width: (last - first + 1) * step - gap,
                height: (levelOf(to) - levelOf(from) + 1) * step - gap
            });

            const placed = [];
            const holes = [];
            // a floor row: its box, its own config (the non-position fields of a floor object) and the units written on it
            const floors = entrance.floors.map(floor => {
                const row = {
                    floor,
                    level: levelOf(floor),
                    box: {x: unitsLeft, y: rowY(levelOf(floor)), width, height: size},
                    config: entrance.props[floor] || {},
                    units: []
                };
                entrance.grid.get(floor).forEach((cell, col) => {
                    if (cell.type === 'unit') row.units.push({cell, box: boxOf(cell.rect)});
                    if (cell.type === 'hole') holes.push({floor, col, box: boxOf({floors: [floor, floor], cols: [col, col]})});
                });
                placed.push(...row.units);
                return row;
            });
            units.push(...placed);

            const box = span(floors.map(row => row.box), unitsLeft);
            return {
                index: entrance.index,
                model: entrance,
                box,                                                   // the units only
                frame: {...box, x: frameLeft, width: x - frameLeft},   // with the entrance's own gutters
                gutters: [...before, ...after],
                floors,
                units: placed,
                holes
            };
        });

        const right = place(own, 'right');
        const frames = entrances.map(entrance => entrance.frame);
        const box = {...span(frames, sectionLeft), width: x - sectionLeft};

        return {index: section.index, model: section, box, gutters: [...left, ...right], entrances};
    });

    // the bands stretch over the whole picture, and a wide one widens it
    const body = levels.length ? (top - bottom) * step + size : 0;
    x += extra(sideOf(-1, 'right'));
    const width = Math.max(x + padding, ...[...bandsOf('top'), ...bandsOf('bottom')].map(band => (band.width ?? 0) + 2 * padding));
    let y = padding;
    const stack = band => {
        const placed = {...band, x: padding, y, width: width - 2 * padding};
        y += band.height;
        return placed;
    };
    const bands = bandsOf('top').map(stack);
    y = padding + above + body;
    bands.push(...bandsOf('bottom').map(stack));
    y = padding + above + body + below;

    return {
        geometry,
        top,
        bottom,
        rowY,
        width,
        height: y + padding,
        sections,
        units,
        bands
    };
}

/**
 * Asks every plugin with a `gutters` hook where it needs room.
 * A reservation is {section, entrance?, side: 'left' | 'right', width, …anything the plugin wants back};
 * {side: 'top' | 'bottom', height} — a band over or under the whole house; {side: 'around', width} — the plugin
 * draws that far outside the units, and the picture keeps that much room on its every side.
 * A zero width is fine: the plugin gets its place back and may draw over a neighbour's empty space.
 * The hook also gets `marks(section, entrance, floor)` — what plugins put in front of that floor's label.
 */
function reserve(plugins, config, ctx) {
    const active = instances(plugins, config);
    const marks = markers(active);
    return active.flatMap(({plugin, name, options}) =>
        (plugin.gutters?.({...ctx, marks, name, options, config}) || [])
            .filter(gutter => gutter && (gutter.width >= 0 || gutter.height >= 0))
            .map(gutter => ({side: 'left', ...gutter, plugin: name})));
}

/**
 * The marks of a floor: every plugin with a `mark` hook may put something in front of the floor's label, in
 * `plugins` order — floorLabels its `mark` field (✓, 🧯), a plugin of yours its own sign. The hook gets
 * {section, entrance, floor} (each with its config; the floor's has `floor` and `level`), name and options, and
 * returns a text, {text, class, title, color}, an array of them, or nothing.
 */
function markers(active) {
    const hooks = active.filter(instance => instance.plugin.mark);
    return (section, entrance, floor) => {
        const props = entrance.props[floor] || {};
        const ctx = {
            section: {config: section.config},
            entrance: {config: entrance.config},
            floor: {config: {...props, floor, level: entrance.levels.get(floor)}}
        };
        return hooks.flatMap(instance => {
            const options = optionsAt(instance, entrance.config, props);
            if (!options) return [];
            return [instance.plugin.mark({...ctx, name: instance.name, options}) ?? []].flat()
                .filter(mark => mark != null && mark !== false && mark !== '')
                .map(mark => ({...(typeof mark === 'object' ? mark : {text: String(mark)}), plugin: instance.name}));
        });
    };
}

const rtl = config => config?.direction === 'rtl';

// the smallest box around the given ones
function span(boxes, left = Math.min(...boxes.map(box => box.x))) {
    if (!boxes.length) return {x: left, y: 0, width: 0, height: 0};
    const right = Math.max(...boxes.map(box => box.x + box.width));
    const y = Math.min(...boxes.map(box => box.y));
    const bottom = Math.max(...boxes.map(box => box.y + box.height));
    return {x: left, y, width: right - left, height: bottom - y};
}

function pick(defaults, options) {
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, options[key] ?? value]));
}
