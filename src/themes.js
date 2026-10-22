// Themes: `theme: 'dark'` is a config of its own put under the house's config — a palette (colors.js) first of all,
// and the options a look needs besides colours. What the config says itself wins, as everywhere:
// `{theme: 'dark', colors: {unit: '#333'}}`. A theme may be an object too — a theme of your own.
import {merge} from './utils.js';

export const themes = {
    light: {},

    // readable on a dark page: the same house, the colours turned around
    dark: {
        colors: {
            background: '#0d1117',
            unit: '#21262d',
            label: '#8b949e',
            wall: '#161b22',
            floorLabel: '#8b949e',
            sectionLine: '#484f58',
            entranceLine: '#30363d',
            text: '#c9d1d9',
            yes: '#3fb950',
            no: '#f85149',
            maybe: '#d29922',
            ignore: '#8b949e',
            none: '#6e7681',
            yesFill: '#1a3d26',
            noFill: '#4a1c1c',
            maybeFill: '#3d2e0f',
            ignoreFill: '#30363d',
            noneFill: '#30363d',
            yesBright: '#2ea043',
            noBright: '#da3633',
            maybeBright: '#bb8009',
            stacks: ['#3d2a2e', '#3d3226', '#383826', '#24382c', '#232f3d'],
            highlight: '#58a6ff',
            aim: '#1c2d44',
            hole: '#2d1a1a',
            holeLine: '#f85149'
        }
    },

    // the house at night: dark walls and windows, and the windows of the flats with a reaction lit with a warm
    // light — `yes` bright, `maybe` dim, the others dark
    night: {
        colors: {
            background: '#1b1f27',
            unit: '#262b35',
            label: '#4d5566',
            wall: '#383e4b',
            floorLabel: '#7b8395',
            sectionLine: null,
            entranceLine: '#323845',
            text: '#d8dbe2',
            yes: '#6b4a12',
            no: '#4d5566',
            maybe: '#3f3420',
            ignore: '#4d5566',
            none: '#4d5566',
            yesFill: '#f0d08a',
            noFill: '#262b35',
            maybeFill: '#8c7a52',
            ignoreFill: '#262b35',
            noneFill: '#262b35',
            yesBright: '#f0d08a',
            noBright: '#262b35',
            maybeBright: '#8c7a52',
            glow: 'rgba(255, 196, 110, 0.55)',
            stacks: ['#2c2a33', '#2f2c2a', '#2c2f2a', '#2a2f30', '#2a2c33'],
            highlight: '#f0d08a',
            aim: '#313847',
            hole: '#2b2328',
            holeLine: '#a35b5b'
        },
        walls: true,
        reactions: {fill: true, style: {strokeWidth: 0, fontWeight: null}, styles: {yes: {glow: '$glow'}}}
    }
};

/**
 * The config with its theme put under it; a config without one as it is.
 * @param {Object} config
 * @returns {Object}
 */
export function themed(config = {}) {
    if (config.theme == null) return config;
    const theme = typeof config.theme === 'string' ? themes[config.theme] : config.theme;
    if (!theme) throw new Error(`easy-house: unknown theme '${config.theme}' — one of ${Object.keys(themes).join(', ')}, or an object`);
    return merge(theme, config);
}
