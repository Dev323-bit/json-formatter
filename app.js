// Aura JSON Formatter — Core Application Logic

// App State
let currentMode = 'format'; // 'format' or 'minify'
let debounceTimer = null;
let parsedJSONObj = null;

// DOM Elements
const jsonInput = document.getElementById('json-input');
const lineGutter = document.getElementById('line-gutter');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');

// Tab / Modes Elements
const tabFormat = document.getElementById('tab-format');
const tabMinify = document.getElementById('tab-minify');
const tabSample = document.getElementById('tab-sample');
const validityBadge = document.getElementById('validity-badge');

// Panels Elements
const inputChars = document.getElementById('input-chars');
const inputLines = document.getElementById('input-lines');
const outputSize = document.getElementById('output-size');
const outputNodes = document.getElementById('output-nodes');
const shortcutLabel = document.getElementById('shortcut-label');

// Output Content Elements
const outputEmpty = document.getElementById('output-empty');
const outputRenderedContainer = document.getElementById('output-rendered-container');
const outputRendered = document.getElementById('output-rendered');
const outputErrorContainer = document.getElementById('output-error-container');
const errorMessage = document.getElementById('error-message');
const errorLocation = document.getElementById('error-location');
const errorContextLines = document.getElementById('error-context-lines');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Sample JSON Object
const sampleJSON = {
    "appName": "Aura JSON Formatter",
    "version": "1.0.0",
    "active": true,
    "developer": {
        "name": "Aura Suite",
        "links": [
            {
                "platform": "GitHub",
                "url": "https://github.com/aura-utility"
            },
            {
                "platform": "Website",
                "url": "https://aura.vercel.app"
            }
        ]
    },
    "features": [
        "Syntax highlighting",
        "Live syntax validation",
        "Indented formatting (2 spaces)",
        "Compact minification",
        "Keyboard shortcuts (Ctrl+Enter)",
        "Instant copy to clipboard"
    ],
    "performance": {
        "clientSide": true,
        "speedMs": 1.2,
        "maxSizeLimitKb": null
    },
    "tags": ["utility", "developer-tools", "json", "formatter"]
};

// Safe Lucide Icon initialization helper
function initIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
            lucide.createIcons();
        } catch (e) {
            console.warn("Failed to render Lucide icons:", e);
        }
    }
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Detect OS for shortcut hint label
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if (isMac) {
        shortcutLabel.textContent = '⌘ + ↵ to format';
    } else {
        shortcutLabel.textContent = 'Ctrl + Enter to format';
    }

    initIcons();
    setupEventListeners();
    updateGutter();
    updateInputStats();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Sync Scroll
    jsonInput.addEventListener('scroll', syncScroll);

    // Instant Gutter and Stats on Input; Debounced Validation
    jsonInput.addEventListener('input', () => {
        updateGutter();
        updateInputStats();
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(liveValidate, 300);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);

    // Tab Bar Interactions
    tabFormat.addEventListener('click', () => {
        setMode('format');
        processJSON();
    });

    tabMinify.addEventListener('click', () => {
        setMode('minify');
        processJSON();
    });

    tabSample.addEventListener('click', () => {
        loadSampleJSON();
    });

    // Header buttons
    clearBtn.addEventListener('click', handleClearAll);
    copyBtn.addEventListener('click', handleCopyToClipboard);
}

// Sync gutter scroll with textarea scroll
function syncScroll() {
    lineGutter.scrollTop = jsonInput.scrollTop;
}

// Update Gutter numbers
function updateGutter() {
    const lines = jsonInput.value.split('\n');
    const lineCount = lines.length || 1;
    let gutterHTML = '';
    for (let i = 1; i <= lineCount; i++) {
        gutterHTML += `<span>${i}</span>`;
    }
    lineGutter.innerHTML = gutterHTML;
    syncScroll();
}

// Update input panel character and line stats
function updateInputStats() {
    const text = jsonInput.value;
    inputChars.textContent = text.length.toLocaleString();
    
    const lineCount = text === '' ? 1 : text.split('\n').length;
    inputLines.textContent = lineCount.toLocaleString();
}

// Set mode (format or minify) and update active tabs
function setMode(mode) {
    if (mode === 'format') {
        currentMode = 'format';
        tabFormat.classList.add('active');
        tabMinify.classList.remove('active');
    } else if (mode === 'minify') {
        currentMode = 'minify';
        tabMinify.classList.add('active');
        tabFormat.classList.remove('active');
    }
}

