// easy-house: the types of the public API.
//
// The config is open: the options of a plugin go under its name at any level (`cells: {fill: 'gold'}`), and the
// fields plugins read are any keys of a unit or a floor (`oldman: true`, `debt: 1200`). So keys of plugins of your
// own are allowed everywhere; the built-in plugins have their options typed.

// ------------------------------------------------------------------ basics

/** `{x, y, width, height}` in the coordinates of the whole picture */
export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** A colour, `'$name'` of the palette, or null for none */
export type Color = string | null;

/** The key of a unit: its number, or the number with what tells it apart (`'2-5'`), or its explicit `id` */
export type Id = string | number;

export type Direction = 'ltr' | 'rtl';
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type SizeWord = 'pixel' | 'icon' | 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
    | 'extraSmall' | 'small' | 'middle' | 'large' | 'extraLarge';

/** An svg-easy-tree node: what plugins return and what House compiles into the `<svg>` */
export interface TreeNode {
    tag: string | Element;
    opt?: Record<string, string | number | boolean | null | undefined>;
    val?: string | number;
    sub?: Array<TreeNode | Element | null | undefined | false>;
    sav?: boolean;
    _id?: string | number;
}

/** What a hook returns: a node, nodes (arrays at any depth), or nothing */
export type Nodes = TreeNode | null | undefined | false | void | Nodes[];

/** The options of a plugin at a level: its options, true to switch it on, null or false to switch it off */
export type Switch<O> = Partial<O> | boolean | null;

// ------------------------------------------------------------------ the config

/** Keys of the built-in plugins, at any level; the keys of other plugins are open */
export interface PluginKeys {
    cells?: Switch<CellsOptions>;
    stacks?: Switch<StacksOptions>;
    walls?: Switch<WallsOptions>;
    roof?: Switch<RoofOptions>;
    floorLabels?: Switch<FloorLabelsOptions>;
    dividers?: Switch<DividersOptions>;
    reactions?: Switch<ReactionsOptions>;
    text?: Switch<TextOptions>;
    hover?: Switch<HoverOptions>;
    icon?: Switch<IconOptions> | unknown;
    hole?: Switch<HoleOptions> | unknown;
    [plugin: string]: unknown;
}

/** A unit described in full */
export interface UnitConfig extends PluginKeys {
    /** what is written on it: a number (the counter goes on from it), a number as a string ('25/1'), a label ('S') */
    label?: string | number;
    /** its kind: 'flat' by default */
    kind?: string;
    /** its tooltip */
    title?: string;
    /** its key for the state and the events; its number by default */
    id?: string | number;
    /** whether it takes a number when it has no label: flats do, `special` units do not */
    enumerable?: boolean;
    /** positions it takes: 2 — this and the next one, -2 — this and the one before */
    colSpan?: number;
    /** floors it takes: 2 — this and the one above */
    rowSpan?: number;
    /** a span of flats merged in a built house: the numbering does not move */
    merged?: boolean;
    /** a drawing of its own; `base(patch)` — the drawing it wraps */
    render?: (ctx: RenderCtx) => Nodes;
}

/** A place on a floor: a hole, a number, a number as a string or a label, or a unit described in full */
export type Slot = null | number | string | UnitConfig;

/** The fields of a floor, beside its positions and the numbers of its units */
export interface FloorFields extends PluginKeys {
    /** positions taken, or the whole row */
    units?: number | Slot[];
    /** the edge `units` count from */
    align?: 'left' | 'right';
    /** written instead of the floor number: 'P' */
    label?: string | number;
    /** a sign in front of the floor number: 'done' */
    mark?: string | string[];
    /** the numbering starts here from this number */
    start?: number;
    numberDirection?: Direction;
    /** the floor draws itself; `base()` — its usual drawing */
    render?: (ctx: FloorCtx & {base: () => Nodes}) => Nodes;
}

/**
 * A floor that differs: `'@2': …` — the position 2 (structure: a hole, a kind, a span, a number), `54: {…}` — the
 * unit numbered 54 (its data; null — a hole in its place), anything else — a field of the floor.
 */
