// The types against the examples of the docs: `npm run types` — nothing is emitted, an error fails it.
import {House, cells, icon, hole, reactions, count, resolve, layout, scene, themed, paint, colors, textBlock} from 'easy-house';
import type {HouseConfig, Plugin, State} from 'easy-house';

// a house, the way the docs write them
const config: HouseConfig = {
    units: 5,
    kinds: {salon: {label: 'S', title: 'A beauty salon', kind: 'special'}, shop: {enumerable: false}},
    floors: {
        to: 22,
        '-1': {label: 'P'},
        1: [1, 2, 3, 'S', {kind: 'shop', colSpan: 2}],
        5: {'@2': null, '@3': {rowSpan: 2}, 19: {title: 'a duplex', oldman: true}, mark: 'done'},
        10: null,
        22: 3
    },
    sections: [{floors: 9}, {floors: {from: 2, to: 12}, entrances: 2, start: 1, floorLabels: null}],
    direction: 'rtl',
    numberDirection: 'ltr',
    theme: 'night',
    colors: {unit: 'ivory', stacks: ['pink', 'gold']},
    background: '$unit',
    size: 'xs',
    stacks: true,
    walls: {padding: 4},
    roof: {height: 3},
    cells: {fill: '$yesFill', fontWeight: 'bold'},
    floorLabels: {at: 'entrance', format: floor => `${floor}.`},
    reactions: {fill: true, percent: {show: 'count:no', at: 'floor:22'}, legend: {line: '{{name}}: {{count}}'}, styles: {yes: {glow: '$glow'}}},
    text: {at: 'top', text: ['A title', {value: ['a', {value: '—', color: 'blue'}, 'b']}]},
    hover: {aim: 'both'},
    plugins: [...House.plugins, hole, {use: icon, name: 'oldman', options: {icon: '👴🏻'}}],
    oldman: {units: [6, 10]}
};

// @ts-expect-error: a size in one word that is not there
const wrong: HouseConfig = {size: 'huge'};
// @ts-expect-error: floor labels at a place they do not go
const nowhere: HouseConfig = {floorLabels: {at: 'roof'}};

const state: State = {57: {reaction: 'yes'}, 's2-5': {reaction: 'no', debt: 120}};
const house = new House('#house', config, state);
const alone = new House({units: 4, floors: 9});
alone.svg.getBBox();

house.on('unit:click', ({unit, floor, element, event}) => {
    const id: string = unit.config.id;
    const where: number = unit.config.path.position;
    const reaction = unit.state.reaction;
    element.classList.add('chosen');
    event.preventDefault();
    console.log(id, where, reaction, floor.config.floor);
});
house.update({57: {reaction: 'no'}, 58: null}).redraw({stacks: false});
const tally = count(house);
if (tally) console.log(tally.total, tally.groups.map(group => group.percent));
house.unit('s2-5')?.unit.box.width;
new House({units: 2, floors: 1, sections: [{}, {start: 1}], keys: 'section'});

// a plugin of your own
const stairs: Plugin<{color: string; every: number}> = {
    name: 'stairs',
    options: {color: '$text', every: 2},
    style: ({unit, options}) => unit.config.path.position % options.every ? null : {stroke: options.color},
    unit: ({unit, house}) => {
        const place = unit.place('top-left', 6);
        return {tag: 'rect', opt: {...place, fill: house.colors.highlight as string}};
    },
    render: ({base, unit}) => base({style: {fill: String(unit.config.label).endsWith('7') ? 'crimson' : null}}),
    gutters: ({sections, geometry}) => sections.map(({section}) => ({side: 'right' as const, section: section.index, width: geometry.gap})),
    section: ({section, gutters}) => gutters.map(gutter => ({tag: 'rect', opt: {x: gutter.x, y: section.box.y, width: 2, height: section.box.height}})),
    mark: ({floor}) => floor.config.floor === 1 ? '🚪' : null
};
new House('#stairs', {units: 3, floors: 5, plugins: [...House.plugins, stairs], stairs: {every: 3}});

// without the DOM
const model = resolve({units: 3, floors: 3});
const geometry = layout(model, {}, [cells, reactions]);
const tree = scene(geometry, [cells, reactions], {}, {});
console.log(model.warnings, geometry.width, tree.tag, themed({theme: 'dark'}).colors, paint('$unit', colors));
console.log(textBlock.fill('{{yes.percent}}%', {yes: {percent: 40}}));
