// The base unit renderer: a square with the unit's label, like addFlat() in heroes house.js.
// It is a `render` hook and comes first in House.plugins, so other render hooks wrap it.
//
// A unit may have its own `render`: from `kinds.flat`, from its kind and from its own description.
// They chain like layers: the most specific one is called, and its `base(patch)` is the next more general one,
// down to the square. So nobody is lost silently — each level decides whether to build on what is below.
//
// Everything is drawn in `unit.box` — the same coordinates as the whole svg-easy-tree tree (no group is transformed),
// so what the layout reserved is exactly where the square lands.
//
// How it looks is `ctx.style`: cells puts its options there first (its `style` hook), plugins after it change what
// they need (reactions — the outline and the number), and a render can patch it for what is below: base({style: {fill}}).
import {nodes, extend} from '../scene.js';

function square({unit, style, options, house}) {
    const {box, config: {label}} = unit;
    const sub = [{
        tag: 'rect',
        opt: {
            x: box.x, y: box.y, width: box.width, height: box.height, fill: style.fill,
            ...(style.stroke && {stroke: style.stroke, 'stroke-width': style.strokeWidth}),
            ...(style.glow && {style: `filter: drop-shadow(0 0 ${Math.max(1, Math.round(box.height * 0.18))}px ${style.glow})`})
        }
    }];

    if (options.numbers && label != null) sub.push({
        tag: 'text',
        val: escape(label),
        opt: {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            fill: style.color,
            'font-family': style.font,
            'font-size': style.fontSize ?? Math.round(house.layout.geometry.size * 0.4),
            ...(style.fontWeight && {'font-weight': style.fontWeight}),
            'text-anchor': 'middle',
            'dominant-baseline': 'central'
        }
    });

    return sub;
}

export default {
    name: 'cells',
    options: {
        numbers: true,
        // the style every unit starts with
        fill: '$unit',          // risers_monocolor in heroes: whitesmoke
        stroke: null,           // no outline
        strokeWidth: 2,         // borders in heroes
        color: '$label',        // textColors.null in heroes: gray
        font: 'arial, sans-serif',
        fontSize: null,         // by default from the unit size
        fontWeight: null,
        glow: null              // a light around the square: a colour (the night theme lights windows with it)
    },
    style({options: {numbers, ...style}}) {
        return style;
    },
    render(ctx) {
        const draw = (ctx.unit.config.renders || []).reduce(
            (base, render) => current => nodes(render({...current, base: patch => base(extend(current, patch))})),
            square
        );
        // the unit's title is its tooltip, however it is drawn (heroes: house.title — 'Beauty salon')
        const {title} = ctx.unit.config;
        return [...draw(ctx), ...(title != null ? [{tag: 'title', val: escape(title)}] : [])];
    }
};

function escape(value) {
    return String(value).replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[char]);
}
