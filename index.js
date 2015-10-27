require('intl');
var path = require('path');
var fs = require('fs');
var Handlebars = require('handlebars');
var HandlebarsIntl = require('handlebars-intl');
var mkdirp = require('mkdirp');
var ncp = require('ncp').ncp;
var del = require('del');

/**
 * Configuration
 * @type {Object}
 */
var config = {
  path: {
    tmpl: path.resolve('./tmpl/'),
    dist: path.resolve('./dist/'),
    intl: path.resolve('./intl/'),
    public: path.resolve('./public/')
  },
  locales: ['ru', 'en']
};

// Register helper
HandlebarsIntl.registerWith(Handlebars);

function cleanDist(dir, next) {
  del([dir]).then(next);
}

function compileTemplates(dir, next) {
  var compiled = [];

  fs.readdir(dir, function(err, files) {
    if (err) {
      console.log(err);
      return;
    }

    files.forEach(function(filename) {
      (function(file) {
        fs.readFile(path.resolve(dir, file), 'utf8', function(err, content) {
          if (err) {
            console.log(err);
            return;
          }

          try {
            compiled.push({ file: path.basename(file, '.tmpl'), template: Handlebars.compile(content) });
          } catch (e) {
            process.stdout.write(e);
          }

          if (compiled.length === files.length) {
            next(compiled);
          }
        });
      })(filename);
    });
  });
}

function localizeTemplates(locales, dir, compiled, next) {
  var rendered = [];

  locales.forEach(function(lang) {
    var intlData = require(path.resolve(dir, lang + '.json'));
    
    compiled.forEach(function(tmpl) {
      var content = tmpl.template({
        lang: lang
      }, {
        data: {
          intl: intlData
        }
      });

      rendered.push({ lang: lang, file: tmpl.file, content: content });

      if (rendered.length === compiled.length * locales.length) {
        next(rendered);
      }
    })
  });
}

function writeFiles(dir, rendered, next) {
  var writed = 0;

  rendered.forEach(function(fileData) {
    var file = path.join(dir, fileData.lang, fileData.file + '.html');
    mkdirp(path.dirname(file), function(err) {
      if (err) {
        console.log(err);
        return;
      }

      fs.writeFile(file, fileData.content, function(err) {
        if (err) {
          console.log(err);
          return;
        }

        if (++writed === rendered.length) {
          next();
        }
      });
    })
  });
}

function copyAssets(source, dest) {
  ncp(source, dest, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

// Async run
cleanDist(config.path.dist, function() {
  compileTemplates(config.path.tmpl, function(result) {
    localizeTemplates(config.locales, config.path.intl, result, function(result) {
      writeFiles(config.path.dist, result, function() {
        copyAssets(config.path.public, config.path.dist);
      });
    });
  });
});
