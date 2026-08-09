/* ============================================
   BlueKnight AI — Module Registry
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    BK.modules = {};

    BK.registerModule = function(name, module) {
        if (BK.modules[name]) {
            console.warn('[BK Modules] Module "' + name + '" already registered. Overwriting.');
        }
        BK.modules[name] = module;
        console.log('[BK Modules] Registered: ' + name);
    };

    // Placeholder module — real module loads from its own file
    BK.registerModule('preview', {
        name: 'preview',
        init: function() {
            console.log('[BK Preview] Initialized');
        }
    });

    console.log('[BK Modules] All stubs registered');
})();
