import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve, matrix, defaultKinds} from '../src/resolve.js';
import {merge} from '../src/utils.js';

const rowsOf = (config, section = 0, entrance = 0) => matrix(resolve(config))[section][entrance];
const labelsOf = (model, floor, section = 0, entrance = 0) => model.sections[section].entrances[entrance].grid.get(floor)
    .filter(cell => cell.type === 'unit')
    .map(cell => cell.label);

const heroesKinds = {salon: {label: 'С', title: 'Салон Красоты'}, concierge: {label: 'К', title: 'Консьерж'}};
const heroesConfig = {units: 5, kinds: heroesKinds, floors: {to: 22, 1: {'@4': {kind: 'salon'}, '@5': {kind: 'concierge'}}, 22: 3}};

test('merge keeps holes: null stays a value, only undefined falls back to the base', () => {
    assert.deepEqual(merge({row: [1, 2, 3]}, {row: [null, 2]}), {row: [null, 2]});
    assert.deepEqual(merge({floors: {1: {4: 'С'}}}, {floors: {1: {3: null}}}), {floors: {1: {4: 'С', 3: null}}});
    assert.deepEqual(merge({units: 5}, {units: undefined}), {units: 5});
});

test('the example from the discussion: a hole, a shop, numbering goes on from explicit numbers', () => {
    const model = resolve({
        floors: 4,
        units: 5,
        kinds: {shop: {enumerable: false}},
        sections: [
            {floors: {1: ['С', 1, 2]}},
            {floors: {1: [null, 20, 21, {colSpan: 2, kind: 'shop'}]}}
        ]
    });
    const [[first], [second]] = matrix(model);

    assert.deepEqual(first, [
        [13, 14, 15, 16, 17],
        [8, 9, 10, 11, 12],
        [3, 4, 5, 6, 7],
        ['С', 1, 2, null, null]
    ]);
    assert.deepEqual(second, [
        [32, 33, 34, 35, 36],
        [27, 28, 29, 30, 31],
        [22, 23, 24, 25, 26],
        [null, 20, 21, {kind: 'shop', colSpan: 2}]
    ]);
    assert.deepEqual(model.warnings, []);
});

test('a string that does not start with a digit is a label: it takes no number', () => {
    assert.deepEqual(rowsOf({units: 5, floors: {to: 2, 1: [1, 2, 3, 'С', 'К']}}), [
        [4, 5, 6, 7, 8],
        [1, 2, 3, 'С', 'К']
    ]);
});

test('the heroes house: a plain row, positions with kinds, a row with kinds', () => {
    const grounds = [[1, 2, 3, 'С', 'К'], {'@4': {kind: 'salon'}, '@5': {kind: 'concierge'}}, [1, 2, 3, {kind: 'salon'}, {kind: 'concierge'}]];
    for (const ground of grounds) {
        const model = resolve({...heroesConfig, floors: {...heroesConfig.floors, 1: ground}});
        assert.deepEqual(labelsOf(model, 1), [1, 2, 3, 'С', 'К']);
        assert.deepEqual(labelsOf(model, 2), [4, 5, 6, 7, 8]);
        assert.deepEqual(labelsOf(model, 21), [99, 100, 101, 102, 103]);
        assert.deepEqual(labelsOf(model, 22), [104, 105, 106]);
        assert.equal(model.units.filter(cell => typeof cell.label === 'number').length, 106);
        assert.deepEqual(model.warnings, []);
    }
    const salon = resolve(heroesConfig).units.find(cell => cell.label === 'С');
    assert.equal(salon.fields.title, 'Салон Красоты');
});

