// The playground: the code on the left is an ES module — `export default` is the house config,
// an optional `export const state` is the state of the units (by id), an optional `export function setup(house, {log, panel})`
// runs after drawing. Presets: built-in and your own (localStorage).
import {House} from 'easy-house';
import {presets} from './presets.js';
import {table, matrixText, escape} from './debug.js';

const $ = id => document.getElementById(id);
const code = $('code');
const select = $('preset');
const nameInput = $('name');

const STORE = 'easy-house:presets';
const LAST = 'easy-house:last';

// storage may be missing (private mode, blocked site data) — the page works without it
const read = key => {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
};
const write = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
};

let mine = read(STORE) || {};
let current = null;     // {group: 'builtin' | 'mine', name}
let savedCode = '';     // the current preset as stored, to tell edits apart

const builtin = name => presets.find(preset => preset.name === name);
const stored = ({group, name} = {}) => group === 'mine' ? mine[name] : builtin(name)?.code;
const key = ({group, name}) => `${group}:${name}`;

// ------------------------------------------------------------------ presets

function fillSelect() {
    const option = (group, name) => `<option value="${escape(key({group, name}))}">${escape(name)}</option>`;
    const own = Object.keys(mine).sort((a, b) => a.localeCompare(b));
    select.innerHTML = `<optgroup label="Examples">${presets.map(preset => option('builtin', preset.name)).join('')}</optgroup>`
        + (own.length ? `<optgroup label="Mine">${own.map(name => option('mine', name)).join('')}</optgroup>` : '');
    if (current) select.value = key(current);
}

function load(preset, text = stored(preset)) {
    current = preset;
    savedCode = stored(preset) ?? '';
    code.value = text ?? '';
    nameInput.value = preset.name;
    fillSelect();
    updateState();
    remember();
    run();
}

function updateState() {
    const dirty = code.value !== savedCode;
    document.title = `${dirty ? '• ' : ''}${current?.name ?? 'easy-house'} — playground`;
    $('remove').disabled = current?.group !== 'mine';
    $('reset').disabled = !dirty;
}

select.addEventListener('change', () => {
    if (code.value !== savedCode && !confirm('There are unsaved changes. Switch the preset?')) {
        select.value = key(current);
        return;
    }
    const [group, ...name] = select.value.split(':');
    load({group, name: name.join(':')});
});

function save() {
    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        return;
    }
    const overwrite = mine[name] != null && !(current?.group === 'mine' && current.name === name);
    if (overwrite && !confirm(`A preset “${name}” is there already. Overwrite it?`)) return;

    mine[name] = code.value;
    write(STORE, mine);
    current = {group: 'mine', name};
    savedCode = code.value;
    fillSelect();
    updateState();
    remember();
}

$('save').addEventListener('click', save);

$('remove').addEventListener('click', () => {
    if (current?.group !== 'mine' || !confirm(`Delete the preset “${current.name}”?`)) return;
    delete mine[current.name];
    write(STORE, mine);
    load({group: 'builtin', name: presets[0].name});
});

$('reset').addEventListener('click', () => current && load(current));

// ------------------------------------------------------------------ editor

let timer;
code.addEventListener('input', () => {
    updateState();
    remember();
    clearTimeout(timer);
    timer = setTimeout(run, 500);
});

code.addEventListener('keydown', event => {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(timer);
        run();
    } else if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
    } else if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        code.setRangeText('    ', code.selectionStart, code.selectionEnd, 'end');
        code.dispatchEvent(new Event('input'));
    }
});

// the code on screen, and the preset as it was stored then: to tell your edits from a preset that has changed since
function remember() {
    write(LAST, {...current, code: code.value, base: savedCode});
}

// keys renamed on the way, which an old preset of yours may still have
const renamed = [[/\brisers\s*:/, 'risers is stacks now: stacks: true']];

$('fit').addEventListener('change', event => $('stage').classList.toggle('fit', event.target.checked));
$('debug').addEventListener('change', event => {
    $('model').hidden = !event.target.checked;
    if (event.target.checked && window.house) showModel(window.house);
});

// ------------------------------------------------------------------ run

let generation = 0;

async function run() {
    const ticket = ++generation;
    const url = URL.createObjectURL(new Blob([code.value], {type: 'text/javascript'}));
    const errors = $('errors');

    try {
        const module = await import(url);
        if (ticket !== generation) return;    // a newer run has started meanwhile

        const config = module.default;
        if (!config || typeof config !== 'object') throw new Error('The module has to export the config: export default {…}');

        const stage = $('stage');
        stage.innerHTML = '';
        const log = $('log');
        log.textContent = '';
        log.hidden = true;

        const panel = $('panel');
        panel.hidden = true;
        panel.innerHTML = '';

        const house = new House(stage, config, module.state);
        window.house = house;
        module.setup?.(house, {
            panel,
            log: (...parts) => {
                log.hidden = false;
                log.textContent += parts.join(' ') + '\n';
                log.scrollTop = log.scrollHeight;
            }
        });

        errors.hidden = true;
        showInfo(house);
        if (!$('model').hidden) showModel(house);
    } catch (error) {
        // the last good drawing stays on the stage
        errors.hidden = false;
        errors.textContent = String(error?.stack || error).replaceAll(url, 'preset');
    } finally {
        URL.revokeObjectURL(url);
    }
}

function showInfo(house) {
    const {model, layout} = house;
    const numbered = model.units.filter(unit => typeof unit.label === 'number').length;
    const sections = model.sections.length;
    const entrances = model.sections.reduce((sum, section) => sum + section.entrances.length, 0);
    $('info').innerHTML = `
        <span>sections: <b>${sections}</b></span>
        <span>entrances: <b>${entrances}</b></span>
        <span>units: <b>${model.units.length}</b>, numbered: <b>${numbered}</b></span>
        <span>picture: <b>${Math.round(layout.width)}×${Math.round(layout.height)}</b></span>
        ${warningsOf(model).length ? `<div class="warnings">${warningsOf(model).map(escape).join('<br>')}</div>` : ''}`;
}

function warningsOf(model) {
    return [...model.warnings, ...renamed.filter(([pattern]) => pattern.test(code.value)).map(([, hint]) => hint)];
}

function showModel(house) {
    $('model').innerHTML = `<pre>${escape(matrixText(house.model))}</pre>${table(house.model)}`;
}

// ------------------------------------------------------------------ start

fillSelect();
// a house sent from the docs (the configurator): playground.html#code=…
const shared = new URLSearchParams(location.hash.slice(1)).get('code');
const last = shared == null ? read(LAST) : null;
// not edited (the code was the preset as stored) — the preset as it is now: a built-in one may have changed since
const edited = last?.code != null && last.base != null && last.code !== last.base;
if (shared != null) {
    load({group: 'builtin', name: presets[0].name}, shared);
    nameInput.value = 'From the docs';
    history.replaceState(null, '', location.pathname + location.search);
} else if (last && stored(last) != null) load({group: last.group, name: last.name}, edited ? last.code : undefined);
else if (edited) load({group: 'builtin', name: presets[0].name}, last.code);     // a preset since renamed: keep your edits
else load({group: 'builtin', name: presets[0].name});
