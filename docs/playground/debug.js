// Debug views of a model for the playground: the model as a table and as matrices.
import {matrix} from 'easy-house';

/** The model as one table: sections side by side on a common ground, spans as rowspan/colspan. */
export function table(model) {
    const columns = [];
    model.sections.forEach((section, s) => {
        if (s) columns.push({gap: 'section'});
        section.entrances.forEach((entrance, e) => {
            if (e) columns.push({gap: 'entrance'});
            const floorAt = new Map([...entrance.levels].map(([floor, level]) => [level, floor]));
            for (let col = 0; col < entrance.width; col++) columns.push({entrance, floorAt, col});
        });
    });

    const levels = model.sections.flatMap(section => section.entrances.flatMap(entrance => [...entrance.levels.values()]));
    const top = Math.max(...levels);
    const bottom = Math.min(...levels);

    let html = '<table class="fit">';
    for (let level = top; level >= bottom; level--) {
        html += `<tr><th>${level}</th>`;
        for (const column of columns) {
            if (column.gap) {
                html += `<td class="gap ${column.gap}"></td>`;
                continue;
            }

            const {entrance, floorAt, col} = column;
            const floor = floorAt.get(level);
            const cell = entrance.grid.get(floor)?.[col];
            if (!cell) {
                html += '<td></td>';   // this section has no such floor
                continue;
            }

            const unit = cell.type === 'covered' ? cell.by : cell.type === 'unit' ? cell : null;
            if (unit) {
                // a spanning unit is emitted once, at the top-left corner of its rectangle
                const {floors: [from, to], cols: [left, right]} = unit.rect;
                if (floor !== to || col !== left) continue;
                const rows = entrance.levels.get(to) - entrance.levels.get(from) + 1;
                const cols = right - left + 1;
                html += `<td class="unit ${unit.kind}"${rows > 1 ? ` rowspan="${rows}"` : ''}${cols > 1 ? ` colspan="${cols}"` : ''}`
                    + ` title="id: ${escape(unit.id)}${unit.fields.title ? ` — ${escape(unit.fields.title)}` : ''}">`
                    + `${escape(unit.label ?? (unit.kind === 'flat' ? '' : unit.kind))}</td>`;
                continue;
            }

            html += `<td class="${cell.type}"></td>`;
        }
        html += '</tr>';
    }

    return html + '</table>';
}

export function matrixText(model) {
    const several = model.sections.length > 1 || model.sections.some(section => section.entrances.length > 1);
    return matrix(model).map((entrances, s) => entrances.map((rows, e) => {
        const head = several ? `// секция ${s + 1}${entrances.length > 1 ? `, подъезд ${e + 1}` : ''}\n` : '';
        return head + rows.map(row => show(row)).join('\n');
    }).join('\n\n')).join('\n\n');
}

/** JS-literal printer: short things on one line, keys unquoted where possible. */
export function show(value, depth = 0) {
    if (value === null) return 'null';
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'function') return value.name ? `[${value.name}]` : '[function]';
    if (typeof value !== 'object') return String(value);

    const array = Array.isArray(value);
    const items = array
        ? value.map(item => show(item, depth + 1))
        : Object.entries(value).map(([key, item]) => `${/^([A-Za-z_$][\w$]*|\d+)$/.test(key) ? key : `'${key}'`}: ${show(item, depth + 1)}`);
    const [open, close] = array ? ['[', ']'] : ['{', '}'];
    const inline = open + items.join(', ') + close;
    if (inline.length + depth * 4 <= 96 && !inline.includes('\n')) return inline;

    const pad = '    '.repeat(depth);
    return `${open}\n${items.map(item => `${pad}    ${item}`).join(',\n')}\n${pad}${close}`;
}

export function escape(text) {
    return String(text).replace(/[&<>"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[char]);
}
