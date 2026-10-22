// A flat that is there — its number, its data, its events — with a hole in the house in its place: `18: {hole: true}`.
// (`10: null` is different: there is nothing at all.) Per-flat settings ride on the same key, the plugin's name:
// `23: {hole: {note: '2022'}}`; house-wide ones on the house's `hole: {…}`.
//
// It is a `render` hook: instead of the usual square it draws the hole, keeping the number in sight.

export default {
    name: 'hole',
    options: {
        fill: '$hole',
        stroke: '$holeLine',
        dash: '3 3',
        note: null              // a short text under the number, e.g. a year
    },

    render({unit, name, options, base}) {
        if (!unit.config[name]) return base();

        const {box} = unit;
        return [
            ...base({style: {fill: options.fill, color: options.stroke}}),
            {
                tag: 'rect',
                opt: {class: 'hole', ...box, fill: 'none', stroke: options.stroke, 'stroke-dasharray': options.dash}
            },
            options.note && {
                tag: 'text',
                val: options.note,
                opt: {
                    x: box.x + box.width / 2,
                    y: box.y + box.height - 3,
                    fill: options.stroke,
                    'font-size': Math.round(box.height * 0.22),
                    'font-family': 'arial, sans-serif',
                    'text-anchor': 'middle'
                }
            }
        ];
    }
};
