/**
 * The configurator of the introduction: controls on the side change a config, the config is printed under them
 * and the house is drawn from it — the way component pages of UI libraries let you try their props.
 *
 * Authoring format: <div class="configurator"></div> on a page. Not every option is here, the main ones; the
 * code it prints is a whole example to copy, or to open in the playground.
 */
(function () {
    'use strict';

    const controls = [
        {key: 'floors', label: 'Floors', type: 'range', min: 2, max: 25, value: 9},
        {key: 'units', label: 'Flats on a floor', type: 'range', min: 2, max: 8, value: 4},
        {key: 'sections', label: 'Sections', type: 'range', min: 1, max: 3, value: 1},
        {key: 'entrances', label: 'Entrances in a section', type: 'range', min: 1, max: 3, value: 1},
        {key: 'heights', label: 'Sections of different height', type: 'check', value: false, when: values => values.sections > 1},
        {key: 'arch', label: 'An arch under the 2nd section', type: 'check', value: false, when: values => values.sections > 1},
        {key: 'top', label: 'A short top floor', type: 'check', value: false},
        {key: 'duplex', label: 'A duplex', type: 'check', value: false},
        {key: 'wide', label: 'A wide flat', type: 'check', value: false, when: values => values.units > 2},
        {key: 'labels', label: 'Floor numbers', type: 'select', value: 'house', options: ['house', 'gutter', 'section', 'entrance', 'off']},
        {key: 'direction', label: 'Direction', type: 'select', value: 'ltr', options: ['ltr', 'rtl']},
        {key: 'stacks', label: 'Stacks', type: 'check', value: false},
        {key: 'walls', label: 'Walls', type: 'check', value: false, when: values => values.theme !== 'night'},
        {key: 'roof', label: 'Roof', type: 'check', value: false},
        {key: 'reactions', label: 'Reactions', type: 'select', value: 'outline', options: ['off', 'outline', 'fill']},
        {key: 'counted', label: 'Percent and legend', type: 'check', value: false, when: values => values.reactions !== 'off' && !/^[a-z]/.test(values.size)},
        {key: 'hover', label: 'Hover aim', type: 'select', value: 'unit', options: ['off', 'unit', 'floor', 'stack', 'both']},
        {key: 'size', label: 'Size', type: 'select', value: '35', options: ['35', '24', 'm', 's', 'xs']},
        {key: 'theme', label: 'Theme', type: 'select', value: 'light', options: ['light', 'dark', 'night']}
    ];

    // what the controls say → a config, with only what differs from the defaults
    function configOf(values) {
        const config = {units: values.units};

        // the floors of a section: its height, where it starts (an arch), how its floors differ
        const floorsOf = i => {
            const top = values.heights ? Math.max(3, values.floors + [0, 3, -2][i]) : values.floors;
            const floors = {};
            if (values.arch && i === 1) floors.from = 2;
            floors.to = top;
            if (values.top) floors[top] = values.units - 1;
            if (values.duplex) floors[3] = {'@1': {rowSpan: 2}};
            if (values.wide) floors[2] = {'@2': {colSpan: 2}};
            return Object.keys(floors).length === 1 ? top : floors;
        };

        const count = values.sections;
        const all = Array.from({length: count}, (_, i) => floorsOf(i));
        const alike = all.every(floors => JSON.stringify(floors) === JSON.stringify(all[0]));
        if (alike) {
            config.floors = all[0];
            if (count > 1) config.sections = count;
            if (values.entrances > 1) config.entrances = values.entrances;
        } else {
            config.sections = all.map(floors => ({floors, ...(values.entrances > 1 && {entrances: values.entrances})}));
        }

        if (values.labels === 'off') config.floorLabels = null;
        else if (values.labels === 'gutter') config.floorLabels = {mode: 'gutter'};
        else if (values.labels !== 'house') config.floorLabels = {at: values.labels};
        if (values.direction === 'rtl') config.direction = 'rtl';
        if (values.stacks) config.stacks = true;
        if (values.walls && values.theme !== 'night') config.walls = true;
        if (values.roof) config.roof = true;

        const reactions = {};
        if (values.reactions === 'off') config.reactions = null;
        if (values.reactions === 'fill') reactions.fill = true;
        if (values.counted && values.reactions !== 'off') Object.assign(reactions, {percent: true, legend: true});
        if (Object.keys(reactions).length) config.reactions = reactions;

        if (values.hover !== 'off') config.hover = values.hover === 'unit' ? true : {aim: values.hover};
        if (values.size !== '35') config.size = /^\d+$/.test(values.size) ? Number(values.size) : values.size;
        if (values.theme !== 'light') config.theme = values.theme;
        return config;
    }

    // a few reactions, the same every time
    const answers = {1: 'yes', 2: 'yes', 3: 'no', 6: 'maybe', 7: 'yes', 10: 'no', 13: 'yes', 14: 'yes', 18: 'yes', 22: 'no'};

    function stateOf(values) {
        if (values.reactions === 'off') return null;
        return Object.fromEntries(Object.entries(answers).map(([id, reaction]) => [id, {reaction}]));
    }

    // ------------------------------------------------------------------ code

    function literal(value, depth = 0) {
        const pad = '    '.repeat(depth);
        if (value === null) return 'null';
        if (typeof value === 'string') return `'${value}'`;
        if (typeof value !== 'object') return String(value);
        if (Array.isArray(value)) {
            const items = value.map(item => literal(item, depth + 1));
            return items.join(', ').length < 60 ? `[${items.join(', ')}]` : `[\n${items.map(item => `${pad}    ${item}`).join(',\n')}\n${pad}]`;
        }
        const key = name => /^[A-Za-z_$][\w$]*$|^\d+$/.test(name) ? name : `'${name}'`;
        // words first — {to: 9, 9: 3}, not as JS orders them, numbers first
        const words = Object.entries(value).sort(([a], [b]) => /^\d+$/.test(a) - /^\d+$/.test(b));
        const entries = words.map(([name, item]) => `${key(name)}: ${literal(item, depth + 1)}`);
        const flat = `{${entries.join(', ')}}`;
        if (depth > 0 && flat.length < 60) return flat;
        return `{\n${entries.map(entry => `${pad}    ${entry}`).join(',\n')}\n${pad}}`;
    }

    function codeOf(config, state) {
        const lines = [`import {House} from 'easy-house';`, ''];
        if (state) lines.push(`const state = ${compactState(state)};`, '');
        lines.push(`new House('#house', ${literal(config)}${state ? ', state' : ''});`);
        return lines.join('\n');
    }

    function moduleOf(config, state) {
        return `export default ${literal(config)};\n` + (state ? `\nexport const state = ${compactState(state)};\n` : '');
    }

    function compactState(state) {
        const entries = Object.entries(state).map(([id, data]) => `${id}: {reaction: '${data.reaction}'}`);
        const rows = [];
        for (let i = 0; i < entries.length; i += 3) rows.push('    ' + entries.slice(i, i + 3).join(', '));
        return `{\n${rows.join(',\n')}\n}`;
    }

    // ------------------------------------------------------------------ the widget

    function build(root, House) {
        root.innerHTML = `
            <div class="configurator-top">
                <div class="configurator-stage"></div>
                <form class="configurator-controls"></form>
            </div>
            <div class="configurator-code"><pre><code class="lang-js"></code></pre>
                <a class="configurator-open" target="_blank">Open in the playground →</a></div>`;
        const stage = root.querySelector('.configurator-stage');
        const form = root.querySelector('.configurator-controls');
        const code = root.querySelector('code');
        const open = root.querySelector('.configurator-open');
        const values = Object.fromEntries(controls.map(control => [control.key, control.value]));

        for (const control of controls) {
            const label = document.createElement('label');
            label.className = `control ${control.type}`;
            const caption = document.createElement('span');
            caption.textContent = control.label;
            let input;
            if (control.type === 'select') {
                input = document.createElement('select');
                input.innerHTML = control.options.map(option => `<option>${option}</option>`).join('');
            } else {
                input = document.createElement('input');
                input.type = control.type === 'check' ? 'checkbox' : 'range';
                if (control.type === 'range') Object.assign(input, {min: control.min, max: control.max, step: 1});
            }
            if (control.type === 'check') input.checked = control.value;
            else input.value = control.value;
            // the value of a slider; not an <output>: docsify styles those as boxes of their own
            const shown = document.createElement('b');
            shown.className = 'value';
            shown.textContent = control.value;

            input.addEventListener('input', () => {
                values[control.key] = control.type === 'check' ? input.checked : control.type === 'range' ? Number(input.value) : input.value;
                shown.textContent = input.value;
                draw();
            });
            if (control.type === 'check') label.append(input, caption);
            else if (control.type === 'range') label.append(caption, input, shown);
            else label.append(caption, input);
            form.appendChild(label);
            control.element = label;
            control.input = input;
        }

        // a control that means nothing now (an arch with one section) is dimmed and does not count
        const usable = () => {
            for (const control of controls) {
                if (!control.when) continue;
                const on = control.when(values);
                control.element.classList.toggle('off', !on);
                control.input.disabled = !on;
            }
        };

        function draw() {
            usable();
            const effective = Object.fromEntries(controls.map(control => [control.key, control.when && !control.when(values) ? control.value : values[control.key]]));
            const config = configOf(effective);
            const state = stateOf(effective);
            stage.innerHTML = '';
            stage.classList.toggle('dark', effective.theme !== 'light');
            try {
                new House(stage, config, state || {});
            } catch (error) {
                stage.textContent = String(error);
            }
            const text = codeOf(config, state);
            code.innerHTML = window.Prism ? window.Prism.highlight(text, window.Prism.languages.javascript, 'javascript') : '';
            if (!window.Prism) code.textContent = text;
            open.href = 'playground.html#code=' + encodeURIComponent(moduleOf(config, state));
        }

        draw();
    }

    window.$docsify = window.$docsify || {};
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
        hook.doneEach(async () => {
            const roots = document.querySelectorAll('.markdown-section .configurator');
            if (!roots.length) return;
            const {House} = await import('easy-house');
            roots.forEach(root => build(root, House));
        });
    });
})();
