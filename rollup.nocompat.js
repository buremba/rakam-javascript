import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

export default {
    input: 'src/index.js',
    output: {
        name: 'rakam',
        file: 'rakam.nocompat.js',
        format: 'umd',
    },
    plugins: [
        json(),
        babel({
            exclude: 'node_modules/**',
            plugins: ['@babel/plugin-proposal-object-rest-spread'],
        }),
        resolve({
            browser: true,
        }),
        replace({
            BUILD_COMPAT_SNIPPET: 'false',
            BUILD_COMPAT_2_0: 'false',
            BUILD_COMPAT_REACT_NATIVE: 'false',
            BUILD_COMPAT_LOCAL_STORAGE: 'false',
        }),
        commonjs({
            include: [
                'node_modules/query-string/**',
                'node_modules/blueimp-md5/**',
            ],
        }),
    ],
};
