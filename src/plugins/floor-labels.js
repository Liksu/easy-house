// Floor numbers, like the level labels of heroes house.js — but room is made only where there are labels.
//
//   at: 'house'    — a floor is labelled where it first appears, left to right: the first section labels its floors,
//                    a taller (or lower) section to the right labels only the levels the others do not have
//   at: 'section'  — every section labels all its floors
//   at: 'entrance' — every entrance labels its floors
//
//   mode: 'compact' — (at: 'house' only) the new floors of a section are written over the neighbour's empty space,
//                     no room is taken between sections
//   mode: 'gutter'  — room is reserved for the labels and mirrored on the other side of the gap,
//                     so the divider stays exactly between the unit squares
//
// The text is `format(floor)`, or the floor's own `label` as is: floors: {'-1': {label: 'P'}}.
// A floor's `mark` goes in front of it, as in heroes — `✓ 21:`: floors: {21: {mark: 'done'}}, or several:
// mark: ['done', 'extinguisher']. `marks` turns a mark into what is written; one not there is written as is.
// Any plugin can put its own sign there too — a `mark` hook (see layout): the marks of all plugins stand in front
// of the number in `plugins` order, and the room for the labels counts them.
//
// Switched off on a section or an entrance (`sections: [{}, {floorLabels: null}]`), it takes no room there, and its
// floors are left to the next one at 'house'. Options of a level (a format of its own) are measured as its own.
import {optionsAt} from '../plugins.js';

export default {
    name: 'floorLabels',
    options: {
        at: 'house',
        mode: 'compact',
        format: floor => `${floor}:`,
        marks: {done: '✓', progress: '⏳', extinguisher: '🧯'},     // the icons of heroes
        color: '$floorLabel',
        font: 'verdana, sans-serif',
        fontSize: null          // by default from the unit size
    },

    // its own marks: the floor's `mark` field
    mark({floor, options}) {
        return [floor.config.mark ?? []].flat().map(name => ({text: options.marks?.[name] ?? name, class: `mark ${name}`}));
    },

    gutters({sections, name, options, geometry, marks}) {
        // the options at a section or an entrance; null — switched off there
        const at = scope => optionsAt({name, options}, scope.config);
        const rowsOf = (section, entrances) => labelRows(section, entrances, marks);
        const widthOf = (rows, own) => 2 * geometry.gap + Math.max(...rows.map(row => textWidth(whole(row, own), sizeOf(own, geometry))));
        const reservations = [];

        // the labelled place, and the place before it in visual order, which gets the mirror
        const reserve = (place, rows, own, previous, compact) => {
            if (!rows.length) return;
            const width = compact ? 0 : widthOf(rows, own);
            reservations.push({...place, side: 'left', width, rows, floors: rows.map(row => row.floor)});
            if (previous && width) reservations.push({...previous, side: 'right', width, rows: [], floors: []});
        };

        if (options.at === 'entrance') {
            const places = sections.flatMap(({section, entrances}) => entrances.map(entrance => ({
                place: {section: section.index, entrance: entrance.index},
                own: at(entrance),
                rows: rowsOf(section, [entrance])
            })));
            places.forEach(({place, own, rows}, i) => own && reserve(place, rows, own, places[i - 1]?.place, false));
            return reservations;
        }

        const labelled = new Set();     // levels already labelled further left
        const taken = new Set();        // levels with units further left: compact labels may not go over them
        sections.forEach(({section}, i) => {
            const own = at(section);
            const entrances = section.entrances.filter(entrance => at(entrance));
            const rows = own ? rowsOf(section, entrances) : [];
            const mine = options.at === 'section' ? rows : rows.filter(row => !labelled.has(row.level));
            mine.forEach(row => labelled.add(row.level));
            // over the neighbour's empty space only: where a section to the left has units, room is taken
            const compact = options.mode === 'compact' && options.at === 'house' && i > 0 && mine.every(row => !taken.has(row.level));
            reserve({section: section.index}, mine, own, i && {section: sections[i - 1].section.index}, compact);
            for (const entrance of section.entrances) for (const level of entrance.levels.values()) taken.add(level);
        });
        return reservations;
    },

    section: labels,
    entrance: labels
};

// the floors of some entrances by level, bottom-up; one label per level, with the marks of the plugins
function labelRows(section, entrances, marks) {
    const byLevel = new Map();
    for (const entrance of entrances) {
        for (const floor of entrance.floors) {
            const level = entrance.levels.get(floor);
            if (byLevel.has(level)) continue;
            byLevel.set(level, {floor, level, label: entrance.props[floor]?.label, marks: marks?.(section, entrance, floor) ?? []});
        }
    }
    return [...byLevel.values()].sort((a, b) => a.level - b.level);
}

function text({floor, label}, options) {
    return label ?? options.format(floor);
}

function whole(row, options) {
    return [...row.marks.map(mark => mark.text), text(row, options)].join(' ');
}

function labels({gutters, house, options}) {
    const {layout} = house;
    const {size, gap, sectionGap} = layout.geometry;
    const fontSize = sizeOf(options, layout.geometry);
    // the right edge of the text: in its room; with no room of its own (compact) — over the neighbour, left of
    // the divider that stands in the middle of the gap between the sections
    const right = gutter => gutter.width ? gutter.x + gutter.width - gap : gutter.x - sectionGap / 2 - gap / 2;

    return gutters.flatMap(gutter => gutter.rows.map(row => ({
        tag: 'text',
        ...withMarks(row, options),
        opt: {
            class: 'floor-label',
            x: right(gutter),
            y: layout.rowY(row.level) + size / 2,
            fill: options.color,
            'font-family': options.font,
            'font-size': fontSize,
            'text-anchor': 'end',
            'dominant-baseline': 'central'
        }
    })));
}

// the text alone, or the marks in front of it as heroes writes them: <tspan class="mark done">✓ </tspan>
function withMarks(row, options) {
    if (!row.marks.length) return {val: escape(text(row, options))};
    return {sub: [
        ...row.marks.map(mark => ({
            tag: 'tspan',
            val: `${escape(mark.text)} `,
            opt: {class: mark.class ?? `mark ${mark.plugin}`, ...(mark.color && {fill: mark.color})},
            ...(mark.title && {sub: [{tag: 'title', val: escape(mark.title)}]})
        })),
        {tag: 'tspan', val: escape(text(row, options))}
    ]};
}

function escape(text) {
    return String(text).replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[char]);
}

function sizeOf(options, geometry) {
    return options.fontSize ?? Math.round(geometry.size * 0.34);
}

// layout has no DOM, so text is measured by an estimate: an average glyph is ~0.62 of the font size
function textWidth(text, fontSize) {
    return Math.ceil(String(text).length * fontSize * 0.62);
}