export type FloorObject = FloorFields & {
    [position: `@${number}`]: Slot;
};

/** 3 — three positions; an object — only what differs; an array — the whole row; null — no units */
export type FloorValue = number | null | Slot[] | FloorObject;

/** `floors: 9` is `{from: 1, to: 9}`; the object also carries the floors that differ: `{to: 22, 1: [...], 22: 3}` */
export type Floors = number | ({from?: number; to?: number} & {[floor: number]: FloorValue});

/** What a house, a section and an entrance have: a lower level overrides the upper one */
export interface ScopeConfig extends PluginKeys {
    /** positions on a floor */
    units?: number;
    floors?: Floors;
    /** kinds of units: presets of fields, `{shop: {enumerable: false}}`; `flat` is the base of all */
    kinds?: Record<string, UnitConfig>;
    /** the edge a short floor counts its positions from */
    align?: 'left' | 'right';
    /** the number of the ground floor: 1 (UA, US) or 0 (EU) */
    groundFloor?: number;
    /** lifts (1) or lowers (-1) a section: a slope */
    base?: number;
    /** entrances and sections right to left, and the numbers on a floor too */
    direction?: Direction;
    /** the numbers on a floor alone */
    numberDirection?: Direction;
    /** where the numbering starts: on a house, a section, an entrance; not passed down */
    start?: number;
    /** '25/1' moves the counter to 25 instead of one step */
    numericStrings?: boolean;
}

export interface EntranceConfig extends ScopeConfig {
    /** the entrance draws itself; `base()` — its usual drawing */
    render?: (ctx: EntranceCtx & {base: () => Nodes}) => Nodes;
}

export interface SectionConfig extends ScopeConfig {
    /** a number of entrances, or each of them */
    entrances?: number | EntranceConfig[];
    /** the section draws itself; `base()` — its usual drawing */
    render?: (ctx: SectionCtx & {base: () => Nodes}) => Nodes;
}

export interface Geometry {
    /** the side of a square, px */
    size: number;
    /** between squares */
    gap: number;
    /** between entrances of a section */
    entranceGap: number;
    /** between sections */
    sectionGap: number;
    /** around the picture */
    padding: number;
}

export interface HouseConfig extends ScopeConfig, Partial<Omit<Geometry, 'size'>> {
    /** a number of sections, or each of them */
    sections?: number | SectionConfig[];
    /** a number of entrances in every section, or each of them */
    entrances?: number | EntranceConfig[];
    /** the side of a square, px — or a small house in one word */
    size?: number | SizeWord;
    /** the plugins in use instead of House.plugins; their order is the order of layers */
    plugins?: PluginEntry[];
    /** a theme by name, or a theme of your own: a config put under this one */
    theme?: 'light' | 'dark' | 'night' | (string & {}) | HouseConfig;
    /** colours of the palette by name */
    colors?: Partial<Palette>;
    /** the background of the picture; null — transparent */
    background?: Color;
}

/** The data of a unit: what changes — a reaction, a payment, a debt */
export interface UnitState {
    reaction?: string | null;
    [field: string]: unknown;
}

/** The data of the units by id */
export type State = Record<string, UnitState>;

// ------------------------------------------------------------------ colours and themes

/** The colours by name; an option may name one: `fill: '$unit'` */
export interface Palette {
    background: Color;
    unit: Color;
    label: Color;
    wall: Color;
    floorLabel: Color;
    sectionLine: Color;
    entranceLine: Color;
    text: Color;
    yes: Color;
    no: Color;
    maybe: Color;
    ignore: Color;
    none: Color;
    yesFill: Color;
    noFill: Color;
    maybeFill: Color;
    ignoreFill: Color;
    noneFill: Color;
    yesBright: Color;
    noBright: Color;
    maybeBright: Color;
    glow: Color;
    stacks: string[];
    highlight: Color;
    aim: Color;
    hole: Color;
    holeLine: Color;
    [name: string]: unknown;
}

