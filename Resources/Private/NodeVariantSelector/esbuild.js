const esbuild = require('esbuild');
const CssModulesPlugin = require('esbuild-css-modules-plugin');
const extensibilityMap = require("@neos-project/neos-ui-extensibility/extensibilityMap.json");
const isWatch = process.argv.includes('--watch');

/** @type {import("esbuild").BuildOptions} */
const options = {
    logLevel: "info",
    bundle: true,
    minify: !isWatch,
    sourcemap: true,
    target: "es2020",
    entryPoints: {
        "Plugin": "src/index.ts",
    },
    loader: {
        ".ts": "ts",
        ".tsx": "tsx",
    },
    plugins: [
        CssModulesPlugin({
            // @see https://github.com/indooorsman/esbuild-css-modules-plugin/blob/main/index.d.ts for more details
            force: true,
            localsConvention: 'camelCaseOnly',
            namedExports: true,
            inject: false,
        }),
    ],
    alias: extensibilityMap,
    outdir: "../../Public/JavaScript/NodeVariantSelector",
}

if (isWatch) {
    esbuild.context(options).then((ctx) => ctx.watch())
} else {
    esbuild.build(options)
}
