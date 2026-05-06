const esbuild = require('esbuild');
const extensibilityMap = require("@neos-project/neos-ui-extensibility/extensibilityMap.json");
const isWatch = process.argv.includes('--watch');

/** @type {import("esbuild").BuildOptions} */
const options = {
    logLevel: "info",
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch,
    target: "es2020",
    entryPoints: {"Plugin": "src/index.js"},
    loader: {
        ".js": "tsx",
    },
    // Explicitly declare the React JSX factory so it is never inherited.
    alias: extensibilityMap,
    outdir: "../../Public/JavaScript/NodeVariantSelector",
}

if (isWatch) {
    esbuild.context(options).then((ctx) => ctx.watch())
} else {
    esbuild.build(options)
}
