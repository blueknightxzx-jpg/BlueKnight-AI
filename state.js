/* ============================================
   BlueKnight AI — Central State Module
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var defaults = {
        view: 'workspace',
        project: {
            name: 'My Website',
            type: 'website',
            fileCount: 0
        },
        editor: {
            activeFile: null,
            openFiles: [
                { id: 'welcome', name: 'Welcome', type: 'welcome', icon: '&#128196;', closable: false }
            ],
            activeTabId: 'welcome'
        },
        panels: {
            left: { collapsed: false, width: 260 },
            right: { collapsed: false, width: 340 }
        },
        status: {
            branch: 'main',
            file: 'No file selected',
            message: 'Ready',
            cursor: 'Ln 1, Col 1',
            encoding: 'UTF-8',
            lang: 'Plain Text'
        }
    };

    var data = JSON.parse(JSON.stringify(defaults));

    function getPath(obj, path) {
        var keys = path.split('.');
        var target = obj;
        for (var i = 0; i < keys.length; i++) {
            if (target === null || target === undefined) return undefined;
            target = target[keys[i]];
        }
        return target;
    }

    function setPath(obj, path, value) {
        var keys = path.split('.');
        var target = obj;
        for (var i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        var last = keys[keys.length - 1];
        var oldValue = target[last];
        target[last] = value;
        return oldValue;
    }

    var state = {
        name: 'state',

        init: function() {
            console.log('[BK State] Initialized');
            if (BK.events) {
                BK.events.emit('state:ready', { data: this.get() });
            }
        },

        get: function(path) {
            if (!path) return JSON.parse(JSON.stringify(data));
            return getPath(data, path);
        },

        set: function(path, value) {
            var oldValue = setPath(data, path, value);
            if (BK.events) {
                BK.events.emit('state:changed', { path: path, value: value, oldValue: oldValue });
                BK.events.emit('state:changed:' + path, { value: value, oldValue: oldValue });
            }
        },

        subscribe: function(path, callback) {
            var event = 'state:changed:' + path;
            BK.events.on(event, callback);
            return function() {
                BK.events.off(event, callback);
            };
        }
    };

    BK.state = state;
})();
