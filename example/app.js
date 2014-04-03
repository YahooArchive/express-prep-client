/*jslint node:true, nomen: true*/

'use strict';

// express related stuff
var express     = require('express'),
    exphbs      = require('express3-handlebars'),
    es6         = require('../'), // require('express-loader-bootstrap'),
    app         = express();

es6.extend(app, {
    'app.import': function (name) {
        var loader = app.loader;
        if (!loader) {
            // setup a custom loader instance
            // TODO: replace with new Loader(System);
            loader = app.loader = System;
            // extending loader
            app.loaderExtensions.aliases(loader, { aliases: app.aliases });
            app.loaderExtensions.scriptTransport(loader, {});
            app.loaderExtensions.formatAMD(loader, {});
        }
        return loader.normalize(name).then(function (name) {
            return loader.import(name);
        });
    },
    'app.foo': function (callback) {
        callback(123);
    }
});

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.prepClient({
    testFn: function () {
        return !!window.Intl;
    },
    nope: [
        'https://rawgithub.com/andyearnshaw/Intl.js/master/Intl.min.js'
    ]
});

app.prepClient({
    testFn: function () {
        return !!window.Promise;
    },
    nope: [
        'https://rawgithub.com/yahoo/ypromise/master/promise.js'
    ]
});

app.prepClient({
    testFn: function () {
        return !!window.Loader;
    },
    nope: 'https://rawgithub.com/ModuleLoader/es6-module-loader/master/dist/es6-module-loader.js'
});

app.expose({
    aliases: require('loader-extensions/dist/node/aliases')['default'],
    scriptTransport: require('loader-extensions/dist/node/transport-script')['default'],
    formatAMD: require('loader-extensions/dist/node/format-amd')['default']
}, 'app.loaderExtensions', { cache: true });

app.get('/', function (req, res, next) {
    // patching IntlPolyfill with default `en` locale-data
    res.prepClient({
        testFn: function () {
            return window.IntlPolyfill;
        },
        yep: 'https://rawgithub.com/andyearnshaw/Intl.js/master/locale-data/jsonp/en.js'
    });
    res.expose({}, 'app.aliases');
    res.render('page');
});

app.get('/french-bucket-123', function (req, res, next) {
    // patching IntlPolyfill with `fr-FR` locale-data
    res.prepClient({
        testFn: function () {
            return window.IntlPolyfill;
        },
        yep: 'https://rawgithub.com/andyearnshaw/Intl.js/master/locale-data/jsonp/fr-FR.js'
    });
    // detect a bucket and patch loader for this type of request
    res.expose({ foo: 'foo-123' }, 'app.aliases');
    res.render('page');
});

app.use(express.static(__dirname + '/modules'));

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
