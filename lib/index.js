/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true */

'use strict';

var expstate = require('express-state');

module.exports = {
    extend: ExpressPrepClient
};

function ExpressPrepClient(app, config) {
    var appPreps = [];

    if (app['@ExpressPrepClient']) { return app; }

    // Brand.
    Object.defineProperty(app, '@ExpressPrepClient', {
        value: ExpressPrepClient
    });

    // extend express with some other requirements.
    expstate.extend(app);
    // exposing bootstraping method
    app.expose(require('./thenable-shim'), 'ExpressPrepClient', { cache: true });
    Object.keys(config || []).forEach(function (ns) {
        if (typeof config[ns] === 'function') {
            app.expose(function namedCallee() {
                return window['ExpressPrepClient'].apply(this, [namedCallee.ready, arguments]);
            }, ns, { cache: true });
            app.expose(config[ns], ns + '.ready', { cache: true });
        }
    });

    // adding prepClient() capabilities to express
    app.prepClient = function (preps) {
        preps = normalizePreps(preps);
        appPreps.push.apply(appPreps, preps);
        this.expose(appPreps, 'ExpressPrepClient' + '.preps', { cache: true });
    };
    app.response.prepClient = function (preps) {
        preps = normalizePreps(preps);
        this._preps = this._preps || [];
        this._preps.push.apply(this._preps, preps);
        this.expose(appPreps.concat(this._preps), 'ExpressPrepClient' + '.preps');
    };
    return app;
}

function normalizePreps(preps) {
    if (typeof preps === 'string') {
        preps = {
            load: preps
        };
    }
    if (!Array.isArray(preps)) {
        preps = [preps];
    }
    return preps;
}
