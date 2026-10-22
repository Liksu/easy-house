// A highlight under the pointer, by CSS (:hover and :has), so it needs no events. Off until named: `hover: true`.
//
//   aim: 'unit'  — the unit under the pointer gets an outline (stroke, strokeWidth, fill)
//        'floor' — and its floor across the house is lit up (line), a duplex — on both its floors
//        'stack' — and its stack: the same position in its entrance
//        'both'  — the floor and the stack, a crosshair
//        'off'   — nothing, the pointer only
//
// It finds the floor and the stack by the marks every unit has (data-floors, data-section, data-entrance,
// data-positions, see scene.js), so its rules are made for the floors and stacks of this house.
// The rules are scoped to this drawing: the <svg> gets a class made from them, so two houses on one page may
// highlight differently (a <style> inside an inline <svg> applies to the whole page).

export default {
    name: 'hover',
    enabled: false,
    options: {
        aim: 'unit',            // off | unit | floor | stack | both
        stroke: '$highlight',
        strokeWidth: 2,
        fill: null,             // a fill of the unit under the pointer too
        line: {fill: '$aim', stroke: null},       // the floor and the stack it aims along
        cursor: 'pointer'
    },

    house({house, options}) {
        const {aim} = options;
        const units = house.sections.flatMap(section => section.entrances.flatMap(entrance => entrance.floors.flatMap(floor => floor.units)));
        const floors = new Set(units.flatMap(unit => floorsOf(unit.config)));
        const stacks = new Set(units.flatMap(unit => positionsOf(unit.config)
            .map(position => `[data-section="${unit.config.path.section}"][data-entrance="${unit.config.path.entrance}"][data-positions~="${position}"]`)));

        const targets = [
            ...(aim === 'floor' || aim === 'both' ? [...floors].map(floor => `[data-floors~="${floor}"]`) : []),
            ...(aim === 'stack' || aim === 'both' ? [...stacks] : [])
        ];
        const scope = `hover-${hash(JSON.stringify([options, targets]))}`;
        const root = `.easy-house.${scope}`;
        const rules = [`${root} .unit { cursor: ${options.cursor} }`];
        if (aim !== 'off') {
            // the lines first: the unit itself is said last with the same weight, so its outline wins
            const line = declarations({fill: options.line?.fill, stroke: options.line?.stroke});
            if (line) rules.push(...targets.map(target => `${root}:has(.unit${target}:hover) .unit${target} rect { ${line} }`));
            const own = declarations({stroke: options.stroke, 'stroke-width': options.strokeWidth, fill: options.fill});
            rules.push(`${root}:has(.unit:hover) .unit[data-unit]:hover rect { ${own} }`);
        }

        house.node.opt.class = `${house.node.opt.class} ${scope}`;
        return {tag: 'style', val: rules.join('\n')};
    }
};

// a floor that is not there (0 between -1 and 1) only makes a rule that matches nothing
function floorsOf(config) {
    const {floors: [from, to]} = config.rect;
    return Array.from({length: to - from + 1}, (_, i) => from + i);
}

function positionsOf(config) {
    const {cols: [first, last]} = config.rect;
    return Array.from({length: last - first + 1}, (_, i) => first + i + 1);
}

function declarations(styles) {
    return Object.entries(styles).filter(([, value]) => value != null).map(([key, value]) => `${key}: ${value}`).join('; ');
}

function hash(text) {
    let value = 5381;
    for (const char of text) value = (value * 33 ^ char.codePointAt(0)) >>> 0;
    return value.toString(36);
}
