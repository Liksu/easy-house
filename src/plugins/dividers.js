// Hairlines in the middle of the gaps: between sections and between entrances of a section.
// A line stays one device pixel wide at any scale (non-scaling-stroke).
//
//   extent: 'overlap' — only as high as the two neighbours overlap (the compact look)
//   extent: 'full'    — as tall as both of them together

export default {
    name: 'dividers',
    options: {
        sections: '$sectionLine',       // colour of the line between sections, or null for none
        entrances: '$entranceLine',     // between entrances of a section
        extent: 'overlap'
    },

    house({house, options}) {
        return options.sections && between(house.layout.sections.map(section => section.box), options.sections, options.extent);
    },

    section({section, options}) {
        return options.entrances && between(section.entrances.map(entrance => entrance.frame), options.entrances, options.extent);
    }
};

function between(boxes, stroke, extent) {
    return boxes.slice(1).map((box, i) => {
        const previous = boxes[i];
        const tops = [previous.y, box.y];
        const bottoms = [previous.y + previous.height, box.y + box.height];
        const y1 = extent === 'full' ? Math.min(...tops) : Math.max(...tops);
        const y2 = extent === 'full' ? Math.max(...bottoms) : Math.min(...bottoms);
        if (y2 <= y1) return null;

        const x = (previous.x + previous.width + box.x) / 2;
        return {
            tag: 'line',
            opt: {
                class: 'divider',
                x1: x,
                x2: x,
                y1,
                y2,
                stroke,
                'stroke-width': 1,
                'vector-effect': 'non-scaling-stroke',
                'shape-rendering': 'crispEdges'
            }
        };
    });
}
