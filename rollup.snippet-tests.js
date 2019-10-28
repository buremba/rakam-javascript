import config from './rollup.config.js';
import legacy from 'rollup-plugin-legacy';

config.plugins.push(legacy({
    './rakam-snippet.min.js': 'rakam',
}));
config.input = 'test/snippet-tests.js';
config.output.file = 'build/snippet-tests.js';

export default config;