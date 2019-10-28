import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';


export default {
    input: 'src/index.js',
    output: {
        file: 'rakam.js',
        format: 'umd',
    },
    name: 'rakam',
    plugins: [
        builtins(),
        babel({
            exclude: 'node_modules/**'
        }),
        resolve({
            browser: true,
        }),
        commonjs(),
    ],
}