// ------------------------------------------------------------------ the options of the plugins

/** How a unit looks: `style` hooks add to it, `cells` draws by it */
export interface Style {
    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
    color?: Color;
    font?: string;
    fontSize?: number | null;
    fontWeight?: string | number | null;
    /** a light around the square: a colour */
    glow?: Color;
    [key: string]: unknown;
}

export interface CellsOptions extends Style {
    /** write the labels on the squares */
    numbers: boolean;
}

export interface StacksOptions {
    /** colours by position: a list, or a name of the palette */
    colors: string | string[];
}

export interface WallsOptions {
    color: Color;
    /** px around the units; by default half a gap */
    padding: number | null;
}

export interface RoofOptions {
    /** by default the colour of the walls there */
    color: Color;
    /** px, the thickness of the strip */
    height: number;
    /** px between the strip and the top floor; by default a gap */
    offset: number | null;
}

export interface FloorLabelsOptions {
    /** where the floors are labelled */
    at: 'house' | 'section' | 'entrance';
    /** compact: over the neighbour's empty space; gutter: room of their own */
    mode: 'compact' | 'gutter';
    format: (floor: number) => string;
    /** the signs of the floor marks: {done: '✓'} */
    marks: Record<string, string>;
    color: Color;
    font: string;
    fontSize: number | null;
}

export interface DividersOptions {
    /** the line between sections; null — none */
    sections: Color;
    /** the line between entrances; null — none */
    entrances: Color;
    /** overlap: as high as the neighbours overlap; full: as tall as both */
    extent: 'overlap' | 'full';
}

export interface HoverOptions {
    /** what is highlighted around the unit under the pointer */
    aim: 'off' | 'unit' | 'floor' | 'stack' | 'both';
    stroke: Color;
    strokeWidth: number;
    fill: Color;
    /** the floor and the stack it aims along */
    line: {fill?: Color; stroke?: Color};
    cursor: string;
}

export interface IconOptions {
    icon: string;
    corner: Corner;
    size: number | null;
    color: Color;
    font: string | null;
    title: string | null;
    /** the units that get the mark, besides those with the field of its name */
    units: Id[];
}

export interface HoleOptions {
    fill: Color;
    stroke: Color;
    dash: string;
    /** a short text under the number, e.g. a year */
    note: string | null;
}

/** A part of a line of text: a text, or a text with a look of its own */
export type TextPart = string | number | {value: TextLine; color?: string; size?: number; weight?: string | number; font?: string};
/** A line: a part, or parts one after another */
export type TextLine = TextPart | TextPart[];

/** Where a text block is and how it looks */
export interface TextBlockOptions {
    /** 'house', 'section:2', 'floor:22' (its row across the house); 'top' or 'bottom' — a band of its own */
    at: 'house' | 'top' | 'bottom' | `section:${number}` | `floor:${number}`;
    /** px from the near edge of the place, negative — from the far one; '50%' — of its size */
    x: number | string;
    y: number | string;
    align: 'left' | 'center' | 'right';
    valign: 'top' | 'middle' | 'bottom';
    color: Color;
    font: string;
    /** by default from the unit size, times `scale` */
    size: number | null;
    scale: number;
    weight: string | number | null;
    lineHeight: number;
    /** '1px dashed silver' */
    border: string | null;
    padding: number;
}

export interface TextOptions extends TextBlockOptions {
    /** the lines */
    text: TextLine | TextLine[];
}

export interface PercentOptions extends TextBlockOptions {
    /** 'yes', 'count:no', 'yes/no' */
    show: string;
    /** lines of your own with values: ['{{no.percent}}%'] */
    text: TextLine | TextLine[] | null;
}

export interface LegendOptions extends TextBlockOptions {
    /** the line of a group: '{{name}}: {{count}} / {{total}} = {{share}}% ≈ {{percent}}%' */
    line: string;
    /** groups shown even when empty */
    keep: string[];
    /** digits after the point in `share` */
    decimal: number;
}