// Debounced live validator (updates the nav badge status)
function liveValidate() {
    const rawValue = jsonInput.value.trim();
    if (rawValue === '') {
        updateValidityBadge('empty');
        return;
    }

    try {
        JSON.parse(rawValue);
        updateValidityBadge('valid');
    } catch (e) {
        updateValidityBadge('invalid');
    }
}

// Update UI state of validity badge
function updateValidityBadge(status) {
    validityBadge.className = 'badge';
    
    if (status === 'empty') {
        validityBadge.classList.add('badge-neutral');
        validityBadge.innerHTML = `
            <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i>
            <span>Empty Input</span>
        `;
    } else if (status === 'valid') {
        validityBadge.classList.add('badge-success');
        validityBadge.innerHTML = `
            <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>
            <span>✓ Valid</span>
        `;
    } else if (status === 'invalid') {
        validityBadge.classList.add('badge-error');
        validityBadge.innerHTML = `
            <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i>
            <span>✗ Invalid</span>
        `;
    }
    initIcons();
}

// Main execution parsing, formatting, and minification pipeline
function processJSON() {
    const rawValue = jsonInput.value.trim();

    if (rawValue === '') {
        showEmptyState();
        return;
    }

    try {
        const parsed = JSON.parse(rawValue);
        parsedJSONObj = parsed;

        // Update stats
        updateOutputStats(parsed);

        // Format according to current mode
        let resultString = '';
        if (currentMode === 'format') {
            resultString = JSON.stringify(parsed, null, 2);
        } else if (currentMode === 'minify') {
            resultString = JSON.stringify(parsed);
        }

        // Render highlighted output
        const highlighted = syntaxHighlight(resultString);
        renderOutput(highlighted);
        updateValidityBadge('valid');

    } catch (error) {
        parsedJSONObj = null;
        renderError(error, rawValue);
        updateValidityBadge('invalid');
    }
}

// Render formatted output
function renderOutput(htmlContent) {
    outputEmpty.classList.add('hidden');
    outputErrorContainer.classList.add('hidden');
    outputRenderedContainer.classList.remove('hidden');
    outputRendered.innerHTML = htmlContent;
}

// Render error message and context
function renderError(error, originalText) {
    outputEmpty.classList.add('hidden');
    outputRenderedContainer.classList.add('hidden');
    outputErrorContainer.classList.remove('hidden');

    const details = getErrorDetails(error, originalText);
    errorMessage.textContent = details.message;

    if (details.line !== null) {
        errorLocation.textContent = `Line ${details.line}, Column ${details.column}`;
        errorContextLines.textContent = getErrorContext(originalText, details.line);
        errorLocation.classList.remove('hidden');
        errorContextLines.parentElement.parentElement.classList.remove('hidden');
    } else {
        errorLocation.classList.add('hidden');
        errorContextLines.parentElement.parentElement.classList.add('hidden');
    }

    // Reset output stats since compilation failed
    outputSize.textContent = '0 B';
    outputNodes.textContent = '0';
}

// Restore Output view to Empty state
function showEmptyState() {
    outputRenderedContainer.classList.add('hidden');
    outputErrorContainer.classList.add('hidden');
    outputEmpty.classList.remove('hidden');
    
    outputSize.textContent = '0 B';
    outputNodes.textContent = '0';
    updateValidityBadge('empty');
}

// Parse error line & column information from JSON.parse error
function getErrorDetails(error, text) {
    const message = error.message;
    let line = null;
    let column = null;
    let position = null;

    // Matches e.g. "at position 45"
    const posMatch = message.match(/at position (\d+)/i);
    if (posMatch) {
        position = parseInt(posMatch[1], 10);
    } else {
        // Matches e.g. "line 2 column 5" (Firefox / Safari style)
        const lineColMatch = message.match(/line (\d+).*column (\d+)/i);
        if (lineColMatch) {
            line = parseInt(lineColMatch[1], 10);
            column = parseInt(lineColMatch[2], 10);
        }
    }

    if (position !== null && line === null) {
        // Compute line and column offset manually from position index
        const substring = text.slice(0, position);
        const lines = substring.split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
    }

    return {
        message: message,
        line: line,
        column: column,
        position: position
    };
}

