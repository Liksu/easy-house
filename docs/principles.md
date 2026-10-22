# Principles

The rules the config and the plugins follow. Where the docs say nothing about a case, it works by these rules.

## The config

1. **Only what differs.** Every key has a default. `{units: 4, floors: 9}` is already a house. A floor is written
   only where it differs from the others: `22: 3` — three flats on the 22nd floor.
2. **One cascade.** A key can be written on the house, on a section or on an entrance; floors and units take the
   keys that make sense for them. The lower level overrides the upper one, and objects are merged. Only the
   structure (`sections`, `entrances`), a numbering `start` and a level's own `render` are not passed down.
3. **The building and the data are kept apart.** The config describes the building — its sections, floors and
   flats. The state holds the data about the flats — a vote, a payment, a debt — keyed by the flat number. The
   config rarely changes; the state changes often, and `house.update()` redraws only what it touched.
4. **A position is a place, a number is a flat.** `'@2'` means "the second place on this floor"; a hole, a kind or
   a span written there may shift the numbers of the flats after it. `54` means "the flat numbered 54" as you see
   it on the picture; it is used to add data to that flat and never shifts the numbers before it.
5. **Written the way it is drawn.** Rows, positions and the sign of a span go from left to right, as on the
   picture, whichever way the flats are numbered.
6. **A plugin's name is its key.** The same name sets its options (`floorLabels: {…}`), switches it off
   (`floorLabels: null`) and marks a flat or a floor for it (`21: {rental: true}`). Kinds are values: `kind: 'salon'`.
7. **Numbering follows real houses.** It is continuous; an explicit number moves the counter; a label takes no
   number; a hole keeps the numbers of the other flats; a designed duplex is one flat, merged flats keep their
   numbers.
8. **Mistakes are reported, not fatal.** When the config contradicts itself — a span over a flat that is written
   explicitly, a number that is not on its floor — easy-house warns (`house.model.warnings` and the console) and
   draws the rest.

## The plugins

1. **Everything that is drawn is a plugin.** The core reads the config, numbers the flats and computes where
   everything goes. The square of a flat is drawn by `cells`, floor numbers by `floorLabels`, and so on. Any of
   them can be replaced.
2. **Plugins return descriptions, not DOM.** A hook returns [svg-easy-tree](how-it-works.md) nodes —
   `{tag, opt, val, sub}`; only `House` turns them into an `<svg>`. A plugin can be tested without a browser.
3. **The same context everywhere.** Every hook gets the chain of levels — `house`, `section`, `entrance`, `floor`,
   `unit` — each with its `config`, `box` and `node`, and its own `name` and `options`.
4. **Options follow the levels.** `cells: {fill: 'pink'}` on a floor paints that floor; `cells: null` there
   switches the plugin off on that floor.
5. **First the look, then the drawing.** `style` hooks decide how a flat looks, in the order of the plugins — a later
   one wins, like CSS rules; then the flat is drawn by that look. So the stacks and the votes never fight over one
   square.
6. **Layers follow the order of `plugins`.** `render` hooks wrap each other (`base()` draws what the earlier ones
   draw); `unit`, `floor`, `section` and `house` hooks draw on top of their level.
7. **Room is asked for in advance.** A plugin that needs space beside a section, an entrance or the whole house asks
   for it before anything is placed (`gutters`); there is space only where there is something to put.
8. **A plugin owns its subject.** `reactions` counts its own votes and writes its own legend; `text` writes the lines
   it is given and does not know what they mean. Plugins share exported functions, not the core.
9. **Colours by name.** The defaults of the plugins name the colours of a palette (`'$unit'`), so a theme or a
   config changes a colour once for every plugin.
10. **Some are off until named.** A few built-in plugins come with the house but work only when the config names
   them: `stacks: true`, `hover: true`, `text: {…}`.
11. **One plugin, several names.** `{use: icon, name: 'oldman', options}` runs a plugin once more under another name
    — the same mechanism with different settings.
