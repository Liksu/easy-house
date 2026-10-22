// The body of the building: a wall behind the units of every section, so the house reads as a building and not as
// a grid of squares — the night theme turns it on. Off until named: `walls: true`.
//
// A wall covers the units of a section, the gaps between its entrances too, with `padding` around them; under an
// arch there is no wall — the section starts higher. Walls are put first into their sections, so they are behind.
// The picture keeps room for the padding at its edges, so a wall is never cut there.

export default {
    name: 'walls',
    enabled: false,
    options: {
        color: '$wall',
        padding: null           // px around the units; by default half a gap
    },

    gutters({options, geometry}) {
        return [{side: 'around', width: options.padding ?? geometry.gap / 2}];
    },

    house({house, options}) {
        const {gap} = house.layout.geometry;
        const padding = options.padding ?? gap / 2;
        for (const section of house.sections) {
            const boxes = section.entrances.map(entrance => entrance.box).filter(box => box.width && box.height);
            if (!boxes.length) continue;
            const x = Math.min(...boxes.map(box => box.x)) - padding;
            const y = Math.min(...boxes.map(box => box.y)) - padding;
            const right = Math.max(...boxes.map(box => box.x + box.width)) + padding;
            const bottom = Math.max(...boxes.map(box => box.y + box.height)) + padding;
            section.node.sub.unshift({tag: 'rect', opt: {class: 'wall', x, y, width: right - x, height: bottom - y, fill: options.color}});
        }
        return null;
    }
};
