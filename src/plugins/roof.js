// A roof over every entrance: a thin strip above its top floor, from the middle of its first column to the middle
// of its last one. Off until named: `roof: true`; switched off on a section or an entrance — no roof there.
// Its colour is the colour of the walls there (`walls: {color}`, or the palette's `wall`) unless it has its own.
//
// Room is taken above the house only as much as the roofs of the tallest entrances need: a lower entrance has its
// roof in the empty space over it. In House.plugins it comes after text, so its band is the one next to the house.
import {optionsAt} from '../plugins.js';
import {paint} from '../colors.js';

export default {
    name: 'roof',
    enabled: false,
    options: {
        color: null,            // by default the colour of the walls
        height: 2,              // px, the thickness of the strip
        offset: null            // px between the strip and the top floor; by default a gap
    },

    gutters({model, name, options, geometry}) {
        const {size, gap} = geometry;
        const step = size + gap;
        const tops = model.sections.flatMap(section => section.entrances)
            .filter(entrance => entrance.levels.size)
            .map(entrance => ({options: optionsAt({name, options}, entrance.config), top: Math.max(...entrance.levels.values())}));
        if (!tops.length) return [];
        const highest = Math.max(...tops.map(({top}) => top));
        const height = Math.max(0, ...tops.filter(({options}) => options)
            .map(({options, top}) => (options.offset ?? gap) + options.height - (highest - top) * step));
        return height ? [{side: 'top', height}] : [];
    },

    entrance({entrance, house, options}) {
        const {box} = entrance;
        const {size, gap} = house.layout.geometry;
        const width = box.width - size;
        if (!box.height || width <= 0) return null;
        return {tag: 'rect', opt: {
            class: 'roof',
            x: box.x + size / 2,
            y: box.y - (options.offset ?? gap) - options.height,
            width,
            height: options.height,
            fill: options.color ?? paint(entrance.config.walls?.color ?? '$wall', house.colors)
        }};
    }
};
