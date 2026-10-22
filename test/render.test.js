import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from '../src/resolve.js';
import {layout} from '../src/layout.js';
import {scene, levels} from '../src/scene.js';
import cells from '../src/plugins/cells.js';
import floorLabels from '../src/plugins/floor-labels.js';
import dividers from '../src/plugins/dividers.js';
import hole from '../src/plugins/hole.js';
import icon from '../src/plugins/icon.js';
import reactions from '../src/plugins/reactions.js';
import stacks from '../src/plugins/stacks.js';
import text from '../src/plugins/text.js';
import hover from '../src/plugins/hover.js';
import {count} from '../src/plugins/reactions.js';
import {sized} from '../src/sizes.js';
import {themed} from '../src/themes.js';
import {colors, paint} from '../src/colors.js';
import walls from '../src/plugins/walls.js';
import roof from '../src/plugins/roof.js';

const heroes = {units: 5, floors: {to: 22, 1: [1, 2, 3, 'С', 'К'], 22: 3}};
const all = [cells, floorLabels, dividers];

const boxOf = (geometry, id) => geometry.units.find(({cell}) => cell.id === id).box;
const find = (node, test) => test(node) ? [node] : (node.sub || []).flatMap(child => find(child, test));
const byClass = (svg, name) => find(svg, node => node.opt?.class?.split(' ').includes(name));
const draw = (config, plugins = all, state = {}) => {
    const geometry = layout(resolve(config), config, plugins);
    return {geometry, svg: scene(geometry, plugins, config, state)};
};
// floor labels per section, in visual order: [[section index, [floors]]]
const labelled = config => draw(config).geometry.sections
    .map(section => [section.index, section.gutters.filter(gutter => gutter.plugin === 'floorLabels').flatMap(gutter => gutter.floors)]);
const unitsRight = section => Math.max(...section.entrances.map(entrance => entrance.box.x + entrance.box.width));
const unitsLeft = section => Math.min(...section.entrances.map(entrance => entrance.box.x));

test('layout: the heroes house — the size of the picture comes from the model', () => {
    const geometry = layout(resolve(heroes));

    // padding 1 + 5 units of 35 with gaps of 6; 22 rows
    assert.equal(geometry.width, 1 + 5 * 41 - 6 + 1);
    assert.equal(geometry.height, 2 + 21 * 41 + 35);
    assert.deepEqual(boxOf(geometry, '104'), {x: 1, y: 1, width: 35, height: 35});
    assert.deepEqual(boxOf(geometry, '1'), {x: 1, y: 1 + 21 * 41, width: 35, height: 35});
    assert.deepEqual(boxOf(geometry, 'К'), {x: 1 + 4 * 41, y: 1 + 21 * 41, width: 35, height: 35});
});

test('layout: spans make one box over several positions and floors', () => {
    const geometry = layout(resolve({units: 3, kinds: {shop: {enumerable: false}}, floors: {to: 2, 1: {'@1': {rowSpan: 2}, '@2': {colSpan: 2, kind: 'shop'}}}}));
    const [duplex, shop] = geometry.units;

    assert.deepEqual(duplex.box, {x: 1, y: 1, width: 35, height: 2 * 41 - 6});
    assert.deepEqual(shop.box, {x: 1 + 41, y: 1 + 41, width: 2 * 41 - 6, height: 35});
});

test('layout: sections stand on common ground — an arch, a slope, a section below ground', () => {
    const arch = layout(resolve({units: 4, sections: [{floors: 12}, {floors: {from: 2, to: 4}, units: 3}, {floors: 12}]}));
    const [left, middle, right] = arch.sections;
    assert.equal(middle.box.x, left.box.x + left.box.width + 16);
    assert.equal(right.box.x, middle.box.x + middle.box.width + 16);
    // the middle section ends one floor above the ground: that is the arch
    assert.equal(left.box.y + left.box.height - (middle.box.y + middle.box.height), 41);

    const slope = layout(resolve({floors: 5, units: 3, sections: [{}, {base: 1}]}));
    const [low, high] = slope.sections;
    assert.equal(low.box.y - high.box.y, 41);
    assert.equal(slope.top, 6);

    const below = layout(resolve({floors: 3, units: 2, sections: [{}, {base: -1}]}));
    assert.equal(below.bottom, 0);
    assert.equal(below.sections[1].box.y - below.sections[0].box.y, 41);
});

test('layout: an underground floor stands right under the first one', () => {
    const geometry = layout(resolve({units: 2, floors: 3, sections: [{}, {floors: {from: -1, to: 3}}]}));
    const [ground, withBasement] = geometry.sections;
    const [entrance] = withBasement.entrances;

    assert.deepEqual(entrance.floors.map(row => [row.floor, row.level]), [[-1, 0], [1, 1], [2, 2], [3, 3]]);
    // floors 1–3 are on the same rows as the neighbour's, the basement is one row below
    assert.equal(entrance.floors[1].box.y, ground.entrances[0].floors[0].box.y);
    assert.equal(entrance.floors[0].box.y - entrance.floors[1].box.y, 41);
});

test('layout: entrances stand side by side, right to left when asked', () => {
    const ltr = layout(resolve({floors: 2, units: 2, entrances: 3}));
    assert.deepEqual(ltr.sections[0].entrances.map(entrance => [entrance.index, entrance.box.x]), [[1, 1], [2, 1 + 76 + 12], [3, 1 + 2 * (76 + 12)]]);

    const rtl = layout(resolve({floors: 2, units: 2, entrances: 3, direction: 'rtl'}));
    assert.deepEqual(rtl.sections[0].entrances.map(entrance => entrance.index), [3, 2, 1]);
    // the numbering keeps its order: entrance 1 (now on the right) still has flats 1–4
    const first = rtl.units.find(({cell}) => cell.id === '1');
    assert.ok(first.box.x > rtl.sections[0].entrances[0].box.x);
});

