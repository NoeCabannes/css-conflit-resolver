// CSS Conflict Resolver Application - Fixed Navigation
class CSSConflictResolver {
    constructor() {
        this.conflicts = [];
        this.uuidMapping = {};
        this.stats = {
            totalSelecteursPrincipal: 0,
            totalSelecteursDemo: 0,
            conflitsDetectes: 0,
            pourcentageConflit: 0
        };
        
        // Données d'exemple
        this.exampleData = {
            cssPrincipal: ".header{background-color:#333;color:white;padding:20px}.navigation{display:flex;justify-content:space-between}.button{background:linear-gradient(45deg,#ff6b6b,#feca57);border:none;padding:12px 24px;border-radius:8px;color:white;font-weight:bold;cursor:pointer;transition:all 0.3s ease}.button:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,0.2)}.container{max-width:1200px;margin:0 auto;padding:20px}.footer{background:#222;color:#ccc;text-align:center;padding:40px 0}#main-content{min-height:500px;background:#f8f9fa}.sidebar{width:300px;background:#e9ecef;padding:20px}",
            cssDemo: ".header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px 0;text-align:center}.navigation{display:flex;align-items:center;justify-content:center;gap:20px}.button{background:#3498db;border:none;padding:10px 20px;border-radius:5px;color:white;text-decoration:none;display:inline-block;transition:background 0.3s}.button:hover{background:#2980b9}.container{max-width:800px;margin:0 auto;padding:20px;background:white;box-shadow:0 2px 10px rgba(0,0,0,0.1)}.demo-specific{background:#f1c40f;padding:20px;margin:20px 0;border-radius:10px}.card{background:white;border-radius:8px;padding:20px;margin:15px 0;box-shadow:0 2px 5px rgba(0,0,0,0.1)}#main-content{background:#ecf0f1;min-height:400px;padding:30px 0}.feature-box{display:flex;align-items:center;gap:15px;margin:20px 0}",
            htmlAvant: '<div class="container"><header class="header"><nav class="navigation"><button class="button">Cliquer</button></nav></header><main id="main-content">Contenu</main></div>',
            htmlApres: '<div class="uuid-m3n4o5p6"><header class="uuid-a1b2c3d4"><nav class="uuid-e5f6g7h8"><button class="uuid-i9j0k1l2">Cliquer</button></nav></header><main id="uuid-q7r8s9t0">Contenu</main></div>'
        };
        
        // Store instance globally for access from global functions
        window.app = this;
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApplication();
            });
        } else {
            this.setupApplication();
        }
    }

    setupApplication() {
        console.log('Setting up CSS Conflict Resolver');
        this.setupEventListeners();
        this.setupThemeToggle();
        this.loadExampleData();
        this.showTab('accueil');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Navigation tabs with direct click handlers
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = tab.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                if (tabId) {
                    this.showTab(tabId);
                }
            });
        });

        // Add click handler to "Commencer l'Analyse" button
        const startButton = document.querySelector('.cta-section .btn--primary');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTab('analyseur');
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        
        if (!themeToggle || !themeIcon) {
            console.log('Theme toggle elements not found');
            return;
        }
        
        // Check for saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute('data-color-scheme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-color-scheme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    showTab(tabId) {
        console.log('Showing tab:', tabId);
        
        // Hide all tab contents
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        const allNavTabs = document.querySelectorAll('.nav-tab');
        allNavTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log('Tab content activated:', tabId);
        } else {
            console.error('Tab content not found:', tabId);
        }
        
        // Activate corresponding nav tab
        const targetNavTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetNavTab) {
            targetNavTab.classList.add('active');
            console.log('Nav tab activated:', tabId);
        } else {
            console.error('Nav tab not found:', tabId);
        }
        
        // Load data when switching to analyzer
        if (tabId === 'analyseur') {
            this.ensureExampleDataLoaded();
        }
    }

    ensureExampleDataLoaded() {
        const cssPrincipalField = document.getElementById('css-principal');
        const cssDemoField = document.getElementById('css-demo');
        
        if (cssPrincipalField && !cssPrincipalField.value.trim()) {
            cssPrincipalField.value = this.exampleData.cssPrincipal;
        }
        
        if (cssDemoField && !cssDemoField.value.trim()) {
            cssDemoField.value = this.exampleData.cssDemo;
        }
    }

    loadExampleData() {
        setTimeout(() => {
            const cssPrincipalField = document.getElementById('css-principal');
            const cssDemoField = document.getElementById('css-demo');
            
            if (cssPrincipalField) {
                cssPrincipalField.value = this.exampleData.cssPrincipal;
            }
            if (cssDemoField) {
                cssDemoField.value = this.exampleData.cssDemo;
            }
        }, 100);
    }

    loadExamplePrincipal() {
        const field = document.getElementById('css-principal');
        if (field) {
            field.value = this.exampleData.cssPrincipal;
            this.showStatus('Exemple du projet principal chargé', 'success');
        }
    }

    loadExampleDemo() {
        const field = document.getElementById('css-demo');
        if (field) {
            field.value = this.exampleData.cssDemo;
            this.showStatus('Exemple de la démo chargé', 'success');
        }
    }

    extractSelectorsFromCSS(css) {
        if (!css.trim()) return new Set();
        
        const selectors = new Set();
        
        // Simple regex to extract CSS selectors
        const rules = css.match(/[^{}]+(?=\s*\{)/g) || [];
        
        rules.forEach(rule => {
            const cleanRule = rule.trim().replace(/\s+/g, ' ');
            const individualSelectors = cleanRule.split(',');
            
            individualSelectors.forEach(selector => {
                const trimmedSelector = selector.trim();
                if (trimmedSelector && !trimmedSelector.includes('@')) {
                    // Extract class and ID selectors
                    const classMatches = trimmedSelector.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g) || [];
                    const idMatches = trimmedSelector.match(/#[a-zA-Z_-][a-zA-Z0-9_-]*/g) || [];
                    
                    classMatches.forEach(cls => selectors.add(cls));
                    idMatches.forEach(id => selectors.add(id));
                }
            });
        });
        
        return selectors;
    }

    analyzeConflicts() {
        console.log('Analyzing conflicts');
        
        const cssPrincipalField = document.getElementById('css-principal');
        const cssDemoField = document.getElementById('css-demo');
        
        if (!cssPrincipalField || !cssDemoField) {
            this.showStatus('Erreur: Champs CSS non trouvés', 'error');
            return;
        }
        
        const cssPrincipal = cssPrincipalField.value;
        const cssDemo = cssDemoField.value;
        
        if (!cssPrincipal.trim() || !cssDemo.trim()) {
            this.showStatus('Veuillez fournir le CSS des deux projets', 'error');
            return;
        }

        // Extract selectors
        const selectorsPrincipal = this.extractSelectorsFromCSS(cssPrincipal);
        const selecteursDemo = this.extractSelectorsFromCSS(cssDemo);
        
        // Find common selectors (excluding body and html)
        this.conflicts = [...selectorsPrincipal].filter(selector => 
            selecteursDemo.has(selector) && !['body', 'html'].includes(selector)
        );
        
        // Calculate stats
        this.stats = {
            totalSelecteursPrincipal: selectorsPrincipal.size,
            totalSelecteursDemo: selecteursDemo.size,
            conflitsDetectes: this.conflicts.length,
            pourcentageConflit: this.conflicts.length > 0 ? 
                Math.round((this.conflicts.length / Math.max(selectorsPrincipal.size, selecteursDemo.size)) * 100 * 10) / 10 : 0
        };
        
        this.displayAnalysisResults();
        this.showStatus(`${this.conflicts.length} conflits détectés`, 'success');
    }

    displayAnalysisResults() {
        // Update stats
        const totalPrincipalEl = document.getElementById('total-principal');
        const totalDemoEl = document.getElementById('total-demo');
        const totalConflictsEl = document.getElementById('total-conflicts');
        const conflictPercentageEl = document.getElementById('conflict-percentage');
        
        if (totalPrincipalEl) totalPrincipalEl.textContent = this.stats.totalSelecteursPrincipal;
        if (totalDemoEl) totalDemoEl.textContent = this.stats.totalSelecteursDemo;
        if (totalConflictsEl) totalConflictsEl.textContent = this.stats.conflitsDetectes;
        if (conflictPercentageEl) conflictPercentageEl.textContent = `${this.stats.pourcentageConflit}%`;
        
        // Display conflicts
        const conflictsList = document.getElementById('conflicts-list');
        if (conflictsList) {
            conflictsList.innerHTML = '';
            
            if (this.conflicts.length === 0) {
                conflictsList.innerHTML = '<p style="color: var(--color-text-secondary);">Aucun conflit détecté</p>';
            } else {
                this.conflicts.forEach(conflict => {
                    const conflictItem = document.createElement('div');
                    conflictItem.className = 'conflict-item';
                    conflictItem.textContent = conflict;
                    conflictsList.appendChild(conflictItem);
                });
            }
        }
        
        // Show results section
        const resultsSection = document.getElementById('analysis-results');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
    }

    generateUUID() {
        return 'uuid-' + Math.random().toString(36).substr(2, 8);
    }

    generateUUIDs() {
        console.log('Generating UUIDs');
        
        if (this.conflicts.length === 0) {
            this.showStatus('Aucun conflit détecté. Veuillez d\'abord analyser vos projets.', 'error');
            return;
        }
        
        this.uuidMapping = {};
        this.conflicts.forEach(selector => {
            this.uuidMapping[selector] = selector.startsWith('#') ? 
                '#' + this.generateUUID() : 
                '.' + this.generateUUID();
        });
        
        this.displayUUIDMapping();
        this.showStatus('UUIDs générés avec succès', 'success');
    }

    regenerateUUIDs() {
        if (Object.keys(this.uuidMapping).length === 0) {
            this.showStatus('Aucun mapping existant. Générez d\'abord les UUIDs.', 'error');
            return;
        }
        
        // Regenerate UUIDs for existing mapping
        Object.keys(this.uuidMapping).forEach(selector => {
            this.uuidMapping[selector] = selector.startsWith('#') ? 
                '#' + this.generateUUID() : 
                '.' + this.generateUUID();
        });
        
        this.displayUUIDMapping();
        this.showStatus('UUIDs régénérés avec succès', 'success');
    }

    displayUUIDMapping() {
        const mappingList = document.getElementById('mapping-list');
        if (mappingList) {
            mappingList.innerHTML = '';
            
            Object.entries(this.uuidMapping).forEach(([original, uuid]) => {
                const mappingItem = document.createElement('div');
                mappingItem.className = 'mapping-item';
                mappingItem.innerHTML = `
                    <span class="mapping-original">${original}</span>
                    <span class="mapping-arrow">→</span>
                    <span class="mapping-uuid">${uuid}</span>
                `;
                mappingList.appendChild(mappingItem);
            });
        }
        
        // Update JSON preview
        const jsonField = document.getElementById('mapping-json');
        if (jsonField) {
            jsonField.value = JSON.stringify(this.uuidMapping, null, 2);
        }
        
        // Show mapping section
        const mappingSection = document.getElementById('uuid-mapping');
        if (mappingSection) {
            mappingSection.classList.remove('hidden');
        }
    }

    copyMapping() {
        const mappingJson = document.getElementById('mapping-json');
        if (mappingJson) {
            mappingJson.select();
            document.execCommand('copy');
            this.showStatus('Mapping JSON copié dans le presse-papiers', 'success');
        }
    }

    applyCSSMapping(css, mapping) {
        let modifiedCSS = css;
        
        Object.entries(mapping).forEach(([original, replacement]) => {
            const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedOriginal + '(?=\\s*[,{])', 'g');
            modifiedCSS = modifiedCSS.replace(regex, replacement);
        });
        
        return modifiedCSS;
    }

    applyHTMLMapping(html, mapping) {
        let modifiedHTML = html;
        
        Object.entries(mapping).forEach(([original, replacement]) => {
            if (original.startsWith('.')) {
                const className = original.substring(1);
                const newClassName = replacement.substring(1);
                const classRegex = new RegExp(`\\b${className}\\b`, 'g');
                modifiedHTML = modifiedHTML.replace(classRegex, newClassName);
            } else if (original.startsWith('#')) {
                const idName = original.substring(1);
                const newIdName = replacement.substring(1);
                const idRegex = new RegExp(`id="${idName}"`, 'g');
                modifiedHTML = modifiedHTML.replace(idRegex, `id="${newIdName}"`);
            }
        });
        
        return modifiedHTML;
    }

    generateDemo() {
        console.log('Generating demo');
        
        if (Object.keys(this.uuidMapping).length === 0) {
            this.showStatus('Veuillez d\'abord générer les UUIDs', 'error');
            return;
        }
        
        const originalCSS = document.getElementById('css-demo').value;
        const modifiedCSS = this.applyCSSMapping(originalCSS, this.uuidMapping);
        
        const originalHTML = this.exampleData.htmlAvant;
        const modifiedHTML = this.applyHTMLMapping(originalHTML, this.uuidMapping);
        
        // Display original and modified versions
        const cssOriginalEl = document.getElementById('css-original');
        const cssModifiedEl = document.getElementById('css-modified');
        const htmlOriginalEl = document.getElementById('html-original');
        const htmlModifiedEl = document.getElementById('html-modified');
        
        if (cssOriginalEl) cssOriginalEl.textContent = this.formatCSS(originalCSS);
        if (cssModifiedEl) cssModifiedEl.textContent = this.formatCSS(modifiedCSS);
        if (htmlOriginalEl) htmlOriginalEl.textContent = this.formatHTML(originalHTML);
        if (htmlModifiedEl) htmlModifiedEl.textContent = this.formatHTML(modifiedHTML);
        
        this.showStatus('Démonstration générée avec succès', 'success');
    }

    formatCSS(css) {
        return css.replace(/\{/g, ' {\n  ')
                 .replace(/;/g, ';\n  ')
                 .replace(/\}/g, '\n}\n\n')
                 .replace(/,/g, ',\n');
    }

    formatHTML(html) {
        return html.replace(/></g, '>\n<')
                  .replace(/^\s*\n/gm, '');
    }

    // Utility functions
    extractSelectors() {
        const css = document.getElementById('css-extract').value;
        if (!css.trim()) {
            this.showStatus('Veuillez fournir du CSS à analyser', 'error');
            return;
        }
        
        const selectors = this.extractSelectorsFromCSS(css);
        const results = document.getElementById('extracted-selectors');
        
        if (results) {
            if (selectors.size === 0) {
                results.innerHTML = '<p>Aucun sélecteur trouvé</p>';
            } else {
                results.innerHTML = Array.from(selectors).map(selector => 
                    `<div style="padding: 4px; background: var(--color-background); margin: 2px 0; border-radius: 4px; font-family: var(--font-family-mono);">${selector}</div>`
                ).join('');
            }
        }
        
        this.showStatus(`${selectors.size} sélecteurs extraits`, 'success');
    }

    generateSimpleUUID() {
        const uuid = this.generateUUID();
        const field = document.getElementById('simple-uuid');
        if (field) {
            field.value = uuid;
        }
        this.showStatus('UUID généré', 'success');
    }

    copySimpleUUID() {
        const uuid = document.getElementById('simple-uuid');
        if (uuid && uuid.value) {
            uuid.select();
            document.execCommand('copy');
            this.showStatus('UUID copié dans le presse-papiers', 'success');
        }
    }

    validateCSS() {
        const css = document.getElementById('css-validate').value;
        const results = document.getElementById('validation-results');
        
        if (!css.trim()) {
            this.showStatus('Veuillez fournir du CSS à valider', 'error');
            return;
        }
        
        if (!results) return;
        
        // Simple CSS validation
        const openBraces = (css.match(/\{/g) || []).length;
        const closeBraces = (css.match(/\}/g) || []).length;
        const hasBasicStructure = css.includes('{') && css.includes('}');
        
        if (openBraces === closeBraces && hasBasicStructure) {
            results.className = 'validation-results valid';
            results.innerHTML = '✅ CSS valide - Structure correcte';
        } else {
            results.className = 'validation-results invalid';
            results.innerHTML = `❌ CSS invalide - Accolades déséquilibrées (${openBraces} ouvertes, ${closeBraces} fermées)`;
        }
        
        this.showStatus('Validation terminée', 'success');
    }

    showStatus(message, type = 'info') {
        const statusBar = document.getElementById('status-bar');
        const statusMessage = document.getElementById('status-message');
        
        if (!statusBar || !statusMessage) return;
        
        statusMessage.textContent = message;
        statusBar.classList.remove('hidden');
        statusBar.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideStatus();
        }, 3000);
    }

    hideStatus() {
        const statusBar = document.getElementById('status-bar');
        if (statusBar) {
            statusBar.classList.remove('show');
            setTimeout(() => {
                statusBar.classList.add('hidden');
            }, 300);
        }
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabId) {
    if (window.app) {
        window.app.showTab(tabId);
    }
}

function loadExamplePrincipal() {
    if (window.app) {
        window.app.loadExamplePrincipal();
    }
}

function loadExampleDemo() {
    if (window.app) {
        window.app.loadExampleDemo();
    }
}

function analyzeConflicts() {
    if (window.app) {
        window.app.analyzeConflicts();
    }
}

function generateUUIDs() {
    if (window.app) {
        window.app.generateUUIDs();
    }
}

function regenerateUUIDs() {
    if (window.app) {
        window.app.regenerateUUIDs();
    }
}

function copyMapping() {
    if (window.app) {
        window.app.copyMapping();
    }
}

function generateDemo() {
    if (window.app) {
        window.app.generateDemo();
    }
}

function extractSelectors() {
    if (window.app) {
        window.app.extractSelectors();
    }
}

function generateSimpleUUID() {
    if (window.app) {
        window.app.generateSimpleUUID();
    }
}

function copySimpleUUID() {
    if (window.app) {
        window.app.copySimpleUUID();
    }
}

function validateCSS() {
    if (window.app) {
        window.app.validateCSS();
    }
}

function hideStatus() {
    if (window.app) {
        window.app.hideStatus();
    }
}

// Initialize the application immediately
new CSSConflictResolver();