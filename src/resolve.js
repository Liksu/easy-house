// Config → model: sections → entrances → floor rows of cells, with spans laid out and numbers assigned.
// Pure and DOM-free: the renderer and plugins will work on the model, never on the raw config.
import {merge, isObject} from './utils.js';

// A kind is a named preset of unit fields, like a CSS class (or columnTypes in ag-grid).
// Every unit is a flat first, then its kind, then its own fields: flat < kind < unit.
// `kinds` cascades like everything else, so a section can redefine even `flat` for its units.
// Built in: flat — numbered; special — anything else, drawn as a unit but not numbered (a shop, a concierge,
// a technical room). Kinds of your own are one line: kinds: {shop: {enumerable: false}}.
export const defaultKinds = {
    flat: {enumerable: true},
    special: {enumerable: false}
};

// structure, a scope's own numbering start and its own render are not inherited by the scopes below
const OWN = ['sections', 'entrances', 'start', 'render'];

/**
 * @param {Object} config
 * @returns {{sections: Array, units: Array, warnings: Array<string>}}
 */
export function resolve(config = {}) {
    // A span written by a unit's number (`20: {rowSpan: 2}`) is the same as the span at that unit's position.
    // It moves only the numbers after it — a penthouse has one number however many cells it takes — so it may only
    // go forward in the numbering: up, and along the floor's direction. Merged flats (`merged: true`) move no number
    // at all — every cell they take keeps its number to itself — so they may go any way: `20: {colSpan: -2, merged: true}`.
    // Spans are moved to their positions one at a time, in the order of numbering: the next one is looked up
    // on the model with the ones before it in place.
    const moved = [];
    for (;;) {
        const {moves, ...model} = build(config, moved);
        if (!moves.length) return model;
        moved.push(moves[0]);
    }
}

function build(config, moved) {
    const warnings = [];
    const warn = message => void warnings.push(message);   // falsy on purpose: `keep || warn(...)` filters

    const own = scope => normalize(omit(scope, OWN), warn);
    const houseDefaults = own(config);
    const sections = list(config.sections).map((section, s) => {
        const sectionConfig = merge(houseDefaults, own(section));
        const entrances = list(section.entrances ?? config.entrances).map((ownEntrance, e) => layoutEntrance(
            merge(sectionConfig, own(ownEntrance)),
            {section: s + 1, entrance: e + 1},
            {start: ownEntrance.start, render: ownEntrance.render},
            moved.filter(move => move.section === s + 1 && move.entrance === e + 1),
            warn
        ));

        return {index: s + 1, base: sectionConfig.base || 0, start: section.start, render: section.render, entrances, config: sectionConfig};
    });

    const moves = [];
    const units = number(sections, config.start, warn, moves);
    return {sections, units, warnings, moves};
}

