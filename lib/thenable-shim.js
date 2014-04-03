/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint eqeqeq: false*/

module.exports = function ns(ready, args) {
    var d = document,
        global = window,
        head = d.getElementsByTagName('head')[0],
        // Some basic browser sniffing...
        ie = /MSIE/.test(navigator.userAgent),
        forEach = Array.prototype.forEach ? function (array, fn, thisObj) {
            array.forEach.apply(array, [fn, thisObj]);
        } : function (array, fn, thisObj) {
            for (var i = 0, len = array.length || 0; i < len; ++i) {
                if (i in array) {
                    fn.call(thisObj, array[i], i, array);
                }
            }
        },
        nodeQueue = [],
        mock;

    function createScriptNode(src, callback) {
        var node = d.createElement('script');
        // use async=false for ordered async?
        // parallel-load-serial-execute http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
        if (node.async) {
            node.async = false;
        }
        if (ie) {
            node.onreadystatechange = function () {
                if (/loaded|complete/.test(this.readyState)) {
                    this.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            node.onload = node.onerror = callback;
        }
        node.setAttribute('src', src);
        return node;
    }

    function load(url, callback) {
        var node = createScriptNode(url, function () {
            callback();
            setTimeout(function () {
                if (nodeQueue.length) {
                    head.appendChild(nodeQueue.shift());
                } else if (ns._pending <= 0) {
                    done();
                }
            }, 0);
        });
        // TODO: if original node.async is undefined, it means the order has
        // to be preserved manually, in which case we should insert
        // them one by one to guarantee serial execute
        if (node.async !== false) {
            return nodeQueue.push(node);
        }
        // inserting node into the header
        head.appendChild(node);
    }

    function setup() {
        ns._pending = 0;
        forEach(ns.preps || [], function (p) {
            var result = p.testFn ? p.testFn() : p.test,
                list = [].concat((result ? p.yep : p.nope) || [], p.load || p.both || []),
                counter = list.length;

            forEach(list, function (url, index) {
                ns._pending++;
                load(url, function () {
                    if (p.callback) {
                        p.callback(url, result);
                    }
                    counter--;
                    if (counter <= 0 && p.complete) {
                        p.complete();
                    }
                    ns._pending--;
                });
            });
        });
    }

    function flushPromiseQueue(p, queue) {
        var t, r;
        while ((t = queue.shift())) {
            r = p[t.method].apply(p, t.args);
            if (t.queue.length) {
                flushPromiseQueue(r, t.queue);
            }
        }
    }

    function done() {
        // releasing the queue by executing `ready` on every promises
        forEach(ns._promisesQueue, function (m) {
            flushPromiseQueue(m.ready.apply(m.context, m.args), m.queue);
        });
        // memory cleanup
        ns._promisesQueue = [];
        ns.preps = [];
    }

    function thenable(queue) {
        return {
            then: function () {
                var q = [];
                queue.push({
                    method: 'then',
                    args: arguments,
                    queue: q
                });
                return thenable(q);
            },
            catch: function () {
                var q = [];
                queue.push({
                    method: 'catch',
                    args: arguments,
                    queue: q
                });
                return thenable(q);
            }
        };
    }

    if (!ns.hasOwnProperty('_pending')) {
        setup();
    }

    mock = {
        ready: ready,
        context: this,
        args: args,
        queue: []
    };
    ns._promisesQueue = ns._promisesQueue || [];
    ns._promisesQueue.push(mock);
    return thenable(mock.queue);
};