test('the config from the question: a hole, a special cell with a string number, a plugin field', () => {
    const config = {units: 5, floors: {to: 2, 1: {'@1': null, '@2': {oldman: true, kind: 'special', label: '2/bis'}}}};

    // '2/bis' starts with a digit: a number written as a string, one step
    assert.deepEqual(rowsOf(config), [[5, 6, 7, 8, 9], [null, '2/bis', 2, 3, 4]]);
    // numericStrings: the counter goes to its digits
    assert.deepEqual(rowsOf({...config, numericStrings: true}), [[6, 7, 8, 9, 10], [null, '2/bis', 3, 4, 5]]);
    // a label instead: no number at all
    assert.deepEqual(rowsOf(merge(config, {floors: {1: {'@2': {label: 'С'}}}})), [[4, 5, 6, 7, 8], [null, 'С', 1, 2, 3]]);

    const special = resolve(config).units.find(cell => cell.id === '2/bis');
    assert.equal(special.fields.oldman, true);
});

test('string labels take one step each; numericStrings counts from their digits', () => {
    assert.deepEqual(rowsOf({units: 4, floors: {to: 2, 1: [23, 24, '25/1', '25/2']}})[0], [27, 28, 29, 30]);
    assert.deepEqual(rowsOf({units: 5, floors: {to: 2, 1: [23, 24, '25/1', '25/2', 26]}})[0], [27, 28, 29, 30, 31]);
    assert.deepEqual(rowsOf({units: 4, numericStrings: true, floors: {to: 2, 1: [23, 24, '25/1', '25/2']}})[0], [26, 27, 28, 29]);
});

test('kinds: flat and special are built in; a special unit takes no number unless given one; own kinds are flats', () => {
    assert.deepEqual(Object.keys(defaultKinds), ['flat', 'special']);
    assert.deepEqual(rowsOf({units: 3, floors: {to: 2, 1: [{kind: 'special', label: 'S'}, {kind: 'special', label: 10}, {kind: 'special'}]}}), [
        [11, 12, 13],
        ['S', 10, null]
    ]);
    // a kind of your own that is not numbered either: one line
    assert.deepEqual(rowsOf({units: 3, kinds: {shop: {enumerable: false}}, floors: {to: 2, 1: [{kind: 'shop'}, {kind: 'shop', label: 10}, {kind: 'shop'}]}}), [
        [11, 12, 13],
        [{kind: 'shop'}, {label: 10, kind: 'shop'}, {kind: 'shop'}]
    ]);
    assert.deepEqual(rowsOf({units: 2, kinds: {novapost: {label: 'НП'}}, floors: {to: 1, 1: [1, {kind: 'novapost'}]}}), [
        [1, {label: 'НП', kind: 'novapost'}]
    ]);
    // an own kind is a flat unless it says otherwise
    assert.deepEqual(rowsOf({units: 2, kinds: {duplex: {rowSpan: 2}}, floors: {to: 2, 1: {'@2': {kind: 'duplex'}}}}), [
        [3],
        [1, {label: 2, kind: 'duplex', rowSpan: 2}]
    ]);
    assert.equal(resolve({units: 1, floors: {to: 1, 1: [{kind: 'nope'}]}}).warnings.length, 1);
});

test('kinds: flat < kind < unit, and kinds cascade like everything else', () => {
    const model = resolve({
        floors: 1,
        units: 2,
        kinds: {flat: {title: 'квартира'}, salon: {label: 'С', title: 'Салон Красоты'}},
        sections: [
            {floors: {1: {'@2': {kind: 'salon', title: 'Барбершоп'}}}},
            {kinds: {flat: {title: 'апартаменты'}}}
        ]
    });
    const [a1, barber, b1, b2] = model.units;

    assert.equal(a1.fields.title, 'квартира');
    assert.deepEqual([barber.label, barber.fields.title], ['С', 'Барбершоп']);
    assert.deepEqual([b1.fields.title, b2.fields.title], ['апартаменты', 'апартаменты']);
});