export interface ReactionsOptions {
    /** the field of the unit's state */
    field: string;
    /** the outline and the label by reaction */
    colors: Record<string, Color>;
    /** the fill by reaction */
    fills: Record<string, Color>;
    /** fill the square by the reaction too */
    fill: boolean;
    /** units without a reaction get an outline of colors.none */
    always: boolean;
    style: Style;
    /** any style keys per reaction: {yes: {glow: '$glow'}} */
    styles: Record<string, Style>;
    /** a reaction counted as another one: {paid: 'yes'} */
    synonyms: Record<string, string>;
    /** the group of the units without a reaction; null — they are not counted */
    none: string | null;
    /** which units are counted */
    counts: (ctx: {unit: {config: UnitInfo['config']; state: UnitState}; reaction: unknown}) => boolean;
    /** what a group is called: {yes: 'да'} */
    names: Record<string, string>;
    /** the groups in this order */
    order: string[] | null;
    percent: boolean | Partial<PercentOptions> | null;
    legend: boolean | Partial<LegendOptions> | null;
}

/** A group of reactions, counted */
export interface ReactionGroup {
    key: string;
    name: string;
    count: number;
    /** % of the total */
    share: number;
    /** the share, rounded */
    percent: number;
    color: Color;
}

/** What reactions counted: the total, the groups in order, and every group by its key */
export type Tally = {total: number; groups: ReactionGroup[]} & {[key: string]: ReactionGroup | number | ReactionGroup[]};

// ------------------------------------------------------------------ the model and the layout

export interface UnitPath {
    section: number;
    entrance: number;
    floor: number;
    position: number;
}

/** The floors and the positions (from 0) a unit takes */
export interface UnitRect {
    floors: [number, number];
    cols: [number, number];
}

/** A cell of an entrance's grid */
export type Cell =
    | ModelUnit
    | {type: 'hole'; was?: string}
    | {type: 'empty'}
    | {type: 'covered'; by: ModelUnit; was?: Cell};

export interface ModelUnit {
    type: 'unit';
    id: string;
    label?: string | number;
    kind: string;
    enumerable: boolean;
    path: UnitPath;
    rect: UnitRect;
    floor: number;
    col: number;
    /** its fields: of `flat`, of its kind, its own and the patches by number */
    fields: UnitConfig;
    renders: Array<(ctx: RenderCtx) => Nodes>;
    auto: boolean;
}

export interface ModelEntrance {
    index: number;
    path: {section: number; entrance: number};
    /** its floors, bottom up */
    floors: number[];
    /** floor → the row of the picture */
    levels: Map<number, number>;
    /** positions */
    width: number;
    grid: Map<number, Cell[]>;
    /** the fields of its floors */
    props: Record<number, FloorFields>;
    start?: number;
    render?: EntranceConfig['render'];
    config: EntranceConfig;
}

export interface ModelSection {
    index: number;
    base: number;
    start?: number;
    render?: SectionConfig['render'];
    entrances: ModelEntrance[];
    config: SectionConfig;
}

/** What resolve() makes of a config */
export interface Model {
    sections: ModelSection[];
    units: ModelUnit[];
    /** what did not fit */
    warnings: string[];
}

/** Room a plugin asks for before the layout */
export type Reservation =
    | {side: 'left' | 'right'; section: number; entrance?: number; width: number; [key: string]: unknown}
    | {side: 'top' | 'bottom'; height: number; width?: number; [key: string]: unknown}
    | {side: 'around'; width: number; [key: string]: unknown};

/** A reservation placed: with its coordinates and the name of the plugin */
export type Gutter = Reservation & {plugin: string; x: number; y?: number};

export interface LayoutFloor {
    floor: number;
    level: number;
    box: Box;
    config: FloorFields;
    units: Array<{cell: ModelUnit; box: Box}>;
}