function layoutEntrance(config, path, {start, render}, moved, warn) {
    const kinds = merge(defaultKinds, config.kinds || {});
    const floorValues = config.floors || {};
    const floors = floorRange(floorValues, config.groundFloor ?? 1);
    const levels = levelsOf(floors, config.groundFloor ?? 1, config.base || 0);
    const grid = new Map(floors.map(floor => [floor, []]));
    const props = {};   // non-position fields of floor objects: plugin fields like mark, the floor's own start
    let width = config.units || 0;

    const where = (floor, col) => `section ${path.section}, entrance ${path.entrance}, floor ${floor}, position ${col + 1}`;

    function place(floor, col, slot, auto = false) {
        const row = grid.get(floor);
        if (slot.type === 'hole') {
            row[col] = slot;
            return;
        }

        // a span written by the number of the unit that is here (see resolve)
        const move = slot.type === 'unit' && moved.find(move => move.floor === floor && move.col === col);
        const fields = move ? {...slot.fields, ...move.fields} : slot.fields;
        const {colSpan = 1, rowSpan = 1} = fields;
        const cols = span(col, colSpan).filter(c => c >= 0 || warn(`${where(floor, col)}: colSpan ${colSpan} goes past the left edge`));
        // rows step through the list of floors, so a span from -1 goes to 1 when there is no floor 0
        const rows = span(floors.indexOf(floor), rowSpan)
            .filter(i => (i >= 0 && i < floors.length) || warn(`${where(floor, col)}: rowSpan ${rowSpan} goes past the last floor`))
            .map(i => floors[i]);
        const cell = {
            type: 'unit',
            fields,
            renders: slot.renders,
            auto,
            floor,
            col,
            rect: {floors: [Math.min(...rows), Math.max(...rows)], cols: [Math.min(...cols), Math.max(...cols)]}
        };
        row[col] = cell;

        for (const f of rows) for (const c of cols) {
            if (f === floor && c === col) continue;
            const taken = grid.get(f)[c];
            // a span may swallow holes and auto units, but never something written explicitly
            if (taken && taken.type !== 'hole' && !(taken.type === 'unit' && taken.auto)) {
                warn(`${where(f, c)} is already taken, the span from ${where(floor, col)} skips it`);
                continue;
            }
            grid.get(f)[c] = {type: 'covered', by: cell, was: taken};
        }
    }

    for (const floor of floors) {
        const value = floorValues[floor];
        const row = grid.get(floor);
        if (value === null) continue;   // no units at all on this floor

        // the whole row, explicitly: an array, or `units` of a floor object with fields of the floor beside it
        const items = Array.isArray(value) ? value : isObject(value) && Array.isArray(value.units) ? value.units : null;
        if (items) {
            if (isObject(value)) props[floor] = omit(value, ['units', 'align']);
            // items fill free positions like cells of an HTML table row
            let col = 0;
            for (const raw of items) {
                while (row[col]) col++;
                place(floor, col, slot(raw, kinds, warn));
                col++;
            }
        } else {
            // a count, or changes on top of the inherited count:
            //   '@3': …  — position 3: structure (a hole, a kind, a span, an explicit label), before the numbering
            //   54: {…}  — the unit numbered 54: its data, after the numbering (see patchUnits)
            //   mark: …  — anything else is a field of the floor
            // (`units` is the count of positions here; an array in `units` is the whole row, see above)
            // the count takes positions from the aligned edge, and cells covered by spans are among them
            const overrides = isObject(value) ? value : {};
            const positionKeys = Object.keys(overrides).filter(key => /^@[1-9]\d*$/.test(key));
            const positions = positionKeys.map(key => Number(key.slice(1)));
            const count = typeof value === 'number' ? value : overrides.units ?? config.units ?? 0;
            const align = overrides.align ?? config.align;
            const first = align === 'right' ? Math.max(0, (config.units ?? count) - count) : 0;
            props[floor] = omit(overrides, [...positionKeys, 'units', 'align']);

            for (let col = 0, last = Math.max(first + count, ...positions); col < last; col++) {
                const own = Object.hasOwn(overrides, `@${col + 1}`);
                if (row[col]) {
                    if (own) warn(`${where(floor, col)} is covered by a span, its override is ignored`);
                    continue;
                }
                if (own) place(floor, col, slot(overrides[`@${col + 1}`], kinds, warn));
                else if (col >= first && col < first + count) place(floor, col, slot({}, kinds, warn), true);
            }
        }

        width = Math.max(width, row.length);
    }

    for (const row of grid.values()) {
        for (let col = 0; col < width; col++) row[col] ??= {type: 'empty'};
    }

    return {index: path.entrance, path, floors, levels, width, grid, props, start, render, config, moved};
}

function slot(raw, kinds, warn) {
    if (raw == null) return {type: 'hole'};

    // a bare number or string is just the label — what is written on the unit
    const own = typeof raw === 'number' || typeof raw === 'string' ? {label: raw} : raw;
    if (isObject(own)) {
        if (Object.hasOwn(own, 'value') && !Object.hasOwn(own, 'label')) warn(`a unit's value is now label: {label: ${JSON.stringify(own.value)}}`);
        const kind = own.kind ?? 'flat';
        if (!Object.hasOwn(kinds, kind)) warn(`unknown kind '${kind}'`);
        const preset = kind === 'flat' ? kinds.flat : merge(kinds.flat, kinds[kind] || {});
        // fields merge (the closer wins), but renders chain: each one gets the more general one as its base
        const renders = [kinds.flat.render, kind !== 'flat' && kinds[kind]?.render, own.render]
            .filter(render => typeof render === 'function');
        return {type: 'unit', fields: merge(preset, own), renders};
    }

    warn(`unknown slot ${JSON.stringify(raw)}, treated as a hole`);
    return {type: 'hole'};
}

