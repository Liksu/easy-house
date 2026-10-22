// Colours a unit by a field of its state, like the reactions in heroes house.js: the outline and the number take
// the colour of the reaction (textColors), the number goes bold; with `fill` the square takes its fill too
// (fillSelected, fillColors). Units without a reaction stay as they are, or, with `always`, get the `none` colours
// (alwaysBorder).
//
//   new House(target, config, {57: {reaction: 'yes'}});  house.update({57: {reaction: 'no'}});
//
// Everything about the look is an option, in three layers, each on top of the one before:
//   colors / fills — a colour per reaction (the outline and the number / the fill), the short way;
//   style          — what every unit with a reaction gets besides its colours: {strokeWidth: 2, fontWeight: 'bold'};
//   styles         — per reaction, any keys of the style: {maybe: {fontWeight: 'normal', fontSize: 10}};
//                    `none` — units without a reaction.
// Options cascade by the plugin's name like any other, so a floor or a unit can have its own.
//
// It also counts its reactions — all of that is here, the house knows nothing of it — and may write what it counted
// with the text block (text.js): `percent` (showPercent in heroes) and `legend` (showLegend), both off by default:
//   reactions: {percent: true, legend: true}  or  {percent: {at: 'floor:22', show: 'no'}, legend: {at: 'top'}}
// Counting: groups are the reactions, synonyms counted as one (`paid` as `yes`); units without a reaction are the
// `none` group; `counts` decides which units are counted at all. From outside: count(house).
//
// The same plugin under another name reads another field, and counts and writes its own:
// {use: reactions, name: 'payments', options: {field: 'payment', colors: {paid: 'green'}, legend: true}}.
import {defaults as blockDefaults, lines, band, block, fill} from './text.js';
import {instances} from '../plugins.js';
import {unitConfig} from '../scene.js';
import {merge} from '../utils.js';
import {paint} from '../colors.js';

// the blocks it writes: the text block's options, and their own
const percentDefaults = {...blockDefaults, at: 'top', x: '100%', align: 'right', scale: 1.7, weight: 'bold', show: 'yes', text: null};
const legendDefaults = {
    ...blockDefaults, at: 'bottom', font: 'monospace', keep: ['yes'], decimal: 2,
    line: '{{name}}: {{count}} / {{total}} = {{share}}% ≈ {{percent}}%'
};

export default {
    name: 'reactions',
    options: {
        field: 'reaction',      // the field of the unit's state
        colors: {yes: '$yes', no: '$no', maybe: '$maybe', ignore: '$ignore', none: '$none'},     // outline and number
        fills: {yes: '$yesFill', no: '$noFill', maybe: '$maybeFill', ignore: '$ignoreFill', none: '$noneFill'},
        fill: false,            // fill the square by the reaction too
        always: false,          // units without a reaction get an outline of colors.none (and fills.none with fill)
        style: {strokeWidth: 2, fontWeight: 'bold'},
        styles: {},             // {yes: {…}, none: {…}} — any style keys per reaction

        // counting
        synonyms: {},           // a reaction counted as another one: {paid: 'yes'}
        none: 'none',           // the group of the units without a reaction; null — they are not counted
        counts: ({unit, reaction}) => reaction != null || unit.config.enumerable,     // which units are counted
        names: {},              // what a group is called: {yes: 'да'}; by default its key
        order: null,            // the groups in this order (a legend); by default — as in `colors`

        // what it writes — text blocks (text.js options), off when null
        percent: null,          // true or {show: 'yes' | 'count:no' | 'yes/no', text: ['{{no.percent}}%'], at, x, y, …}
        legend: null            // true or {line: '{{name}}: {{count}}', keep: ['yes'], decimal: 2, at, x, y, …}
    },

    style({unit, options}) {
        const {colors, fills, style, styles} = options;
        const reaction = unit.state[options.field];

        if (reaction == null) return {
            ...(options.always && {stroke: colors.none, strokeWidth: style.strokeWidth}),
            ...(options.fill && {fill: fills.none}),
            ...styles.none
        };

        return {
            stroke: colors[reaction],
            color: colors[reaction],
            ...style,
            ...(options.fill && {fill: fills[reaction] ?? fills.none}),
            ...styles[reaction]
        };
    },

    // the room of the percent and the legend when they stand above or below the house
    gutters({model, state, options, geometry}) {
        const written = writings(tally(unitsOf(model, state), options), options);
        return written.map(({part, text, options}) => band(text, options, geometry, part)).filter(Boolean);
    },

    house({house, name, options, gutters}) {
        const units = house.sections.flatMap(section => section.entrances.flatMap(entrance => entrance.floors.flatMap(floor => floor.units)));
        return writings(tally(units, options), options).map(({part, text, options}) =>
            block(text, paint(options, house.colors), {house, bands: gutters.filter(gutter => gutter.part === part), name: `${name} ${part}`}));
    }
};