test('floor labels: a floor is labelled where it first appears', () => {
    // a taller section on the right labels only its own floors 6–9
    assert.deepEqual(labelled({units: 4, sections: [{floors: 5, entrances: 3}, {floors: 9, entrances: 2}]}),
        [[1, [1, 2, 3, 4, 5]], [2, [6, 7, 8, 9]]]);
    // an arch adds no floors
    assert.deepEqual(labelled({units: 4, sections: [{floors: 12}, {floors: {from: 2, to: 4}}, {floors: 12}]}),
        [[1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]], [2, []], [3, []]]);
    // a slope: every next section brings one new level — labelled by its own floor number
    assert.deepEqual(labelled({floors: 5, units: 3, sections: [{}, {base: 1}, {base: 2}]}),
        [[1, [1, 2, 3, 4, 5]], [2, [5]], [3, [5]]]);
    // below ground: a lowered section, a basement floor
    assert.deepEqual(labelled({floors: 3, units: 2, sections: [{}, {base: -1}]}), [[1, [1, 2, 3]], [2, [1]]]);
    assert.deepEqual(labelled({floors: 3, units: 2, sections: [{}, {floors: {from: -1, to: 3}}]}), [[1, [1, 2, 3]], [2, [-1]]]);
    // every section labels everything
    assert.deepEqual(labelled({units: 2, sections: [{floors: 2}, {floors: 3}], floorLabels: {at: 'section'}}), [[1, [1, 2]], [2, [1, 2, 3]]]);
});

test('floor labels: the room is the text with the same gap on both sides', () => {
    const {geometry, svg} = draw(heroes);
    const [gutter] = geometry.sections[0].gutters;
    const room = 2 * 6 + Math.ceil(3 * 12 * 0.62);    // '22:' at 12px

    assert.deepEqual([gutter.x, gutter.width], [1, room]);
    assert.equal(boxOf(geometry, '1').x, 1 + room);
    assert.equal(geometry.width, 1 + room + 5 * 41 - 6 + 1);

    const labels = byClass(svg, 'floor-label');
    assert.equal(labels.length, 22);
    assert.deepEqual(labels.map(label => label.val).slice(0, 3), ['1:', '2:', '3:']);
    assert.equal(labels[0].opt.x, 1 + room - 6);
});

test('floor labels: compact by default — new floors go over the neighbour, no room between sections', () => {
    const config = {units: 4, sections: [{floors: 5}, {floors: 9}]};
    const {geometry, svg} = draw(config);
    const [first, second] = geometry.sections;

    // no room taken: the sections are a plain section gap apart
    assert.equal(unitsLeft(second) - unitsRight(first), 16);
    // the labels of floors 6–9 stand over the first section's empty space, left of the divider in the middle of the gap
    const labels = byClass(svg, 'floor-label').filter(label => Number.parseInt(label.val) > 5);
    assert.deepEqual(labels.map(label => label.val), ['6:', '7:', '8:', '9:']);
    assert.ok(labels.every(label => label.opt.x === unitsLeft(second) - 16 / 2 - 6 / 2));
});

test('floor labels: gutter mode mirrors the room, so the divider stays between the squares', () => {
    const config = {units: 4, sections: [{floors: 5}, {floors: 9}], floorLabels: {mode: 'gutter'}, dividers: {extent: 'full'}};
    const {geometry, svg} = draw(config);
    const [first, second] = geometry.sections;
    const [line] = byClass(svg, 'divider');

    assert.equal(line.opt.x1 - unitsRight(first), unitsLeft(second) - line.opt.x1);
    assert.ok(unitsLeft(second) - unitsRight(first) > 16);

    // per entrance: every entrance has its labels, the one before it gets the mirror
    const entrances = draw({floors: 2, units: 2, entrances: 2, floorLabels: {at: 'entrance'}}).geometry.sections[0].entrances;
    assert.deepEqual(entrances.map(entrance => entrance.gutters.map(gutter => [gutter.side, gutter.floors])),
        [[['left', [1, 2]], ['right', []]], [['left', [1, 2]]]]);
});

test('dividers: a hairline in the middle of the gap, as high as the neighbours overlap', () => {
    const config = {units: 2, sections: [{floors: 3, entrances: 2}, {floors: 2}]};
    const {geometry, svg} = draw(config);
    const [first, second] = geometry.sections;
    const lines = byClass(svg, 'divider');

    const sectionLine = lines.find(line => line.opt.stroke === '#999');
    assert.equal(sectionLine.opt.x1, (first.box.x + first.box.width + second.box.x) / 2);
    assert.deepEqual([sectionLine.opt.y1, sectionLine.opt.y2], [second.box.y, second.box.y + second.box.height]);
    assert.equal(sectionLine.opt['vector-effect'], 'non-scaling-stroke');

    const [e1, e2] = first.entrances;
    const entranceLine = lines.find(line => line.opt.stroke === '#ccc');
    assert.equal(entranceLine.opt.x1, (e1.frame.x + e1.frame.width + e2.frame.x) / 2);

    // full: as tall as both
    const full = byClass(draw({...config, dividers: {extent: 'full'}}).svg, 'divider').find(line => line.opt.stroke === '#999');
    assert.deepEqual([full.opt.y1, full.opt.y2], [first.box.y, first.box.y + first.box.height]);
});

test('scene: groups section → entrance → floor → unit, a square with the label per unit', () => {
    const {svg} = draw(heroes);
    const units = byClass(svg, 'unit');
    const values = find(svg, node => node.tag === 'text' && node.opt.class !== 'floor-label');

    assert.equal(byClass(svg, 'floor').length, 22);
    assert.equal(units.length, 108);
    assert.equal(find(svg, node => node.tag === 'rect').length, 108);
    assert.deepEqual(units.map(unit => unit.opt['data-unit']).slice(0, 6), ['1', '2', '3', 'С', 'К', '4']);
    assert.deepEqual(values.map(text => text.val).slice(0, 6), ['1', '2', '3', 'С', 'К', '4']);
});

test('scene: plugin options from the config by name; null switches a plugin off', () => {
    const quiet = draw({...heroes, cells: {numbers: false, fill: 'gainsboro'}, floorLabels: null});
    assert.equal(find(quiet.svg, node => node.tag === 'text').length, 0);
    assert.ok(find(quiet.svg, node => node.tag === 'rect').every(rect => rect.opt.fill === 'gainsboro'));
    // switched off before the layout too: no room for labels
    assert.equal(quiet.geometry.width, 1 + 5 * 41 - 6 + 1);
});

