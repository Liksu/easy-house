// The palette: every colour the built-in plugins use, by name. An option may name one — `fill: '$unit'` — and
// gets that colour of the house's palette; the defaults of the plugins all do. So a theme is, first of all, another
// palette (themes.js), and `colors: {unit: 'ivory'}` in a config changes the squares of every plugin that draws them.
// A plugin reads the palette as `house.colors`.

export const colors = {
    background: null,               // the background of the picture; none — the page shows through
    unit: 'whitesmoke',             // the square of a unit
    label: 'gray',                  // what is written on it
    wall: '#e9ecef',                // the body of a section, behind its units (the walls plugin)
    floorLabel: '#555',             // floor numbers
    sectionLine: '#999',            // the line between sections
    entranceLine: '#ccc',           // between entrances
    text: '#333',                   // text blocks
    // reactions: the outline and the label …
    yes: 'green',
    no: 'red',
    maybe: 'orange',
    ignore: 'gray',
    none: 'gray',
    // … the fill …
    yesFill: 'lightgreen',
    noFill: 'pink',
    maybeFill: 'lightyellow',
    ignoreFill: 'gainsboro',
    noneFill: 'gainsboro',
    // … and the fill on a small house, brighter
    yesBright: 'mediumseagreen',
    noBright: 'salmon',
    maybeBright: 'orange',
    glow: null,                     // a light around a unit with a reaction (the night theme)
    stacks: ['mistyrose', 'blanchedalmond', 'lemonchiffon', 'honeydew', 'aliceblue'],
    highlight: '#1e88e5',           // the outline under the pointer
    aim: '#e3f2fd',                 // the floor and the stack it aims along
    hole: '#fff5f5',                // a destroyed flat
    holeLine: '#c66'
};

/** The palette of a config: the default one with its own `colors` over it. */
export function paletteOf(config = {}) {
    return {...colors, ...config.colors};
}

/**
 * '$name' → that colour of the palette; anything else — a colour, a text, a name the palette does not have — as it
 * is (so '$5 a month' in a text stays a text). Objects and arrays are painted at any depth; functions are left alone.
 */
export function paint(value, palette) {
    if (typeof value === 'string') {
        const name = /^\$([A-Za-z][\w-]*)$/.exec(value)?.[1];
        return name && Object.hasOwn(palette, name) ? palette[name] : value;
    }
    if (Array.isArray(value)) return value.map(item => paint(item, palette));
    if (Object.prototype.toString.call(value) === '[object Object]') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, paint(item, palette)]));
    }
    return value;
}
