// Built-in presets of the playground. Each is an ES module as text: `export default` is the house config,
// an optional `export const state` is the state of the units (by id), an optional `export function setup(house, {log, panel})`
// runs after drawing, an optional `export const dark` is what the dark switch puts over the config (theme: 'dark' if
// there is none). Bare imports go through the import map.
import {defaultGeometry, defaultKinds, sizes, colors, cells, floorLabels, dividers, reactions, stacks, text, roof, hover} from 'easy-house';

export const presets = [
    {
        name: 'Every option (the defaults)',
        code: fullConfig()
    },
    {
        name: 'Kyiv: Khreshchatyk 23–27, the House with a star',
        code: `// the flag over the tower, drawn in the square of its unit: emoji flags are not drawn on Windows
const flag = ({unit: {box}}) => {
    const width = box.width * 0.32, height = width * 2 / 3;
    const x = box.x + (box.width - width) / 2, y = box.y + (box.height - height) / 2;
    return [
        {tag: 'rect', opt: {x, y, width, height: height / 2, fill: '#0057b7'}},
        {tag: 'rect', opt: {x, y: y + height / 2, width, height: height / 2, fill: '#ffd700'}}
    ];
};

// Kyiv, Khreshchatyk 23–27 — the ensemble around "the House with a star" (No. 25, 1954; architects A. Dobrovolskyi,
// O. Malynovskyi, P. Petrushenko). No. 25 has three sections: a 14-storey centre with a tower and a spire with a star,
// the tallest house of Kyiv until 1981, and two 9-storey wings. On its ground floor was the Druzhba cinema
// (1956–2012): two halls, the Green and the Red, 100 seats each. Nos. 23 and 27 stand at the sides, 11 storeys each.
// From the descriptions: the houses, their floors, the tower and the cinema. Not found anywhere, so assumed:
// 4 flats on a floor, one entrance a section, shops on the ground floors, as all along Khreshchatyk.
// Switch on dark (next to fit) for the night: the windows of those who said yes are lit, of those who said maybe —
// dimly. Click a window to light it.
export default {
    units: 4,
    kinds: {
        // shop windows and the sign of the cinema have a light of their own, whatever the vote
        shop: {enumerable: false, label: '', title: 'shops', reactions: null, cells: {fill: '$maybeFill'}},
        cinema: {
            enumerable: false, label: 'Druzhba', title: 'The Druzhba cinema, 1956–2012: two halls, the Green and the Red',
            reactions: null, cells: {color: '#e8b64c', glow: '$glow', fontWeight: 'bold'}
        },
        tower: {enumerable: false, label: '', title: 'the tower'}
    },
    floors: {1: [{kind: 'shop', colSpan: 4}]},                     // shops on the ground floor of every house
    sections: [
        {floors: 11},                                               // Khreshchatyk 23
        {floors: 9},                                                // No. 25: the left wing
        {                                                           //         the centre
            floors: {
                to: 16,
                1: [{kind: 'cinema', colSpan: 4}],
                15: {units: 0, label: '', '@2': {kind: 'tower', colSpan: 2}},
                16: {units: 0, label: '', '@2': {kind: 'tower', colSpan: 2, title: 'the flag', draw: flag}}
            },
            roof: null
        },
        {floors: 9},                                                //         the right wing
        {floors: 11}                                                // Khreshchatyk 27
    ],
    walls: true,
    roof: true,
    hover: true,
    // the lines aligned left, the block by the right edge of the house
    text: {x: '100%', anchor: 'right', text: ['Kyiv', 'Khreshchatyk 23–27']}
};

// what the dark switch puts over the config: the night
export const dark = {theme: 'night'};

// a vote: about four in ten said yes, one in ten maybe, one in ten no — the same every time
const random = id => Math.abs(Math.sin(id * 12.9898) * 43758.5453) % 1;
export const state = {};
for (let id = 1; id <= 196; id++) {
    const r = random(id);
    const reaction = r < 0.4 ? 'yes' : r < 0.5 ? 'maybe' : r < 0.6 ? 'no' : null;
    if (reaction) state[id] = {reaction};
}

export function setup(house) {
    house.on('unit:click', ({unit}) => house.update({[unit.config.id]: unit.state.reaction === 'yes' ? null : {reaction: 'yes'}}));
}
`
    },
    {
        name: 'Kyiv: the daisies of Obolon',
        code: `// Kyiv, Obolonska square 2 and 2-a — the "daisies" (or "corn"): two round towers with semicircular balconies,
// an experiment of the microdistrict No. 2. Both stand on a stylobate two storeys high, a little narrower than
// the tower and surrounded by columns.
// The first, 1981: the first monolithic house of Kyiv, its floors lifted along a concrete core. Two technical floors
// below, 15 floors of flats, 6 flats a floor — 90 flats.
// The second, 1990: slip-formed, the tallest house of Kyiv then. In the stylobate — the entrance and the hall; over
// the hall a technical floor, then 20 floors of flats, 6 a floor — 120 flats, and a technical floor under the roof.
// (The source says 22 floors; its parts add up to 24.)
// Two houses, each numbered from 1: the keys are section-flat — 's2-17'.
export default {
    units: 6,
    size: 30,
    kinds: {
        technical: {enumerable: false, label: '', title: 'a technical floor'},
        stylobate: {enumerable: false, label: '', title: 'the stylobate'},
        hall: {enumerable: false, label: 'hall', title: 'the entrance and the hall'}
    },
    sections: [
        {
            floors: {
                to: 17,
                1: {units: 0, '@2': {kind: 'technical', colSpan: 4}},        // the stylobate: narrower, columns around
                2: {units: 0, '@2': {kind: 'technical', colSpan: 4}}
            }
        },
        {
            start: 1,
            floors: {
                to: 24,
                1: {units: 0, '@2': {kind: 'hall', colSpan: 4}},
                2: {units: 0, '@2': {kind: 'stylobate', colSpan: 4}},
                3: [{kind: 'technical', colSpan: 6}],
                24: [{kind: 'technical', colSpan: 6}]
            }
        }
    ],
    walls: true,
    hover: true,
    text: {text: ['Kyiv', 'Obolonska square 2, 2-a']}         // the address, at the top left
};
`
    },
    {
        name: 'Kyiv: a stepped house on Chervonoi Kalyny avenue',
        code: `// Kyiv, Chervonoi Kalyny avenue (once Mayakovskoho), Nos. 62A, 64A and 66A — stepped houses of four entrances,
// 18, 16, 12 and 12 floors high, four flats a floor, numbered through the house.
export default {
    units: 4,
    entrances: [{floors: 18}, {floors: 16}, {floors: 12}, {floors: 12}],
    walls: true,
    roof: true,
    hover: true,
    text: {x: '100%', anchor: 'right', text: ['Kyiv', 'Chervonoi Kalyny avenue']}
};
`
    },
    {
        name: 'Kharkiv: the Slovo house',
        code: `// Kharkiv, Kultury street 9 — the Slovo house (1930; architect M. Dashkevych), built by a cooperative of writers.
// In plan it is the letter С, for "Slovo" — the word: a long wing on the street and two wings into the courtyard.
// Here it is unrolled into one front: the left wing, the street wing, the right wing.
// From the drawings and the descriptions: five entrances — three from the street, one in each side wing; five floors
// over a semi-basement that runs under the whole house; a corner tower with a spire where the street wing meets the
// right one. 66 flats of three and four rooms; the two in the semi-basement of
// entrance 1 were for the building manager and the janitor; a kindergarten was in a semi-basement, a solarium on the
// roof of entrance 5. By 1938 the residents of 40 of the 66 flats were repressed: the Executed Renaissance.
// Assumed, as no plan of the flats is published: three flats a floor in the left wing, two at each entrance of the
// street wing, four in the right wing and three on its top floor, under the tower; the kindergarten under entrance 3
// — 66 in all.
export default {
    kinds: {
        service: {kind: 'special', label: '', title: 'the building manager, the janitor'},
        storage: {enumerable: false, label: '', title: 'storerooms'},
        kindergarten: {enumerable: false, label: 'kids', title: 'the kindergarten for the children of the writers'},
        tower: {enumerable: false, label: '', title: 'the corner tower with a spire'}
    },
    sections: [
        // the left wing: entrance 1
        {units: 3, floors: {to: 5, 0: [{kind: 'service'}, {kind: 'service'}, {kind: 'storage'}]}},
        // the street wing: entrances 2, 3 and 4
        {units: 2, entrances: [
            {floors: {to: 5, 0: [{kind: 'storage', colSpan: 2}]}},
            {floors: {to: 5, 0: [{kind: 'kindergarten', colSpan: 2}]}},
            {floors: {to: 5, 0: [{kind: 'storage', colSpan: 2}]}}
        ]},
        // the right wing: entrance 5 and the corner tower
        {units: 4, floors: {to: 6, 0: [{kind: 'storage', colSpan: 4}], 5: 3, 6: {units: 0, label: '', '@1': {kind: 'tower', colSpan: 2}}}, roof: null}
    ],
    walls: true,
    roof: true,
    hover: true,
    text: {at: 'bottom', text: ['Kharkiv, the Slovo house: 66 flats; by 1938 the residents of 40 were repressed']}
};
`
    },
    {
        name: 'Lviv: the Dnister house',
        code: `// Lviv, Ruska street 20 — the house of the Dnister insurance company (1905–1906; the bureau of Ivan Levynskyi,
// façades by Tadeusz Obmiński, ceramics by Oleksandr Lushpynskyi): the Hutsul secession. Four storeys, two blocks,
// each with its courtyard and staircase: on Ruska street the company's offices; on Pidvalna a symmetric front with
// its central entrance and, over it, the wooden tower.
// The project: shops and a gymnasium on the ground floor, two flats on each of the floors 2–4, of six rooms and of four.
// In the gymnasium of the Sokil society Les Kurbas first appeared on stage, in 1909; the Fortuna Nova confectionery
// was here until 1939. Which block had the flats is not said: here the one on Pidvalna.
export default {
    kinds: {
        office: {enumerable: false, label: 'Dnister', title: 'the offices of the Dnister insurance company'},
        gym: {enumerable: false, label: 'Sokil', title: 'the gymnasium of the Sokil society: Les Kurbas first appeared on stage here, 1909'},
        shop: {enumerable: false, label: '', title: 'the Fortuna Nova confectionery, until 1939'},
        door: {enumerable: false, label: '', title: 'the central entrance on Pidvalna'},
        tower: {enumerable: false, label: '', title: 'the wooden tower, restored in 2006'}
    },
    entrances: [
        // on Ruska street: the offices
        {units: 3, floors: {to: 4, 1: [{kind: 'gym', colSpan: 3}], 2: [{kind: 'office', colSpan: 3}], 3: [{kind: 'office', colSpan: 3}], 4: [{kind: 'office', colSpan: 3}]}},
        // on Pidvalna: the flats, the entrance and the tower in the middle
        {
            units: 5,
            floors: {
                to: 5,
                1: [{kind: 'shop', colSpan: 2}, {kind: 'door'}, {kind: 'shop', colSpan: 2}],
                2: [{colSpan: 3, title: 'six rooms'}, {colSpan: 2, title: 'four rooms'}],
                3: [{colSpan: 3, title: 'six rooms'}, {colSpan: 2, title: 'four rooms'}],
                4: [{colSpan: 3, title: 'six rooms'}, {colSpan: 2, title: 'four rooms'}],
                5: {units: 0, label: '', '@3': {kind: 'tower'}}
            }
        }
    ],
    walls: true,
    roof: true,
    hover: true,
    text: {at: 'bottom', text: ['Lviv, Ruska street 20']}
};
`
    },
    {
        name: 'Odesa: the Margulis house',
        code: `// Odesa, Marazliivska street 34B — the revenue house of Ignatiy Margulis (1912; engineer Felix Pappe), Art Nouveau,
// on the corner of Sabanskyi lane. The ground slopes: the section on the lane has six full floors, while from
// Marazliivska street its first floor is a semi-basement — the same storeys, a street a floor higher; shops are there
// now, a pharmacy and groceries. Six floors from the lane made it the tallest house of Odesa for many decades. The
// painter Hryhoriy Kryzhevskyi lived here.
// The floors of a section are numbered as its street sees them: base lifts the Marazliivska one, so its floor 0 is
// on the row of floor 1 of the lane. Flats a floor are not published: assumed two, for wealthy tenants.
export default {
    units: 2,
    kinds: {shop: {enumerable: false, label: ''}},
    sections: [
        {floors: 6},                                                        // on Sabanskyi lane
        {base: 1, floors: {from: 0, to: 5, 0: [{kind: 'shop', title: 'a pharmacy'}, {kind: 'shop', title: 'groceries'}]}}  // on Marazliivska
    ],
    floorLabels: {at: 'section'},
    walls: true,
    roof: true,
    hover: true,
    text: {at: 'bottom', text: ['Odesa, Marazliivska 34B: Sabanskyi lane on the left, Marazliivska street on the right']}
};
`
    },
    {
        name: 'A tall house: a salon and a concierge',
        code: `// 22 floors of 5 units: on the ground floor a beauty salon and a concierge — kinds of units; three flats on the 22nd
export default {
    units: 5,
    kinds: {
        salon: {label: 'S', title: 'Beauty salon'},
        concierge: {label: 'C', title: 'Concierge'}
    },
    floors: {
        to: 22,
        1: {'@4': {kind: 'salon'}, '@5': {kind: 'concierge'}},     // '@n' — a position: structure
        22: 3
    }
};
`
    },
    {
        name: 'The same, the row by hand',
        code: `// A row may be an array — the whole row, explicitly; the tail is empty.
// 'S' and 'C' do not start with a digit — they are labels and take no number
export default {
    units: 5,
    floors: {to: 22, 1: [1, 2, 3, 'S', 'C'], 22: 3}
};
`
    },
    {
        name: 'A hole, a shop, explicit numbers',
        code: `// A hole, a shop on two positions; the numbering goes on from explicit numbers — there are no 18 and 19
export default {
    floors: 4,
    units: 5,
    kinds: {shop: {enumerable: false}},      // a kind of our own: not numbered
    sections: [
        {floors: {1: ['S', 1, 2]}},
        {floors: {1: [null, 20, 21, {colSpan: 2, kind: 'shop'}]}}
    ]
};
`
    },
    {
        name: 'An arch',
        code: `// The middle section starts on the 2nd floor — a passage under it
export default {
    units: 4,
    sections: [
        {floors: 12},
        {floors: {from: 2, to: 4}, units: 3},
        {floors: 12}
    ]
};
`
    },
    {
        name: 'Sections of different height, several entrances',
        code: `// Floor numbers are written where a floor first appears: 6–9 at the second section
export default {
    units: 4,
    sections: [
        {floors: 5, entrances: 3},
        {floors: 9, entrances: 2}
    ],
    floorLabels: {at: 'house'}          // 'section' — numbers at every section, 'entrance' — at every entrance
};
`
    },
    {
        name: 'A slope: compact and gutter',
        code: `// base lifts a section; each next one brings a new level — it is labelled there.
// The default look is compact: the number of a new floor is written over the neighbour, the line only as high as both.
export default {
    floors: 5,
    units: 3,
    sections: [{}, {base: 1}, {base: 2}],

    // floorLabels: {at: 'section'},     // floor numbers at every section (room is reserved, mirrored)
    // floorLabels: {mode: 'gutter'},    // room for new numbers is reserved and mirrored at the neighbour
    // dividers: {extent: 'full'},       // the line over the full height of the neighbours
};
`
    },
    {
        name: 'Below the ground',
        code: `// A floor below the ground is -1: floors: {from: -1}. It stands right under the 1st (there is no floor 0)
// and is labelled "-1:". groundFloor: 0 — the European count, where 0 is the ground floor.
// base: -1 is something else: the whole section stands lower (a slope down).
export default {
    floors: 4,
    units: 3,
    sections: [
        {},
        {floors: {from: -1, to: 4, '-1': [{colSpan: 3, label: 'parking'}]}},
        {base: -1}
    ]
};
`
    },
    {
        name: 'Parking: a floor draws itself',
        code: `// render of a floor draws the whole floor: a grid of its own, more spots than flats on a floor.
// The core knows only "floor -1" and where it stands (floor.box); everything else is here.
// render gets the same ctx as plugins ({house, section, entrance, floor}), and base() — the usual drawing.
const parking = ({floor}) => {
    const {x, y, width, height} = floor.box;
    const spots = 7;
    const gap = 2;
    const w = (width - gap * (spots - 1)) / spots;
    return Array.from({length: spots}, (_, i) => [
        {tag: 'rect', opt: {x: x + i * (w + gap), y, width: w, height, fill: '#e8eef5'}},
        {tag: 'text', val: 'P' + (i + 1), opt: {
            x: x + i * (w + gap) + w / 2, y: y + height / 2, fill: '#678', 'font-size': 9,
            'font-family': 'arial', 'text-anchor': 'middle', 'dominant-baseline': 'central'
        }}
    ]);
};

export default {
    floors: 4,
    units: 3,
    sections: [{}, {floors: {from: -1, to: 4, '-1': {units: 0, render: parking, label: 'P'}}}, {}]
};
`
    },
    {
        name: 'Duplexes and wide flats',
        code: `// Spans as in HTML, the sign is the direction: rowSpan: 2 — this floor and the one above, -2 — and the one below
export default {
    units: 4,
    kinds: {shop: {enumerable: false}},
    floors: {
        to: 5,
        1: {'@3': {colSpan: 2, kind: 'shop'}},
        4: {'@2': {rowSpan: 2}},
        5: {'@3': {colSpan: 2, rowSpan: -2}}
    }
};
`
    },
    {
        name: 'Spans by number; merged flats',
        code: `// A span may be written by the number of a flat — as you see it. Two cases:
//
// 1. The unit is designed so (a penthouse, a duplex in a new house): one number however many cells it takes,
//    the numbers after it move. By number such a span goes only forward — up and along the floor —
//    so the numbers before it stay. That is why 21 on the 6th floor counts the duplex 19 already.
// 2. Flats merged in a built house — merged: true: the numbering stays, every cell keeps its number.
//    Such a span moves nothing and goes any way: 10: {colSpan: -2, merged: true} — the flat is 10, 9 is gone.
export default {
    units: 4,
    floors: {
        to: 7,
        2: {6: {colSpan: 2}},                       // a wide 6 — the same as '@2': {colSpan: 2}
        3: {10: {colSpan: -2, merged: true}},       // 9 and 10 merged, the flat keeps 10
        5: {
            16: {rowSpan: -2, merged: true},        // 12 and 16 merged one above the other: the flat is 16, 12 is gone
            19: {rowSpan: 2}                        // a duplex 19 — the same as '@4': {rowSpan: 2}
        },
        6: {21: {rowSpan: 2}}                       // and one more, over it
    }
};
`
    },
    {
        name: 'A short floor over a duplex',
        code: `// 103 is a duplex up. A number on a floor is positions from the aligned edge, the cell of the duplex among them:
// right → empty, empty, 104, 105, [103];  without align → 104, 105, 106, empty, [103]
export default {
    units: 5,
    floors: {
        to: 22,
        1: [1, 2, 3, 'S', 'C'],
        21: {'@5': {rowSpan: 2}},
        22: {units: 3, align: 'right'}
    }
};
`
    },
    {
        name: 'Entrances right to left',
        code: `// direction: 'rtl' — entrances right to left, and the numbers on a floor right to left too.
// numberDirection turns only the numbers (by default it is as direction). It cascades like everything:
// on the house, a section, an entrance, and on a floor — that makes a snake.
export default {
    floors: {to: 5},
    // floors: {to: 5, 2: {numberDirection: 'ltr'}, 4: {numberDirection: 'ltr'}},   // a snake
    units: 4,
    entrances: 3,
    direction: 'rtl',
    // numberDirection: 'ltr'       // entrances right to left, but the numbers on a floor left to right
};
`
    },
    {
        name: 'Numbers as strings',
        code: `// A string that starts with a digit is a number: one step of the counter, so after '25/2' comes 27.
// Uncomment numericStrings — and the counter goes from the digits of the string: next is 26
export default {
    units: 4,
    floors: {to: 3, 1: [23, 24, '25/1', '25/2']},
    // numericStrings: true
};
`
    },
    {
        name: 'Reactions: state and house.update',
        code: `// The config is what the house is (its structure), the state is what goes on with the flats (data), apart:
//   new House(target, config, state);   house.update({57: {reaction: 'no'}}) — redraws only 57.
// The reactions plugin (it is in House.plugins) colours by a field of the state: outline and number — colors, fill — fills.
// Click a flat — the next reaction, round and round.
export default {
    units: 5,
    floors: {to: 9, 1: [1, 2, 3, 'S', 'C']},
    hover: true,
    // reactions: {fill: true, always: true},      // fill by reaction, outline every flat
    // reactions: {colors: {maybe: 'goldenrod'}},   // colours of your own — only what differs
    // reactions: {style: {fontWeight: null}},      // for every flat with a reaction: not bold (default {strokeWidth: 2, fontWeight: 'bold'})
    // reactions: {styles: {no: {fontSize: 10, color: 'black'}, none: {fill: 'white'}}},   // any look per reaction
};

// the state: the key is the id of a unit (its number by default), the value — its data
export const state = {
    4: {reaction: 'yes'}, 5: {reaction: 'yes'}, 9: {reaction: 'no'},
    12: {reaction: 'maybe'}, 18: {reaction: 'ignore'}, 25: {reaction: 'yes'}, 33: {reaction: 'no'}
};

const next = {yes: 'no', no: 'maybe', maybe: 'ignore', ignore: null};

export function setup(house, {log}) {
    house.on('unit:click', ({unit}) => {
        const reaction = unit.state.reaction === undefined ? 'yes' : next[unit.state.reaction];
        house.update({[unit.config.id]: reaction ? {reaction} : null});     // null clears the state
        log(unit.config.id + ': ' + (reaction ?? '—'));
    });
}

// The same plugin under another name reads another field:
//   plugins: [...House.plugins, {use: reactions, name: 'payments', options: {field: 'payment', colors: {paid: 'blue'}}}]
`
    },
    {
        name: 'Stacks',
        code: `// Stacks — flats one above another in one colour. The colour is of the position the unit stands at:
// a duplex left to right (colSpan: 2) — the colour of its left cell, right to left (colSpan: -2) — of its right one.
// stacks comes with the house (it is in House.plugins) but is off until named: stacks: true — or a palette of your own.
// In the console: house.redraw({stacks: false}) — the config on the fly; the state (reactions) stays.
export default {
    units: 4,
    floors: {to: 7, 2: {'@1': {colSpan: 2}}, 4: {'@4': {colSpan: -2}}, 5: {'@2': {rowSpan: 2}}},
    stacks: true,
    // stacks: {colors: ['#ff9aa2', '#ffdac1', '#fff5a5', '#b5ead7', '#c7ceea']},   // a palette of your own
    // reactions: {fill: true},     // a fill by reaction wins over the stacks
};

export const state = {5: {reaction: 'yes'}, 9: {reaction: 'no'}, 16: {reaction: 'maybe'}};
`
    },
    {
        name: 'Floor marks',
        code: `// A floor mark is a field of the floor: mark. It stands in front of the floor number ("✓ 21:"), in any mode of floorLabels.
// Several — an array. What is written — floorLabels.marks (done ✓, progress ⏳, extinguisher 🧯); an unknown one as it is.
// Any plugin may put its own sign there too — its mark hook.
// On the fly, from the console: house.redraw({floors: {4: {mark: 'done'}}}).
export default {
    units: 4,
    floors: {
        to: 7,
        1: {mark: 'extinguisher'},
        2: {mark: 'done'},
        3: {mark: ['done', 'extinguisher']},
        5: {mark: 'progress'},
        6: {units: [21, 22, 23, 24], mark: '★'}     // the whole row and the fields of the floor beside it: the row is in units
    },
    // floorLabels: {marks: {done: '✔'}},         // marks of your own
    // floorLabels: {at: 'section'},              // marks go with the numbers, wherever those stand
};
`
    },
    {
        name: 'Percent, legend, text block',
        code: `import {count} from 'easy-house';

// The reactions plugin counts its reactions itself — and writes what it counted: the percent and the legend (off until named).
// It writes them with the text block — the one of the text plugin, but text knows nothing about reactions: it writes the lines it is given.
// What was counted, from outside — count(house): {total, groups, yes: {count, share, percent, name, color}, …}.
// Click a flat — the next reaction: the percent and the legend are counted again.
export default {
    units: 4,
    floors: {to: 7, 7: 2},
    reactions: {
        names: {yes: 'yes', no: 'no', maybe: 'maybe', none: 'no answer'},
        percent: {at: 'floor:7', y: '50%', valign: 'middle'},     // where: by default a band above the house
        // percent: {show: 'count:no'},       // =14; 'yes/no' — two counts; or lines of your own: text: ['{{no.percent}}% against']
        legend: true                          // a line per group, columns aligned; a band under the house
    },
    // the text plugin — just lines: parts of lines, a place (house | section:N | floor:N | top | bottom)
    text: {
        at: 'top', x: '50%', align: 'center',
        // border: '1px dashed silver',          // a border if you like; none by default
        text: [{value: 'Roof repair', weight: 'bold'}, ['vote until ', {value: 'November 1', color: 'crimson'}]]
    },
    hover: true
};

export const state = {
    1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 3: {reaction: 'no'}, 6: {reaction: 'yes'}, 7: {reaction: 'maybe'},
    9: {reaction: 'yes'}, 12: {reaction: 'no'}, 14: {reaction: 'yes'}, 17: {reaction: 'yes'}, 21: {reaction: 'yes'}
};

const next = {yes: 'no', no: 'maybe', maybe: null};

export function setup(house, {log}) {
    const show = () => {
        const counted = count(house);
        log('yes ' + counted.yes.count + ' of ' + counted.total + ' — ' + counted.yes.percent + '%');
    };
    show();
    house.on('unit:click', ({unit}) => {
        const reaction = unit.state.reaction === undefined ? 'yes' : next[unit.state.reaction];
        house.update({[unit.config.id]: reaction ? {reaction} : null});
        show();
    });
}
`
    },
    {
        name: 'Themes: dark and night',
        code: `// A theme is a palette (colours by name) and the options a look needs: theme: 'dark' | 'night' | 'light'.
// What the config says itself wins: colors: {unit: '#333'}. A colour of the palette in any option — '$name'.
// Night: dark walls and windows; flats with yes are lit with a warm light and a glow, maybe — dimly.
// Click a window to light it or to turn the light off.
export default {
    units: 4,
    sections: [{floors: 7}, {floors: {from: 2, to: 7}}, {floors: 9, entrances: 2}],
    theme: 'night',
    roof: true,
    // theme: 'dark',
    // colors: {yesFill: '#9fd3ff', glow: 'rgba(120, 190, 255, 0.5)'},     // a cold light
    hover: {aim: 'both'}
};

export const state = {
    3: {reaction: 'yes'}, 6: {reaction: 'yes'}, 9: {reaction: 'maybe'}, 14: {reaction: 'yes'}, 15: {reaction: 'yes'},
    22: {reaction: 'yes'}, 31: {reaction: 'yes'}, 40: {reaction: 'maybe'}, 47: {reaction: 'yes'}, 58: {reaction: 'yes'}
};

export function setup(house) {
    house.on('unit:click', ({unit}) => house.update({[unit.config.id]: unit.state.reaction === 'yes' ? null : {reaction: 'yes'}}));
}
`
    },
    {
        name: 'Small: a size in one word',
        code: `// A size in one word is a small house: its geometry, no numbers and floors, the squares filled by reaction, no outline.
// The words: pixel, icon, xxs, xs, s, m, l, xl (and extraSmall … extraLarge).
// What the config says itself wins: size: 'xs', floorLabels: {} — with floor numbers. A number is a number, as always.
export default {
    units: 5,
    floors: {to: 22, 22: 3},
    size: 'm',
    // size: 'pixel',
    // reactions: {fills: {yes: 'gold'}},     // a fill of your own over the palette of small houses
};

export const state = {
    1: {reaction: 'yes'}, 2: {reaction: 'yes'}, 3: {reaction: 'no'}, 7: {reaction: 'maybe'}, 12: {reaction: 'yes'},
    18: {reaction: 'yes'}, 25: {reaction: 'no'}, 33: {reaction: 'yes'}, 41: {reaction: 'yes'}, 56: {reaction: 'yes'},
    64: {reaction: 'no'}, 78: {reaction: 'yes'}, 90: {reaction: 'yes'}, 101: {reaction: 'maybe'}, 105: {reaction: 'yes'}
};
`
    },
    {
        name: 'Marks: one plugin under several names',
        code: `import {House, icon} from 'easy-house';

// The mechanics are one — a mark in a corner of a flat — so the plugin is one, and its instances are several, each with a name:
//   {use: icon, name: 'oldman', options: {…}}
// The name is everything: the options (oldman: {…} on the house), the switch (oldman: null), the field of a flat (21: {rental: true}).
// Marks of different instances in one corner stand side by side — a pensioner may rent out a flat.
export default {
    units: 5,
    floors: {
        to: 22,
        1: [1, 2, 3, 'S', 'C'],
        22: 3,
        5: {21: {rental: true}},                 // 21 — a pensioner, and rented out
        13: {62: {oldman: {icon: '👵🏻'}}}         // an icon of its own for one flat: options by the same name
    },
    plugins: [
        ...House.plugins,
        {use: icon, name: 'oldman', options: {icon: '👴🏻', title: 'a pensioner'}},     // title — a tooltip of the mark
        {use: icon, name: 'rental', options: {icon: '💰', title: 'rented out'}}
        // a text mark: options: {…, color: 'blue', font: 'arial, sans-serif'}; corner, size — its place and size
    ],
    oldman: {units: [6, 10, 21, 28, 31, 40, 48, 50, 60, 74, 76, 81, 85, 92, 94, 97, 98, 105]},
    rental: {units: [9, 11, 17, 26, 59, 69, 78, 80]}
    // rental: null                         // switch an instance off by its name
};
`
    },
    {
        name: 'A plugin of your own',
        code: `import {House} from 'easy-house';

// A plugin is an object with hooks by level: house, section, entrance, floor, unit (over it), style and render (the unit itself).
// A hook gets the chain of levels {house, section, entrance, floor, unit} — each {config, box, node},
// name — the name of the instance, and options — its options at this level (debt: {…} on the house, a floor, a flat — by the same name).
// The value of the plugin at a flat is its field with the name of the plugin: 34: {debt: 1200}.
const debt = {
    name: 'debt',
    options: {color: 'crimson', threshold: 0},
    unit({unit, name, options}) {
        const amount = unit.config[name];
        if (!(amount > options.threshold)) return null;
        const place = unit.place('top-right', 7);           // its own place in the corner — next to marks of others
        return {tag: 'circle', opt: {
            cx: place.x + place.width / 2, cy: place.y + place.height / 2, r: place.width / 2, fill: options.color
        }};
    }
};

export default {
    units: 5,
    floors: {to: 9, 7: {34: {debt: 1200}, 35: {debt: 40}}, 8: {38: {debt: 300}}},
    plugins: [...House.plugins, debt],
    debt: {threshold: 100}          // 35 with a debt of 40 is under the threshold
};
`
    },
    {
        name: 'Hover, click, a resident card',
        code: `// The highlight under the pointer is the hover plugin (CSS, off until named), with an aim: 'unit' | 'floor' | 'stack' | 'both' | 'off'.
// Units are marked with where they are: data-floor(s), data-position(s), data-section, data-entrance —
// all the flats of the 5th floor: house.svg.querySelectorAll('[data-floors~="5"]'). Everything else is events.
// A handler gets the same chain of levels as a plugin (each {config, box}) + house, element and event:
//   {type, house, section, entrance, floor, unit, element, event}
// What happens next is for the one who listens: a card, classes on elements, a dialog of your own…
const residents = {5: 'M. Johnson', 14: 'O. Peterson', 27: 'G. Sidorenko'};

export default {floors: 9, units: 4, entrances: 2, hover: {aim: 'both'}};      // hover: {stroke: 'tomato', line: {fill: '#fff3e0'}}

export function setup(house, {log, panel}) {
    house.on('unit:enter', ({unit}) => {
        const {label, id, path} = unit.config;
        panel.hidden = false;
        panel.innerHTML = '<b>Flat ' + label + '</b><br>'
            + 'entrance ' + path.entrance + ', floor ' + path.floor + ', position ' + path.position + '<br>'
            + (residents[id] || '<i>no resident given</i>');
    });
    house.on('unit:leave', () => panel.hidden = true);

    house.on('unit:click', ({unit, element}) => {
        element.classList.toggle('selected');
        log('click: flat ' + unit.config.id + (element.classList.contains('selected') ? ' selected' : ' unselected'));
    });
}
`
    },
    {
        name: 'A hole in the house: null and the hole plugin',
        code: `import {House, hole} from 'easy-house';

// A house of 7 floors with 4 flats on each.
// 10: null — a hole: there is nothing where 10 was, the number 10 is not used, the others do not move.
// 18: {hole: true} — the hole plugin (the key is its name): the flat is there — its number, data, events —
// but a hole in the house in its place. Its options by the same name: hole: {…} on the house, 23: {hole: {…}} at a flat.
export default {
    units: 4,
    floors: {
        to: 7,
        3: {10: null},
        5: {18: {hole: true, title: 'destroyed'}},
        6: {23: {hole: {note: '2022'}}}
    },
    plugins: [...House.plugins, hole]
};

// events — the same names as in house.on, in the DOM with the prefix house:
export function setup(house, {log, panel}) {
    house.element.addEventListener('house:unit:enter', ({detail: {unit}}) => {
        panel.hidden = false;
        panel.innerHTML = 'Flat <b>' + unit.config.label + '</b>'
            + (unit.config.hole ? ' — a hole in the house' : '') + (unit.config.title ? '<br>' + unit.config.title : '');
    });
    house.element.addEventListener('house:unit:leave', () => panel.hidden = true);
    house.on('unit:click', ({unit}) => log('unit:click → ' + unit.config.id + (unit.config.hole ? ' (a hole in the house)' : '')));
}
`
    },
    {
        name: 'Your own render: flat → kind → unit',
        code: `// render is an ordinary field of a unit: in kinds.flat, in a kind, and at the unit itself.
// They wrap each other like layers: the most specific one is called, its base(patch) is the next, more general one, down to the square.
// patch changes the ctx for what is below: base({style: {fill: 'pink'}}), base({unit: {config: {label: '★'}}}).
// Not calling base — drawing everything yourself.
const tinted = color => ({base}) => base({style: {fill: color}});

const round = ({unit}) => [
    {tag: 'circle', opt: {cx: unit.box.x + unit.box.width / 2, cy: unit.box.y + unit.box.height / 2, r: unit.box.width / 2, fill: 'plum'}},
    {tag: 'text', val: unit.config.label, opt: {
        x: unit.box.x + unit.box.width / 2, y: unit.box.y + unit.box.height / 2, fill: 'white',
        'font-family': 'arial', 'text-anchor': 'middle', 'dominant-baseline': 'central'
    }}
];

export default {
    units: 5,
    kinds: {
        // every flat: numbers ending in 7 in red
        flat: {render: ({unit, base}) => base(String(unit.config.label).endsWith('7') ? {style: {color: 'crimson'}} : {})},
        salon: {label: 'S', title: 'Beauty salon', render: tinted('pink')},
        concierge: {label: 'C', title: 'Concierge', render: round}
    },
    floors: {
        to: 6,
        1: {'@4': {kind: 'salon'}, '@5': {kind: 'concierge'}},
        6: {26: {render: tinted('lightyellow')}}    // its own at the flat 26 — over flat
    }
};
`
    },
    {
        name: 'Squares only',
        code: `import {cells} from 'easy-house';

// A list of plugins of your own instead of House.plugins: only the squares, without numbers
export default {
    units: 5,
    floors: {to: 22, 22: 3},
    plugins: [cells],
    cells: {numbers: false}
};
`
    }
];

