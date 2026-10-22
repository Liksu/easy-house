// A text block in the picture: lines of text tied to a place of the house. It knows nothing of what the text is
// about — the lines are given. Off until named:
//
//   text: {
//       at: 'house',                // 'house' | 'section:2' | 'floor:22' (its row across the house) | 'top' | 'bottom'
//       x: 10, y: '50%',            // inside that place: px from the near edge, negative — from the far edge,
//                                   //   '%' — of its size; align / valign — which side of the text x and y are
//       border: '1px dashed silver',
//       text: [
//           'text string',
//           {value: 'second line', color: 'red', size: 20},
//           {value: ['a', {value: '—', color: 'blue'}, 'b']}      // one line of parts
//       ]
//   }
//
// At 'top' or 'bottom' the block takes a band of its own above or below the house: the picture grows.
// Lines are <tspan>s of one <text>, parts — <tspan>s inside them; spaces are kept (white-space: pre).
//
// The drawing is also a set of functions for other plugins with text of their own: reactions draws its percent and
// legend with them — `lines`, `band`, `block` and `defaults` below; `fill` puts values into '{{yes.percent}}%'.

export const defaults = {
    at: 'house',
    x: 0,
    y: 0,
    align: 'left',          // left | center | right
    valign: 'top',          // top | middle | bottom
    color: '$text',
    font: 'arial, sans-serif',
    size: null,             // by default from the unit size, times `scale`
    scale: 1,
    weight: null,
    lineHeight: 1.3,
    border: null,           // '1px dashed silver'
    padding: 4              // between the text and the border, and around a band
};

export default {
    name: 'text',
    enabled: false,
    options: {...defaults, text: []},

    gutters({options, geometry}) {
        return [band(lines(options.text), options, geometry)].filter(Boolean);
    },

    house({house, options, gutters, name}) {
        return block(lines(options.text), options, {house, bands: gutters, name});
    }
};

/** lines as written → [[part, …], …]; a part is {value, color, size, weight, font} */
export function lines(raw) {
    return [raw ?? []].flat().filter(line => line != null).map(line => partsOf(line, {}));
}

function partsOf(item, inherited) {
    if (item == null) return [];
    if (typeof item !== 'object') return [{...inherited, value: String(item)}];
    if (Array.isArray(item)) return item.flatMap(part => partsOf(part, inherited));
    const {value, ...look} = item;
    return partsOf(value, {...inherited, ...look});
}

/** '{{yes.percent}}%' with the values of `data` (a path in it); nothing there — empty */
export function fill(template, data) {
    return String(template).replace(/\{\{\s*([\w$.]+)\s*\}\}/g, (_, path) => path.split('.').reduce((value, key) => value?.[key], data) ?? '');
}

/**
 * The room a block takes at 'top' or 'bottom' — a reservation for the `gutters` hook; null anywhere else.
 * `part` tells the plugin's blocks apart when it has several (reactions: percent and legend).
 */
export function band(written, options, geometry, part) {
    if (options.at !== 'top' && options.at !== 'bottom' || !written.length) return null;
    const {height, width} = measure(written, options, geometry);
    return {side: options.at, height: Math.ceil(height + 2 * options.padding + geometry.gap), width: width + 2 * options.padding, part};
}

/**
 * The nodes of a block: `written` lines (see lines()) at `options.at` of the house, or in its own band.
 * @param {{house: Object, bands: Array, name: string}} place — the house of the ctx, the bands the plugin reserved,
 *     the class of the block
 */
