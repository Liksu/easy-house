// Copied from speed-chart/src/utils.js (deepCopy, merge, safeMerge, isObject) — same author, same semantics:
// arrays are replaced as a whole, null is kept as a value, undefined means "not set, keep the base".

export function deepCopy(some) {
    // primitives, functions, dates
    if (typeof some !== 'object' || some == null || some instanceof Date) return some;
    // arrays
    if (some instanceof Array) {
        return some.map(item => deepCopy(item));
    }
    // objects
    return Object.keys(some).reduce((result, key) => ({...result, [key]: deepCopy(some[key])}), {});
}

export function merge(base, extra) {
    if (extra === undefined) return deepCopy(base);
    if (typeof extra !== 'object' || extra === null) return deepCopy(extra);
    if (base instanceof Array || extra instanceof Array) return deepCopy(extra);
    if (typeof base !== typeof extra || base == null) return deepCopy(extra);
    // else both objects
    return Object.keys(Object.assign({}, base, extra))
        .reduce((result, key) => ({...result, [key]: merge(base[key], extra[key])}), {});
}

export function safeMerge(base, extra) {
    if (arguments.length > 2) {
        const args = Array.from(arguments).slice(2);
        while (args.length) {
            base = safeMerge(base, extra);
            extra = args.shift();
        }
    }

    if (base && typeof base === 'object' && (typeof extra !== 'object' || extra === null)) return deepCopy(base);

    return merge(base, extra);
}

export function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