test('a short floor takes its positions from the aligned edge; a duplex from below counts among them', () => {
    const duplex = {units: 5, floors: {to: 22, 1: [1, 2, 3, 'С', 'К'], 21: {'@5': {rowSpan: 2}}}};
    const top = config => resolve(config).sections[0].entrances[0].grid.get(22).map(cell => cell.label ?? cell.type);

    assert.deepEqual(top(merge(duplex, {floors: {22: {units: 3, align: 'right'}}})), ['empty', 'empty', 104, 105, 'covered']);
    assert.deepEqual(top(merge(duplex, {floors: {22: 3}})), [104, 105, 106, 'empty', 'covered']);
});

test('an arch: a section that starts on the 2nd floor', () => {
    const model = resolve({units: 4, sections: [{floors: 12}, {floors: {from: 2, to: 4}, units: 3}, {floors: 12}]});
    const [[left], [arch], [right]] = matrix(model);

    assert.deepEqual(left.at(-1), [1, 2, 3, 4]);
    assert.deepEqual(left[0], [45, 46, 47, 48]);
    assert.deepEqual(arch, [[55, 56, 57], [52, 53, 54], [49, 50, 51]]);
    assert.deepEqual(right.at(-1), [58, 59, 60, 61]);
    assert.deepEqual(model.sections[1].entrances[0].floors, [2, 3, 4]);
});

test('spans: HTML sizes, the sign is the direction', () => {
    // a duplex going up: one number, the cell above is taken
    assert.deepEqual(rowsOf({units: 3, floors: {to: 3, 2: {'@2': {rowSpan: 2}}}}), [
        [7, 8],
        [4, {label: 5, rowSpan: 2}, 6],
        [1, 2, 3]
    ]);
    // a duplex going down from the floor it is written on: the auto unit below disappears
    assert.deepEqual(rowsOf({units: 3, floors: {to: 3, 3: {'@2': {rowSpan: -2}}}}), [
        [6, {label: 7, rowSpan: -2}, 8],
        [4, 5],
        [1, 2, 3]
    ]);
    // a wide flat to the left
    assert.deepEqual(rowsOf({units: 3, floors: {to: 1, 1: {'@3': {colSpan: -2}}}}), [
        [1, {label: 2, colSpan: -2}]
    ]);
    // a span never swallows a unit written explicitly
    assert.equal(resolve({units: 2, floors: {to: 1, 1: [1, {colSpan: -2}]}}).warnings.length, 1);
});

test('overrides cascade: house → section → entrance', () => {
    const model = resolve({
        units: 3,
        floors: {to: 2, 1: {'@1': null}},
        kinds: {shop: {enumerable: false}},
        sections: [{}, {floors: {1: {'@3': {kind: 'shop'}}}}, {floors: {1: [20, 21, 22]}}]
    });
    const [[a], [b], [c]] = matrix(model);

    assert.deepEqual(a, [[3, 4, 5], [null, 1, 2]]);
    assert.deepEqual(b, [[7, 8, 9], [null, 6, {kind: 'shop'}]]);
    assert.deepEqual(c, [[23, 24, 25], [20, 21, 22]]);
    assert.deepEqual(model.warnings, []);
});

test('sections of different height with several entrances, numbered entrance by entrance', () => {
    const model = resolve({units: 4, sections: [{floors: 5, entrances: 2}, {floors: 9, start: 101}]});
    const [[first, second], [tall]] = matrix(model);

    assert.deepEqual(first.at(-1), [1, 2, 3, 4]);
    assert.deepEqual(first[0], [17, 18, 19, 20]);
    assert.deepEqual(second.at(-1), [21, 22, 23, 24]);
    assert.deepEqual(tall.at(-1), [101, 102, 103, 104]);
    assert.equal(model.units.length, 2 * 5 * 4 + 9 * 4);
});