/** The full config with every default, built from the code itself — so it never goes stale. */
function fullConfig() {
    const block = object => print(object, 1);
    return `import {House, cells, stacks, walls, floorLabels, dividers, reactions, text, roof, hover} from 'easy-house';

// Everything that can be written now, with its default — built from the code, so it never goes stale.
// Any key may be written on the house, a section or an entrance; a lower one overrides the one above.
// Not inherited down: sections, entrances, start, render.
export default {
    // ---- structure
    sections: 1,                // a number or [{…}, {…}] — each section with keys of its own
    entrances: 1,               // a number or [{…}, …]
    floors: {from: 1, to: 5},   // or just 5; a key that is a floor number — how that floor differs (see below)
    units: 4,                   // units (positions) on a floor
    align: 'left',              // 'right' — a short floor counts its positions from the right edge
    base: 0,                    // lift (1) or lower (-1) a section: a slope
    groundFloor: 1,             // the number of the ground floor: 1 (UA, US) or 0 (EU); below it — underground
    direction: 'ltr',           // 'rtl' — entrances and sections right to left, and the numbers on a floor too
    // numberDirection: 'rtl',  // the numbers on a floor alone; by default as direction; on a floor — a snake
    // render: ({house, section, base}) => …,   // on a section / an entrance / a floor — draw it yourself

    // ---- numbering
    start: 1,                   // where to start (a house, a section, an entrance, a floor)
    numericStrings: false,      // '25/1' moves the counter to 25 instead of one step

    // ---- kinds of units: presets of fields, like CSS classes (flat is the base of all)
    kinds: ${block(defaultKinds)},

    // ---- colours and themes: theme: 'dark' | 'night'; colors: {unit: 'ivory', …} — the palette by name;
    //      any colour option may name one: fill: '$yesFill'; background: null — transparent
    // theme: 'light',
    // colors: {${Object.keys(colors).join(', ')}},

    // ---- geometry
${Object.entries(defaultGeometry).map(([key, value]) => `    ${key}: ${value},` + (key === 'size' ? `           // or one word — a small house: ${Object.keys(sizes).slice(0, 8).map(word => `'${word}'`).join(', ')}` : '')).join('\n')}

    // ---- plugins (their order is the order of layers) and their options: config.<name>; null instead of options switches one off.
    // Options by the same name may be written lower too — on a section, a floor, a flat: cells: {fill: 'pink'} on a floor.
    // One plugin under another name: {use: icon, name: 'oldman', options: {icon: '👴🏻'}}.
    // Also in the box: icon (a mark in a corner), hole (a flat is there, with a hole in its place).
    // How a unit looks (fill, stroke, color…) — the options of cells, and over them plugins with a style hook (reactions).
    plugins: [cells, stacks, walls, floorLabels, dividers, reactions, text, roof, hover],     // = House.plugins
    cells: ${block(cells.options)},
    // stacks: true,            // stacks: off until named; their colours — the palette's $stacks, or stacks: {colors: ['#ff9aa2', …]}
    floorLabels: ${block(floorLabels.options)},
    dividers: ${block(dividers.options)},
    reactions: ${block(reactions.options)},
    // walls: true,             // the body of a section behind its units: off until named; or {color: '$wall', padding: 3}
    // off until named: text — a text block, roof — a strip over every entrance, hover — a highlight under the pointer
    // text: {${Object.keys(text.options).join(', ')}},
    // roof: true,              // or ${inline(roof.options)} — color: null is the colour of the walls
    // hover: true,              // or ${inline(hover.options)}
    // the percent and the legend are of reactions: reactions: {percent: true, legend: true}
};