test('render: flat → kind → unit chain like layers, each gets the more general one as base', () => {
    const dot = ({unit, base}) => [...base(), {tag: 'circle', opt: {class: 'dot', cx: unit.box.x, cy: unit.box.y, r: 2}}];
    const pink = ({base}) => base({style: {fill: 'pink'}});
    const star = ({base}) => base({unit: {config: {label: '★'}}});
    const replace = ({unit}) => ({tag: 'circle', opt: {class: 'own', cx: unit.box.x, cy: unit.box.y, r: 9}});
    const config = {
        units: 4,
        kinds: {flat: {render: dot}, salon: {label: 'С', render: pink}},
        floors: {to: 1, 1: [1, {kind: 'salon'}, {kind: 'salon', render: star}, {kind: 'salon', render: replace}]}
    };
    const [flat, salon, starred, own] = byClass(draw(config, [cells]).svg, 'unit').map(unit => unit.sub);
    const fills = sub => sub.filter(node => node.tag === 'rect').map(rect => rect.opt.fill);
    const texts = sub => sub.filter(node => node.tag === 'text').map(text => text.val);
    const dots = sub => sub.filter(node => node.opt.class === 'dot').length;

    assert.deepEqual([fills(flat), texts(flat), dots(flat)], [['whitesmoke'], ['1'], 1]);
    assert.deepEqual([fills(salon), texts(salon), dots(salon)], [['pink'], ['С'], 1]);
    assert.deepEqual([fills(starred), texts(starred), dots(starred)], [['pink'], ['★'], 1]);
    assert.deepEqual(own.map(node => node.opt.class), ['own']);
});

test('render: a section or a floor can be drawn by its own render, base() gives the usual drawing', () => {
    const parking = ({floor}) => ({tag: 'rect', opt: {class: 'parking', ...floor.box}});
    const framed = ({section, base}) => [{tag: 'rect', opt: {class: 'frame', ...section.box}}, ...base()];
    const config = {
        units: 3,
        floors: 3,
        sections: [{render: framed}, {floors: {from: -1, to: 3, '-1': {render: parking}}}]
    };
    const {svg} = draw(config);
    const [first, second] = byClass(svg, 'section');

    assert.equal(first.sub[0].opt.class, 'frame');
    assert.equal(byClass(first, 'unit').length, 9);
    const basement = byClass(second, 'floor').find(floor => floor.opt['data-floor'] === -1);
    assert.deepEqual(basement.sub.map(node => node.opt.class).filter(Boolean), ['parking']);
});

test('ctx: every level is {config, box, node}; config is everything resolved about it', () => {
    const seen = [];
    const probe = {
        name: 'probe',
        options: {mark: '*'},
        house: ({house, options}) => void seen.push(['house', options.mark, house.config.units, house.box.width === house.layout.width, house.node.tag]),
        section: ({section, gutters}) => void seen.push(['section', section.config.index, section.config.floors.to, gutters.length, section.node.opt.class]),
        entrance: ({section, entrance}) => void seen.push(['entrance', section.config.index, entrance.config.index, entrance.node.opt.class]),
        floor: ({entrance, floor}) => void seen.push(['floor', entrance.config.index, floor.config.floor, floor.config.mark ?? '-']),
        unit: ({floor, unit}) => void seen.push(['unit', floor.config.floor, unit.config.id, unit.config.title ?? '-', unit.box.width])
    };
    draw({floors: {to: 1, 1: {mark: 'done', '@1': {title: 'A'}}}, units: 1, sections: 2, probe: {mark: '!'}}, [cells, probe]);

    assert.deepEqual(seen, [
        ['unit', 1, '1', 'A', 35],
        ['floor', 1, 1, 'done'],
        ['entrance', 1, 1, 'entrance'],
        ['section', 1, 1, 0, 'section'],
        ['unit', 1, '2', 'A', 35],
        ['floor', 1, 1, 'done'],
        ['entrance', 2, 1, 'entrance'],
        ['section', 2, 1, 0, 'section'],
        ['house', '!', 1, true, 'svg']
    ]);

    // a unit's config: its own fields and what the resolver computed — id, label, kind, path, rect
    let config;
    draw({units: 2, kinds: {shop: {enumerable: false}}, floors: {to: 1, 1: {'@2': {kind: 'shop', title: 'кафе'}}}}, [{name: 'peek', unit: ({unit}) => void (config = unit.config)}]);
    assert.deepEqual(
        {id: config.id, label: config.label, kind: config.kind, enumerable: config.enumerable, path: config.path, title: config.title},
        {id: '1.1.1.2', label: undefined, kind: 'shop', enumerable: false, path: {section: 1, entrance: 1, floor: 1, position: 2}, title: 'кафе'}
    );
    // the children are there too: house.sections → section.entrances → entrance.floors → floor.units
    let tree;
    draw({units: 2, floors: 2, entrances: 2}, [{name: 'peek', house: ({house}) => void (tree = house)}]);
    assert.deepEqual(tree.sections[0].entrances.map(entrance => entrance.floors.map(floor => floor.units.map(unit => unit.config.label))),
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
});

test('box: what the layout reserved is exactly where the base drawing lands', () => {
    const {geometry, svg} = draw({units: 3, kinds: {shop: {enumerable: false}}, floors: {to: 4, 2: {'@2': {rowSpan: 2}, '@3': {kind: 'shop'}}}, sections: [{}, {base: 1}]});
    const groups = find(svg, node => node.tag === 'g');

    // no group moves its children: every level draws in the coordinates of the whole tree
    assert.ok(groups.every(group => group.opt.transform == null));
    for (const unit of byClass(svg, 'unit')) {
        const {box} = geometry.units.find(({cell}) => cell.id === unit.opt['data-unit']);
        const [rect] = unit.sub;
        assert.deepEqual({x: rect.opt.x, y: rect.opt.y, width: rect.opt.width, height: rect.opt.height}, box);
    }
});

test('hole plugin: a flat that is there with a hole in its place; its options ride on its name; null leaves nothing', () => {
    const {svg} = draw({units: 3, floors: {to: 1, 1: {1: null, 2: {hole: true}, 3: {hole: {note: '2022'}}}}}, [cells, hole]);
    const units = byClass(svg, 'unit');

    assert.deepEqual(units.map(unit => unit.opt['data-unit']), ['2', '3']);    // 1 is gone
    const [two, three] = units.map(unit => unit.sub);
    assert.ok(two.some(node => node.opt?.class === 'hole'));
    assert.equal(two.find(node => node.tag === 'rect').opt.fill, '#fff5f5');    // the square, drawn by cells with the hole's fill
    assert.ok(two.some(node => node.tag === 'text' && node.val === '2'));      // the number stays in sight
    assert.ok(three.some(node => node.tag === 'text' && node.val === '2022'));
});

test('options cascade by the plugin name: house → floor → unit; null switches it off there', () => {
    const config = {
        units: 3,
        cells: {fill: 'gainsboro'},
        floors: {to: 3, 2: {cells: {fill: 'pink'}, 4: {cells: {fill: 'red'}}, 5: {cells: null}}}
    };
    const {svg} = draw(config, [cells]);
    const fill = id => byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === String(id)).sub.find(node => node.tag === 'rect')?.opt.fill;

    assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(fill), ['gainsboro', 'gainsboro', 'gainsboro', 'red', undefined, 'pink', 'gainsboro']);
});

