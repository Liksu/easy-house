// Layout + plugins → a tree of svg-easy-tree nodes. Pure: builds plain objects; compiling them is House's job.
//
// Groups: svg → section → entrance → floor → unit. For every group the scene calls the hook of that level
// in every plugin, in `plugins` order; a hook returns a node, an array of nodes or nothing, and they go into
// the group after its children (so they paint on top).
//
// A unit is drawn in three steps:
//   style  — how it looks: every plugin with a `style` hook adds to `ctx.style` in `plugins` order, later ones win,
//            like CSS rules (cells gives the defaults from its options, reactions colours by the state);
//   render — the unit itself: plugins with a `render` hook wrap each other in `plugins` order, every one gets
//            `base(patch)` — the drawing of the ones before it (cells, the first, draws the square by `ctx.style`);
//   unit   — things over it (icons, marks), every plugin adds its own; `unit.place(corner, w, h)` gives the next
//            free place in a corner, so marks of different plugins stack instead of overlapping.
//
// One ctx for every level, the same names everywhere:
//   house, section, entrance, floor, unit — the chain of levels down to the current one; each level is
//       config — everything resolved about it: its settings after the cascade and its identity
//                (unit: its fields + id, label, kind, enumerable, path, rect; floor: + floor, level;
//                 entrance and section: + index, render)
//       box    — the rectangle it is drawn in (pixels, from the layout)
//       node   — its group in the svg-easy-tree tree: return nodes, or add to any group up the chain
//       state  — the unit's data that changes (`house.update`), `{}` when there is none;
//                the house has the whole map, by unit id
//       and its children: house.sections → section.entrances → entrance.floors → floor.units
//   name    — the name of this instance of the plugin (one plugin can run under several names)
//   options — its options at this level: the house's `config[name]` with the same key of every level on the way
//             down merged on top (a floor's `cells: {fill}` paints that floor); null there switches it off
//   style   — for unit hooks: how the unit looks — {fill, stroke, strokeWidth, color, font, fontSize, fontWeight}
//   gutters — for section and entrance hooks: the room this instance reserved there; for the house hook —
//             its bands above or below the house
//   house.colors — the palette (colors.js): the colours by name, a theme's or the config's own
//
// `render` in the config of a section, an entrance, a floor (or a unit, see cells) replaces what would be drawn
// there; it gets the same ctx plus `base(patch)` — the drawing it replaces, so it can be wrapped instead.
import {instances, optionsAt} from './plugins.js';
import {paletteOf, paint} from './colors.js';

/**
 * @param {Object} layout — the result of layout()
 * @param {Array<Object>} plugins
 * @param {Object} [config] — the house config
 * @param {Object} [state] — the data of the units by id: {57: {reaction: 'yes'}}
 */
export function scene(layout, plugins, config = {}, state = {}) {
    const active = instances(plugins, config);
    // `configs` — the configs of the levels on the way down, for the options of each instance at this level
    const run = (hook, ctx, configs, gutters) => active.flatMap(instance => {
        if (!instance.plugin[hook]) return [];
        const options = optionsAt(instance, ...configs);
        if (!options) return [];
        return nodes(instance.plugin[hook]({
            ...ctx,
            name: instance.name,
            options,
            ...(gutters && {gutters: gutters.filter(gutter => gutter.plugin === instance.name)})
        }));
    });

    // how a unit looks: style hooks add to it one after another, empty values do not count
    const styles = active.filter(instance => instance.plugin.style);
    const look = (ctx, configs) => styles.reduce((style, instance) => {
        const options = optionsAt(instance, ...configs);
        if (!options) return style;
        const own = instance.plugin.style({...ctx, style, name: instance.name, options}) || {};
        return {...style, ...Object.fromEntries(Object.entries(own).filter(([, value]) => value != null))};
    }, {});

    // the unit itself: render hooks wrap each other, base() of each is the drawing of the ones before it
    const renders = active.filter(instance => instance.plugin.render);
    const body = (ctx, configs) => renders.reduce((inner, instance) => (outer, patch) => {
        const options = optionsAt(instance, ...configs);
        if (!options) return inner(outer, patch);       // switched off here: see through it
        const current = extend({...outer, name: instance.name, options}, patch);
        return nodes(instance.plugin.render({...current, base: next => inner(current, next)}));
    }, () => [])(ctx);

    const {width, height} = layout;
    const colors = paletteOf(config);
    const background = paint(config.background ?? '$background', colors);
    const svg = {
        tag: 'svg',
        opt: {viewBox: `0 0 ${width} ${height}`, width, height, class: 'easy-house', ...(background && {style: `background: ${background}`})},
        sub: []
    };
    const house = {...levels(layout, config, state), colors, node: svg};

    for (const section of house.sections) {
        section.node = group('section', {'data-section': section.config.index});

        const entrances = () => section.entrances.map(entrance => {
            entrance.node = group('entrance', {'data-entrance': entrance.config.index});

            const floors = () => entrance.floors.map(floor => {
                floor.node = group('floor', {'data-floor': floor.config.floor});

                const units = () => floor.units.map(unit => {
                    unit.node = group(`unit ${unit.config.kind}`, marks(unit.config, entrance));
                    unit.place = placer(unit.box);
                    const ctx = {house, section, entrance, floor, unit};
                    const configs = [entrance.config, floor.config, unit.config];
                    ctx.style = look(ctx, configs);
                    unit.node.sub = [...body(ctx, configs), ...run('unit', ctx, configs)];
                    return unit.node;
                });

                const ctx = {house, section, entrance, floor};
                floor.node.sub = [...override(floor.config.render, ctx, units), ...run('floor', ctx, [entrance.config, floor.config])];
                return floor.node;
            });

            const ctx = {house, section, entrance};
            entrance.node.sub = [
                ...override(entrance.config.render, ctx, floors),
                ...run('entrance', ctx, [entrance.config], entrance.gutters)
            ];
            return entrance.node;
        });

        const ctx = {house, section};
        section.node.sub = [...override(section.config.render, ctx, entrances), ...run('section', ctx, [section.config], section.gutters)];
        svg.sub.push(section.node);
    }

    // the house hook gets the bands its instance reserved above or below the house
    svg.sub.push(...run('house', {house}, [], layout.bands ?? []));
    return svg;
}