export interface LayoutEntrance {
    index: number;
    model: ModelEntrance;
    /** the units only */
    box: Box;
    /** with the entrance's own gutters */
    frame: Box;
    gutters: Gutter[];
    floors: LayoutFloor[];
    units: Array<{cell: ModelUnit; box: Box}>;
    holes: Array<{floor: number; col: number; box: Box}>;
}

export interface LayoutSection {
    index: number;
    model: ModelSection;
    box: Box;
    gutters: Gutter[];
    entrances: LayoutEntrance[];
}

/** The geometry: a box for every unit, floor, entrance and section, and the size of the picture */
export interface Layout {
    geometry: Geometry;
    /** the highest and the lowest row */
    top: number;
    bottom: number;
    /** the y of a row */
    rowY(level: number): number;
    width: number;
    height: number;
    sections: LayoutSection[];
    units: Array<{cell: ModelUnit; box: Box}>;
    /** the bands above and below the house */
    bands: Gutter[];
}

// ------------------------------------------------------------------ levels and the context of hooks

export interface UnitInfo {
    /** its fields after the cascade, and what was computed */
    config: UnitConfig & {
        id: string;
        label?: string | number;
        kind: string;
        enumerable: boolean;
        path: UnitPath;
        rect: UnitRect;
        renders?: Array<(ctx: RenderCtx) => Nodes>;
    };
    box: Box;
    /** its data from the state, `{}` when there is none */
    state: UnitState;
}

export interface FloorInfo {
    config: FloorFields & {floor: number; level: number};
    box: Box;
    units: UnitInfo[];
}

export interface EntranceInfo {
    config: EntranceConfig & {index: number; section: number};
    box: Box;
    /** the box with its gutters */
    frame: Box;
    gutters: Gutter[];
    floors: FloorInfo[];
}

export interface SectionInfo {
    config: SectionConfig & {index: number; base: number};
    box: Box;
    gutters: Gutter[];
    entrances: EntranceInfo[];
}

export interface HouseInfo {
    config: HouseConfig;
    box: Box;
    layout: Layout;
    /** all of it, by unit id */
    state: State;
    sections: SectionInfo[];
}

/** The chain of levels of a unit, as an event handler and house.unit(id) get it */
export interface UnitLevels {
    section: SectionInfo;
    entrance: EntranceInfo;
    floor: FloorInfo;
    unit: UnitInfo;
}

// the levels as hooks get them: with their groups in the tree
export interface UnitLevel extends UnitInfo {
    node: TreeNode;
    /** the next free place in a corner, so marks of different plugins stack */
    place(corner?: Corner, width?: number, height?: number): Box;
}

export interface FloorLevel extends FloorInfo {
    node: TreeNode;
    units: UnitLevel[];
}

export interface EntranceLevel extends EntranceInfo {
    node: TreeNode;
    floors: FloorLevel[];
}

export interface SectionLevel extends SectionInfo {
    node: TreeNode;
    entrances: EntranceLevel[];
}

export interface HouseLevel extends HouseInfo {
    node: TreeNode;
    /** the palette */
    colors: Palette;
    sections: SectionLevel[];
}

interface Own<O> {
    /** the name of this instance */
    name: string;
    /** its options at this level */
    options: O;
}

export interface HouseCtx<O = any> extends Own<O> {
    house: HouseLevel;
    /** its bands above or below the house */
    gutters: Gutter[];
}

export interface SectionCtx<O = any> extends Own<O> {
    house: HouseLevel;
    section: SectionLevel;
    /** the room it reserved beside the section */
    gutters: Gutter[];
}

export interface EntranceCtx<O = any> extends Own<O> {
    house: HouseLevel;
    section: SectionLevel;
    entrance: EntranceLevel;
    /** the room it reserved beside the entrance */
    gutters: Gutter[];
}

export interface FloorCtx<O = any> extends Own<O> {
    house: HouseLevel;
    section: SectionLevel;
    entrance: EntranceLevel;
    floor: FloorLevel;
}

export interface UnitCtx<O = any> extends Own<O> {
    house: HouseLevel;
    section: SectionLevel;
    entrance: EntranceLevel;
    floor: FloorLevel;
    unit: UnitLevel;
    /** how the unit looks so far */
    style: Style;
}

