/* global describe, it */
'use strict';

jest.dontMock('../lib/index.js');

var prep   = require('../lib/index.js');

describe('exports', function () {
    describe('.extend', function () {

        it('should have a .extend property', function () {
            expect(prep.extend).toBeDefined();
        });

        it('should always return the Express app being extended', function () {
            var app = {response: {}, expose: jest.genMockFunction()};

            // Extended twice to make sure an already extended app is still
            // returned.
            expect(prep.extend(app)).toBe(app);
            expect(prep.extend(app)).toBe(app);
        });

        it('should extend app and app.response with prepClient() method', function () {
            var app = prep.extend({response: {}, expose: jest.genMockFunction()});

            expect(app.prepClient).toBeDefined();
            expect(app.response.prepClient).toBeDefined();
        });
    });
});
