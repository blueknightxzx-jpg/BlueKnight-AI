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
        },
        settings: {
            appearance: {
                theme: 'dark',
                uiScale: '100%',
                animations: true
            },
            editor: {
                fontSize: 14,
                tabSize: 2,
                wordWrap: true,
                autoSave: false
            },
            workspace: {
                restoreWorkspace: true,
                confirmCloseTab: true
            }
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
            var saved = null;
            try { saved = localStorage.getItem('bk_settings'); } catch (e) {}
            if (saved) {
                try {
                    var parsed = JSON.parse(saved);
                    if (parsed) data.settings = parsed;
                } catch (e) {}
            }
            console.log('[BK State] Initialized');
            if (BK.events) {
                BK.events.emit('state:ready', { data: this.get() });
            }
        },

        saveSettings: function() {
            try {
                localStorage.setItem('bk_settings', JSON.stringify(data.settings));
            } catch (e) {
                console.warn('[BK State] Could not save settings:', e);
            }
        },

        saveFileContents: function() {
            try {
                localStorage.setItem('bk_file_contents', JSON.stringify(data.editor.fileContents || {}));
            } catch (e) {
                console.warn('[BK State] Could not save file contents:', e);
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