export interface RenderCtx<O = any> extends UnitCtx<O> {
    /** the drawing of the plugins before it, with the patch merged into the context */
    base(patch?: DeepPartial<UnitCtx<O>>): Nodes;
}

export interface GuttersCtx<O = any> extends Own<O> {
    model: Model;
    /** the sections and their entrances in the order they are drawn */
    sections: Array<{section: ModelSection; entrances: ModelEntrance[]}>;
    geometry: Geometry;
    state: State;
    config: HouseConfig;
    /** what plugins put in front of a floor's label */
    marks(section: ModelSection, entrance: ModelEntrance, floor: number): Mark[];
}

export interface MarkCtx<O = any> extends Own<O> {
    section: {config: SectionConfig};
    entrance: {config: EntranceConfig};
    floor: {config: FloorFields & {floor: number; level: number}};
}

/** A sign in front of a floor number */
export type Mark = string | {text: string; class?: string; title?: string; color?: string};

type DeepPartial<T> = {[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]};

// ------------------------------------------------------------------ plugins

export interface Plugin<O extends object = Record<string, any>> {
    /** the key of everything: its options, its switch, its field on a unit */
    name: string;
    /** false — off until the config names it */
    enabled?: boolean;
    /** its default options; a colour may be a name of the palette: '$text' */
    options?: O;
    /** a part of a unit's look; later plugins win */
    style?(ctx: UnitCtx<O>): Style | null | void;
    /** the unit itself, wrapping the plugins before it */
    render?(ctx: RenderCtx<O>): Nodes;
    unit?(ctx: UnitCtx<O>): Nodes;
    floor?(ctx: FloorCtx<O>): Nodes;
    entrance?(ctx: EntranceCtx<O>): Nodes;
    section?(ctx: SectionCtx<O>): Nodes;
    house?(ctx: HouseCtx<O>): Nodes;
    /** room before the layout */
    gutters?(ctx: GuttersCtx<O>): Array<Reservation | null | undefined | false> | null | void;
    /** a sign in front of a floor's number */
    mark?(ctx: MarkCtx<O>): Mark | Mark[] | null | undefined | false;
}

/** A plugin, or the same plugin once more under another name and with other options */
export type PluginEntry = Plugin<any> | {use: Plugin<any>; name?: string; options?: object; enabled?: boolean};

/** A plugin with its name and its options of the house */
export interface Instance {
    plugin: Plugin<any>;
    name: string;
    palette: Palette;
    options: Record<string, any>;
}

// ------------------------------------------------------------------ House

export type HouseEventType = 'unit:click' | 'unit:enter' | 'unit:leave';

export interface HouseEvent extends UnitLevels {
    type: HouseEventType;
    house: House;
    /** the `<g class="unit">` */
    element: SVGGElement;
    event: MouseEvent | PointerEvent;
}

export class House {
    /** used when the config has no `plugins` of its own */
    static plugins: PluginEntry[];

    /**
     * @param target a selector or an element to draw into
     * @param config what the house is
     * @param state the data of the units by id
     */
    constructor(target: string | Element | null | undefined, config?: HouseConfig, state?: State);
    /** a house drawn into nothing: put `house.svg` anywhere */
    constructor(config: HouseConfig, state?: State);

    /** the container, or null */
    element: Element | null;
    svg: SVGSVGElement;
    /** the config as given (and as redraw changed it) */
    config: HouseConfig;
    /** the config that is drawn: with its theme under it and a size in one word expanded */
    effective: HouseConfig;
    state: State;
    plugins: PluginEntry[];
    model: Model;
    layout: Layout;
    /** the tree that was compiled */
    scene: TreeNode;
    /** unit id → its chain of levels */
    units: Map<string, UnitLevels>;

