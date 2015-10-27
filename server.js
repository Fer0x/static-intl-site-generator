var connect = require('connect');
var serveStatic = require('serve-static');
var path = require('path');
var watch = require('node-watch');
var debounce = require('debounce');
var exec = require('child_process').exec;

var PORT = 8080;
var TIMER = 2000;
var WATCH_PATH = ['tmpl', 'intl', 'index.js'];

connect().use(serveStatic(path.resolve(__dirname, 'dist'))).listen(PORT);
console.log('server started at localhost:' + PORT);

build();

function preparePath() {
  return WATCH_PATH.map(function(p) {
    return path.resolve(__dirname, p);
  });
}

watch(preparePath(), { recursive: true }, function() {
  debouncedBuild();
});

var debouncedBuild = debounce(build, TIMER);
var child = null;

function build() {
  console.log('building...');
  
  if (child) {
    child.kill();
  }

  child = exec('npm run build', function(err, stdout, stderr) {
    if (!err) {
      child = null;
      console.log('done');
    }
  });
}