test('floors: a number is sugar for {from: 1, to: n}; numbers and objects merge through the cascade', () => {
    const model = resolve({units: 2, floors: 22, sections: [{floors: {22: 1}}, {floors: {from: 2, to: 4}}, {floors: 3}]});
    const [tall, arch, low] = model.sections.map(section => section.entrances[0]);

    assert.deepEqual([tall.floors.at(0), tall.floors.at(-1)], [1, 22]);
    assert.equal(tall.grid.get(22).filter(cell => cell.type === 'unit').length, 1);
    assert.deepEqual(arch.floors, [2, 3, 4]);
    assert.deepEqual(low.floors, [1, 2, 3]);
    // the range can come from the keys alone
    assert.deepEqual(resolve({units: 1, floors: {1: 1, 5: 1}}).sections[0].entrances[0].floors, [1, 2, 3, 4, 5]);
    // the old array form is not a range any more
    assert.equal(resolve({units: 1, floors: [2, 4]}).warnings.length, 1);
});

test('underground floors: no floor 0 with groundFloor 1; 0 is the ground with groundFloor 0', () => {
    const ua = resolve({units: 1, floors: {from: -2, to: 2}}).sections[0].entrances[0];
    assert.deepEqual(ua.floors, [-2, -1, 1, 2]);
    assert.deepEqual([...ua.levels], [[-2, -1], [-1, 0], [1, 1], [2, 2]]);

    const eu = resolve({units: 1, groundFloor: 0, floors: {from: -1, to: 2}}).sections[0].entrances[0];
    assert.deepEqual(eu.floors, [-1, 0, 1, 2]);
    assert.deepEqual([...eu.levels], [[-1, 0], [0, 1], [1, 2], [2, 3]]);

    // numbering goes bottom-up through the basement, a span from -1 reaches floor 1
    const model = resolve({units: 1, floors: {from: -1, to: 2, '-1': {'@1': {rowSpan: 2}}}});
    assert.deepEqual(matrix(model)[0][0], [[2], [], [{label: 1, rowSpan: 2}]]);
    assert.deepEqual(model.warnings, []);
});

test("a floor object: positions ('@n') change the structure, unit numbers patch what you see", () => {
    // floor 12: a hole by position, and the flat that ends up as 54 marked by its number
    const config = {units: 5, floors: {to: 13, 1: [1, 2, 3, 'С', 'К'], 12: {'@1': null, 54: {oldman: true, title: 'ветеран'}}}};
    const model = resolve(config);
    const [floor13, floor12] = rowsOf(config);

    assert.deepEqual(model.warnings, []);
    assert.deepEqual(floor12, [null, 54, 55, 56, 57]);
    assert.deepEqual(floor13, [58, 59, 60, 61, 62]);
    const flat = model.units.find(cell => cell.id === '54');
    assert.deepEqual([flat.path.position, flat.fields.oldman, flat.fields.title], [2, true, 'ветеран']);
});

test('a patch by number: a number not on the floor or a field that moves the numbering is warned, nothing moves', () => {
    const model = resolve({units: 5, floors: {to: 13, 1: [1, 2, 3, 'С', 'К'], 12: {53: null, 55: {oldman: true, label: 111}}}});
    const [missing, structural] = model.warnings;

    assert.match(missing, /floor 12 has no unit 53 \(units here: 54, 55, 56, 57, 58\)/);
    assert.match(structural, /unit 55: label would change the numbering/);
    assert.deepEqual(matrix(model)[0][0][1], [54, 55, 56, 57, 58]);
    assert.equal(model.units.find(cell => cell.id === '55').fields.oldman, true);
    assert.equal(model.sections[0].entrances[0].width, 5);
});

