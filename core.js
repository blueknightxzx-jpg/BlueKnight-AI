/* ============================================
   BlueKnight AI — Core Kernel
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var version = '0.4.0-step4';

    BK.core = {
        version: version,

        init: function() {
            console.log('%cBlueKnight AI v' + version, 'color:#2f81f7; font-size:14px; font-weight:bold;');
            console.log('[BK Core] Starting initialization...');

            var initOrder = ['state', 'project', 'ai', 'ui', 'editor', 'preview'];
            var initialized = 0;

            initOrder.forEach(function(name) {
                var mod = BK.modules[name];
                if (mod && typeof mod.init === 'function') {
                    mod.init();
                    initialized++;
                } else {
                    console.warn('[BK Core] Module "' + name + '" not found or missing init()');
                }
            });

            console.log('[BK Core] Initialization complete. ' + initialized + '/' + initOrder.length + ' modules active.');

            var statusEl = document.getElementById('header-status');
            if (statusEl) statusEl.textContent = 'v' + version;

            var footerEl = document.getElementById('status-message');
            if (footerEl) footerEl.textContent = initialized + ' modules loaded';

            if (BK.events) {
                BK.events.emit('core:ready', { version: version, modules: initialized });
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', BK.core.init);
    } else {
        BK.core.init();
    }
})();
