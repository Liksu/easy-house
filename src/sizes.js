// A size in one word — `size: 'xs'` — is a small house, as on the list of documents in heroes (house_small.html.ep):
// its geometry, the squares filled by their reactions in a brighter palette, no outline — and nothing written:
// no numbers on the squares, no floor labels, no percent and no legend (text a few pixels high is a smudge).
// The geometry and the palette are defaults under the config (`size: 'xs', gap: 2` — its own gap); what is not
// written is not, whatever the config says. A number in `size` is the size of a square, as always.
import {merge} from './utils.js';

// size and gap of a square, as in heroes; the gaps between entrances and sections grow with them
export const sizes = {
    pixel: {size: 1, gap: 0},
    icon: {size: 2, gap: 0},
    xxs: {size: 3, gap: 0},
    xs: {size: 4, gap: 1},
    s: {size: 7, gap: 2},
    m: {size: 9, gap: 2},
    l: {size: 11, gap: 3},
    xl: {size: 14, gap: 3}
};
// the long names of heroes
Object.assign(sizes, {extraSmall: sizes.xs, small: sizes.s, middle: sizes.m, large: sizes.l, extraLarge: sizes.xl});

/**
 * The config with its size in one word expanded; any other config as it is.
 * @param {Object} config
 * @returns {Object}
 */
export function sized(config = {}) {
    if (typeof config.size !== 'string') return config;
    const named = sizes[config.size];
    if (!named) throw new Error(`easy-house: unknown size '${config.size}' — one of ${Object.keys(sizes).join(', ')}, or a number`);

    const {size, gap} = named;
    const defaults = {
        size,
        gap,
        entranceGap: Math.max(1, Math.round(size / 3)),
        sectionGap: Math.max(2, Math.round(size / 2)),
        reactions: {
            // brighter than on a big house, to be seen on a tiny square
            fills: {yes: '$yesBright', no: '$noBright', maybe: '$maybeBright', ignore: '$ignoreFill', none: '$noneFill'}
        }
    };
    const forced = {
        size,
        cells: {numbers: false},
        floorLabels: null,
        reactions: {fill: true, style: {strokeWidth: 0}, percent: null, legend: null}
    };
    return merge(merge(defaults, config), forced);
}