/**
 * Continuous by default: section by section, entrance by entrance, floors bottom-up, positions in the floor's
 * `numberDirection` — left to right, or right to left (by default as `direction`; it cascades down to a floor).
 * The label decides: a number moves the counter there; a string starting with digits ('25/1', '5a') is a number
 * written as a string and takes one step (with `numericStrings` — moves the counter to its digits); any other
 * string ('S', 'C') is just a label and takes no number. Only units without a label use `enumerable`.
 */
function number(sections, start, warn, moves) {
    const units = [];
    let counter = (start ?? 1) - 1;

    for (const section of sections) {
        if (section.start != null) counter = section.start - 1;

        for (const entrance of section.entrances) {
            if (entrance.start != null) counter = entrance.start - 1;

            for (const floor of entrance.floors) {
                if (entrance.props[floor]?.start != null) counter = entrance.props[floor].start - 1;
                const direction = numberDirection(entrance, floor);
                const row = entrance.grid.get(floor);
                const onFloor = [];

                for (const cell of direction === 'rtl' ? [...row].reverse() : row) {
                    // a cell of merged flats takes its number with it: the number of the flat that was there is gone
                    if (cell.type === 'covered' && cell.by.fields.merged && cell.was?.type !== 'hole') counter++;
                    if (cell.type !== 'unit') continue;
                    onFloor.push(cell);

                    const {fields} = cell;
                    const kind = fields.kind || 'flat';
                    const enumerable = fields.enumerable !== false;

                    let label;
                    if (typeof fields.label === 'number') counter = label = fields.label;
                    else if (fields.label != null) {
                        label = String(fields.label);
                        const digits = /^\d+/.exec(label);
                        if (digits) counter = entrance.config.numericStrings ? Number(digits[0]) : counter + 1;
                    } else if (enumerable) label = ++counter;

                    const path = {section: section.index, entrance: entrance.index, floor, position: cell.col + 1};
                    const id = String(fields.id ?? label ?? `${path.section}.${path.entrance}.${floor}.${path.position}`);

                    Object.assign(cell, {id, label, kind, enumerable, path});
                    units.push(cell);
                }

                patchUnits(entrance, floor, onFloor, direction, moves, warn);
            }
        }
    }

    const placed = units.filter(cell => cell.type === 'unit');     // `10: null` turned some into holes
    keys(placed, warn);
    return placed;
}

const LEVELS = ['section', 'entrance', 'floor'];

/**
 * Where numbering starts again, the number alone is not a key: the key grows by what tells the flats apart.
 * Sections numbered each from 1 (two houses in one building, 7 and 7a) — section-flat: '2-5'; entrances numbered
 * each from 1 in several sections — section-entrance-flat: '2-1-5'. A level that has one value in the house tells
 * nothing apart and is left out: one section with entrances from 1 — entrance-flat: '2-5'. All the numbers of a house
 * have keys of one shape; labels without a number ('C') are keyed apart from them, the same way. An explicit `id`
 * is the key as it is; a unit without a number or a label is keyed by its place ('1.1.1.4'), which is unique anyway.
 * What repeats at every depth — the same number twice on one floor — is a mistake, and is reported.
 */
function keys(units, warn) {
    const numbered = cell => typeof cell.label === 'number' || /^\d/.test(cell.label ?? '');
    const groups = [
        units.filter(cell => cell.fields.id == null && cell.label != null && numbered(cell)),
        units.filter(cell => cell.fields.id == null && cell.label != null && !numbered(cell))
    ];
    // the levels that have more than one value in the house: one section, or entrances one per section, tell nothing
    const many = LEVELS.filter(level => new Set(units.map(cell => cell.path[level])).size > 1);
    const keyOf = (cell, depth) => [...LEVELS.slice(0, depth).filter(level => many.includes(level)).map(level => cell.path[level]), cell.id].join('-');
    const repeats = (cells, depth) => cells.length - new Set(cells.map(cell => keyOf(cell, depth))).size;

    for (const cells of groups) {
        const least = repeats(cells, LEVELS.length);
        const depth = [0, 1, 2, 3].find(depth => repeats(cells, depth) === least);
        for (const cell of cells) cell.id = keyOf(cell, depth);
    }

    const seen = new Set();
    for (const cell of units) {
        if (seen.has(cell.id)) warn(`duplicate unit id ${cell.id} (section ${cell.path.section}, entrance ${cell.path.entrance}, floor ${cell.path.floor})`);
        seen.add(cell.id);
    }
}

