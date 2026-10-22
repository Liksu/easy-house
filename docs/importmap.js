// Where the pages of these docs take the library from. Examples import it by its package name —
// `import {House} from 'easy-house'` — so the code on the page is the code you write; this import map
// says what the name is:
//   on the published site — the package from unpkg, the version below;
//   served from the repository (localhost) — the sources next to the docs, as they are right now.
// ?lib=cdn or ?lib=local in the address picks one by hand.
//
// A classic script, loaded before any module: it writes the import map while the page is being parsed.
(function () {
    var version = '1.0.0';           // the published easy-house; keep in step with package.json
    var tree = '1.0.4';              // svg-easy-tree, its only dependency

    var choice = new URLSearchParams(location.search).get('lib');
    var local = choice ? choice === 'local' : /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    var root = new URL('../', document.currentScript.src).href;      // the repository: docs/..

    var imports = local
        ? {'easy-house': root + 'index.js', 'svg-easy-tree': root + 'node_modules/svg-easy-tree/tree.js'}
        : {
            'easy-house': 'https://unpkg.com/easy-house@' + version + '/index.js',
            'svg-easy-tree': 'https://unpkg.com/svg-easy-tree@' + tree + '/tree.js'
        };

    window.easyHouseSource = local ? 'local sources' : 'easy-house@' + version + ' from unpkg';
    document.write('<script type="importmap">' + JSON.stringify({imports: imports}) + '<\/script>');
})();
