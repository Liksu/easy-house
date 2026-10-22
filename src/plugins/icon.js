// A small mark in a corner of a unit. The mechanics are the same for any mark, so it is one plugin
// used under several names, each with its own settings:
//
//   plugins: [...House.plugins,
//       {use: icon, name: 'oldman', options: {icon: '👴🏻'}},
//       {use: icon, name: 'rental', options: {icon: '💰'}}]
//
// A unit gets the mark when it has the instance's name — `54: {oldman: true}` — or its number is in the
// instance's `units`: `oldman: {units: [6, 10, 21]}`. Marks of different instances in one corner stand side by side
// (`unit.place`), so a pensioner can rent out a flat. (heroes put both on one spot, one over the other.)

export default {
    name: 'icon',
    options: {
        icon: '•',
        corner: 'bottom-right',     // top-left | top-right | bottom-left | bottom-right
        size: null,                 // by default from the unit size: 80% of the text in a heroes square
        color: null,                // the fill of a text mark (emoji have colours of their own); heroes: 'blue'
        font: null,                 // heroes: 'arial, sans-serif'
        title: null,                // a tooltip of the mark: 'пенсионер'
        units: []                   // unit numbers (ids) that get the mark
    },

    unit({unit, name, options}) {
        const marked = unit.config[name] || options.units.map(String).includes(unit.config.id);
        if (!marked) return null;

        const size = options.size ?? Math.round(unit.box.height * 0.36);
        const place = unit.place(options.corner, size, size);
        return {
            tag: 'text',
            val: options.icon,
            opt: {
                class: `icon ${name}`,
                x: place.x + place.width / 2,
                y: place.y + place.height / 2,
                'font-size': size,
                ...(options.color && {fill: options.color}),
                ...(options.font && {'font-family': options.font}),
                'text-anchor': 'middle',
                'dominant-baseline': 'central'
            },
            ...(options.title && {sub: [{tag: 'title', val: escape(options.title)}]})
        };
    }
};

function escape(text) {
    return String(text).replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[char]);
}
