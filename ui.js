/* ============================================
   BlueKnight AI — UI Module (Step 4 Complete)
   Onboarding, launcher, wizards, dock, tabs,
   panels, chat, navigation, file tree.
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var ui = {
        name: 'ui',
        isResizing: false,
        activeResizer: null,
        onboardingSlide: 0,
        onboardingTotal: 6,
        inLauncherMode: false,
        websiteWizardStep: 0,
        gameWizardStep: 0,
        closedTabs: [],
        hasProject: false,

        init: function() {
            console.log('[BK UI] Initializing...');
            this.initOnboarding();
            this.initResizers();
            this.initPanelControls();
            this.initChatInput();
            this.initNavigation();
            this.initProjectUI();
            this.initDock();
            this.initWizards();
            this.initSettings();
            this.initEditor();
            this.syncFromState();
            this.bindStateListeners();

            var completed = localStorage.getItem('bk_onboarding_complete');
            if (completed) {
                this.inLauncherMode = true;
                this.renderLauncherMode();
            }

            console.log('[BK UI] Initialized');
        },

        /* ----------------------------------------
           Onboarding
           ---------------------------------------- */
        initOnboarding: function() {
            var self = this;
            var completed = localStorage.getItem('bk_onboarding_complete');

            if (!completed) {
                this.showOnboarding();
            }

            var btnNext = document.getElementById('btn-next-onboarding');
            var btnSkip = document.getElementById('btn-skip-onboarding');

            if (btnNext) {
                btnNext.addEventListener('click', function() {
                    self.nextOnboardingSlide();
                });
            }

            if (btnSkip) {
                btnSkip.addEventListener('click', function() {
                    self.completeOnboarding();
                });
            }

            var dots = document.querySelectorAll('.onboarding-dots .dot');
            dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                    var slide = parseInt(dot.dataset.slide, 10);
                    self.goToOnboardingSlide(slide);
                });
            });
        },

        showOnboarding: function() {
            var overlay = document.getElementById('onboarding-overlay');
            if (overlay) overlay.classList.remove('hidden');
            this.onboardingSlide = 0;
            this.renderOnboarding();
        },

        completeOnboarding: function() {
            var overlay = document.getElementById('onboarding-overlay');
            if (overlay) overlay.classList.add('hidden');
            localStorage.setItem('bk_onboarding_complete', 'true');
            this.inLauncherMode = true;
            this.renderLauncherMode();
        },

        nextOnboardingSlide: function() {
            if (this.onboardingSlide < this.onboardingTotal - 1) {
                this.onboardingSlide++;
                this.renderOnboarding();
            } else {
                this.completeOnboarding();
            }
        },

        goToOnboardingSlide: function(index) {
            this.onboardingSlide = index;
            this.renderOnboarding();
        },

        renderOnboarding: function() {
            var slides = document.querySelectorAll('.onboarding-slide');
            var dots = document.querySelectorAll('.onboarding-dots .dot');
            var btnNext = document.getElementById('btn-next-onboarding');

            slides.forEach(function(slide) {
                slide.classList.remove('active');
            });
            dots.forEach(function(dot) {
                dot.classList.remove('active');
            });

            var currentSlide = document.querySelector('.onboarding-slide[data-slide="' + this.onboardingSlide + '"]');
            var currentDot = document.querySelector('.onboarding-dots .dot[data-slide="' + this.onboardingSlide + '"]');

            if (currentSlide) currentSlide.classList.add('active');
            if (currentDot) currentDot.classList.add('active');

            if (btnNext) {
                btnNext.textContent = (this.onboardingSlide === this.onboardingTotal - 1) ? 'Get Started' : 'Next';
            }
        },

        /* ----------------------------------------
           State Sync & Subscriptions
           ---------------------------------------- */
        syncFromState: function() {
            this.renderNav();
            this.renderView();
            this.renderTabs();
            this.renderPanels();
            this.renderStatus();
            this.renderProjectCard();
            this.renderLauncher();
            this.renderSettingsValues();
            this.renderFileTree();
        },

        bindStateListeners: function() {
            var self = this;

            BK.state.subscribe('view', function() {
                self.renderNav();
                self.renderView();
            });

            BK.state.subscribe('editor.openFiles', function() {
                self.renderTabs();
            });

            BK.state.subscribe('editor.activeTabId', function() {
                self.renderTabs();
            });

            BK.state.subscribe('panels.left.collapsed', function() {
                self.renderPanels();
            });

            BK.state.subscribe('panels.right.collapsed', function() {
                self.renderPanels();
            });

            BK.state.subscribe('status.branch', function(e) {
                self.updateStatusItem('status-branch', e.value);
            });

            BK.state.subscribe('status.file', function(e) {
                self.updateStatusItem('status-file', e.value);
            });

            BK.state.subscribe('status.message', function(e) {
                self.updateStatusItem('status-message', e.value);
            });

            BK.state.subscribe('status.cursor', function(e) {
                self.updateStatusItem('status-cursor', e.value);
            });

            BK.state.subscribe('status.encoding', function(e) {
                self.updateStatusItem('status-encoding', e.value);
            });

            BK.state.subscribe('status.lang', function(e) {
                self.updateStatusItem('status-lang', e.value);
            });

            BK.state.subscribe('project', function() {
                self.renderProjectCard();
                self.renderFileTree();
            });
        },

        /* ----------------------------------------
           Launcher
           ---------------------------------------- */
        renderLauncher: function() {
            var launcher = document.getElementById('view-launcher');
            var workspace = document.getElementById('view-workspace');

            if (!launcher || !workspace) return;

            if (!this.hasProject) {
                launcher.classList.remove('hidden');
                workspace.classList.add('hidden');
            } else {
                launcher.classList.add('hidden');
                workspace.classList.remove('hidden');
            }
        },

        enterWorkspace: function() {
            this.inLauncherMode = false;
            this.hasProject = true;
            this.renderLauncherMode();
            this.renderLauncher();
            this.renderPanels();
            this.renderTabs();
            BK.state.set('view', 'workspace');
        },

        renderLauncherMode: function() {
            var leftPanel = document.getElementById('panel-left');
            var rightPanel = document.getElementById('panel-right');
            var leftResizer = document.getElementById('resizer-left');
            var rightResizer = document.getElementById('resizer-right');
            var tabBar = document.getElementById('tab-bar-container');
            var footer = document.querySelector('.app-footer');
            var dockBar = document.getElementById('dock-bar');

            if (this.inLauncherMode) {
                if (leftPanel) leftPanel.classList.add('hidden');
                if (rightPanel) rightPanel.classList.add('hidden');
                if (leftResizer) leftResizer.classList.add('hidden');
                if (rightResizer) rightResizer.classList.add('hidden');
                if (tabBar) tabBar.classList.add('hidden');
                if (footer) footer.classList.add('hidden');
                if (dockBar) dockBar.classList.add('hidden');
            } else {
                if (leftPanel) leftPanel.classList.remove('hidden');
                if (rightPanel) rightPanel.classList.remove('hidden');
                if (leftResizer) leftResizer.classList.remove('hidden');
                if (rightResizer) rightResizer.classList.remove('hidden');
                if (tabBar) tabBar.classList.remove('hidden');
                if (footer) footer.classList.remove('hidden');
                this.updateDock();
            }
        },

        /* ----------------------------------------
           Project UI (Action Cards)
           ---------------------------------------- */
        initProjectUI: function() {
            var self = this;

            // Launcher cards
            var launcherCards = document.querySelectorAll('.launcher-card[data-action]');
            launcherCards.forEach(function(card) {
                card.addEventListener('click', function() {
                    var action = card.dataset.action;
                    if (action === 'new-website') {
                        self.openWebsiteWizard();
                    } else if (action === 'new-game') {
                        self.openGameWizard();
                    } else if (action === 'open-project') {
                        BK.state.set('status.message', 'Open Project: coming soon');
                        setTimeout(function() {
                            BK.state.set('status.message', 'Ready');
                        }, 2000);
                    }
                });
            });

            // Workspace action cards (legacy welcome screen)
            var actionCards = document.querySelectorAll('.action-card[data-action]');
            actionCards.forEach(function(card) {
                card.addEventListener('click', function() {
                    var action = card.dataset.action;
                    if (action === 'new-website') {
                        self.openWebsiteWizard();
                    } else if (action === 'new-game') {
                        self.openGameWizard();
                    } else if (action === 'open-project') {
                        BK.state.set('status.message', 'Open Project: coming soon');
                        setTimeout(function() {
                            BK.state.set('status.message', 'Ready');
                        }, 2000);
                    }
                });
            });

            // Legacy modal (kept for compatibility)
            var modalClose = document.getElementById('modal-close');
            var btnCancel = document.getElementById('btn-cancel-project');
            var btnCreate = document.getElementById('btn-create-project');

            if (modalClose) modalClose.addEventListener('click', function() { self.closeNewProjectModal(); });
            if (btnCancel) btnCancel.addEventListener('click', function() { self.closeNewProjectModal(); });
            if (btnCreate) btnCreate.addEventListener('click', function() { self.onCreateProjectLegacy(); });

            var modalOverlay = document.getElementById('modal-new-project');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', function(e) {
                    if (e.target.id === 'modal-new-project') self.closeNewProjectModal();
                });
            }

            var nameInput = document.getElementById('project-name-input');
            if (nameInput) {
                nameInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') self.onCreateProjectLegacy();
                });
            }

            // Project card click
            var projectCard = document.getElementById('project-card');
            if (projectCard) {
                projectCard.addEventListener('click', function() {
                    var proj = BK.project.getCurrentProject();
                    if (proj) {
                        console.log('[BK UI] Project info:', proj);
                        BK.state.set('status.message', 'Project: ' + proj.name);
                        setTimeout(function() {
                            BK.state.set('status.message', 'Ready');
                        }, 2000);
                    }
                });
            }

            // New file button
            var btnNewFile = document.getElementById('btn-new-file');
            if (btnNewFile) {
                btnNewFile.addEventListener('click', function() {
                    self.onNewFile();
                });
            }

            // Clear chat button
            var btnClearChat = document.getElementById('btn-clear-chat');
            if (btnClearChat) {
                btnClearChat.addEventListener('click', function() {
                    var container = document.getElementById('chat-messages');
                    if (container) {
                        container.innerHTML = '';
                        var welcome = document.createElement('div');
                        welcome.className = 'chat-message ai-message';
                        welcome.innerHTML =
                            '<div class="message-avatar">AI</div>' +
                            '<div class="message-bubble">' +
                                '<div class="message-text">Chat cleared. How can I help you?</div>' +
                                '<div class="message-time">Now</div>' +
                            '</div>';
                        container.appendChild(welcome);
                    }
                    if (BK.ai) BK.ai.clearMessages();
                });
            }
        },

        openNewProjectModal: function(preselectedType) {
            var modal = document.getElementById('modal-new-project');
            var nameInput = document.getElementById('project-name-input');
            var typeInputs = document.querySelectorAll('input[name="project-type"]');
            var descInput = document.getElementById('project-desc-input');

            if (!modal) return;

            nameInput.value = '';
            descInput.value = '';

            typeInputs.forEach(function(input) {
                input.checked = (input.value === preselectedType);
            });

            modal.classList.remove('hidden');
            nameInput.focus();
        },

        closeNewProjectModal: function() {
            var modal = document.getElementById('modal-new-project');
            if (modal) modal.classList.add('hidden');
        },

        onCreateProjectLegacy: function() {
            var nameInput = document.getElementById('project-name-input');
            var typeInput = document.querySelector('input[name="project-type"]:checked');
            var descInput = document.getElementById('project-desc-input');

            var name = nameInput.value.trim();
            var type = typeInput ? typeInput.value : 'website';
            var desc = descInput.value.trim();

            if (!name) {
                nameInput.style.borderColor = '#ef4444';
                setTimeout(function() {
                    nameInput.style.borderColor = '';
                }, 1500);
                return;
            }

            if (type === 'website') {
                BK.project.createWebsite({ name: name, purpose: 'general', description: desc });
            } else {
                BK.project.createGame({ name: name, dimension: '2d', genre: 'other', description: desc });
            }

            this.closeNewProjectModal();
            this.enterWorkspace();
            BK.state.set('status.message', 'Created project: ' + name);
            setTimeout(function() {
                BK.state.set('status.message', 'Ready');
            }, 2500);
        },

        renderProjectCard: function() {
            var proj = BK.state.get('project');
            if (!proj) return;

            var nameEl = document.getElementById('project-name');
            var metaEl = document.getElementById('project-meta');
            var locEl = document.getElementById('loc-project');

            if (nameEl) nameEl.textContent = proj.name;
            if (metaEl) metaEl.textContent = proj.type + ' \u00b7 ' + proj.fileCount + ' files';
            if (locEl) locEl.textContent = proj.name;
        },

        onNewFile: function() {
            var name = prompt('Enter file name (with extension):');
            if (!name || !name.trim()) return;
            name = name.trim();

            var ext = name.split('.').pop().toLowerCase();
            var typeMap = {
                html: 'html', htm: 'html', css: 'css', js: 'js', ts: 'ts',
                json: 'json', md: 'md', txt: 'txt', py: 'py', cs: 'cs',
                cpp: 'cpp', c: 'cpp', h: 'cpp', java: 'java', lua: 'lua',
                glsl: 'glsl', gd: 'gd', tscn: 'tscn', godot: 'godot',
                uproject: 'uproject', svg: 'svg'
            };
            var type = typeMap[ext] || 'txt';

            var fileId = 'file_' + Date.now();
            var file = { id: fileId, name: name, type: type, path: '/' };

            if (BK.project.current) {
                BK.project.addFile(file);
            }

            this.openFile(fileId, name, type);
            this.renderFileTree();
        },

        /* ----------------------------------------
           Website Wizard
           ---------------------------------------- */
        initWizards: function() {
            this.initWebsiteWizard();
            this.initGameWizard();
        },

        initWebsiteWizard: function() {
            var self = this;

            var btnClose = document.getElementById('btn-close-website-wizard');
            var btnCancel = document.getElementById('btn-cancel-website');
            var btnNext = document.getElementById('btn-website-next');
            var btnBack = document.getElementById('btn-website-back');
            var btnCreate = document.getElementById('btn-website-create');

            if (btnClose) btnClose.addEventListener('click', function() { self.closeWebsiteWizard(); });
            if (btnCancel) btnCancel.addEventListener('click', function() { self.closeWebsiteWizard(); });
            if (btnNext) btnNext.addEventListener('click', function() { self.nextWebsiteStep(); });
            if (btnBack) btnBack.addEventListener('click', function() { self.prevWebsiteStep(); });
            if (btnCreate) btnCreate.addEventListener('click', function() { self.onCreateWebsite(); });

            var modal = document.getElementById('modal-website-wizard');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target.id === 'modal-website-wizard') self.closeWebsiteWizard();
                });
            }

            var nameInput = document.getElementById('website-name-input');
            if (nameInput) {
                nameInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') self.nextWebsiteStep();
                });
            }
        },

        openWebsiteWizard: function() {
            var modal = document.getElementById('modal-website-wizard');
            if (!modal) return;

            this.websiteWizardStep = 0;
            document.getElementById('website-name-input').value = '';
            document.getElementById('website-purpose-input').value = '';
            document.getElementById('website-desc-input').value = '';

            var checkboxes = document.querySelectorAll('#modal-website-wizard input[type="checkbox"]');
            checkboxes.forEach(function(cb) { cb.checked = false; });

            this.renderWebsiteWizard();
            modal.classList.remove('hidden');
            document.getElementById('website-name-input').focus();
        },

        closeWebsiteWizard: function() {
            var modal = document.getElementById('modal-website-wizard');
            if (modal) modal.classList.add('hidden');
        },

        nextWebsiteStep: function() {
            if (this.websiteWizardStep === 0) {
                var name = document.getElementById('website-name-input').value.trim();
                var purpose = document.getElementById('website-purpose-input').value.trim();

                if (!name) {
                    document.getElementById('website-name-input').style.borderColor = '#ef4444';
                    setTimeout(function() {
                        document.getElementById('website-name-input').style.borderColor = '';
                    }, 1500);
                    return;
                }

                if (!purpose) {
                    document.getElementById('website-purpose-input').style.borderColor = '#ef4444';
                    setTimeout(function() {
                        document.getElementById('website-purpose-input').style.borderColor = '';
                    }, 1500);
                    return;
                }
            }

            this.websiteWizardStep++;
            this.renderWebsiteWizard();
        },

        prevWebsiteStep: function() {
            this.websiteWizardStep--;
            this.renderWebsiteWizard();
        },

        renderWebsiteWizard: function() {
            var steps = document.querySelectorAll('#modal-website-wizard .wizard-step');
            var btnNext = document.getElementById('btn-website-next');
            var btnBack = document.getElementById('btn-website-back');
            var btnCreate = document.getElementById('btn-website-create');

            steps.forEach(function(step) {
                step.classList.remove('active');
            });

            var currentStep = document.querySelector('#modal-website-wizard .wizard-step[data-wstep="' + this.websiteWizardStep + '"]');
            if (currentStep) currentStep.classList.add('active');

            if (btnBack) btnBack.classList.toggle('hidden', this.websiteWizardStep === 0);
            if (btnNext) btnNext.classList.toggle('hidden', this.websiteWizardStep === 1);
            if (btnCreate) btnCreate.classList.toggle('hidden', this.websiteWizardStep !== 1);
        },

        onCreateWebsite: function() {
            var name = document.getElementById('website-name-input').value.trim();
            var purpose = document.getElementById('website-purpose-input').value.trim();
            var desc = document.getElementById('website-desc-input').value.trim();

            var stylePrefs = [];
            var checkboxes = document.querySelectorAll('#modal-website-wizard input[type="checkbox"]:checked');
            checkboxes.forEach(function(cb) {
                stylePrefs.push(cb.value);
            });

            BK.project.createWebsite({
                name: name,
                purpose: purpose,
                description: desc,
                stylePreferences: stylePrefs
            });

            this.closeWebsiteWizard();
            this.enterWorkspace();
            BK.state.set('status.message', 'Created website: ' + name);
            setTimeout(function() {
                BK.state.set('status.message', 'Ready');
            }, 2500);
        },

        /* ----------------------------------------
           Game Wizard
           ---------------------------------------- */
        initGameWizard: function() {
            var self = this;

            var btnClose = document.getElementById('btn-close-game-wizard');
            var btnCancel = document.getElementById('btn-cancel-game');
            var btnNext = document.getElementById('btn-game-next');
            var btnBack = document.getElementById('btn-game-back');
            var btnCreate = document.getElementById('btn-game-create');

            if (btnClose) btnClose.addEventListener('click', function() { self.closeGameWizard(); });
            if (btnCancel) btnCancel.addEventListener('click', function() { self.closeGameWizard(); });
            if (btnNext) btnNext.addEventListener('click', function() { self.nextGameStep(); });
            if (btnBack) btnBack.addEventListener('click', function() { self.prevGameStep(); });
            if (btnCreate) btnCreate.addEventListener('click', function() { self.onCreateGame(); });

            var modal = document.getElementById('modal-game-wizard');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target.id === 'modal-game-wizard') self.closeGameWizard();
                });
            }

            var nameInput = document.getElementById('game-name-input');
            if (nameInput) {
                nameInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') self.nextGameStep();
                });
            }

            var engineSelect = document.getElementById('game-engine-input');
            if (engineSelect) {
                engineSelect.addEventListener('change', function() {
                    var folderGroup = document.getElementById('engine-folder-group');
                    if (engineSelect.value) {
                        folderGroup.classList.remove('hidden');
                    } else {
                        folderGroup.classList.add('hidden');
                    }
                });
            }

            var btnSelectFolder = document.getElementById('btn-select-folder');
            if (btnSelectFolder) {
                btnSelectFolder.addEventListener('click', function() {
                    var path = prompt('Enter engine project folder path (for reference):');
                    if (path) {
                        document.getElementById('game-engine-folder').value = path;
                    }
                });
            }
        },

        openGameWizard: function() {
            var modal = document.getElementById('modal-game-wizard');
            if (!modal) return;

            this.gameWizardStep = 0;
            document.getElementById('game-name-input').value = '';
            document.querySelector('input[name="game-dimension"][value="2d"]').checked = true;
            document.getElementById('game-genre-input').value = '';
            document.getElementById('game-desc-input').value = '';
            document.getElementById('game-engine-input').value = '';
            document.getElementById('game-engine-folder').value = '';
            document.getElementById('engine-folder-group').classList.add('hidden');

            this.renderGameWizard();
            modal.classList.remove('hidden');
            document.getElementById('game-name-input').focus();
        },

        closeGameWizard: function() {
            var modal = document.getElementById('modal-game-wizard');
            if (modal) modal.classList.add('hidden');
        },

        nextGameStep: function() {
            if (this.gameWizardStep === 0) {
                var name = document.getElementById('game-name-input').value.trim();
                var genre = document.getElementById('game-genre-input').value.trim();

                if (!name) {
                    document.getElementById('game-name-input').style.borderColor = '#ef4444';
                    setTimeout(function() {
                        document.getElementById('game-name-input').style.borderColor = '';
                    }, 1500);
                    return;
                }

                if (!genre) {
                    document.getElementById('game-genre-input').style.borderColor = '#ef4444';
                    setTimeout(function() {
                        document.getElementById('game-genre-input').style.borderColor = '';
                    }, 1500);
                    return;
                }
            }

            this.gameWizardStep++;
            this.renderGameWizard();
        },

        prevGameStep: function() {
            this.gameWizardStep--;
            this.renderGameWizard();
        },

        renderGameWizard: function() {
            var steps = document.querySelectorAll('#modal-game-wizard .wizard-step');
            var btnNext = document.getElementById('btn-game-next');
            var btnBack = document.getElementById('btn-game-back');
            var btnCreate = document.getElementById('btn-game-create');

            steps.forEach(function(step) {
                step.classList.remove('active');
            });

            var currentStep = document.querySelector('#modal-game-wizard .wizard-step[data-wstep="' + this.gameWizardStep + '"]');
            if (currentStep) currentStep.classList.add('active');

            if (btnBack) btnBack.classList.toggle('hidden', this.gameWizardStep === 0);
            if (btnNext) btnNext.classList.toggle('hidden', this.gameWizardStep === 1);
            if (btnCreate) btnCreate.classList.toggle('hidden', this.gameWizardStep !== 1);
        },

        onCreateGame: function() {
            var name = document.getElementById('game-name-input').value.trim();
            var dimension = document.querySelector('input[name="game-dimension"]:checked').value;
            var genre = document.getElementById('game-genre-input').value.trim();
            var desc = document.getElementById('game-desc-input').value.trim();
            var engine = document.getElementById('game-engine-input').value.trim();
            var engineFolder = document.getElementById('game-engine-folder').value.trim();

            BK.project.createGame({
                name: name,
                dimension: dimension,
                genre: genre,
                description: desc,
                engine: engine,
                engineFolder: engineFolder
            });

            this.closeGameWizard();
            this.enterWorkspace();
            BK.state.set('status.message', 'Created game: ' + name);
            setTimeout(function() {
                BK.state.set('status.message', 'Ready');
            }, 2500);
        },

        /* ----------------------------------------
           Navigation
           ---------------------------------------- */
        initNavigation: function() {
            var navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var view = item.dataset.view;
                    if (view) BK.state.set('view', view);
                });
            });
        },

        renderNav: function() {
            var view = BK.state.get('view');
            document.querySelectorAll('.nav-item').forEach(function(item) {
                if (item.dataset.view === view) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        },

        renderView: function() {
            if (this.inLauncherMode) {
                var workspace = document.getElementById('view-workspace');
                var settings = document.getElementById('view-settings');
                var launcher = document.getElementById('view-launcher');
                if (workspace) workspace.classList.add('hidden');
                if (settings) settings.classList.add('hidden');
                if (launcher) launcher.classList.remove('hidden');
                return;
            }

            var view = BK.state.get('view');
            var workspace = document.getElementById('view-workspace');
            var settings = document.getElementById('view-settings');
            var tabBar = document.getElementById('tab-bar-container');

            if (!this.hasProject) {
                // Launcher is always shown when no project
                if (workspace) workspace.classList.add('hidden');
                if (settings) settings.classList.add('hidden');
                if (tabBar) tabBar.classList.remove('hidden');
                return;
            }

            if (view === 'workspace') {
                if (workspace) workspace.classList.remove('hidden');
                if (settings) settings.classList.add('hidden');
                if (tabBar) tabBar.classList.remove('hidden');
            } else if (view === 'settings') {
                if (workspace) workspace.classList.add('hidden');
                if (settings) settings.classList.remove('hidden');
                if (tabBar) tabBar.classList.add('hidden');
            }
        },

        /* ----------------------------------------
           File Tree (Dynamic)
           ---------------------------------------- */
        renderFileTree: function() {
            var tree = document.getElementById('file-tree');
            if (!tree) return;

            var proj = BK.project.getCurrentProject();
            if (!proj) {
                tree.innerHTML = '<div style="color:#8b949e;padding:8px 12px;font-size:12px;">No project open</div>';
                return;
            }

            var self = this;
            var html = '';

            // Build folder structure
            var folders = proj.folders || [];
            var folderMap = {};

            folders.forEach(function(folder) {
                var parts = folder.split('/');
                var currentPath = '';
                for (var i = 0; i < parts.length; i++) {
                    if (!parts[i]) continue;
                    currentPath = currentPath ? currentPath + '/' + parts[i] : parts[i];
                    if (!folderMap[currentPath]) {
                        folderMap[currentPath] = {
                            name: parts[i],
                            fullPath: currentPath,
                            children: []
                        };
                    }
                }
            });

            // Group files by folder
            var filesByFolder = {};
            var rootFiles = [];

            (proj.files || []).forEach(function(file) {
                var folder = file.path || '/';
                if (folder === '/' || folder === '') {
                    rootFiles.push(file);
                } else {
                    if (!filesByFolder[folder]) filesByFolder[folder] = [];
                    filesByFolder[folder].push(file);
                }
            });

            // Render folders and their files
            Object.keys(folderMap).forEach(function(path) {
                var depth = path.split('/').length - 1;
                var indent = '  '.repeat(depth);
                html += '<div class="tree-item tree-folder" data-folder="' + path + '" style="padding-left:' + (12 + depth * 12) + 'px">';
                html += '<span class="tree-icon">&#9656;</span>';
                html += '<span class="tree-label">' + self.escapeHtml(folderMap[path].name) + '</span>';
                html += '</div>';
                html += '<div class="tree-children" data-parent="' + path + '">';

                var files = filesByFolder['/' + path] || filesByFolder[path] || [];
                files.forEach(function(file) {
                    html += self.renderFileTreeItem(file, depth + 1);
                });

                html += '</div>';
            });

            // Render root files
            rootFiles.forEach(function(file) {
                html += self.renderFileTreeItem(file, 0);
            });

            tree.innerHTML = html;

            // Bind events
            var folderItems = tree.querySelectorAll('.tree-folder');
            folderItems.forEach(function(item) {
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var folder = item.dataset.folder;
                    var children = tree.querySelector('.tree-children[data-parent="' + folder + '"]');
                    if (children) {
                        children.classList.toggle('hidden');
                        var icon = item.querySelector('.tree-icon');
                        if (icon) {
                            icon.innerHTML = children.classList.contains('hidden') ? '&#9656;' : '&#9662;';
                        }
                    }
                });
            });

            var fileItems = tree.querySelectorAll('.tree-file');
            fileItems.forEach(function(item) {
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = item.dataset.fileId;
                    var name = item.dataset.fileName;
                    var type = item.dataset.fileType;
                    self.openFile(id, name, type);
                });
            });
        },

        renderFileTreeItem: function(file, depth) {
            var iconMap = {
                html: '<>', css: '#', js: '{}', ts: '{}', json: '{}',
                md: '\u{1F4DC}', txt: '\u{1F4C4}', py: '\u{1F40D}', cs: 'C#',
                cpp: 'C++', java: 'J', lua: 'L', glsl: 'GL', gd: '\u2699',
                tscn: '\u2699', godot: '\u2699', uproject: '\u2699', svg: '\u2726'
            };
            var icon = iconMap[file.type] || '\u{1F4C4}';
            var padding = 12 + depth * 12;
            return '<div class="tree-item tree-file" data-file-id="' + file.id + '" data-file-name="' + this.escapeHtml(file.name) + '" data-file-type="' + file.type + '" style="padding-left:' + padding + 'px">' +
                '<span class="tree-icon">&nbsp;</span>' +
                '<span class="tree-label">' + this.escapeHtml(file.name) + '</span>' +
                '</div>';
        },

        openFile: function(id, name, type) {
            var openFiles = BK.state.get('editor.openFiles');
            var exists = openFiles.some(function(f) { return f.id === id; });

            if (!exists) {
                var iconMap = {
                    html: '<>', css: '#', js: '{}', ts: '{}', json: '{}',
                    md: '\u{1F4DC}', txt: '\u{1F4C4}', py: '\u{1F40D}', cs: 'C#',
                    cpp: 'C++', java: 'J', lua: 'L', glsl: 'GL', gd: '\u2699',
                    tscn: '\u2699', godot: '\u2699', uproject: '\u2699', svg: '\u2726'
                };
                var newFiles = openFiles.concat([{
                    id: id,
                    name: name,
                    type: type,
                    icon: iconMap[type] || '\u{1F4C4}',
                    closable: true
                }]);
                BK.state.set('editor.openFiles', newFiles);
            }

            BK.state.set('editor.activeTabId', id);
            BK.state.set('status.file', name);

            var langMap = {
                html: 'HTML', css: 'CSS', js: 'JavaScript', ts: 'TypeScript',
                json: 'JSON', md: 'Markdown', txt: 'Plain Text', py: 'Python',
                cs: 'C#', cpp: 'C++', java: 'Java', lua: 'Lua', glsl: 'GLSL',
                gd: 'GDScript', tscn: 'Scene', godot: 'Godot', uproject: 'Unreal', svg: 'SVG'
            };
            BK.state.set('status.lang', langMap[type] || 'Plain Text');

            // Load file content into editor
            if (BK.editor && id !== 'welcome') {
                BK.editor.loadFile(id);
            }
        },

        /* ----------------------------------------
           Tabs
           ---------------------------------------- */
        renderTabs: function() {
            var tabBar = document.getElementById('tab-bar');
            if (!tabBar) return;

            var openFiles = BK.state.get('editor.openFiles');
            var activeTabId = BK.state.get('editor.activeTabId');

            tabBar.innerHTML = '';

            var self = this;
            openFiles.forEach(function(file) {
                var tab = document.createElement('div');
                tab.className = 'tab' + (file.id === activeTabId ? ' active' : '');
                tab.innerHTML =
                    '<span class="tab-icon">' + file.icon + '</span>' +
                    '<span class="tab-label">' + self.escapeHtml(file.name) + '</span>' +
                    (file.closable ? '<span class="tab-close" data-tab-id="' + file.id + '">&times;</span>' : '');

                tab.addEventListener('click', function(e) {
                    if (e.target.classList.contains('tab-close')) {
                        e.stopPropagation();
                        self.closeTab(file.id);
                    } else {
                        self.switchTab(file.id);
                    }
                });

                tabBar.appendChild(tab);
            });

            this.renderWorkspaceContent();
        },

        switchTab: function(id) {
            BK.state.set('editor.activeTabId', id);
            var files = BK.state.get('editor.openFiles');
            var file = files.find(function(f) { return f.id === id; });
            if (file && file.id !== 'welcome') {
                BK.state.set('status.file', file.name);
                var langMap = {
                    html: 'HTML', css: 'CSS', js: 'JavaScript', ts: 'TypeScript',
                    json: 'JSON', md: 'Markdown', txt: 'Plain Text', py: 'Python',
                    cs: 'C#', cpp: 'C++', java: 'Java', lua: 'Lua', glsl: 'GLSL',
                    gd: 'GDScript', tscn: 'Scene', godot: 'Godot', uproject: 'Unreal', svg: 'SVG'
                };
                BK.state.set('status.lang', langMap[file.type] || 'Plain Text');
                if (BK.editor) BK.editor.loadFile(id);
            } else if (file && file.id === 'welcome') {
                BK.state.set('status.file', 'No file selected');
                BK.state.set('status.lang', 'Plain Text');
                if (BK.editor) BK.editor.loadFile('welcome');
            }
        },

        closeTab: function(id) {
            var openFiles = BK.state.get('editor.openFiles');
            var idx = openFiles.findIndex(function(f) { return f.id === id; });
            if (idx === -1) return;

            var fileToClose = openFiles[idx];
            var newFiles = openFiles.filter(function(f) { return f.id !== id; });
            BK.state.set('editor.openFiles', newFiles);

            // Add to closed tabs for dock
            this.closedTabs.push(fileToClose);
            this.updateDock();

            var activeTabId = BK.state.get('editor.activeTabId');
            if (activeTabId === id) {
                var nextFile = newFiles[newFiles.length - 1];
                if (nextFile) {
                    BK.state.set('editor.activeTabId', nextFile.id);
                    if (nextFile.id === 'welcome') {
                        BK.state.set('status.file', 'No file selected');
                        BK.state.set('status.lang', 'Plain Text');
                        if (BK.editor) BK.editor.loadFile('welcome');
                    } else {
                        BK.state.set('status.file', nextFile.name);
                        var langMap = {
                            html: 'HTML', css: 'CSS', js: 'JavaScript', ts: 'TypeScript',
                            json: 'JSON', md: 'Markdown', txt: 'Plain Text', py: 'Python',
                            cs: 'C#', cpp: 'C++', java: 'Java', lua: 'Lua', glsl: 'GLSL',
                            gd: 'GDScript', tscn: 'Scene', godot: 'Godot', uproject: 'Unreal', svg: 'SVG'
                        };
                        BK.state.set('status.lang', langMap[nextFile.type] || 'Plain Text');
                        if (BK.editor) BK.editor.loadFile(nextFile.id);
                    }
                }
            }
        },

        renderWorkspaceContent: function() {
            var activeTabId = BK.state.get('editor.activeTabId');
            var welcome = document.getElementById('workspace-welcome');
            var fileView = document.getElementById('workspace-file');

            if (!welcome || !fileView) return;

            if (activeTabId === 'welcome') {
                welcome.classList.remove('hidden');
                fileView.classList.add('hidden');
            } else {
                welcome.classList.add('hidden');
                fileView.classList.remove('hidden');
                this.updateLineNumbers();
            }
        },

        /* ----------------------------------------
           Panels (Collapse/Expand)
           ---------------------------------------- */
        initPanelControls: function() {
            var self = this;
            var leftBtn = document.getElementById('btn-collapse-left');
            var rightBtn = document.getElementById('btn-collapse-right');

            if (leftBtn) {
                leftBtn.addEventListener('click', function() {
                    self.togglePanel('left', leftBtn);
                });
            }
            if (rightBtn) {
                rightBtn.addEventListener('click', function() {
                    self.togglePanel('right', rightBtn);
                });
            }
        },

        togglePanel: function(side, btn) {
            var panelId = side === 'left' ? 'panel-left' : 'panel-right';
            var panel = document.getElementById(panelId);
            if (!panel) return;

            var isCollapsed = panel.classList.contains('collapsed');
            var newCollapsed = !isCollapsed;

            if (newCollapsed) {
                panel.dataset.lastWidth = panel.offsetWidth + 'px';
                panel.classList.add('collapsed');
                btn.innerHTML = side === 'left' ? '&#9654;' : '&#9664;';
                btn.title = 'Expand';
            } else {
                panel.classList.remove('collapsed');
                panel.style.width = panel.dataset.lastWidth || '';
                btn.innerHTML = side === 'left' ? '&#9664;' : '&#9654;';
                btn.title = 'Collapse';
            }

            BK.state.set('panels.' + side + '.collapsed', newCollapsed);
            this.updateDock();
            BK.events.emit('ui:panelToggle', { panel: panelId, collapsed: newCollapsed });
        },

        renderPanels: function() {
            if (this.inLauncherMode) return;

            var leftCollapsed = BK.state.get('panels.left.collapsed');
            var rightCollapsed = BK.state.get('panels.right.collapsed');
            var leftPanel = document.getElementById('panel-left');
            var rightPanel = document.getElementById('panel-right');
            var leftBtn = document.getElementById('btn-collapse-left');
            var rightBtn = document.getElementById('btn-collapse-right');

            if (leftPanel) {
                if (leftCollapsed) {
                    if (!leftPanel.classList.contains('collapsed')) leftPanel.classList.add('collapsed');
                    if (leftBtn) { leftBtn.innerHTML = '&#9654;'; leftBtn.title = 'Expand'; }
                } else {
                    leftPanel.classList.remove('collapsed');
                    if (leftBtn) { leftBtn.innerHTML = '&#9664;'; leftBtn.title = 'Collapse'; }
                }
            }

            if (rightPanel) {
                if (rightCollapsed) {
                    if (!rightPanel.classList.contains('collapsed')) rightPanel.classList.add('collapsed');
                    if (rightBtn) { rightBtn.innerHTML = '&#9664;'; rightBtn.title = 'Expand'; }
                } else {
                    rightPanel.classList.remove('collapsed');
                    if (rightBtn) { rightBtn.innerHTML = '&#9654;'; rightBtn.title = 'Collapse'; }
                }
            }

            this.updateDock();
        },

        /* ----------------------------------------
           Dock
           ---------------------------------------- */
        initDock: function() {
            var self = this;

            var dockRestoreLeft = document.getElementById('dock-restore-left');
            var dockRestoreRight = document.getElementById('dock-restore-right');

            if (dockRestoreLeft) {
                dockRestoreLeft.addEventListener('click', function() {
                    self.restorePanel('left');
                });
            }

            if (dockRestoreRight) {
                dockRestoreRight.addEventListener('click', function() {
                    self.restorePanel('right');
                });
            }

            this.updateDock();
        },

        updateDock: function() {
            var dockBar = document.getElementById('dock-bar');
            var dockTabItems = document.getElementById('dock-tab-items');
            var dockPanelItems = document.getElementById('dock-panel-items');
            if (!dockBar || !dockTabItems || !dockPanelItems) return;

            var self = this;

            // Update closed tabs
            dockTabItems.innerHTML = '';
            if (this.closedTabs.length > 0) {
                this.closedTabs.forEach(function(file, index) {
                    var btn = document.createElement('button');
                    btn.className = 'dock-item';
                    btn.textContent = file.name;
                    btn.addEventListener('click', function() {
                        self.restoreTabFromDock(index);
                    });
                    dockTabItems.appendChild(btn);
                });
            }

            // Update panel restore buttons visibility
            var leftCollapsed = BK.state.get('panels.left.collapsed');
            var rightCollapsed = BK.state.get('panels.right.collapsed');

            var leftDockBtn = document.getElementById('dock-restore-left');
            var rightDockBtn = document.getElementById('dock-restore-right');

            if (leftDockBtn) leftDockBtn.classList.toggle('hidden', !leftCollapsed);
            if (rightDockBtn) rightDockBtn.classList.toggle('hidden', !rightCollapsed);

            // Show/hide dock bar
            var hasDockItems = this.closedTabs.length > 0 || leftCollapsed || rightCollapsed;
            dockBar.classList.toggle('hidden', !hasDockItems);
        },

        restoreTabFromDock: function(index) {
            if (index < 0 || index >= this.closedTabs.length) return;
            var file = this.closedTabs.splice(index, 1)[0];
            this.updateDock();

            var openFiles = BK.state.get('editor.openFiles');
            var exists = openFiles.some(function(f) { return f.id === file.id; });

            if (!exists) {
                var newFiles = openFiles.concat([file]);
                BK.state.set('editor.openFiles', newFiles);
            }

            BK.state.set('editor.activeTabId', file.id);
            BK.state.set('status.file', file.name);
        },

        restorePanel: function(side) {
            var panelId = side === 'left' ? 'panel-left' : 'panel-right';
            var panel = document.getElementById(panelId);
            var btn = document.getElementById(side === 'left' ? 'btn-collapse-left' : 'btn-collapse-right');

            if (!panel) return;

            panel.classList.remove('collapsed');
            panel.style.width = panel.dataset.lastWidth || '';

            if (btn) {
                btn.innerHTML = side === 'left' ? '&#9664;' : '&#9654;';
                btn.title = 'Collapse';
            }

            BK.state.set('panels.' + side + '.collapsed', false);
            this.updateDock();
        },

        /* ----------------------------------------
           Resizers
           ---------------------------------------- */
        initResizers: function() {
            var self = this;
            var resizerEls = document.querySelectorAll('.resizer-h');
            resizerEls.forEach(function(el) {
                el.addEventListener('mousedown', function(e) {
                    self.onResizerMouseDown(e);
                });
            });
            document.addEventListener('mousemove', function(e) {
                self.onResizerMouseMove(e);
            });
            document.addEventListener('mouseup', function() {
                self.onResizerMouseUp();
            });
        },

        onResizerMouseDown: function(e) {
            var targetId = e.target.dataset.target;
            if (!targetId) return;
            this.isResizing = true;
            this.activeResizer = {
                el: e.target,
                target: document.getElementById(targetId),
                min: parseInt(e.target.dataset.min, 10) || 180,
                max: parseInt(e.target.dataset.max, 10) || 500,
                startX: e.clientX,
                startWidth: document.getElementById(targetId).offsetWidth
            };
            e.target.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        },

        onResizerMouseMove: function(e) {
            if (!this.isResizing || !this.activeResizer) return;
            var delta = e.clientX - this.activeResizer.startX;
            var isLeft = this.activeResizer.el.id === 'resizer-left';
            var newWidth;

            if (isLeft) {
                newWidth = this.activeResizer.startWidth + delta;
            } else {
                newWidth = this.activeResizer.startWidth - delta;
            }

            newWidth = Math.max(this.activeResizer.min, Math.min(this.activeResizer.max, newWidth));
            this.activeResizer.target.style.width = newWidth + 'px';
            this.activeResizer.target.style.flex = 'none';
        },

        onResizerMouseUp: function() {
            if (!this.isResizing) return;
            if (this.activeResizer) {
                this.activeResizer.el.classList.remove('active');
            }
            this.isResizing = false;
            this.activeResizer = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        },

        /* ----------------------------------------
           Status Bar
           ---------------------------------------- */
        renderStatus: function() {
            var status = BK.state.get('status');
            this.updateStatusItem('status-branch', status.branch);
            this.updateStatusItem('status-file', status.file);
            this.updateStatusItem('status-message', status.message);
            this.updateStatusItem('status-cursor', status.cursor);
            this.updateStatusItem('status-encoding', status.encoding);
            this.updateStatusItem('status-lang', status.lang);
        },

        updateStatusItem: function(id, text) {
            var el = document.getElementById(id);
            if (el) el.textContent = text;
        },

        /* ----------------------------------------
           Chat Input
           ---------------------------------------- */
        initChatInput: function() {
            var input = document.getElementById('chat-input');
            var sendBtn = document.getElementById('chat-send-btn');
            if (!input) return;

            var self = this;

            var sendAction = function() {
                var text = input.value.trim();
                if (!text) return;
                self.addUserMessage(text);
                input.value = '';
                input.style.height = 'auto';

                if (BK.ai) {
                    BK.ai.addUserMessage(text);
                }

                BK.events.emit('ui:chatSend', { text: text });
            };

            sendBtn.addEventListener('click', sendAction);

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAction();
                }
            });

            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        },

        addUserMessage: function(text) {
            var container = document.getElementById('chat-messages');
            if (!container) return;

            var msg = document.createElement('div');
            msg.className = 'chat-message user-message';
            msg.innerHTML =
                '<div class="message-avatar">ME</div>' +
                '<div class="message-bubble">' +
                    '<div class="message-text">' + this.escapeHtml(text) + '</div>' +
                    '<div class="message-time">Now</div>' +
                '</div>';
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;
        },

        initSettings: function() {
            var inputs = [
                { id: 'setting-theme', path: 'settings.appearance.theme' },
                { id: 'setting-ui-scale', path: 'settings.appearance.uiScale' },
                { id: 'setting-animations', path: 'settings.appearance.animations', type: 'checkbox' },
                { id: 'setting-font-size', path: 'settings.editor.fontSize', type: 'number' },
                { id: 'setting-tab-size', path: 'settings.editor.tabSize', type: 'number' },
                { id: 'setting-word-wrap', path: 'settings.editor.wordWrap', type: 'checkbox' },
                { id: 'setting-auto-save', path: 'settings.editor.autoSave', type: 'checkbox' },
                { id: 'setting-restore-workspace', path: 'settings.workspace.restoreWorkspace', type: 'checkbox' },
                { id: 'setting-confirm-close', path: 'settings.workspace.confirmCloseTab', type: 'checkbox' }
            ];

            inputs.forEach(function(cfg) {
                var el = document.getElementById(cfg.id);
                if (!el) return;

                el.addEventListener('change', function() {
                    var value;
                    if (cfg.type === 'checkbox') value = el.checked;
                    else if (cfg.type === 'number') value = parseInt(el.value, 10);
                    else value = el.value;
                    BK.state.set(cfg.path, value);
                    BK.state.saveSettings();
                    if (cfg.path.indexOf('editor.') !== -1 && BK.editor) BK.editor.applySettings();
                });
            });
        },

        renderSettingsValues: function() {
            var settings = BK.state.get('settings');
            if (!settings) return;

            var map = [
                { id: 'setting-theme', value: settings.appearance.theme },
                { id: 'setting-ui-scale', value: settings.appearance.uiScale },
                { id: 'setting-animations', value: settings.appearance.animations, type: 'checkbox' },
                { id: 'setting-font-size', value: settings.editor.fontSize, type: 'number' },
                { id: 'setting-tab-size', value: settings.editor.tabSize, type: 'number' },
                { id: 'setting-word-wrap', value: settings.editor.wordWrap, type: 'checkbox' },
                { id: 'setting-auto-save', value: settings.editor.autoSave, type: 'checkbox' },
                { id: 'setting-restore-workspace', value: settings.workspace.restoreWorkspace, type: 'checkbox' },
                { id: 'setting-confirm-close', value: settings.workspace.confirmCloseTab, type: 'checkbox' }
            ];

            map.forEach(function(item) {
                var el = document.getElementById(item.id);
                if (!el) return;
                if (item.type === 'checkbox') el.checked = !!item.value;
                else el.value = item.value;
            });
        },

        initEditor: function() {
            var textarea = document.getElementById('code-editor');
            if (!textarea) return;
            var self = this;
            textarea.addEventListener('input', function() { self.updateLineNumbers(); });
            textarea.addEventListener('scroll', function() { self.syncLineNumberScroll(); });
            textarea.addEventListener('click', function() { if (BK.editor) BK.editor.updateCursorPosition(); });
            textarea.addEventListener('keyup', function() { if (BK.editor) BK.editor.updateCursorPosition(); });
        },

        updateLineNumbers: function() {
            var textarea = document.getElementById('code-editor');
            var gutter = document.getElementById('line-numbers');
            if (!textarea || !gutter) return;
            var lines = textarea.value.split('\n').length;
            var html = '';
            for (var i = 1; i <= lines; i++) html += i + '\n';
            gutter.textContent = html.trimEnd();
        },

        syncLineNumberScroll: function() {
            var textarea = document.getElementById('code-editor');
            var gutter = document.getElementById('line-numbers');
            if (!textarea || !gutter) return;
            gutter.parentElement.scrollTop = textarea.scrollTop;
        },

        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    BK.registerModule('ui', ui);
})();
