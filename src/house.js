// The only part that touches the DOM: config → resolve → layout → scene → <svg> via svg-easy-tree, and events.
import Tree from 'svg-easy-tree';
import {resolve} from './resolve.js';
import {merge} from './utils.js';
import {sized} from './sizes.js';
import {themed} from './themes.js';
import {layout} from './layout.js';
import {scene, levels} from './scene.js';
import cells from './plugins/cells.js';
import floorLabels from './plugins/floor-labels.js';
import dividers from './plugins/dividers.js';
import reactions from './plugins/reactions.js';
import stacks from './plugins/stacks.js';
import walls from './plugins/walls.js';
import roof from './plugins/roof.js';
import text from './plugins/text.js';
import hover from './plugins/hover.js';

export default class House {
    /**
     * Used when the config has no `plugins` of its own. Some are off until the config names them:
     * stacks (`stacks: true`), walls (`walls: true`), text (`text: {…}`), roof (`roof: true`), hover (`hover: true`).
     */
    static plugins = [cells, stacks, walls, floorLabels, dividers, reactions, text, roof, hover];

    /**
     * new House(target, config, state) — draws into an element; new House(config, state) — draws into nothing:
     * `house.svg` is there to put anywhere, and it stays the same element across redraws.
     * @param {string|Element} [target] — a selector or an element to draw into
     * @param {Object} config — the structure: what the house is
     * @param {Object} [state] — the data of the units by id, what changes: {57: {reaction: 'yes'}}
     */
    constructor(target, config = {}, state = {}) {
        if (target !== null && typeof target === 'object' && !(target instanceof Element)) [target, config, state] = [null, target, config];
        this.element = typeof target === 'string' ? document.querySelector(target) : target ?? null;
        this.config = config ?? {};
        this.state = {...state};
        this.listeners = new Map();
        this.draw();
    }

    draw() {
        // what is drawn: the config with its theme under it and its size in one word over it (themes.js, sizes.js)
        this.effective = sized(themed(this.config));
        this.model = resolve(this.effective);
        this.plugins = this.effective.plugins ?? House.plugins;
        this.layout = layout(this.model, this.effective, this.plugins, this.state);
        this.scene = scene(this.layout, this.plugins, this.effective, this.state);
        this.tree = new Tree(this.scene);

        // a new drawing takes the place of the old one, wherever that is now
        const old = this.svg;
        this.svg = this.tree.compile(null, null);
        if (old?.parentNode) old.replaceWith(this.svg);
        else if (this.element) this.element.appendChild(this.svg);
        this.index();
        this.listen();
        this.settle();

        if (this.model.warnings.length) console.warn('easy-house:', ...this.model.warnings);
        return this;
    }

    /**
     * Changes the config and draws the house anew; the state stays. The patch merges into the config like any
     * override: objects at any depth (`{floors: {5: {…}}}`), arrays and other values replace, null or false switches
     * a plugin off — `house.redraw({stacks: false})`.
     */
    redraw(patch = {}) {
        this.config = merge(this.config, patch);
        return this.draw();
    }

    /**
     * Changes the state of some units: {57: {reaction: 'no'}} merges into the state of 57, null clears it.
     * The structure stays; the layout (a legend may need another line) and the scene are built anew,
     * and only what differs is replaced in the drawing.
     */
    update(patch = {}) {
        for (const [id, data] of Object.entries(patch)) {
            if (!this.units.has(id)) console.warn(`easy-house: no unit ${id} to update`);
            if (data == null) delete this.state[id];
            else this.state[id] = {...this.state[id], ...data};
        }

        this.layout = layout(this.model, this.effective, this.plugins, this.state);
        const next = scene(this.layout, this.plugins, this.effective, this.state);
        const replaced = replace(this.tree, this.svg, this.scene, next);
        this.scene = next;
        if (replaced) {
            this.svg = replaced;
            this.listen();
        }
        this.index();
        this.settle();
        return this;
    }