test('10: null — a hole where 10 was: nothing is there, no other number moves', () => {
    const config = {units: 4, floors: {to: 7, 3: {10: null, 12: {hole: true, title: 'разрушена'}}}};
    const model = resolve(config);
    const [, , , floor4, floor3] = rowsOf(config);

    assert.deepEqual(model.warnings, []);
    assert.deepEqual(floor3, [9, null, 11, 12]);
    assert.deepEqual(floor4, [13, 14, 15, 16]);
    assert.equal(model.units.find(cell => cell.id === '10'), undefined);      // gone: no data, no events
    // `hole` is just a field for the core — the key of the hole plugin
    assert.equal(model.units.find(cell => cell.id === '12').fields.hole, true);

    // a spanning unit takes all its cells with it
    const duplex = {units: 3, floors: {to: 3, 2: {'@2': {rowSpan: 2}, 5: null}}};
    assert.deepEqual(rowsOf(duplex), [[7, null, 8], [4, null, 6], [1, 2, 3]]);
});

test('a span by number: the same as at the unit\'s position; the next one counts the ones before it', () => {
    const byNumber = {units: 4, floors: {to: 7, 2: {6: {colSpan: 2, title: 'wide'}}, 5: {19: {rowSpan: 2}}, 6: {21: {rowSpan: 2}}}};
    const byPosition = {units: 4, floors: {to: 7, 2: {'@2': {colSpan: 2}}, 5: {'@4': {rowSpan: 2}}, 6: {'@2': {rowSpan: 2}}}};
    const model = resolve(byNumber);

    assert.deepEqual(model.warnings, []);
    assert.deepEqual(matrix(model), matrix(resolve(byPosition)));
    assert.deepEqual(rowsOf(byNumber).slice(0, 3), [[23, 24, 25], [20, {label: 21, rowSpan: 2}, 22], [16, 17, 18, {label: 19, rowSpan: 2}]]);
    assert.equal(model.units.find(cell => cell.id === '6').fields.title, 'wide');    // the data of the patch stays

    // an explicit row above: its items take the free positions, like under a span by position
    assert.deepEqual(rowsOf({units: 3, floors: {to: 2, 1: {2: {rowSpan: 2}}, 2: ['a', 'b']}}), [['a', 'b'], [1, {label: 2, rowSpan: 2}, 3]]);
});

test('a span by number goes only forward in the numbering; back, or a kind or a label, is warned and moves nothing', () => {
    const down = resolve({units: 4, floors: {to: 2, 2: {6: {rowSpan: -2}}}});
    assert.match(down.warnings[0], /unit 6: by number a span goes forward in the numbering — up \(rowSpan > 0\) and to the right/);
    assert.deepEqual(matrix(down)[0][0], [[5, 6, 7, 8], [1, 2, 3, 4]]);

    const left = resolve({units: 4, floors: {to: 1, 1: {2: {colSpan: -2}}}});
    assert.equal(left.warnings.length, 1);

    // with right-to-left numbering forward is to the left
    const rtl = resolve({units: 4, numberDirection: 'rtl', floors: {to: 1, 1: {2: {colSpan: -2}}}});
    assert.deepEqual(rtl.warnings, []);
    assert.deepEqual(matrix(rtl)[0][0], [[3, {label: 2, colSpan: -2}, 1]]);
    assert.match(resolve({units: 4, numberDirection: 'rtl', floors: {to: 1, 1: {2: {colSpan: 2}}}}).warnings[0], /to the left \(colSpan < 0\)/);
});

test('numberDirection: right to left on a floor; by default as direction; cascades down to a floor', () => {
    assert.deepEqual(rowsOf({units: 3, floors: 2, numberDirection: 'rtl'}), [[6, 5, 4], [3, 2, 1]]);
    // a snake: one floor its own way
    assert.deepEqual(rowsOf({units: 3, floors: {to: 3, 2: {numberDirection: 'rtl'}}}), [[7, 8, 9], [6, 5, 4], [1, 2, 3]]);

    // direction: 'rtl' — entrances from the right, and the numbers on a floor too, unless said otherwise
    const twoEntrances = extra => matrix(resolve({units: 2, entrances: 2, floors: 1, direction: 'rtl', ...extra}))[0].map(([row]) => row);
    assert.deepEqual(twoEntrances(), [[2, 1], [4, 3]]);
    assert.deepEqual(twoEntrances({numberDirection: 'ltr'}), [[1, 2], [3, 4]]);
    assert.deepEqual(twoEntrances({entrances: [{}, {numberDirection: 'ltr'}]}), [[2, 1], [3, 4]]);
});

