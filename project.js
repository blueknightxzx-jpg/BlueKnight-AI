/* ============================================
   BlueKnight AI — Project Manager Module
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    function generateId() {
        return 'bk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    function now() {
        return new Date().toISOString();
    }

    var engineStructures = {
        godot: {
            files: [
                { id: 'project-godot', name: 'project.godot', type: 'godot', path: '/' },
                { id: 'icon-svg', name: 'icon.svg', type: 'svg', path: '/' },
                { id: 'main-tscn', name: 'Main.tscn', type: 'tscn', path: '/scenes' },
                { id: 'player-gd', name: 'Player.gd', type: 'gd', path: '/scripts' }
            ],
            folders: ['scenes', 'scripts', 'assets', 'audio']
        },
        unity: {
            files: [
                { id: 'manifest-json', name: 'manifest.json', type: 'json', path: '/Packages' },
                { id: 'main-cs', name: 'Main.cs', type: 'cs', path: '/Assets/Scripts' }
            ],
            folders: ['Assets', 'Assets/Scripts', 'Assets/Scenes', 'Assets/Prefabs', 'ProjectSettings', 'Packages']
        },
        unreal: {
            files: [
                { id: 'project-u', name: 'MyProject.uproject', type: 'uproject', path: '/' },
                { id: 'main-cpp', name: 'Main.cpp', type: 'cpp', path: '/Source/MyProject' }
            ],
            folders: ['Content', 'Source', 'Source/MyProject', 'Config', 'Plugins']
        }
    };

    var defaultWebFiles = [
        { id: 'index-html', name: 'index.html', type: 'html', path: '/' },
        { id: 'style-css', name: 'style.css', type: 'css', path: '/' },
        { id: 'script-js', name: 'script.js', type: 'js', path: '/' }
    ];

    var defaultGameFiles = [
        { id: 'index-html', name: 'index.html', type: 'html', path: '/' },
        { id: 'game-js', name: 'game.js', type: 'js', path: '/' },
        { id: 'style-css', name: 'style.css', type: 'css', path: '/' }
    ];

    var project = {
        name: 'project',
        current: null,

        init: function() {
            console.log('[BK Project] Initialized');
        },

        createWebsite: function(config) {
            var safeName = (config.name || 'Untitled Website').trim();
            var safePurpose = (config.purpose || 'general').trim();
            var safeDesc = (config.description || '').trim();
            var safeStyle = config.stylePreferences || [];

            var newProject = {
                id: generateId(),
                name: safeName,
                type: 'website',
                purpose: safePurpose,
                description: safeDesc,
                stylePreferences: safeStyle,
                createdAt: now(),
                updatedAt: now(),
                files: JSON.parse(JSON.stringify(defaultWebFiles)),
                folders: [],
                settings: {},
                metadata: {
                    purpose: safePurpose,
                    stylePreferences: safeStyle
                }
            };

            this.current = newProject;
            this.syncToState();
            BK.events.emit('project:created', { project: this.getCurrentProject() });
            if (BK.editor) BK.editor.initProjectContents();
            return newProject;
        },

        createGame: function(config) {
            var safeName = (config.name || 'Untitled Game').trim();
            var safeDimension = (config.dimension || '2d').trim();
            var safeGenre = (config.genre || 'other').trim();
            var safeDesc = (config.description || '').trim();
            var safeEngine = (config.engine || '').trim();
            var safeEngineFolder = (config.engineFolder || '').trim();

            var files = JSON.parse(JSON.stringify(defaultGameFiles));
            var folders = [];

            if (safeEngine && engineStructures[safeEngine]) {
                var structure = engineStructures[safeEngine];
                files = JSON.parse(JSON.stringify(structure.files));
                folders = structure.folders.slice();
            }

            var newProject = {
                id: generateId(),
                name: safeName,
                type: 'game',
                dimension: safeDimension,
                genre: safeGenre,
                description: safeDesc,
                engine: safeEngine,
                engineFolder: safeEngineFolder,
                createdAt: now(),
                updatedAt: now(),
                files: files,
                folders: folders,
                settings: {},
                metadata: {
                    dimension: safeDimension,
                    genre: safeGenre,
                    engine: safeEngine,
                    engineFolder: safeEngineFolder
                }
            };

            this.current = newProject;
            this.syncToState();
            BK.events.emit('project:created', { project: this.getCurrentProject() });
            if (BK.editor) BK.editor.initProjectContents();
            return newProject;
        },

        loadProject: function(projectData) {
            if (!projectData || typeof projectData !== 'object') {
                console.error('[BK Project] Invalid project data');
                return null;
            }
            this.current = projectData;
            this.syncToState();
            BK.events.emit('project:loaded', { project: this.getCurrentProject() });
            return this.current;
        },

        getCurrentProject: function() {
            return this.current ? JSON.parse(JSON.stringify(this.current)) : null;
        },

        updateProject: function(updates) {
            if (!this.current) return null;
            var self = this;
            Object.keys(updates).forEach(function(key) {
                if (key !== 'id' && key !== 'createdAt') {
                    self.current[key] = updates[key];
                }
            });
            this.current.updatedAt = now();
            this.syncToState();
            BK.events.emit('project:updated', { project: this.getCurrentProject() });
            return this.getCurrentProject();
        },

        addFile: function(file) {
            if (!this.current) return null;
            if (!file.id) file.id = generateId();
            this.current.files.push(file);
            this.current.updatedAt = now();
            this.syncToState();
            BK.events.emit('project:fileAdded', { file: file, project: this.getCurrentProject() });
            return file;
        },

        addFolder: function(folderName) {
            if (!this.current) return null;
            var cleanName = folderName.trim().replace(/^\/+|\/+$/g, '');
            if (!cleanName) return null;
            if (!this.current.folders) this.current.folders = [];
            if (this.current.folders.indexOf(cleanName) === -1) {
                this.current.folders.push(cleanName);
                this.current.updatedAt = now();
                this.syncToState();
                BK.events.emit('project:folderAdded', { folder: cleanName, project: this.getCurrentProject() });
            }
            return cleanName;
        },

        removeFile: function(fileId) {
            if (!this.current) return null;
            var idx = this.current.files.findIndex(function(f) { return f.id === fileId; });
            if (idx === -1) return null;
            var removed = this.current.files.splice(idx, 1)[0];
            this.current.updatedAt = now();
            this.syncToState();
            BK.events.emit('project:fileRemoved', { file: removed, project: this.getCurrentProject() });
            return removed;
        },

        getFileCount: function() {
            return this.current ? this.current.files.length : 0;
        },

        syncToState: function() {
            if (!BK.state || !this.current) return;
            BK.state.set('project', {
                name: this.current.name,
                type: this.current.type,
                fileCount: this.current.files.length
            });
        }
    };

    BK.project = project;
    BK.registerModule('project', project);
})();