    /**
     * Text blocks standing by another side than their lines align to (text: {align: 'left', anchor: 'right'}):
     * the scene has only an estimate of their width, the page knows it — each is moved to stand exactly at its x.
     * Only in the page: a house drawn into nothing keeps the estimate until it is drawn again.
     */
    settle() {
        if (!this.svg.isConnected) return this;
        for (const text of this.svg.querySelectorAll('text[data-anchor]')) {
            const box = text.getBBox();
            const share = {center: 0.5, right: 1}[text.dataset.anchor] ?? 0;
            const shift = Number(text.dataset.x) - (box.x + box.width * share);
            for (const node of [text, ...text.children]) node.setAttribute('x', Number(node.getAttribute('x')) + shift);
        }
        return this;
    }

    /** the chain of levels of a unit, the same as a plugin gets: {section, entrance, floor, unit}, each {config, box} */
    unit(id) {
        return this.units.get(String(id));
    }

    /** the <g class="unit"> of a unit */
    elementOf(id) {
        return this.svg.querySelector(`[data-unit="${CSS.escape(String(id))}"]`);
    }

    /**
     * Events: 'unit:click', 'unit:enter', 'unit:leave'. A handler gets one object —
     * {type, house, section, entrance, floor, unit, element, event}: the chain of levels as in plugins
     * (each level with config and box), this House, the unit's <g> and the browser event.
     * The same goes out as a DOM CustomEvent on the container, under the same name with a `house:` prefix:
     * `unit:click` here is `house:unit:click` there, with the same object in `detail`.
     */
    on(type, handler) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(handler);
        return this;
    }

    off(type, handler) {
        this.listeners.get(type)?.delete(handler);
        return this;
    }

    emit(type, detail) {
        for (const handler of this.listeners.get(type) || []) handler(detail);
        // on the container; a house drawn into nothing — on its <svg>, the event bubbles from wherever it is put
        (this.element ?? this.svg).dispatchEvent(new CustomEvent(`house:${type}`, {detail, bubbles: true}));
    }

    // id → chain of levels, built once per drawing from the same tree the plugins get
    index() {
        this.units = new Map();
        for (const section of levels(this.layout, this.effective, this.state).sections) {
            for (const entrance of section.entrances) {
                for (const floor of entrance.floors) {
                    for (const unit of floor.units) this.units.set(unit.config.id, {section, entrance, floor, unit});
                }
            }
        }
    }

    // one delegated listener per kind of pointer event on the whole drawing
    listen() {
        const unitOf = event => event.target.closest?.('[data-unit]');
        const fire = (type, event, element) => {
            const levels = this.unit(element.dataset.unit);
            if (levels) this.emit(type, {type, house: this, ...levels, element, event});
        };

        this.svg.addEventListener('click', event => {
            const element = unitOf(event);
            if (element) fire('unit:click', event, element);
        });
        // over/out bubble from the rect and the text inside a unit: only crossing the unit's own border counts
        this.svg.addEventListener('pointerover', event => {
            const element = unitOf(event);
            if (element && !element.contains(event.relatedTarget)) fire('unit:enter', event, element);
        });
        this.svg.addEventListener('pointerout', event => {
            const element = unitOf(event);
            if (element && !element.contains(event.relatedTarget)) fire('unit:leave', event, element);
        });
    }
}

/**
 * Lays the new scene over the old one, node by node: where a node itself differs (tag, text, attributes,
 * the number of children), it is compiled anew and replaces the old element; otherwise only its children are looked at.
 * So a new reaction of one flat replaces the square and the number of that flat and nothing else —
 * the groups stay, with their listeners and the classes put on them.
 * @returns {Element|null} the new element, when `element` itself was replaced
 */
function replace(tree, element, before, after) {
    const [was, is] = [before.sub || [], after.sub || []];
    const same = before.tag === after.tag && before.val === after.val
        && JSON.stringify(before.opt) === JSON.stringify(after.opt)
        && was.length === is.length
        // children map onto elements one to one only when all of them are nodes with a tag and there is no text
        && (before.val == null || !is.length)
        && [...was, ...is].every(node => typeof node?.tag === 'string');

    if (!same) {
        const fresh = tree.compile(after);
        element.replaceWith(fresh);
        return fresh;
    }
    is.forEach((node, i) => replace(tree, element.children[i], was[i], node));
    return null;
}