test('one plugin under several names; marks of different instances stack in a corner', () => {
    const plugins = [cells, {use: icon, name: 'oldman', options: {icon: 'O'}}, {use: icon, name: 'rental', options: {icon: 'R'}}];
    const config = {units: 3, oldman: {units: [1, 2]}, floors: {to: 1, 1: {2: {rental: true}, 3: {rental: true, oldman: true}}}};
    const marks = (svg, id) => byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === id).sub
        .filter(node => node.opt?.class?.startsWith('icon'));
    const {svg} = draw(config, plugins);

    assert.deepEqual(marks(svg, '1').map(node => node.val), ['O']);
    const [oldman, rental] = marks(svg, '2');
    assert.deepEqual([oldman.val, rental.val], ['O', 'R']);
    assert.ok(rental.opt.x < oldman.opt.x);         // side by side from the corner, not on top of each other
    assert.deepEqual(marks(svg, '3').map(node => node.val), ['O', 'R']);

    // an instance is switched off by its name
    assert.deepEqual(marks(draw({...config, rental: null}, plugins).svg, '3').map(node => node.val), ['O']);
});

test('style: plugins add to how a unit looks in plugins order, later ones win, empty values do not count', () => {
    const outline = {name: 'outline', style: () => ({stroke: 'navy', fill: null})};
    const gold = {name: 'gold', style: ({unit, style}) => unit.config.label === 2 && {fill: 'gold', color: style.fill}};
    const {svg} = draw({units: 2, floors: 1, cells: {fill: 'pink'}}, [cells, outline, gold]);
    const [one, two] = byClass(svg, 'unit').map(unit => unit.sub);

    assert.deepEqual(one.find(node => node.tag === 'rect').opt, {...one[0].opt, fill: 'pink', stroke: 'navy', 'stroke-width': 2});
    assert.equal(two.find(node => node.tag === 'rect').opt.fill, 'gold');
    assert.equal(two.find(node => node.tag === 'text').opt.fill, 'pink');     // a hook sees the style so far
});

test('reactions: the outline and the number by the state; always and fill like alwaysBorder and fillSelected', () => {
    const config = {units: 4, floors: {to: 1, 1: [1, 2, 3, 'С']}};
    const state = {1: {reaction: 'yes'}, 2: {reaction: 'no'}, 3: {other: true}};
    const look = (svg, id) => {
        const sub = byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === id).sub;
        const {fill, stroke} = sub.find(node => node.tag === 'rect').opt;
        const text = sub.find(node => node.tag === 'text').opt;
        return [fill, stroke ?? null, text.fill, text['font-weight'] ?? null];
    };

    let {svg} = draw(config, [cells, reactions], state);
    assert.deepEqual(look(svg, '1'), ['whitesmoke', 'green', 'green', 'bold']);
    assert.deepEqual(look(svg, '2'), ['whitesmoke', 'red', 'red', 'bold']);
    assert.deepEqual(look(svg, '3'), ['whitesmoke', null, 'gray', null]);

    ({svg} = draw({...config, reactions: {always: true, fill: true}}, [cells, reactions], state));
    assert.deepEqual(look(svg, '1'), ['lightgreen', 'green', 'green', 'bold']);
    assert.deepEqual(look(svg, '3'), ['gainsboro', 'gray', 'gray', null]);
    assert.deepEqual(look(svg, 'С'), ['gainsboro', 'gray', 'gray', null]);

    // the look is options: the style of any reaction, a style per reaction, `none` for units without one
    ({svg} = draw({...config, reactions: {style: {fontWeight: null, strokeWidth: 1}, styles: {no: {fontSize: 9, color: 'black'}, none: {fill: 'white'}}}},
        [cells, reactions], state));
    assert.deepEqual(look(svg, '1'), ['whitesmoke', 'green', 'green', null]);
    assert.deepEqual(look(svg, '2'), ['whitesmoke', 'red', 'black', null]);
    assert.deepEqual(look(svg, '3'), ['white', null, 'gray', null]);
    const two = byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === '2').sub;
    assert.deepEqual([two[0].opt['stroke-width'], two[1].opt['font-size']], [1, 9]);

    // the same plugin under another name reads another field
    const payments = {use: reactions, name: 'payments', options: {field: 'payment', colors: {paid: 'blue'}}};
    ({svg} = draw(config, [cells, payments], {2: {payment: 'paid', reaction: 'no'}}));
    assert.deepEqual(look(svg, '2'), ['whitesmoke', 'blue', 'blue', 'bold']);
});

