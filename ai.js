/* ============================================
   BlueKnight AI — AI Context Module
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var ai = {
        name: 'ai',
        context: null,
        messages: [],

        init: function() {
            console.log('[BK AI] Initializing...');
            this.loadContextFromProject();
            this.bindEvents();
            console.log('[BK AI] Initialized');
        },

        bindEvents: function() {
            var self = this;
            BK.events.on('project:created', function(e) {
                self.loadContextFromProject();
                self.addSystemMessage('Project created: ' + e.project.name);
            });

            BK.events.on('project:loaded', function(e) {
                self.loadContextFromProject();
            });
        },

        loadContextFromProject: function() {
            var proj = BK.project ? BK.project.getCurrentProject() : null;
            if (!proj) {
                this.context = null;
                return;
            }

            this.context = {
                type: proj.type,
                name: proj.name,
                description: proj.description || '',
                metadata: proj.metadata || {}
            };

            if (proj.type === 'website') {
                this.context.purpose = proj.purpose || '';
                this.context.stylePreferences = proj.stylePreferences || [];
            } else if (proj.type === 'game') {
                this.context.dimension = proj.dimension || '';
                this.context.genre = proj.genre || '';
                this.context.engine = proj.engine || '';
                this.context.engineFolder = proj.engineFolder || '';
            }

            console.log('[BK AI] Context updated:', this.context);
        },

        getContext: function() {
            return this.context ? JSON.parse(JSON.stringify(this.context)) : null;
        },

        getContextString: function() {
            if (!this.context) return 'No project context available.';
            var ctx = this.context;
            var parts = ['Project: ' + ctx.name + ' (' + ctx.type + ')'];

            if (ctx.description) parts.push('Description: ' + ctx.description);

            if (ctx.type === 'website') {
                if (ctx.purpose) parts.push('Purpose: ' + ctx.purpose);
                if (ctx.stylePreferences && ctx.stylePreferences.length) {
                    parts.push('Style: ' + ctx.stylePreferences.join(', '));
                }
            } else if (ctx.type === 'game') {
                if (ctx.dimension) parts.push('Dimension: ' + ctx.dimension);
                if (ctx.genre) parts.push('Genre: ' + ctx.genre);
                if (ctx.engine) parts.push('Engine: ' + ctx.engine);
            }

            return parts.join('\n');
        },

        addSystemMessage: function(text) {
            this.messages.push({ role: 'system', text: text, time: new Date().toISOString() });
        },

        addUserMessage: function(text) {
            this.messages.push({ role: 'user', text: text, time: new Date().toISOString() });
        },

        addAssistantMessage: function(text) {
            this.messages.push({ role: 'assistant', text: text, time: new Date().toISOString() });
        },

        getMessages: function() {
            return this.messages.slice();
        },

        clearMessages: function() {
            this.messages = [];
        }
    };

    BK.ai = ai;
    BK.registerModule('ai', ai);
})();