    /** draws the house from config and state again */
    draw(): this;
    /** merges the patch into the config and draws the house again; the state and the handlers stay */
    redraw(patch?: HouseConfig): this;
    /** merges {id: data} into the state (null clears it) and redraws only what changed */
    update(patch: Record<string, UnitState | null>): this;
    unit(id: Id): UnitLevels | undefined;
    elementOf(id: Id): SVGGElement | null;
    on(type: HouseEventType, handler: (event: HouseEvent) => void): this;
    off(type: HouseEventType, handler: (event: HouseEvent) => void): this;
    /** calls the handlers and dispatches `house:<type>` on the container */
    emit(type: string, detail: unknown): void;
}


// ------------------------------------------------------------------ functions and values

/** config → model: the grid of every entrance, the units with their numbers, warnings */
export function resolve(config?: HouseConfig): Model;
/** the model as rows, top floor first: sections → entrances → rows → cells */
export function matrix(model: Model): Array<Array<Array<Array<string | number | null | UnitConfig>>>>;
export const defaultKinds: Record<string, UnitConfig>;

/** model → geometry */
export function layout(model: Model, config?: HouseConfig, plugins?: PluginEntry[], state?: State): Layout;
export const defaultGeometry: Geometry;

export const sizes: Record<SizeWord, {size: number; gap: number}>;
/** the config with its size in one word expanded */
export function sized(config?: HouseConfig): HouseConfig;

export const themes: Record<'light' | 'dark' | 'night', HouseConfig> & Record<string, HouseConfig>;
/** the config with its theme put under it */
export function themed(config?: HouseConfig): HouseConfig;

/** the default palette */
export const colors: Palette;
/** '$name' in a value, at any depth → the colour of the palette */
export function paint<T>(value: T, palette: Record<string, unknown>): T;

/** geometry → the tree of nodes */
export function scene(layout: Layout, plugins: PluginEntry[], config?: HouseConfig, state?: State): TreeNode;
/** the chain of levels house → sections → entrances → floors → units */
export function levels(layout: Layout, config?: HouseConfig, state?: State): HouseInfo;
/** the patch merged into a context: plain objects at any depth (what base(patch) does) */
export function extend<T extends object>(target: T, patch?: DeepPartial<T> | Record<string, unknown>): T;

/** the plugins with their names and their options of the house */
export function instances(plugins: PluginEntry[], config?: HouseConfig): Instance[];
/** the options of an instance at a level; null — switched off there */
export function optionsAt(instance: Pick<Instance, 'name' | 'options'> & {palette?: Palette}, ...configs: Array<object | null | undefined>): Record<string, any> | null;

/** what reactions counted in a house; null when there is no such instance */
export function count(house: House, name?: string): Tally | null;

export const cells: Plugin<CellsOptions>;
export const stacks: Plugin<StacksOptions>;
export const walls: Plugin<WallsOptions>;
export const roof: Plugin<RoofOptions>;
export const floorLabels: Plugin<FloorLabelsOptions>;
export const dividers: Plugin<DividersOptions>;
export const reactions: Plugin<ReactionsOptions>;
export const text: Plugin<TextOptions>;
export const hover: Plugin<HoverOptions>;
export const icon: Plugin<IconOptions>;
export const hole: Plugin<HoleOptions>;

/** The drawing of text blocks, for plugins with text of their own */
export namespace textBlock {
    /** the options of a block */
    const defaults: TextBlockOptions;
    /** lines as written → lines of parts */
    function lines(raw: TextLine | TextLine[] | null | undefined): Array<Array<{value: string; color?: string; size?: number; weight?: string | number; font?: string}>>;
    /** '{{yes.percent}}%' with the values of data */
    function fill(template: string, data: object): string;
    /** the room a block takes at 'top' or 'bottom'; null anywhere else */
    function band(written: ReturnType<typeof lines>, options: TextBlockOptions, geometry: Geometry, part?: string): Reservation | null;
    /** the nodes of a block */
    function block(written: ReturnType<typeof lines>, options: TextBlockOptions, place: {house: HouseLevel; bands?: Gutter[]; name?: string}): TreeNode | null;
}
