/**
 * Live examples for the easy-house docs (taken from the docs of speed-chart, same author).
 *
 * A fenced block marked as `js live` is both printed and executed. The source
 * shown on the page is the exact text handed to the browser, so an example can
 * never drift away from its description.
 *
 * Authoring format:
 *
 *     <div id="my-house" class="demo"></div>
 *
 *     ```js live
 *     import {House} from 'easy-house';
 *
 *     new House('#my-house', {units: 4, floors: 5});
 *     ```
 *
 * The element in front of the block is the stage the example draws into. Use a
 * `<div class="demo-row">` wrapper to give one block several stages. On GitHub
 * the stage renders as nothing and the block reads as an ordinary example, so
 * the markdown stays honest documentation on its own.
 *
 * `import 'easy-house'` resolves through the import map written by importmap.js.
 */
(function () {
    'use strict';

    const FENCE = /^```js[ \t]+live[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm;
    const STAGE_SELECTOR = '.demo, .demo-row';

    /** Bumped on every page render so that work from the previous page dies off. */
    let generation = 0;
    /** True while example code (or a callback it scheduled) is on the stack. */
    let insideExample = false;

    const originalSource = new WeakMap();
    const blankStage = new WeakMap();

    // ---------------------------------------------------------------- timers

    /**
     * Examples may start intervals and animation frames, and docsify never reloads
     * the page. Without this, every example ever visited would keep running
     * against detached DOM nodes.
     *
     * Callbacks scheduled by an example remember the generation they were
     * registered in and simply stop firing once the page has moved on. A chained
     * `requestAnimationFrame` re-registers from inside a guarded callback, so the
     * whole chain unwinds by itself. Timers scheduled by docsify or by any other
     * script are passed through untouched.
     */
    function guard(schedule) {
        return function (callback, ...rest) {
            if (!insideExample || typeof callback !== 'function') {
                return schedule.call(window, callback, ...rest);
            }

            const scheduledIn = generation;

            return schedule.call(window, function (...args) {
                if (scheduledIn !== generation) return;

                const wasInside = insideExample;
                insideExample = true;
                try {
                    return callback.apply(this, args);
                } finally {
                    insideExample = wasInside;
                }
            }, ...rest);
        };
    }

    window.setInterval = guard(window.setInterval);
    window.setTimeout = guard(window.setTimeout);
    window.requestAnimationFrame = guard(window.requestAnimationFrame);

    // ------------------------------------------------------------- execution

    async function execute(source, stage) {
        stage.innerHTML = blankStage.get(stage) || '';

        const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));

        insideExample = true;
        try {
            await import(url);
        } catch (error) {
            report(stage, error);
        } finally {
            insideExample = false;
            URL.revokeObjectURL(url);
        }
    }

    function report(stage, error) {
        const box = document.createElement('pre');
        box.className = 'live-error';
        box.textContent = String((error && error.stack) || error);
        stage.appendChild(box);
        console.error('[live example]', error);
    }

    // --------------------------------------------------------------- markup

    function findPrevious(element, test) {
        let node = element && element.previousElementSibling;
        while (node && !test(node)) node = node.previousElementSibling;
        return node;
    }

    function highlight(code, source) {
        if (window.Prism && window.Prism.languages.javascript) {
            code.innerHTML = window.Prism.highlight(source, window.Prism.languages.javascript, 'javascript');
        } else {
            code.textContent = source;
        }
    }

    function buildToolbar(stage, pre, code) {
        const toolbar = document.createElement('div');
        toolbar.className = 'live-toolbar';

        const current = () => code.textContent;

        const button = (label, title, onClick) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'live-button';
            el.textContent = label;
            el.title = title;
            el.addEventListener('click', onClick);
            toolbar.appendChild(el);
            return el;
        };

        const edit = button('Edit', 'Make this example editable', () => {
            const editing = code.getAttribute('contenteditable') === 'true';
            if (editing) {
                code.removeAttribute('contenteditable');
                highlight(code, current());
            } else {
                code.textContent = current();
                code.setAttribute('contenteditable', 'true');
                code.setAttribute('spellcheck', 'false');
                code.focus();
            }
            edit.textContent = editing ? 'Edit' : 'Done';
            pre.classList.toggle('is-editing', !editing);
        });

        button('Run', 'Run the code as it is written now', () => {
            generation++;
            execute(current(), stage);
        });

        button('Reset', 'Restore the original code and run it', () => {
            generation++;
            const source = originalSource.get(pre);
            code.removeAttribute('contenteditable');
            pre.classList.remove('is-editing');
            edit.textContent = 'Edit';
            highlight(code, source);
            execute(source, stage);
        });

        return toolbar;
    }

    /** Wraps stage + code into one figure so they can sit side by side. */
    function layout(stage, pre) {
        const figure = document.createElement('figure');
        figure.className = 'live-example';

        const stageBox = document.createElement('div');
        stageBox.className = 'live-stage';

        const sourceBox = document.createElement('div');
        sourceBox.className = 'live-source';

        pre.parentNode.insertBefore(figure, pre);
        stageBox.appendChild(stage);
        sourceBox.appendChild(pre);
        figure.appendChild(stageBox);
        figure.appendChild(sourceBox);

        return {figure, sourceBox};
    }

    // ---------------------------------------------------------------- plugin

    function collect() {
        const markers = document.querySelectorAll('.markdown-section .live-run');
        const examples = [];

        markers.forEach(marker => {
            // The code may have been wrapped by another plugin, so keep hold of
            // the node that actually sits next to the stage.
            const outer = findPrevious(marker, node => node.tagName === 'PRE' || !!node.querySelector('pre'));
            marker.remove();
            if (!outer) return;

            const block = outer.tagName === 'PRE' ? outer : outer.querySelector('pre');
            const code = block.querySelector('code') || block;
            const stage = findPrevious(outer, node => node.matches(STAGE_SELECTOR));
            if (!stage) {
                console.warn('[live example] no .demo stage in front of', block);
                return;
            }

            const source = code.textContent;
            originalSource.set(block, source);
            blankStage.set(stage, stage.innerHTML);

            const {sourceBox} = layout(stage, outer);
            sourceBox.appendChild(buildToolbar(stage, block, code));

            examples.push({source, stage});
        });

        return examples;
    }

    async function boot() {
        generation++;
        // Sequential, so that the `insideExample` window of one example never
        // overlaps another's.
        for (const {source, stage} of collect()) {
            await execute(source, stage);
        }
    }

    window.$docsify = window.$docsify || {};
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
        // Strip the `live` marker before docsify hands the fence to Prism, and
        // leave a node behind so the rendered block can be found again.
        hook.beforeEach(markdown =>
            markdown.replace(FENCE, (_, code) => '```js\n' + code + '\n```\n\n<div class="live-run"></div>\n')
        );

        hook.doneEach(boot);
    });
})();