// Extract three lines around the error for contextual preview
function getErrorContext(text, errorLine) {
    const lines = text.split('\n');
    const start = Math.max(0, errorLine - 3);
    const end = Math.min(lines.length, errorLine + 2);
    
    let context = '';
    for (let i = start; i < end; i++) {
        const lineNum = i + 1;
        const isErrorLine = lineNum === errorLine;
        const prefix = isErrorLine ? ' > ' : '   ';
        const numStr = String(lineNum).padStart(4, ' ');
        context += `${prefix}${numStr} | ${lines[i] || ''}\n`;
    }
    return context;
}

// Update output size and node count stats
function updateOutputStats(obj) {
    const stringified = JSON.stringify(obj, null, 2);
    const sizeInBytes = new Blob([stringified]).size;
    outputSize.textContent = formatBytes(sizeInBytes);
    
    const nodesCount = getNodesCount(obj);
    outputNodes.textContent = nodesCount.toLocaleString();
}

// Recursive function to count nodes in a JSON structure
function getNodesCount(obj) {
    if (obj === null || obj === undefined) return 1;
    if (typeof obj !== 'object') return 1;
    
    let count = 1; // Count current object/array
    
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            count += getNodesCount(obj[key]);
        }
    }
    
    return count;
}

// Format bytes size to human-readable string
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Custom simple regex-based tokenizer for JSON syntax highlighting
function syntaxHighlight(json) {
    // Protect against injection / escapes
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const regex = /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
    
    return json.replace(regex, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        
        if (cls === 'json-key') {
            // Keep the trailing colon outside the colored key span
            const keyName = match.trim().slice(0, -1);
            return `<span class="${cls}">${keyName}</span>:`;
        }
        
        return `<span class="${cls}">${match}</span>`;
    });
}

// Load sample JSON into workspace
function loadSampleJSON() {
    setMode('format');
    jsonInput.value = JSON.stringify(sampleJSON, null, 2);
    updateGutter();
    updateInputStats();
    liveValidate();
    processJSON();
    showToast('Loaded', 'Sample JSON loaded into editor.', 'info');
}

// Reset workspace
function handleClearAll() {
    if (jsonInput.value === '' && outputEmpty.classList.contains('hidden') === false) return;
    
    jsonInput.value = '';
    showEmptyState();
    updateGutter();
    updateInputStats();
    showToast('Cleared', 'Editor and output cleared.', 'info');
}

// Copy output area text content to clipboard
function handleCopyToClipboard() {
    // If output is hidden or showing error/empty state
    if (!outputEmpty.classList.contains('hidden')) {
        showToast('Empty Output', 'There is no formatted output to copy.', 'warning');
        return;
    }
    if (!outputErrorContainer.classList.contains('hidden')) {
        showToast('Invalid JSON', 'Cannot copy output while syntax is invalid.', 'warning');
        return;
    }

    const textToCopy = outputRendered.textContent;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Copied', 'JSON copied to clipboard!', 'success');
        
        // Copy Button visual feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <i data-lucide="check" style="width: 15px; height: 15px;"></i>
            Copied!
        `;
        copyBtn.classList.add('active-copied');
        initIcons();

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.remove('active-copied');
            initIcons();
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Copy Failed', 'Failed to copy to clipboard.', 'error');
    });
}

// Global Keyboard Shortcut Bindings
function handleKeyboardShortcuts(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Format shortcut: Ctrl + Enter (or ⌘ + Enter)
    const isFormatShortcut = (isMac && e.metaKey && e.key === 'Enter') || (!isMac && e.ctrlKey && e.key === 'Enter');
    if (isFormatShortcut) {
        e.preventDefault();
        setMode('format');
        processJSON();
        showToast('Formatting', 'Pretty-printed input JSON.', 'success');
        return;
    }

    // Alt + C: Clear workspace
    if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClearAll();
        return;
    }

    // Alt + K: Copy Output
    if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCopyToClipboard();
        return;
    }

    // Alt + F: Format Mode
    if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setMode('format');
        processJSON();
        showToast('Mode Set', 'Formatter mode active.', 'info');
        return;
    }

    // Alt + M: Minify Mode
    if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMode('minify');
        processJSON();
        showToast('Mode Set', 'Minifier mode active.', 'info');
        return;
    }

    // Alt + S: Load Sample
    if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        loadSampleJSON();
        return;
    }
}

// Toast Notifications System Helper
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';
    if (type === 'warning') icon = 'alert-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    toastContainer.appendChild(toast);
    initIcons();

    // Small slide-in delay
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove toast card after 4.2 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4200);
}