// left to right or right to left: the floor's own, else the entrance's (cascaded from above), else as `direction`
function numberDirection(entrance, floor) {
    return entrance.props[floor]?.numberDirection ?? entrance.config.numberDirection ?? entrance.config.direction ?? 'ltr';
}

// what a patch by unit number may not change: these would change the unit's own number or the ones before it
const STRUCTURE = ['label', 'kind', 'enumerable', 'id'];
const SPANS = ['colSpan', 'rowSpan', 'merged'];

/**
 * Keys of a floor object that are ids of units on that floor (`54: {oldman: true}`) patch those units' data.
 * They are applied after the numbering, so they address the numbers you see. A kind or an explicit label
 * changes the numbering itself — that goes by position (`'@1': …`).
 *
 * A span may go by number too (`20: {rowSpan: 2}` — a duplex), if it goes forward in the numbering: up, and along
 * the floor's direction. It moves only the numbers after the unit; resolve() puts it at the unit's position.
 * Flats merged in a built house keep the numbering as it was: `20: {colSpan: -2, merged: true}` — 20 takes the place
 * of 19 too, 19 is gone, nothing moves; so a merged span may go any way.
 *
 * `10: null` makes a hole where 10 was: there is nothing there, 10 is simply not used, no other number moves.
 * (`'@1': null` is a place without a flat before the numbering — the numbers go on without it.)
 */
function patchUnits(entrance, floor, cells, direction, moves, warn) {
    const props = entrance.props[floor];
    if (!props) return;

    const where = `section ${entrance.path.section}, entrance ${entrance.path.entrance}, floor ${floor}`;
    const byId = new Map(cells.map(cell => [cell.id, cell]));

    for (const [key, value] of Object.entries(props)) {
        const cell = byId.get(key);
        if (!cell) {
            if (/^\d/.test(key)) {
                warn(`${where} has no unit ${key} (units here: ${[...byId.keys()].join(', ') || 'none'})`
                    + ` — a place without a flat, a kind or a span goes by position: '@1'`);
                delete props[key];
            }
            continue;   // a field of the floor: mark, render, start…
        }

        delete props[key];
        if (value === null) {
            // the unit and every cell of its span become holes; it leaves the list of units
            const {floors: [from, to], cols: [left, right]} = cell.rect;
            for (const f of entrance.floors.filter(f => f >= from && f <= to)) {
                for (let c = left; c <= right; c++) entrance.grid.get(f)[c] = {type: 'hole', was: cell.id};
            }
            cell.type = 'hole';
            continue;
        }

        const patch = value;
        if (!isObject(patch)) {
            warn(`${where}, unit ${key}: a patch by number is an object of fields, or null for a hole`);
            continue;
        }

        const structural = Object.keys(patch).filter(field => STRUCTURE.includes(field));
        if (structural.length) {
            warn(`${where}, unit ${key}: ${structural.join(', ')} would change the numbering — write it by position: '@n'`);
        }

        const spans = SPANS.filter(field => field in patch && patch[field] !== (cell.fields[field] ?? {colSpan: 1, rowSpan: 1}[field]));
        if (spans.length) {
            const {colSpan = 1, rowSpan = 1, merged} = patch;
            const back = !merged && (rowSpan < -1 || (direction === 'rtl' ? colSpan > 1 : colSpan < -1));
            if (back) {
                warn(`${where}, unit ${key}: by number a span goes forward in the numbering — up (rowSpan > 0) and `
                    + `${direction === 'rtl' ? 'to the left (colSpan < 0)' : 'to the right (colSpan > 0)'}, `
                    + `any other way it would move the numbers before it; flats merged in a built house keep `
                    + `their numbers — merged: true; or write it by position: '@n'`);
            } else if (!entrance.moved.some(move => move.floor === cell.floor && move.col === cell.col)) {
                moves.push({
                    ...entrance.path, floor: cell.floor, col: cell.col,
                    fields: Object.fromEntries(spans.map(field => [field, patch[field]]))
                });
            }
        }

        const fields = omit(patch, [...STRUCTURE, ...SPANS]);
        cell.fields = merge(cell.fields, fields);
        if (typeof fields.render === 'function') cell.renders = [...cell.renders, fields.render];
    }
}