test('state: every unit of the level tree has its own, {} when there is none; the house has the whole map', () => {
    const state = {2: {reaction: 'yes'}};
    const seen = [];
    const spy = {name: 'spy', unit: ({house, unit}) => void seen.push([unit.config.id, unit.state, house.state])};
    draw({units: 2, floors: 1}, [cells, spy], state);
    assert.deepEqual(seen, [['1', {}, state], ['2', {reaction: 'yes'}, state]]);

    const tree = levels(layout(resolve({units: 2, floors: 1})), {}, state);
    assert.deepEqual(tree.sections[0].entrances[0].floors[0].units.map(unit => unit.state), [{}, {reaction: 'yes'}]);
});

test('floor labels: a floor\'s own label is written as is, the others by format', () => {
    const config = {units: 2, floors: {from: -1, to: 2, '-1': {label: 'P'}}, floorLabels: {format: floor => `${floor} эт.`}};
    const labels = byClass(draw(config).svg, 'floor-label').map(node => node.val);
    assert.deepEqual(labels, ['P', '1 эт.', '2 эт.']);
});

test('stacks: the fill of the position the unit stands at; off until named; a fill by reaction wins', () => {
    const plugins = [cells, stacks, reactions];
    const fills = (config, state) => Object.fromEntries(byClass(draw(config, plugins, state).svg, 'unit')
        .map(unit => [unit.opt['data-unit'], unit.sub.find(node => node.tag === 'rect').opt.fill]));
    const config = {units: 3, floors: {to: 2, 1: {1: {colSpan: 2}}, 2: {'@3': {colSpan: -2}}}};

    // off by default: the house has to name it
    assert.deepEqual(Object.values(fills(config)), Array(4).fill('whitesmoke'));

    const palette = {stacks: {colors: ['red', 'green', 'blue']}};
    // 1 is written left to right — the colour of its left cell; 4, right to left — of its right one
    assert.deepEqual(fills({...config, ...palette}), {1: 'red', 2: 'blue', 3: 'red', 4: 'blue'});
    assert.equal(fills({...config, stacks: true})[1], 'mistyrose');                       // the heroes palette
    assert.equal(fills({...config, ...palette, reactions: {fill: true}}, {1: {reaction: 'yes'}})[1], 'lightgreen');
    // and off again on a level
    assert.equal(fills({...config, ...palette, floors: {...config.floors, 1: {...config.floors[1], stacks: null}}})[1], 'whitesmoke');
});

test("a unit's title is its tooltip however it is drawn; a mark has a colour, a font and a tooltip of its own", () => {
    const own = ({unit}) => ({tag: 'circle', opt: {cx: unit.box.x, cy: unit.box.y, r: 3}});
    const config = {units: 3, floors: {to: 1, 1: [{label: 'С', title: 'Салон <1>'}, {title: 'кафе', render: own}, 3]}};
    const plugins = [cells, {use: icon, name: 'oldman', options: {icon: '*', color: 'blue', font: 'arial', title: 'пенсионер'}}];
    const units = byClass(draw({...config, oldman: {units: [3]}}, plugins).svg, 'unit').map(unit => unit.sub);
    const titles = sub => sub.filter(node => node.tag === 'title').map(node => node.val);

    assert.deepEqual(units.map(titles), [['Салон &lt;1&gt;'], ['кафе'], []]);
    const mark = units[2].find(node => node.opt?.class === 'icon oldman');
    assert.deepEqual([mark.opt.fill, mark.opt['font-family'], mark.opt['font-size'], titles(mark.sub)], ['blue', 'arial', 13, ['пенсионер']]);
});

test("floor marks go in front of the floor's label, as in heroes: one, several, or unknown written as is", () => {
    const config = {units: 2, floors: {to: 3, 1: {mark: 'done'}, 2: {mark: ['progress', 'x'], label: 'B'}}};
    const {svg, geometry} = draw(config);
    const labels = byClass(svg, 'floor-label');
    const written = node => node.val ?? node.sub.map(part => part.val).join('');

    assert.deepEqual(labels.map(written), ['✓ 1:', '⏳ x B', '3:']);
    assert.deepEqual(labels[1].sub.map(part => part.opt?.class), ['mark progress', 'mark x', undefined]);
    // the room for labels counts the marks too
    assert.ok(geometry.width > draw({units: 2, floors: 3}).geometry.width);
});

test('any plugin can put its own mark in front of a floor label: a mark hook, in plugins order', () => {
    const exits = {
        name: 'exits',
        options: {sign: '🚪'},
        mark: ({floor, options}) => floor.config.exit && {text: options.sign, title: 'exit to the roof', color: 'green'}
    };
    const config = {units: 2, floors: {to: 3, 2: {exit: true, mark: 'done'}, 3: {exit: true, exits: {sign: 'E'}}}};
    const labels = byClass(draw(config, [cells, floorLabels, exits]).svg, 'floor-label');
    const written = node => node.val ?? node.sub.map(part => part.val).join('');

    assert.deepEqual(labels.map(written), ['1:', '✓ 🚪 2:', 'E 3:']);
    const door = labels[1].sub[1];
    assert.deepEqual([door.opt.class, door.opt.fill, door.sub[0].val], ['mark exits', 'green', 'exit to the roof']);
});

// the whole pipeline as House runs it: the layout gets the state too (a legend takes room by it)
const drawWithState = (config, plugins, state = {}) => {
    const model = resolve(config);
    const geometry = layout(model, config, plugins, state);
    return {model, geometry, svg: scene(geometry, plugins, config, state)};
};
const linesOf = node => node.sub.map(line => line.sub.map(part => part.val).join(''));

