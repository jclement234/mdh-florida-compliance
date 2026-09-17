import {build} from 'esbuild';
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',outfile:'public/app.js',target:'es2022'});
