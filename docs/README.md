# easy-house

easy-house draws an apartment building in SVG: every flat is a square, placed where it is in the house. It was
written for the site of a housing association — to show on one picture who voted for a decision, who has paid,
which flats are rented out, and to open the card of a flat when it is clicked.

Drawing the squares is easy; describing a real building is not. Sections have different heights, a section may
have several entrances, the top floor is often shorter, there are duplexes, an arch over a passage, a slope,
floors below the ground, and flat numbers that skip or start again. In easy-house you describe an ordinary floor
once and then only the places where the house differs from it. The library numbers the flats the way houses are
usually numbered and lays them out; how they look is up to plugins.

Here are the main options — change them and see the config and the house:

<div class="configurator"></div>

## What is in it

* **[Describing a house](building.md)** — sections, entrances, floors and positions; a floor says only how it
  differs; kinds of units, wide flats and duplexes, arches, slopes, floors below the ground.
* **[Numbering](numbering.md)** — continuous by default, explicit numbers, numbers as strings, labels without a
  number, holes, merged flats, right to left.
* **[Drawing](drawing.md)** — the size of the squares and the gaps, small houses in one word, the look of a unit.
* **[Themes and colors](themes.md)** — a palette of named colours, themes: light, dark, night.
* **[State and events](state-and-events.md)** — data about the flats kept apart from the description of the house;
  only what changed is redrawn; events instead of dialogs.
* **[Plugins](plugins.md)** — everything drawn is a plugin: floor numbers, colours by votes, stacks, marks, text,
  a highlight under the pointer. Replace them or add your own.
* **[How it works](how-it-works.md)** and the **[API](api.md)**.

## Install

```bash
npm install easy-house
```

```js
import {House} from 'easy-house';

new House('#house', {units: 4, floors: 9});
```

Without a bundler, an [import map](https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap)
keeps the same import:

```html
<script type="importmap">
    {
        "imports": {
            "easy-house": "https://unpkg.com/easy-house@1.0.0/index.js",
            "svg-easy-tree": "https://unpkg.com/svg-easy-tree@1.0.3/tree.js"
        }
    }
</script>
<script type="module">
    import {House} from 'easy-house';

    new House('#house', {units: 4, floors: 9});
</script>
```

The only dependency is [svg-easy-tree](https://www.npmjs.com/package/svg-easy-tree); there is no build step.

Every example in these docs can be edited and run again. To work on a whole house, use the
<a href="playground.html">playground</a>.