/**
 * The tree of levels: house → sections → entrances → floors → units, each {config, box, …children};
 * units also have `state` — their data from the state map (`{}` when there is none), the house has the whole map.
 * The scene adds `node` to every level; House uses the same tree for events.
 */
export function levels(layout, config = {}, state = {}) {
    return {
        config,
        box: {x: 0, y: 0, width: layout.width, height: layout.height},
        layout,
        state,
        sections: layout.sections.map(placed => ({
            config: {...placed.model.config, index: placed.index, base: placed.model.base, render: placed.model.render},
            box: placed.box,
            gutters: placed.gutters,
            entrances: placed.entrances.map(entrance => ({
                config: {...entrance.model.config, index: entrance.index, section: placed.index, render: entrance.model.render},
                box: entrance.box,
                frame: entrance.frame,      // the box together with the entrance's own gutters
                gutters: entrance.gutters,
                floors: entrance.floors.map(row => ({
                    config: {...row.config, floor: row.floor, level: row.level},
                    box: row.box,
                    units: row.units.map(({cell, box}) => ({config: unitConfig(cell), box, state: state[cell.id] ?? {}}))
                }))
            }))
        }))
    };
}

// everything the resolver knows about a unit: its fields (flat + kind + own + patches) and what it computed
export function unitConfig(cell) {
    const {id, label, kind, enumerable, path, rect, renders} = cell;
    return {...cell.fields, id, label, kind, enumerable, path, rect, renders};
}

// a render from the config replaces the drawing of its place and may call base() to get it anyway
function override(render, ctx, drawing) {
    return typeof render === 'function' ? nodes(render({...ctx, base: drawing})) : drawing();
}

/**
 * Where a unit is, on its group — to find units in the drawing by CSS or querySelector:
 * data-unit (id), data-section, data-entrance, data-floor and data-position (where it is written), and all the floors
 * and positions it takes, space-separated, for `~=`: a duplex is on both floors — [data-floors~="6"].
 */
function marks({id, path, rect}, entrance) {
    const {floors: [from, to], cols: [first, last]} = rect;
    const floors = entrance.floors.map(row => row.config.floor).filter(floor => floor >= from && floor <= to);
    const positions = Array.from({length: last - first + 1}, (_, i) => first + i + 1);
    return {
        'data-unit': id,
        'data-section': path.section,
        'data-entrance': path.entrance,
        'data-floor': path.floor,
        'data-position': path.position,
        'data-floors': floors.join(' '),
        'data-positions': positions.join(' ')
    };
}

/**
 * Small things in the corners of a box, side by side: every call takes the next free place
 * from the corner inwards — `place('bottom-right', 10)`, then the next one to its left.
 */
function placer(box, inset = 2, gap = 1) {
    const used = {};
    return (corner = 'bottom-right', width = 10, height = width) => {
        const offset = used[corner] ?? 0;
        used[corner] = offset + width + gap;
        const right = corner.endsWith('right');
        const bottom = corner.startsWith('bottom');
        return {
            x: right ? box.x + box.width - inset - offset - width : box.x + inset + offset,
            y: bottom ? box.y + box.height - inset - height : box.y + inset,
            width,
            height
        };
    };
}

function group(name, data) {
    return {tag: 'g', opt: {class: name, ...data}, sub: []};
}

export function nodes(result) {
    if (result == null || result === false) return [];
    return Array.isArray(result) ? result.flat(Infinity).filter(Boolean) : [result];
}

/**
 * Applies a patch to a ctx: plain objects are merged at any depth, everything else is replaced —
 * so `base({style: {fill: 'pink'}})` keeps the rest of the style and `base({unit: {config: {label: '★'}}})`
 * the rest of the unit. Untouched branches are shared, not copied.
 */
export function extend(target, patch = {}) {
    const result = {...target};
    for (const [key, value] of Object.entries(patch)) {
        result[key] = plain(value) && plain(target?.[key]) ? extend(target[key], value) : value;
    }
    return result;
}

function plain(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
