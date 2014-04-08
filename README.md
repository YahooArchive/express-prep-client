Express Prep Client
===================

[Express][] extension to patch the client runtime based on feature detection.

[![Build Status](https://travis-ci.org/yahoo/express-prep-client.png?branch=master)][Build Status]

__TL;DR:__ With the traction behind evergreen browsers, and the new process behind ECMA TC39 committee to update the language more frecuently, you should have a reliable way to patch the client runtime before executing any application code.

[Express]: https://github.com/visionmedia/express
[express-state]: https://github.com/yahoo/express-state
[yepnope]: http://yepnopejs.com
[Build Status]: https://travis-ci.org/yahoo/express-prep-client


Goals & Design
--------------

This compontent is a conventional `express` extension, which means it will extend the functionalities provided on `express` by augmenting the express app with new features. `express-prep-client` augments the express app instance with two new method: `app.prepClient()` and `res.prepClient()`.

These two methods help you to set up a set of rules at the app level, and at the request level that should be applied to the client runtime before any code gets executed in the browser. In fact, it acts like a shim for a promise based API to guarantee that the runtime is ready before releasing the control to the real promise.

How does this work
------------------

This package relies on [express-state][] package to serialize configuration and bootstrap methods to the client side. It provides a simple API to define async methods (that might or might not be promise based), and these methods (one or more) can be global methods or under a particular namespace. This package will shim those methods to provide a reliable way to call them from the browser but holding the actual execution of those methods until all the neccessary patches to be applied to the runtime to execute the real methods under the hood.

Why doing all this on the server side? The reality is that you could do all this manually on your templates directly, but when you have multiple pages, multiple variations of the things you want to patch, things become a little bit more complex. While using the server and monadic methods that can be serialized and executed on the client side can provide you the right level of abstraction.

Installation
------------

Install using npm:

```shell
$ npm install express-prep-client
```


Usage
-----

### Extending express functionalities

Here is an example of how to extend an `express` app with `express-prep-client`:

```js
var express = require('express'),
    app = express();

// extending the `express` app instance using extension pattern decribed here:
// https://gist.github.com/ericf/6133744
require('express-prep-client').extend(app);

// using the new `prepClient` method off the app instance
app.prepClient({
    testFn: function () {
        return !!window.Loader;
    },
    nope: 'https://rawgithub.com/ModuleLoader/es6-module-loader/master/dist/es6-module-loader.js'
});
```

Keep in mind that you can add as many `prepClient()` conditions as you want.

_note #1: we don't use [yepnope][] component explicitely because it is too big to be embeded in every page, instead we implement a narrow version of its API._

_note #2: we expanded the [yepnope][] API to support `testFn` as a method that can be serialized and execute on the client side, the result of this method will have precedence over the `test` value if specified._


### Setting up the page

Any patch applied thru `app.prepClient()` and/or `req.prepClient()` will automatically be exposed into the `state` variable in your template engine (see more details on [express-state][] documentation). If you use `handlebars` you will do this:

```html
<script>{{{state}}}</script>
<script>
app.init();
</script>
```

And this is really the only thing you need to do in your templates. In the example above, we are reling on the default trigger (`app.init()`, which returns a promise) to initialize the application in the client side, but you can customize that as well.

### Custom initialization

As you saw in the previous example, by default, this package will bootstrap the initialization thru a `app.init()` method. But it doesn't have to be that way. You have full control on how your application code will try to initialize the application itself. Here is an example of how to define custom shims when extending the express application:

```js
require('express-prep-client').extend(app, {

    "Foo.Bar.init": function (config) {
        // this method will be called once all the patches are executed
        // it will receive the same arguments
        // you can do whatever you want to initialize the app here.
    },

    "System.import": function (name) {
        // this method will be called once all the patches are executed
        // and at this point you can execute the right method and
        // return the real promise.
        return System.import(name);
    },

    "MyApp.ready": function (callback) {
        // this method will be called once all the patches are executed
        // at this point callback can be called
        callback();
    }

});
```

Then, in your template, you will have to use the new namespace:

```html
<script>{{{state}}}</script>
<script>
// calling the first shim
Foo.Bar.init({something: 1});
// or calling the promise base shim
System.import('foo');
// or calling the callback based shim
MyApp.ready(function () { /* do something */ });
// or simply do all of them at the same time
</script>
```

This means that `express-prep-client` will shim the call to `Foo.Bar.init()`, `System.import()` and `MyApp.ready()` methods until all the async patches are applied, then it will release the control, calling them in the same order they were called the first time, with the exact same arguments.


### app.prepClient() vs res.prepClient()

This is an example of polyfilling the `global.Intl` when missing:

```js
app.prepClient({
    testFn: function () {
        return !!window.Intl;
    },
    nope: [
        'https://rawgithub.com/andyearnshaw/Intl.js/master/Intl.min.js'
    ]
});
```

Since the polyfill requires additional `locale-data` to function for a specific locale, applying the `fr-FR` locale data to support number and date formats can be done conditionally at the request level:

```
app.get('/french-page', function (req, res, next) {
    // patching IntlPolyfill with `fr-FR` locale-data for a specific req
    res.prepClient({
        testFn: function () {
            return !!window.Intl;
        },
        yep: 'https://rawgithub.com/andyearnshaw/Intl.js/master/locale-data/jsonp/fr-FR.js'
    });
    res.render('page');
});
```

In the example above, there are two small details that should be taken in consideration:

 * `locale-data` is conditionally loaded based on whether or not the `window.Intl` is available, that means the polyfill itself and the corresponding locale date will be based off the same condition.
 * All patches are loaded in parallel, at least for all moderm browsers, while the execution of the code is preserved based on the other of patches definition. This means that `locale-data` will be set thru `window.IntlPolyfill.__addLocaleData()` API without triggering a race condition.


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-prep-client/blob/master/LICENSE.md
