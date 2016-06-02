var fs = require('fs');
var path = require('path');

// Update the README with the minified snippet.
var cwd = process.cwd();
var readmeFilename = path.join(cwd, "README.md");
var readme = fs.readFileSync(readmeFilename, 'utf-8');

var snippetFilename = path.join(cwd, "rakam-snippet.min.js");
var snippet = fs.readFileSync(snippetFilename, 'utf-8');
var script =
'        <script type="text/javascript">\n' +
snippet.trim().replace(/^/gm, '          ') + '\n\n' +
'          rakam.init("YOUR_PROJECT_WRITE_KEY", "USER_ID_HERE", { \n\
                apiEndpoint:"127.0.0.1:9999", \n\
                includeUtm: true, \n\
                trackClicks: true, \n\
                trackForms: true, \n\
                includeReferrer: true \n\
           });\n' +
                '        </script>';

var updated = readme.replace(/ +<script[\s\S]+?script>/, script);
fs.writeFileSync(readmeFilename, updated);

console.log('Updated README.md');
