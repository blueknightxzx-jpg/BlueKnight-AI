/* ============================================
   BlueKnight AI — Code Editor Module (Phase 2)
   Syntax highlighting, search, AI hooks.
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var editor = {
        name: 'editor',
        textarea: null,
        highlightLayer: null,
        contents: {},
        dirtyFiles: {},
        activeFileId: null,
        currentLanguage: null,
        searchOpen: false,
        searchQuery: '',
        searchReplace: '',

        init: function() {
            console.log('[BK Editor] Initializing...');
            this.initDOM();
            this.bindEvents();
            this.applySettings();
            console.log('[BK Editor] Initialized');
        },

        initDOM: function() {
            this.textarea = document.getElementById('code-editor');
            if (!this.textarea) return;

            this.highlightLayer = document.createElement('div');
            this.highlightLayer.id = 'code-highlight';
            this.highlightLayer.className = 'code-highlight';
            this.highlightLayer.setAttribute('aria-hidden', 'true');

            var container = this.textarea.parentElement;
            if (container) {
                container.insertBefore(this.highlightLayer, this.textarea);
            }

            if (BK.highlighter) BK.highlighter.injectStyles();

            this.textarea.style.color = 'transparent';
            this.textarea.style.caretColor = '#c9d1d9';
            this.textarea.style.background = 'transparent';
            this.textarea.style.position = 'relative';
            this.textarea.style.zIndex = '2';
        },

        bindEvents: function() {
            var self = this;
            if (!this.textarea) return;

            this.textarea.addEventListener('input', function() { self.onInput(); });
            this.textarea.addEventListener('keydown', function(e) { self.onKeyDown(e); });
            this.textarea.addEventListener('keyup', function() { self.updateCursorPosition(); });
            this.textarea.addEventListener('click', function() { self.updateCursorPosition(); });
            this.textarea.addEventListener('scroll', function() { self.syncHighlightScroll(); });

            // Ctrl+F / Ctrl+H search
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    self.openSearch(false);
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                    e.preventDefault();
                    self.openSearch(true);
                }
                if (e.key === 'Escape' && self.searchOpen) {
                    self.closeSearch();
                }
            });

            BK.events.on('project:created', function() { self.initProjectContents(); });
            BK.events.on('project:loaded', function() { self.initProjectContents(); });
        },

        onInput: function() {
            var activeId = BK.state.get('editor.activeTabId');
            if (!activeId || activeId === 'welcome') return;
            this.contents[activeId] = this.textarea.value;
            this.dirtyFiles[activeId] = true;
            BK.state.set('editor.fileContents.' + activeId, this.textarea.value);
            BK.state.set('editor.fileModified.' + activeId, true);
            this.updateCursorPosition();
            this.updateHighlight();
            this.updateUnsavedIndicator();
            this.autoSave();
        },

        onKeyDown: function(e) {
            if (!this.textarea) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.textarea.selectionStart;
                var end = this.textarea.selectionEnd;
                var tabSize = BK.state.get('settings.editor.tabSize') || 2;
                var spaces = ' '.repeat(tabSize);
                this.textarea.value = this.textarea.value.substring(0, start) + spaces + this.textarea.value.substring(end);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + spaces.length;
                this.onInput();
                return;
            }

            if (e.key === 'Enter') {
                var tabSize = BK.state.get('settings.editor.tabSize') || 2;
                var start = this.textarea.selectionStart;
                var val = this.textarea.value;
                var before = val.substring(0, start);
                var lineStart = before.lastIndexOf('\n') + 1;
                var currentLine = before.substring(lineStart);
                var indent = currentLine.match(/^[ \t]*/)[0];
                
                // Smart brace indent
                var extraIndent = '';
                var trimmed = currentLine.trim();
                if (/[\{\[\(]\s*$/.test(trimmed)) {
                    extraIndent = ' '.repeat(tabSize);
                }
                
                e.preventDefault();
                var insert = '\n' + indent + extraIndent;
                this.textarea.value = val.substring(0, start) + insert + val.substring(start);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + insert.length;
                this.onInput();
                return;
            }
        },

        loadFile: function(fileId) {
            if (!this.textarea) return;
            if (this.activeFileId === fileId) return;
            this.activeFileId = fileId;
            this.currentLanguage = this.getLanguage(fileId);
            var content = this.contents[fileId] || '';
            this.textarea.value = content;
            this.updateCursorPosition();
            this.applySettings();
            this.updateHighlight();
            this.updateUnsavedIndicator();
        },

        saveFile: function() {
            var activeId = BK.state.get('editor.activeTabId');
            if (!activeId || activeId === 'welcome') return;
            this.contents[activeId] = this.textarea.value;
            this.dirtyFiles[activeId] = false;
            BK.state.set('editor.fileContents.' + activeId, this.textarea.value);
            BK.state.set('editor.fileModified.' + activeId, false);
            BK.state.saveFileContents();
            BK.state.set('status.message', 'Saved');
            setTimeout(function() { BK.state.set('status.message', 'Ready'); }, 1200);
            this.updateUnsavedIndicator();
            this.analyzeForErrors(activeId);
        },

        autoSave: function() {
            var autoSaveEnabled = BK.state.get('settings.editor.autoSave');
            if (!autoSaveEnabled) return;
            var self = this;
            if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
            this._autoSaveTimer = setTimeout(function() { self.saveFile(); }, 2000);
        },

        analyzeForErrors: function(fileId) {
            // Phase 3 placeholder: future BlueKnight AI error detection
            console.log('[BK Editor] analyzeForErrors placeholder for', fileId);
        },

        updateCursorPosition: function() {
            if (!this.textarea) return;
            var text = this.textarea.value.substring(0, this.textarea.selectionStart);
            var lines = text.split('\n');
            var line = lines.length;
            var col = lines[lines.length - 1].length + 1;
            BK.state.set('status.cursor', 'Ln ' + line + ', Col ' + col);
        },

        applySettings: function() {
            if (!this.textarea) return;
            var settings = BK.state.get('settings.editor');
            if (!settings) return;
            var fontSize = settings.fontSize || 14;
            var tabSize = settings.tabSize || 2;
            var wordWrap = settings.wordWrap !== false;

            this.textarea.style.fontSize = fontSize + 'px';
            this.textarea.style.tabSize = tabSize.toString();
            this.textarea.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';

            if (this.highlightLayer) {
                this.highlightLayer.style.fontSize = fontSize + 'px';
                this.highlightLayer.style.tabSize = tabSize.toString();
                this.highlightLayer.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
            }
        },

        getTemplate: function(type, name) {
            if (type === 'html') return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>' + name + '</title>\n</head>\n<body>\n\n</body>\n</html>';
            if (type === 'css') return '/* ' + name + ' */\n\n';
            if (type === 'js') return '// ' + name + '\n\n';
            if (type === 'ts') return '// ' + name + '\n\n';
            if (type === 'json') return '{\n  \n}';
            if (type === 'md') return '# ' + name + '\n\n';
            if (type === 'py') return '# ' + name + '\n\n';
            if (type === 'gd') return 'extends Node\n\n# ' + name + '\n\nfunc _ready():\n    pass\n';
            if (type === 'cs') return '// ' + name + '\n\nusing System;\n\npublic class Program {\n    public static void Main() {\n        \n    }\n}\n';
            if (type === 'cpp') return '// ' + name + '\n\n#include <iostream>\n\nint main() {\n    return 0;\n}\n';
            if (type === 'java') return '// ' + name + '\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n';
            if (type === 'lua') return '-- ' + name + '\n\n';
            if (type === 'glsl') return '// ' + name + '\n\nvoid main() {\n    \n}\n';
            return '';
        },

        getLanguage: function(fileId) {
            var files = BK.state.get('editor.openFiles');
            var file = files.find(function(f) { return f.id === fileId; });
            if (!file) return null;
            if (BK.highlighter) return BK.highlighter.getLanguageFromType(file.type);
            return null;
        },

        updateHighlight: function() {
            if (!this.highlightLayer || !this.textarea) return;
            var lang = this.getLanguage(this.activeFileId);
            this.currentLanguage = lang;
            var raw = this.textarea.value;
            if (lang && BK.highlighter) {
                this.highlightLayer.innerHTML = BK.highlighter.tokenize(raw, lang);
            } else {
                this.highlightLayer.textContent = raw;
            }
        },

        syncHighlightScroll: function() {
            if (!this.highlightLayer || !this.textarea) return;
            this.highlightLayer.scrollTop = this.textarea.scrollTop;
            this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
        },

        updateUnsavedIndicator: function() {
            var activeId = BK.state.get('editor.activeTabId');
            var isDirty = this.dirtyFiles[activeId];
            var indicator = document.getElementById('unsaved-indicator');
            if (indicator) {
                indicator.style.display = (isDirty ? 'inline-block' : 'none');
            }
        },

        /* ---------- Search / Replace ---------- */
        openSearch: function(showReplace) {
            this.searchOpen = true;
            var bar = document.getElementById('search-replace-bar');
            if (bar) {
                bar.classList.remove('hidden');
                var findInput = document.getElementById('search-find-input');
                var replaceInput = document.getElementById('search-replace-input');
                if (findInput) findInput.focus();
                if (replaceInput) replaceInput.style.display = showReplace ? 'block' : 'none';
            }
        },

        closeSearch: function() {
            this.searchOpen = false;
            var bar = document.getElementById('search-replace-bar');
            if (bar) bar.classList.add('hidden');
        },

        performSearch: function() {
            var query = document.getElementById('search-find-input').value;
            if (!query || !this.textarea) return;
            var val = this.textarea.value;
            var idx = val.indexOf(query, this.textarea.selectionEnd);
            if (idx === -1) idx = val.indexOf(query);
            if (idx !== -1) {
                this.textarea.selectionStart = idx;
                this.textarea.selectionEnd = idx + query.length;
                this.textarea.focus();
            }
        },

        performReplace: function() {
            var query = document.getElementById('search-find-input').value;
            var replacement = document.getElementById('search-replace-input').value;
            if (!query || !this.textarea) return;
            var start = this.textarea.selectionStart;
            var end = this.textarea.selectionEnd;
            var val = this.textarea.value;
            if (val.substring(start, end) === query) {
                this.textarea.value = val.substring(0, start) + replacement + val.substring(end);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + replacement.length;
                this.onInput();
            } else {
                this.performSearch();
            }
        },

        performReplaceAll: function() {
            var query = document.getElementById('search-find-input').value;
            var replacement = document.getElementById('search-replace-input').value;
            if (!query || !this.textarea) return;
            var val = this.textarea.value;
            var newVal = val.split(query).join(replacement);
            if (newVal !== val) {
                this.textarea.value = newVal;
                this.onInput();
            }
        },

        /* ---------- Run / Execute Hooks ---------- */
        runCurrentFile: function() {
            var activeId = BK.state.get('editor.activeTabId');
            if (!activeId || activeId === 'welcome') return;
            var content = this.contents[activeId] || '';
            var files = BK.state.get('editor.openFiles');
            var file = files.find(function(f) { return f.id === activeId; });
            if (!file) return;

            console.log('[BK Editor] Run requested for', file.name, 'type:', file.type);
            BK.events.emit('editor:run', { fileId: activeId, content: content, type: file.type, name: file.name });
        },

        /* ---------- AI Preparation Hooks ---------- */
        getCurrentFileContent: function() {
            var activeId = BK.state.get('editor.activeTabId');
            if (!activeId || activeId === 'welcome') return null;
            return { id: activeId, content: this.contents[activeId] || '', language: this.currentLanguage };
        },

        getSelectedText: function() {
            if (!this.textarea) return null;
            var start = this.textarea.selectionStart;
            var end = this.textarea.selectionEnd;
            return this.textarea.value.substring(start, end);
        },

        getCurrentLanguage: function() {
            return this.currentLanguage;
        },

        getProjectStructure: function() {
            var proj = BK.project ? BK.project.getCurrentProject() : null;
            return proj;
        },

        initProjectContents: function() {
            var proj = BK.project.getCurrentProject();
            if (!proj || !proj.files) return;
            var self = this;
            proj.files.forEach(function(file) {
                if (!self.contents[file.id]) {
                    self.contents[file.id] = self.getTemplate(file.type, file.name);
                }
            });
        }
    };

    BK.editor = editor;
    BK.registerModule('editor', editor);
})();
