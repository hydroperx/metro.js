await Bun.build({
    entrypoints: ["./src/Main.tsx"],
    outdir: "./static",
    minify: true,
    plugins: [],
    sourcemap: "linked",
    naming: "[dir]/script.[ext]"
});