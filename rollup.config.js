import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

const name = pkg.name
	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
	.replace(/^\w/, m => m.toUpperCase())
	.replace(/-\w/g, m => m[1].toUpperCase());

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.module, 'format': 'es', inlineDynamicImports: true },
		{ file: pkg.main, 'format': 'umd', name, inlineDynamicImports: true }
	],
	plugins: [
		svelte({compilerOptions: {dev: !production}}),
		css({ output: 'bundle.css' }),
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		// production && terser()
	],
	external: ["pdfjs-dist"]
};