test('merged flats keep the numbering: every cell they take keeps its number to itself; any direction, by number or by position', () => {
    const rows = config => rowsOf({units: 4, ...config});
    // 19 and 20 merged, the room keeps 20: 19 is gone, nothing moves
    assert.deepEqual(rows({floors: {to: 2, 1: {4: {colSpan: -2, merged: true}}}}), [[5, 6, 7, 8], [1, 2, {label: 4, colSpan: -2, merged: true}]]);
    assert.deepEqual(rows({floors: {to: 2, 1: {3: {colSpan: 2, merged: true}}}}), [[5, 6, 7, 8], [1, 2, {label: 3, colSpan: 2, merged: true}]]);
    // a designed penthouse: one number however many cells, the numbers after it move
    assert.deepEqual(rows({floors: {to: 2, 1: {3: {colSpan: 2}}}}), [[4, 5, 6, 7], [1, 2, {label: 3, colSpan: 2}]]);
    // up and down
    assert.deepEqual(rows({floors: {to: 2, 1: {3: {rowSpan: 2, merged: true}}}}), [[5, 6, 8], [1, 2, {label: 3, rowSpan: 2, merged: true}, 4]]);
    assert.deepEqual(rows({floors: {to: 2, 2: {7: {rowSpan: -2, merged: true}}}}), [[5, 6, {label: 7, rowSpan: -2, merged: true}, 8], [1, 2, 4]]);
    // by position the same; a hole under a merged span had no number to take
    assert.deepEqual(rows({floors: {to: 2, 1: {'@3': {colSpan: 2, merged: true}}}}), [[5, 6, 7, 8], [1, 2, {label: 3, colSpan: 2, merged: true}]]);
    assert.deepEqual(rows({floors: {to: 2, 1: {'@3': null}, 2: {'@3': {rowSpan: -2, merged: true}}}}), [[4, 5, {label: 6, rowSpan: -2, merged: true}, 7], [1, 2, 3]]);
    // with right-to-left numbering too
    assert.deepEqual(rows({numberDirection: 'rtl', floors: {to: 1, 1: {3: {colSpan: 2, merged: true}}}}), [[4, {label: 3, colSpan: 2, merged: true}, 1]]);
});

test('a floor object may carry its whole row in units, with fields of the floor beside it', () => {
    const model = resolve({units: 3, floors: {to: 2, 1: {units: [1, 'S', 2], mark: 'done', 2: {title: 'two'}}}});
    assert.deepEqual(model.warnings, []);
    assert.deepEqual(matrix(model)[0][0], [[3, 4, 5], [1, 'S', 2]]);
    assert.equal(model.sections[0].entrances[0].props[1].mark, 'done');
    assert.equal(model.units.find(cell => cell.id === '2').fields.title, 'two');
});