/**
 * What the reactions of a house are, counted: {total, groups: [{key, name, count, share, percent, color}], yes: {…}, …}.
 * @param {Object} house — a House
 * @param {string} [name] — the instance: 'payments' for {use: reactions, name: 'payments'}
 */
export function count(house, name = 'reactions') {
    const instance = instances(house.plugins, house.effective ?? house.config).find(entry => entry.name === name);
    return instance ? tally(unitsOf(house.model, house.state), instance.options) : null;
}

function unitsOf(model, state = {}) {
    return model.units.map(cell => ({config: unitConfig(cell), state: state[cell.id] ?? {}}));
}

function tally(units, options) {
    const {field, synonyms, none, colors, names, order: first} = options;
    const counted = new Map();
    for (const unit of units) {
        const reaction = unit.state[field] ?? null;
        if (!options.counts({unit, reaction})) continue;
        const group = reaction == null ? none : synonyms[reaction] ?? reaction;
        if (group != null) counted.set(group, (counted.get(group) ?? 0) + 1);
    }

    // every group the colours know (in their order, or in `order`) is there even when empty, then the ones met
    const known = first ?? Object.keys(colors).filter(key => !(key in synonyms) && (key !== 'none' || none === 'none'));
    const order = [...new Set([...known, ...counted.keys()])];
    const total = [...counted.values()].reduce((sum, count) => sum + count, 0);
    const groups = order.map(key => {
        const count = counted.get(key) ?? 0;
        const share = total ? count / total * 100 : 0;
        return {key, name: names[key] ?? key, count, share, percent: Math.round(share), color: colors[key]};
    });
    return {total, groups, ...Object.fromEntries(groups.map(group => [group.key, group]))};
}

// the blocks to write, with their lines and options
function writings(counted, options) {
    const blocks = [];
    if (options.percent) {
        const own = merge(percentDefaults, options.percent === true ? {} : options.percent);
        blocks.push({part: 'percent', options: own, text: percentLines(counted, own)});
    }
    if (options.legend) {
        const own = merge(legendDefaults, options.legend === true ? {} : options.legend);
        blocks.push({part: 'legend', options: own, text: legendLines(counted, own)});
    }
    return blocks;
}

/**
 * The percent of heroes (showPercent), big and bold, in the group's colour:
 *   show: 'yes'       — the share of a group: 78% (an unknown group — yes, as in heroes)
 *         'count:no'  — its count: =14 ('count' — of yes)
 *         'yes/no'    — two counts side by side, each in its colour: 83 / 14
 * or lines of your own with what was counted: text: ['{{no.percent}}% против'].
 */
function percentLines(counted, options) {
    if (options.text) {
        return lines(options.text).map(parts => parts.map(part => ({
            ...part,
            value: fill(part.value, counted),
            ...(part.color && {color: fill(part.color, counted)})
        })));
    }

    const group = key => counted[key] ?? {count: 0, percent: 0};
    const show = String(options.show);
    const [, compared, against] = /^(\w+)\/(\w+)$/.exec(show) || [];
    if (compared) return lines([[
        {value: group(compared).count, color: group(compared).color},
        {value: ' / ', color: counted.none?.color},
        {value: group(against).count, color: group(against).color}
    ]]);

    const counting = /^count(?::(\w+))?$/.exec(show);
    if (counting) {
        const of = counting[1] ?? 'yes';
        return lines([{value: `=${group(of).count}`, color: group(of).color}]);
    }
    const of = show in counted ? show : 'yes';
    return lines([{value: `${group(of).percent}%`, color: group(of).color}]);
}

/**
 * The legend of heroes: a line per group — `да: 83 / 106 = 78.30% ≈ 78%`, in the group's colour. The line is the
 * template `line`: {{name}}, {{key}}, {{count}}, {{total}}, {{share}} (exact, `decimal` digits, cut, not rounded),
 * {{percent}} (rounded). Every value is padded to the widest of any group, shown or not, so the columns stand in
 * line. Empty groups are left out, except those in `keep`.
 */
function legendLines({total, groups}, options) {
    const accuracy = 10 ** options.decimal;
    const rows = groups.map(group => ({
        group,
        values: {
            name: String(group.name),
            key: String(group.key),
            count: String(group.count),
            total: String(total),
            share: (Math.floor(group.share * accuracy) / accuracy).toFixed(options.decimal),
            percent: String(group.percent)
        }
    }));
    const widths = Object.fromEntries(Object.keys(rows[0]?.values ?? {})
        .map(key => [key, Math.max(...rows.map(row => row.values[key].length))]));

    return lines(rows
        .filter(row => row.group.count || options.keep.includes(row.group.key))
        .map(row => ({
            value: fill(options.line, Object.fromEntries(Object.entries(row.values).map(([key, value]) => [key, value.padStart(widths[key])]))),
            color: row.group.color
        })));
}