test('text block: general — lines and parts at a place of the house, a border; off until named', () => {
    const config = {units: 3, floors: 3, text: {
        at: 'floor:3', x: '100%', y: '50%', align: 'right', valign: 'middle', border: '1px dashed silver',
        text: ['one line', {value: ['a', {value: '—', color: 'blue'}, 'b'], size: 9}]
    }};
    const {svg, geometry} = drawWithState(config, [cells, text]);
    const [block] = byClass(svg, 'text');
    const [border] = byClass(svg, 'text-border');
    const row = geometry.sections[0].entrances[0].floors.find(floor => floor.floor === 3).box;

    assert.deepEqual(linesOf(block), ['one line', 'a—b']);
    assert.deepEqual([block.opt.x, block.opt['text-anchor']], [row.x + row.width, 'end']);
    assert.deepEqual(block.sub[1].sub.map(part => [part.opt.fill, part.opt['font-size']]), [[undefined, 9], ['blue', 9], [undefined, 9]]);
    assert.equal(border.opt['stroke-dasharray'], '4 2');
    const ys = block.sub.map(line => line.opt.y);
    assert.ok(Math.abs((ys[0] + ys[1]) / 2 - (row.y + row.height / 2)) < 0.01);       // around the middle of the row

    assert.equal(byClass(drawWithState({units: 3, floors: 3}, [cells, text]).svg, 'text').length, 0);
    // at the top it takes a band of its own: the house moves down
    const banded = drawWithState({units: 3, floors: 3, text: {at: 'top', text: ['title']}}, [cells, text]);
    assert.deepEqual(banded.geometry.bands.map(band => band.side), ['top']);
    assert.ok(banded.geometry.units[0].box.y > geometry.units[0].box.y);
});

test('reactions count their groups — synonyms as one, units without a reaction as none, counts decides who', () => {
    const config = {units: 4, floors: {to: 2, 1: [1, 2, 3, 'S']}};
    const state = {1: {reaction: 'yes'}, 2: {reaction: 'paid'}, 3: {reaction: 'no'}, S: {reaction: 'yes'}};
    const house = (extra = {}) => ({model: resolve({...config, ...extra}), state, plugins: [cells, reactions], config: {...config, ...extra}});

    const plain = count(house());
    assert.deepEqual(plain.groups.map(group => [group.key, group.count]), [['yes', 2], ['no', 1], ['maybe', 0], ['ignore', 0], ['none', 4], ['paid', 1]]);
    assert.equal(plain.total, 8);
    assert.deepEqual([plain.yes.percent, plain.yes.share, plain.yes.color], [25, 25, 'green']);

    const counted = count(house({reactions: {synonyms: {paid: 'yes'}, none: 'ignore', names: {yes: 'да'},
        counts: ({unit, reaction}) => unit.config.enumerable || reaction != null, order: ['ignore', 'yes', 'no']}}));
    assert.deepEqual(counted.groups.map(group => [group.key, group.count]), [['ignore', 4], ['yes', 3], ['no', 1]]);
    assert.equal(counted.yes.name, 'да');
    assert.equal(count(house(), 'payments'), null);                                     // no such instance
});

test('reactions write the percent and the legend with the text block; off by default; the legend takes a band', () => {
    const config = {units: 4, floors: 3};
    const state = {1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 3: {reaction: 'no'}};
    const plugins = [cells, reactions];
    const quiet = drawWithState(config, plugins, state);
    assert.equal(byClass(quiet.svg, 'text').length, 0);

    const {svg, geometry} = drawWithState({...config, reactions: {percent: true, legend: true}}, plugins, state);
    const [shown, listed] = ['percent', 'legend'].map(name => byClass(svg, name)[0]);
    assert.deepEqual(shown.opt.class, 'text reactions percent');
    assert.deepEqual(linesOf(shown), ['17%']);
    assert.deepEqual(linesOf(listed), [
        '   yes: 2 / 12 = 16.66% ≈ 17%',      // the columns are as wide as any group's, shown or not: 'ignore'
        '    no: 1 / 12 =  8.33% ≈  8%',
        '  none: 9 / 12 = 75.00% ≈ 75%'
    ]);
    assert.deepEqual(geometry.bands.map(band => [band.side, band.part]), [['top', 'percent'], ['bottom', 'legend']]);
    assert.ok(geometry.height > quiet.geometry.height);

    // the percent of heroes: a group, a count, two counts; or lines of your own with what was counted
    const show = percent => linesOf(byClass(drawWithState({...config, reactions: {percent}}, plugins, state).svg, 'percent')[0]);
    assert.deepEqual([show({show: 'no'}), show({show: 'count'}), show({show: 'count:no'}), show({show: 'yes/no'})], [['8%'], ['=2'], ['=1'], ['2 / 1']]);
    assert.deepEqual(show({text: ['{{no.percent}}% против', '{{total}} всего']}), ['8% против', '12 всего']);
});

test('hover: off until named; a highlight by CSS, scoped to its own drawing; the aim along the floor and the stack', () => {
    const config = {units: 2, floors: {to: 2, 1: {'@2': {rowSpan: 2}}}};
    const styleOf = extra => find(drawWithState({...config, ...extra}, [cells, hover]).svg, node => node.tag === 'style')[0]?.val;
    assert.equal(styleOf({}), undefined);

    const {svg} = drawWithState({...config, hover: {stroke: 'tomato'}}, [cells, hover]);
    const scope = svg.opt.class.split(' ').find(name => name.startsWith('hover-'));
    const unit = styleOf({hover: {stroke: 'tomato'}});
    assert.ok(unit.includes(`.easy-house.${scope}:has(.unit:hover) .unit[data-unit]:hover rect { stroke: tomato; stroke-width: 2 }`));
    assert.ok(!unit.includes('data-floors'));

    const rulesOf = aim => styleOf({hover: {aim}}).split('\n').slice(1);
    assert.deepEqual(rulesOf('floor').map(rule => /:has\(\.unit([^:]*):hover\)/.exec(rule)[1]),
        ['[data-floors~="1"]', '[data-floors~="2"]', '']);
    assert.deepEqual(rulesOf('stack').map(rule => /:has\(\.unit([^:]*):hover\)/.exec(rule)[1]), [
        '[data-section="1"][data-entrance="1"][data-positions~="1"]',
        '[data-section="1"][data-entrance="1"][data-positions~="2"]',
        ''
    ]);
    assert.equal(rulesOf('both').length, 5);
    assert.deepEqual(rulesOf('off'), []);
    assert.ok(rulesOf('floor')[0].endsWith('rect { fill: #e3f2fd }'));
});

