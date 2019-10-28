var fs = require('fs');
var path = require('path');
var package = require('../package');
var previous = require('../build/version');

var version = package.version;

var cwd = process.cwd();

function replaceVersion(filepath) {
    var filename = path.join(cwd, filepath);
    fs.writeFileSync(filename, fs.readFileSync(filename, 'utf-8').split(previous).join(version));
    console.log('Updated ', filepath);
}

console.log('Updating to version ' + version);

var files = [
    'README.md',
    path.join('src', 'rakam-snippet.js'),
    path.join('src', 'version.js'),
];
files.map(replaceVersion);

console.log('Updated version from', previous, 'to', version);