/*jslint node:true, nomen: true*/

'use strict';

// express related stuff
var express           = require('express'),
    expressHandlebars = require('express3-handlebars'),
    expressPrepClient = require('../'), // require('express-prep-client'),
    app               = express();

expressPrepClient.extend(app, {
    'displayDateInCurrentLang': function () {
        // this is the code that will be executed when the client calls `displayDateInCurrentLang()`.
        // if you don't want to have client code here, then simply use this method as a shim to call
        // another function that alerts the date.
        var date = new Date();
        alert('Today in ' + app.locales[0] + ': ' + new Intl.DateTimeFormat(app.locales[0]).format(date));
    },
    'myapp.giveMeAPromise': function () {
        // this promise will be returned when `myapp.giveMeAPromise()`.
        // if you don't want to have client code here, then simply use this method as a shim to call
        // another function that returns a promise.
        return new Promise(function (resolve, reject) {
            resolve(1);
        });
    }
});

// template engine
app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');

app.prepClient({
    testFn: function () {
        return window.Intl;
    },
    nope: [
        'https://rawgit.com/andyearnshaw/Intl.js/master/Intl.min.js'
    ]
});

app.prepClient({
    testFn: function () {
        return !!window.Promise;
    },
    nope: [
        'https://rawgit.com/yahoo/ypromise/master/promise.js'
    ]
});

app.get('/', function (req, res, next) {
    // patching IntlPolyfill with default `en` locale-data
    res.prepClient({
        testFn: function () {
            return !window.Intl || window.IntlPolyfill;
        },
        yep: 'https://rawgit.com/andyearnshaw/Intl.js/master/locale-data/jsonp/en.js'
    });
    res.expose(['en'], 'app.locales');
    res.render('page');
});

app.get('/french', function (req, res, next) {
    // patching IntlPolyfill with `fr-FR` locale-data
    res.prepClient({
        testFn: function () {
            return !window.Intl || window.IntlPolyfill;
        },
        yep: 'https://rawgit.com/andyearnshaw/Intl.js/master/locale-data/jsonp/fr-FR.js'
    });
    res.expose(['fr-FR'], 'app.locales');
    res.render('page');
});


app.get('/arabic', function (req, res, next) {
    // patching IntlPolyfill with `ar-EG` locale-data
    res.prepClient({
        testFn: function () {
            return !window.Intl || window.IntlPolyfill;
        },
        yep: 'https://rawgit.com/andyearnshaw/Intl.js/master/locale-data/jsonp/ar-EG.js'
    });
    res.expose(['ar-EG'], 'app.locales');
    res.render('page');
});

app.use(express.static(__dirname + '/modules'));

// listening
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