test('a unit is marked where it is: section, entrance, floor, position, and all floors and positions it takes', () => {
    const config = {units: 3, entrances: 2, floors: {to: 2, 1: {'@2': {rowSpan: 2, colSpan: 2}}}};
    const units = byClass(draw(config, [cells]).svg, 'unit');
    const data = id => {
        const {opt} = units.find(unit => unit.opt['data-unit'] === id);
        return ['section', 'entrance', 'floor', 'position', 'floors', 'positions'].map(key => opt[`data-${key}`]);
    };
    assert.deepEqual(data('2'), [1, 1, 1, 2, '1 2', '2 3']);       // the duplex: written at floor 1, position 2
    assert.deepEqual(data('3'), [1, 1, 2, 1, '2', '1']);
    assert.deepEqual(data('4'), [1, 2, 1, 1, '1', '1']);            // the second entrance starts its positions anew
    assert.deepEqual(data('5'), [1, 2, 1, 2, '1 2', '2 3']);       // and has its own duplex: the floors are the house's
});

test('floor labels switched off on a section or an entrance take no room there; their floors go to the next one', () => {
    const width = config => draw(config).geometry.width;
    const labels = config => byClass(draw(config).svg, 'floor-label').length;
    const two = {units: 2, floors: 3, sections: 2};

    // at 'section': the second section labels nothing and takes no room — as wide as with one section labelled
    const off = {...two, floorLabels: {at: 'section'}, sections: [{}, {floorLabels: null}]};
    assert.equal(labels(off), 3);
    assert.equal(width(off), width({...two, floorLabels: {at: 'house', mode: 'gutter'}}));

    // at 'house': the first section switched off — the second one labels the floors, with room of its own
    // (compact would write over the first section's units)
    const first = {...two, sections: [{floorLabels: null}, {}]};
    assert.equal(labels(first), 3);
    const [, second] = draw(first).geometry.sections;
    assert.ok(second.gutters.some(gutter => gutter.plugin === 'floorLabels' && gutter.width > 0));

    // at 'entrance': one entrance off
    const entrances = {units: 2, floors: 3, entrances: [{}, {floorLabels: false}], floorLabels: {at: 'entrance'}};
    assert.equal(labels(entrances), 3);
    assert.equal(draw(entrances).geometry.sections[0].entrances[1].gutters.length, 0);
});

test("a size in one word is a small house: the geometry of heroes, no numbers or floors, filled by reactions", () => {
    const small = sized({units: 5, floors: 3, size: 'xs'});
    assert.deepEqual([small.size, small.gap, small.entranceGap, small.sectionGap], [4, 1, 1, 2]);
    assert.deepEqual([small.cells, small.floorLabels, small.reactions.fill, small.reactions.style], [{numbers: false}, null, true, {strokeWidth: 0}]);
    assert.equal(sized({size: 'extraSmall'}).size, 4);                      // the long names of heroes too

    // the geometry and the palette are defaults the config may change; what is written is off, whatever the config says
    const own = sized({size: 'xs', gap: 2, floorLabels: {at: 'section'}, cells: {numbers: true, fill: 'white'},
        reactions: {fills: {yes: 'gold'}, legend: true}});
    assert.deepEqual([own.gap, own.reactions.fills.yes, own.reactions.fills.no, own.cells.fill], [2, 'gold', '$noBright', 'white']);
    assert.deepEqual([own.floorLabels, own.cells.numbers, own.reactions.legend], [null, false, null]);
    const plain = {size: 20};
    assert.equal(sized(plain), plain);
    assert.throws(() => sized({size: 'huge'}), /unknown size 'huge'/);

    const {svg, geometry} = drawWithState(small, [cells, floorLabels, reactions], {1: {reaction: 'yes'}});
    assert.equal(geometry.units[1].box.x - geometry.units[0].box.x, 5);      // size 4 + gap 1
    assert.equal(byClass(svg, 'floor-label').length, 0);
    assert.equal(find(svg, node => node.tag === 'text').length, 0);
    const one = byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === '1').sub[0].opt;
    assert.deepEqual([one.fill, one['stroke-width']], ['mediumseagreen', 0]);
});

test('compact floor labels stand left of the divider between sections, not across it', () => {
    const {svg, geometry} = draw({units: 3, sections: [{floors: 2}, {floors: 4}], dividers: {extent: 'full'}});
    const divider = byClass(svg, 'divider')[0].opt.x1;
    const labels = byClass(svg, 'floor-label').filter(node => ['3:', '4:'].includes(node.val));
    assert.equal(labels.length, 2);
    assert.ok(labels.every(label => label.opt.x < divider));
    assert.ok(geometry.sections[1].box.x - divider === geometry.geometry.sectionGap / 2);
});

test('the legend line is a template; every value is padded to the widest of any group', () => {
    const config = {units: 4, floors: 3, reactions: {legend: {line: '{{name}} {{percent}}% ({{count}})'}}};
    const state = {1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 3: {reaction: 'no'}};
    const model = resolve(config);
    const geometry = layout(model, config, [cells, reactions], state);
    const legend = byClass(scene(geometry, [cells, reactions], config, state), 'legend')[0];
    assert.deepEqual(legend.sub.map(line => line.sub.map(part => part.val).join('')), ['   yes 17% (2)', '    no  8% (1)', '  none 75% (9)']);
});

test('the palette: plugins take their colours by name; $name in options is a colour of the palette', () => {
    assert.deepEqual(paint({fill: '$unit', list: ['$yes', 'red'], text: '$5 a month', fn: paint}, colors),
        {fill: 'whitesmoke', list: ['green', 'red'], text: '$5 a month', fn: paint});

    const rect = (svg, id) => byClass(svg, 'unit').find(unit => unit.opt['data-unit'] === id).sub[0].opt;
    const config = {units: 2, floors: 1, colors: {unit: 'ivory', yes: 'navy'}, cells: {stroke: '$yes'}};
    const {svg} = drawWithState({...config, floors: {to: 1, 1: {2: {cells: {fill: '$noFill'}}}}}, [cells, reactions], {1: {reaction: 'yes'}});
    assert.deepEqual([rect(svg, '1').fill, rect(svg, '1').stroke], ['ivory', 'navy']);        // the config's palette, by name
    assert.equal(rect(svg, '2').fill, 'pink');                                                // a level's option by name too
    assert.equal(drawWithState({units: 1, floors: 1, background: '$yes', colors: {yes: 'navy'}}, [cells]).svg.opt.style, 'background: navy');
});