test('keys: where numbering starts again, the key grows by what tells the flats apart', () => {
    const ids = config => resolve(config).units.map(cell => cell.id);
    const warnings = config => resolve(config).warnings;

    // continuous: the number is the key
    assert.deepEqual(ids({units: 2, floors: 1, sections: 2}), ['1', '2', '3', '4']);
    // a section starting further on repeats nothing: still the number
    assert.deepEqual(ids({units: 2, floors: 1, sections: [{}, {start: 101}]}), ['1', '2', '101', '102']);

    // two houses in one building, 7 and 7a, each numbered from 1: section-flat
    const raskovoi = {units: 2, floors: 1, sections: [{entrances: 2}, {entrances: 2, start: 1}]};
    assert.deepEqual(ids(raskovoi), ['s1-1', 's1-2', 's1-3', 's1-4', 's2-1', 's2-2', 's2-3', 's2-4']);
    assert.deepEqual(warnings(raskovoi), []);

    // entrances numbered each from 1, in several sections: section-entrance-flat
    const each = {units: 2, floors: 1, sections: [{entrances: [{}, {start: 1}]}, {entrances: [{start: 1}, {start: 1}]}]};
    assert.deepEqual(ids(each), ['s1-e1-1', 's1-e1-2', 's1-e2-1', 's1-e2-2', 's2-e1-1', 's2-e1-2', 's2-e2-1', 's2-e2-2']);
    // one section: the section tells nothing apart — entrance-flat
    assert.deepEqual(ids({units: 2, floors: 1, entrances: [{}, {start: 1}]}), ['e1-1', 'e1-2', 'e2-1', 'e2-2']);
    // numbers that go back on one entrance: floor-flat; a negative number keeps its minus
    assert.deepEqual(ids({units: 2, floors: {to: 2, 2: [1, -1]}}), ['f1-1', 'f1-2', 'f2-1', 'f2--1']);

    // labels without a number are keyed apart: a concierge in each section does not change the keys of the flats
    const concierges = {units: 2, floors: {to: 2, 1: {'@1': {label: 'C'}}}, sections: 2};
    assert.deepEqual(ids(concierges), ['s1-C', '1', '2', '3', 's2-C', '4', '5', '6']);
    // an empty label keys nothing: such units are keyed by their place, and the keys of the rest stay as they are
    assert.deepEqual(ids({units: 2, floors: {to: 1, 1: [{kind: 'special', label: ''}, {kind: 'special', label: ''}]}, sections: 2}),
        ['1.1.1.1', '1.1.1.2', '2.1.1.1', '2.1.1.2']);
    // an explicit id is the key as it is; a unit without a number — its place
    assert.deepEqual(ids({units: 2, floors: {to: 1, 1: [{id: 'shop'}, {kind: 'special'}]}, sections: [{}, {start: 1}]}),
        ['shop', '1.1.1.2', 'shop', '2.1.1.2']);
    assert.match(warnings({units: 2, floors: {to: 1, 1: [{id: 'shop'}, 1]}, sections: [{}, {start: 1}]})[0], /duplicate unit id shop/);

    // the same number twice on one floor is a mistake at any depth: reported, the rest keyed as usual
    const twice = resolve({units: 3, floors: {to: 1, 1: [1, 2, 2]}, sections: [{}, {start: 1}]});
    assert.deepEqual(twice.units.map(cell => cell.id), ['s1-1', 's1-2', 's1-2', 's2-1', 's2-2', 's2-2']);
    assert.equal(twice.warnings.length, 2);

    // patches by number still go by the number written on the floor
    const patched = resolve({units: 2, floors: {to: 1, 1: {2: {title: 'two'}}}, sections: [{}, {start: 1}]});
    assert.deepEqual(patched.units.filter(cell => cell.fields.title).map(cell => cell.id), ['s1-2', 's2-2']);

    // the shape written in the config: the same keys whatever the numbers do
    assert.deepEqual(ids({units: 2, floors: 1, sections: 2, keys: 'section'}), ['s1-1', 's1-2', 's2-3', 's2-4']);
    assert.deepEqual(ids({units: 2, floors: 1, keys: 'entrance'}), ['s1-e1-1', 's1-e1-2']);
    assert.deepEqual(ids({units: 1, floors: 2, keys: 'floor'}), ['s1-e1-f1-1', 's1-e1-f2-2']);
    const plain = resolve({...raskovoi, keys: 'number'});
    assert.deepEqual(plain.units.map(cell => cell.id), ['1', '2', '3', '4', '1', '2', '3', '4']);
    assert.equal(plain.warnings.length, 4);
    assert.match(warnings({units: 1, floors: 1, keys: 'house'})[0], /keys: 'house'/);
});