export function block(written, options, {house, bands = [], name = 'text'}) {
    if (!written.length) return null;
    const {geometry} = house.layout;
    const own = options.at === 'top' || options.at === 'bottom';
    const box = own ? bands[0] : placeOf(options.at, house);
    if (!box) return null;
    // a band: the padding around the text, and a gap from the house on its side
    const inner = own ? inset(box, options.padding, geometry.gap, options.at === 'top') : box;

    const size = sizeOf(options, geometry);
    const step = size * options.lineHeight;
    const x = offset(options.x, inner.x, inner.width);
    const y = offset(options.y, inner.y, inner.height);
    const height = written.length * step;
    const first = {top: y, middle: y - height / 2, bottom: y - height}[options.valign] ?? y;
    const anchor = {left: 'start', center: 'middle', right: 'end'}[options.align] ?? 'start';

    const text = {
        tag: 'text',
        opt: {
            class: `text ${name}`,
            x,
            'text-anchor': anchor,
            'dominant-baseline': 'central',
            fill: options.color,
            'font-family': options.font,
            'font-size': size,
            ...(options.weight && {'font-weight': options.weight}),
            style: 'white-space: pre'
        },
        sub: written.map((parts, i) => ({
            tag: 'tspan',
            opt: {x, y: first + step * (i + 0.5)},
            sub: parts.map(part => ({tag: 'tspan', val: escape(part.value), opt: look(part)}))
        }))
    };
    if (!options.border) return [text];

    const {width} = measure(written, options, geometry);
    const left = {start: x, middle: x - width / 2, end: x - width}[anchor];
    return [frame(options.border, {
        x: left - options.padding,
        y: first - options.padding,
        width: width + 2 * options.padding,
        height: height + 2 * options.padding
    }), text];
}

function look(part) {
    return {
        ...(part.color && {fill: part.color}),
        ...(part.size && {'font-size': part.size}),
        ...(part.weight && {'font-weight': part.weight}),
        ...(part.font && {'font-family': part.font})
    };
}

// the box a block is tied to
function placeOf(at, house) {
    const [kind, which] = String(at).split(':');
    const {sections} = house;
    if (kind === 'house') return around(sections.map(section => section.box));
    if (kind === 'section') return sections.find(section => String(section.config.index) === which)?.box;
    if (kind === 'floor') {
        return around(sections.flatMap(section => section.entrances.flatMap(entrance => entrance.floors))
            .filter(row => String(row.config.floor) === which)
            .map(row => row.box));
    }
    return null;
}

function around(boxes) {
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map(box => box.x));
    const y = Math.min(...boxes.map(box => box.y));
    return {
        x, y,
        width: Math.max(...boxes.map(box => box.x + box.width)) - x,
        height: Math.max(...boxes.map(box => box.y + box.height)) - y
    };
}

function inset(box, padding, gap, above) {
    return {
        x: box.x + padding,
        y: box.y + padding + (above ? 0 : gap),
        width: box.width - 2 * padding,
        height: box.height - 2 * padding - gap
    };
}

// 10 or '10px' — from the near edge, -10 — from the far one, '50%' — of the size
function offset(value, start, size) {
    const text = String(value ?? 0).trim();
    const number = Number.isNaN(parseFloat(text)) ? 0 : parseFloat(text);
    const length = text.endsWith('%') ? number / 100 * size : number;
    return Object.is(length, -0) || length < 0 ? start + size + length : start + length;
}

function sizeOf(options, geometry) {
    return options.size ?? Math.round(geometry.size * 0.4 * options.scale);
}

// no DOM here: a glyph is ~0.6 of the font size (monospace exactly, a proportional font about)
function measure(written, options, geometry) {
    const size = sizeOf(options, geometry);
    const chars = Math.max(...written.map(parts => parts.reduce((sum, part) => sum + [...part.value].length, 0)));
    return {width: Math.ceil(chars * size * 0.6), height: written.length * size * options.lineHeight};
}

// '1px dashed silver' → a rect around the text
function frame(border, box) {
    const [, width = '1', style = 'solid', color = 'silver'] = /^\s*(\d+(?:\.\d+)?)(?:px)?\s+(solid|dashed|dotted)\s+(.+?)\s*$/.exec(border) || [];
    const dash = {dashed: '4 2', dotted: '1 2'}[style];
    return {
        tag: 'rect',
        opt: {class: 'text-border', ...box, fill: 'none', stroke: color, 'stroke-width': Number(width), ...(dash && {'stroke-dasharray': dash})}
    };
}

function escape(value) {
    return String(value).replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[char]);
}