// The state is apart from the config: export const state = {57: {reaction: 'yes'}} (here) or new House(target, config, state);
// then house.update({57: {reaction: 'no'}}) — only 57 is redrawn.

// The value of a floor in floors:
//   22: 3                              — how many positions are taken
//   12: {'@1': null, 54: {title: '…'}}  — only what differs, the rest as usual:
//         '@1' — a position: structure (a hole, a kind, a span, an explicit number) — changes the numbering;
//         54   — the number of a flat, as you see it: its data (title, render, fields of plugins)
//   1: [1, 2, 3, 'S', 'C']             — the whole row, explicitly; the tail is empty
//   1: {units: [1, 2, 3, 'S', 'C'], mark: 'done'}  — the same, and fields of the floor beside it
//   0: null                            — no units on this floor
//   fields of a floor: {units, align, start, render, label: 'P', mark: 'done', numberDirection, …fields of plugins}
//
// A unit (a slot): null — a hole; 57 — a number; '25/1' — a number as a string; 'S' — a label;
//   {label, kind, enumerable, id, title, colSpan, rowSpan, merged, render, …fields of plugins by their names}
// In a floor object by number: 54: {…} — the data of the flat; 54: {rowSpan: 2} — a duplex up;
//   54: null — a hole in its place (the number is not used).
`;
}

// a JS literal on one line, for a comment
function inline(value) {
    if (value === null || typeof value !== 'object') return print(value);
    if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
    return `{${Object.entries(value).map(([key, item]) => `${key}: ${inline(item)}`).join(', ')}}`;
}

// a JS literal with functions as their source
function print(value, depth = 0) {
    const pad = '    '.repeat(depth);
    if (typeof value === 'function') return value.toString();
    if (typeof value === 'string') return `'${value}'`;
    if (value === null || typeof value !== 'object') return String(value);

    const entries = Object.entries(value).map(([key, item]) => `${pad}    ${key}: ${print(item, depth + 1)}`);
    return entries.length ? `{\n${entries.join(',\n')}\n${pad}}` : '{}';
}