/**
 * The model as plain matrices, top floor first, the way they are written by hand:
 * a number or a label for plain units, an object for spans and non-flat kinds, null for holes, covered cells omitted.
 * @returns {Array<Array<Array<Array<*>>>>} sections → entrances → rows → cells
 */
export function matrix(model) {
    return model.sections.map(section => section.entrances.map(entrance =>
        [...entrance.floors].reverse().map(floor => entrance.grid.get(floor)
            .filter(cell => cell.type !== 'covered')
            .map(compact))
    ));
}

function compact(cell) {
    if (cell.type !== 'unit') return null;

    const {colSpan = 1, rowSpan = 1} = cell.fields;
    const plain = colSpan === 1 && rowSpan === 1 && (cell.kind === 'flat' || cell.kind === 'special');
    if (plain) return cell.label ?? null;

    return {
        ...(cell.label != null && {label: cell.label}),
        ...(cell.kind !== 'flat' && {kind: cell.kind}),
        ...(colSpan !== 1 && {colSpan}),
        ...(rowSpan !== 1 && {rowSpan}),
        ...(cell.fields.merged && {merged: true})
    };
}

/**
 * One key for everything about floors: `floors: 22` is sugar for `{from: 1, to: 22}`,
 * and the object form also carries the floors that differ: `{to: 22, 1: {…}, 22: 3}`.
 * It is normalized before the cascade, so `floors: 22` above and `floors: {22: 3}` below merge.
 */
function normalize(scope, warn) {
    const {floors} = scope;
    if (floors == null || isObject(floors)) return scope;
    if (typeof floors === 'number') return {...scope, floors: {from: 1, to: floors}};

    warn(`floors: ${JSON.stringify(floors)} — expected a number or {from, to, <floor>: …}`);
    return omit(scope, ['floors']);
}

/**
 * With groundFloor 1 (UA, US) there is no floor 0: below 1 comes -1, unless 0 is written explicitly.
 * With groundFloor 0 (most of Europe) 0 is the ground floor.
 */
function floorRange(floors, groundFloor) {
    const keys = Object.keys(floors).filter(key => /^-?\d+$/.test(key)).map(Number);
    const from = floors.from ?? Math.min(groundFloor, ...keys);
    const to = floors.to ?? Math.max(...keys);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
    return range(from, to).filter(floor => floor !== 0 || groundFloor === 0 || keys.includes(0));
}

/**
 * Floor → level: the row of the picture. Floors from the ground floor up are levels 1, 2, …;
 * the floors below stack right under it (0, -1, …) without gaps; `base` lifts or lowers the whole entrance.
 */
function levelsOf(floors, groundFloor, base) {
    const below = floors.filter(floor => floor < groundFloor).sort((a, b) => b - a);
    return new Map(floors.map(floor => [
        floor,
        base + (floor >= groundFloor ? floor - groundFloor + 1 : -below.indexOf(floor))
    ]));
}

// HTML semantics with a direction: 2 — this and the next one, -2 — this and the previous one
function span(from, size) {
    const length = Math.max(1, Math.abs(size));
    return Array.from({length}, (_, i) => size < 0 ? from - length + 1 + i : from + i);
}

function range(from, to) {
    return Array.from({length: to - from + 1}, (_, i) => from + i);
}

function list(value) {
    if (value == null) return [{}];
    if (typeof value === 'number') return Array.from({length: value}, () => ({}));
    if (Array.isArray(value)) return value.map(item => item ?? {});
    return [value];
}

function omit(object = {}, keys) {
    return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
}
