import {merge} from './utils.js';
import {paletteOf, paint} from './colors.js';

/**
 * The plugins of a house, each with its name and its house-level options.
 *
 * An entry is a plugin, or `{use: plugin, name, options}` — the same plugin once more under another name and with
 * other defaults: one `icon` drawn as `oldman` and as `rental`. The name is what everything keys on: the options
 * (`config.oldman`), the switch (`config.oldman: null`), the field in a unit (`54: {oldman: true}`).
 *
 * Options: the plugin's own, then the entry's, then `config[name]`.
 *
 * A plugin with `enabled: false` (stacks) comes with the house but is off until the house config names it:
 * `stacks: true` or `stacks: {…}`. An entry `{use, name}` is the user's own, so it is on unless it says `enabled: false`.
 *
 * Colours named in the options — `fill: '$unit'` — are the colours of the house's palette (colors.js).
 */
export function instances(plugins, config = {}) {
    const palette = paletteOf(config);
    return plugins
        .map(entry => entry.use
            ? {plugin: entry.use, name: entry.name ?? entry.use.name, enabled: entry.enabled, defaults: merge(entry.use.options || {}, entry.options || {})}
            : {plugin: entry, name: entry.name, enabled: entry.enabled, defaults: entry.options || {}})
        .filter(({name}) => config[name] !== null && config[name] !== false)
        .filter(({name, enabled}) => enabled !== false || config[name] != null)
        .map(({plugin, name, defaults}) => ({
            plugin,
            name,
            palette,
            options: paint(merge(defaults, plain(config[name]) ? config[name] : undefined), palette)
        }));
}

/**
 * The options of an instance at some level: the house-level ones with the instance's key of every level on the way
 * down merged on top — `cells: {fill: 'pink'}` on a floor paints that floor, on a unit — that unit.
 * A plain object merges; null or false switches the instance off there; anything else (`true`, a string) leaves the
 * options as they are — it is for the plugin to read as `unit.config[name]`.
 * @returns {Object|null} null when switched off
 */
export function optionsAt(instance, ...configs) {
    let options = instance.options;
    for (const config of configs) {
        const value = config?.[instance.name];
        if (value === null || value === false) return null;
        if (plain(value)) options = merge(options, instance.palette ? paint(value, instance.palette) : value);
    }
    return options;
}

export function plain(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
