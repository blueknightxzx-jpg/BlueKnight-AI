/* ============================================
   BlueKnight AI — Event Bus
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var listeners = {};

    BK.events = {
        on: function(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },

        off: function(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(function(fn) { return fn !== callback; });
        },

        emit: function(event, data) {
            if (!listeners[event]) return;
            listeners[event].forEach(function(fn) {
                try {
                    fn(data);
                } catch (err) {
                    console.error('[BK Events] Error in listener for "' + event + '":', err);
                }
            });
        }
    };

    console.log('[BK Events] Event bus initialized');
})();