test('themes: a palette and options under the config; dark and night; a theme of your own', () => {
    assert.equal(themed({units: 1}).theme, undefined);
    assert.throws(() => themed({theme: 'neon'}), /unknown theme 'neon'/);
    const own = themed({theme: 'dark', colors: {unit: '#333'}});
    assert.deepEqual([own.colors.unit, own.colors.background], ['#333', '#0d1117']);           // the config wins

    const plugins = [cells, walls, reactions];
    const draw = (config, state = {}) => drawWithState(themed(config), plugins, state).svg;
    const dark = draw({units: 2, floors: 1, theme: 'dark'});
    assert.equal(dark.opt.style, 'background: #0d1117');
    assert.equal(byClass(dark, 'unit')[0].sub[0].opt.fill, '#21262d');

    // night: walls behind the sections, dark windows, a flat with yes lit warm with a glow
    const night = draw({units: 2, floors: 2, theme: 'night'}, {1: {reaction: 'yes'}});
    const [section] = byClass(night, 'section');
    assert.equal(section.sub[0].opt.class, 'wall');
    const [one, two] = byClass(night, 'unit').map(unit => unit.sub[0].opt);
    assert.equal(one.fill, '#f0d08a');
    assert.match(one.style, /drop-shadow\(.*rgba\(255, 196, 110, 0.55\)\)/);
    assert.deepEqual([two.fill, two.style, two.stroke], ['#262b35', undefined, undefined]);

    // a theme of your own is an object
    assert.equal(byClass(draw({units: 1, floors: 1, theme: {colors: {unit: 'tan'}}}), 'unit')[0].sub[0].opt.fill, 'tan');
});

test('roof: a strip over every entrance, from the middle of its first column to the middle of its last', () => {
    const plugins = [cells, text, roof];
    // the second section is a floor lower: its roof is in the empty space over it, room is taken for the first only
    const config = {units: 3, sections: [{floors: 3}, {floors: 2, entrances: 2}], roof: true};
    const {svg, geometry} = drawWithState(config, plugins);
    const roofs = byClass(svg, 'roof').map(node => node.opt);
    assert.equal(roofs.length, 3);
    const [first] = geometry.sections[0].entrances;
    assert.deepEqual(roofs[0], {class: 'roof', x: first.box.x + 35 / 2, y: first.box.y - 6 - 2, width: first.box.width - 35, height: 2, fill: colors.wall});
    assert.equal(first.box.y, 1 + 6 + 2);       // padding + offset + height
    assert.equal(roofs[0].y, 1);
    const lower = geometry.sections[1].entrances[0];
    assert.equal(roofs[1].y, lower.box.y - 8);

    // off until named; off on the tall section — no roof there and no room for it
    assert.equal(byClass(drawWithState({units: 3, floors: 2}, plugins).svg, 'roof').length, 0);
    const off = drawWithState({...config, sections: [{floors: 3, roof: null}, {floors: 2, entrances: 2}]}, plugins);
    assert.equal(byClass(off.svg, 'roof').length, 2);
    assert.equal(off.geometry.sections[0].entrances[0].box.y, 1);

    // its band is next to the house: a text block above stays clear of it
    const titled = drawWithState({...config, roof: {height: 3, offset: 4}, text: {text: 'Title', at: 'top'}}, plugins);
    const [band] = titled.geometry.bands.filter(band => band.plugin === 'roof');
    assert.equal(band.y + band.height, titled.geometry.sections[0].entrances[0].box.y);
    assert.equal(band.height, 7);

    // the colour of the walls there, unless it has its own
    const fills = config => byClass(drawWithState(config, plugins).svg, 'roof').map(node => node.opt.fill);
    assert.deepEqual(fills({...config, walls: {color: 'tan'}, sections: [{floors: 3}, {floors: 2, walls: {color: 'peru'}}]}), ['tan', 'peru']);
    assert.deepEqual(fills({...config, walls: {color: 'tan'}, roof: {color: 'gray'}, sections: [{floors: 3}, {floors: 2}]}), ['gray', 'gray']);
});

test('walls: the picture keeps room for them at its edges, counting the room there anyway', () => {
    const plugins = [cells, walls, floorLabels, text];
    const edges = (config, own = plugins) => {
        const {svg, geometry} = drawWithState(config, own);
        const rects = byClass(svg, 'wall').map(node => node.opt);
        return {
            left: Math.min(...rects.map(rect => rect.x)),
            top: Math.min(...rects.map(rect => rect.y)),
            right: geometry.width - Math.max(...rects.map(rect => rect.x + rect.width)),
            bottom: geometry.height - Math.max(...rects.map(rect => rect.y + rect.height)),
            geometry
        };
    };
    // no floor labels: a wall reaches every edge, not over it
    const bare = edges({units: 2, sections: [{floors: 3}, {floors: 4}], walls: {padding: 4}, floorLabels: null});
    assert.deepEqual([bare.left, bare.top, bare.right, bare.bottom], [0, 0, 0, 0]);
    // floor labels on the left and a title above are room enough: nothing is added there
    const labelled = edges({units: 2, floors: 3, walls: {padding: 4}, text: {text: 'Title', at: 'top'}});
    const plain = edges({units: 2, floors: 3, text: {text: 'Title', at: 'top'}}, [cells, floorLabels, text]);
    assert.equal(labelled.geometry.units[0].box.x, plain.geometry.units[0].box.x);
    assert.equal(labelled.geometry.units[0].box.y, plain.geometry.units[0].box.y);
    assert.equal(labelled.geometry.width, plain.geometry.width + 3);    // on the right: 4 - padding 1
});
