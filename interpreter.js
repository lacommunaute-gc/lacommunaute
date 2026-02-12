// Interpreter using Pyodide (Python) and JSCPP (C) and Monaco Editor
let pyodide = null;
let isPyodideInitialized = false;
let editor = null;
let currentLanguage = 'python'; // 'python' or 'c'

// Initialize Pyodide
async function initializePyodide() {
    if (isPyodideInitialized) return;

    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');

    try {
        statusText.textContent = 'Loading Python...';
        statusDot.classList.add('running');

        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });

        // Set up stdout and stderr capture
        pyodide.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.buffer = StringIO()
    
    def write(self, s):
        self.buffer.write(s)
    
    def flush(self):
        pass
    
    def getvalue(self):
        return self.buffer.getvalue()
    
    def clear(self):
        self.buffer = StringIO()

stdout_capture = OutputCapture()
stderr_capture = OutputCapture()
sys.stdout = stdout_capture
sys.stderr = stderr_capture
        `);

        isPyodideInitialized = true;
        if (currentLanguage === 'python') {
            statusText.textContent = 'Ready';
            statusDot.classList.remove('running');
            statusDot.classList.remove('error');
        }

        console.log('Pyodide initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        if (currentLanguage === 'python') {
            statusText.textContent = 'Failed to load';
            statusDot.classList.remove('running');
            statusDot.classList.add('error');
            showOutput('Error: Failed to initialize Python interpreter. Please refresh the page.', 'error');
        }
    }
}

// Run Code Dispatcher
async function runCode() {
    if (currentLanguage === 'python') {
        await runPythonCode();
    } else {
        await runCCode();
    }
}

// Run Python code
async function runPythonCode() {
    if (!isPyodideInitialized) {
        await initializePyodide();
    }

    const output = document.getElementById('output');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    const runBtn = document.getElementById('runBtn');

    if (!editor) return;
    const code = editor.getValue(); // Don't trim, indentation matters in Python

    if (!code.trim()) {
        showOutput('Please enter some Python code to run.', 'error');
        return;
    }

    // Clear previous output
    output.innerHTML = '';

    // Update status
    statusText.textContent = 'Running Python...';
    statusDot.classList.add('running');
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="loading"></span> Running...';

    try {
        // Clear capture buffers
        pyodide.runPython(`
stdout_capture.clear()
stderr_capture.clear()
        `);

        // Run the user's code
        const result = pyodide.runPython(code);

        // Get captured output
        const stdout = pyodide.runPython('stdout_capture.getvalue()');
        const stderr = pyodide.runPython('stderr_capture.getvalue()');

        // Display output
        if (stderr) {
            showOutput(stderr, 'error');
        } else if (stdout) {
            showOutput(stdout, 'success');
        } else if (result !== undefined) {
            showOutput(String(result), 'success');
        } else {
            showOutput('Code executed successfully (no output)', 'success');
        }

        statusText.textContent = 'Ready';
        statusDot.classList.remove('running');

    } catch (error) {
        const errorMessage = error.toString();
        showOutput(errorMessage, 'error');
        statusText.textContent = 'Error';
        statusDot.classList.remove('running');
        statusDot.classList.add('error');
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = '<span class="btn-icon">▶</span> Run Code';
    }
}

// Run C code
async function runCCode() {
    const output = document.getElementById('output');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    const runBtn = document.getElementById('runBtn');

    if (!editor) return;
    const code = editor.getValue().trim();

    if (!code) {
        showOutput('Please enter some C code to run.', 'error');
        return;
    }

    // Clear previous output
    output.innerHTML = '';

    // Update status
    statusText.textContent = 'Compiling & Running C...';
    statusDot.classList.add('running');
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="loading"></span> Running...';

    let outputBuffer = "";

    try {
        const config = {
            stdio: {
                write: function (s) {
                    outputBuffer += s;
                }
            }
        };

        // Use JSCPP to run the code
        JSCPP.run(code, "", config);

        // Display output
        if (outputBuffer) {
            showOutput(outputBuffer, 'success');
        } else {
            showOutput('Code executed successfully (no output)', 'success');
        }

        statusText.textContent = 'Ready';
        statusDot.classList.remove('running');

    } catch (error) {
        console.error(error);
        showOutput('Error: ' + error.message, 'error');
        statusText.textContent = 'Error';
        statusDot.classList.remove('running');
        statusDot.classList.add('error');
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = '<span class="btn-icon">▶</span> Run Code';
    }
}

// Display output
function showOutput(text, type = 'success') {
    const output = document.getElementById('output');

    if (output.querySelector('.output-placeholder')) {
        output.innerHTML = '';
    }

    const lines = text.split('\n');
    lines.forEach(line => {
        const outputLine = document.createElement('div');
        outputLine.className = `output-line output-${type}`;
        outputLine.textContent = line || ' '; // Handle empty lines
        output.appendChild(outputLine);
    });

    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
}

// Clear editor
function clearEditor() {
    if (editor) {
        editor.setValue('');
        editor.focus();
    }
}

// Switch Language
function switchLanguage(lang) {
    currentLanguage = lang;
    const isPython = lang === 'python';

    // Update Monaco Editor language
    if (editor) {
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, isPython ? 'python' : 'c');

        // Set default code if empty or previous default
        const currentValue = editor.getValue();
        if (!currentValue.trim() || currentValue.includes('# Write your Python code here') || currentValue.includes('// Write your C code here')) {
            if (isPython) {
                editor.setValue(`# Write your Python code here...
# Example:
print('Hello, La Communauté!')`);
            } else {
                editor.setValue(`// Write your C code here...
// Example:
#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}`);
            }
        }
    }

    // Update UI
    document.title = isPython ?
        'Stanford nunchi vacchina ethical hackers - Python Interpreter' :
        'Stanford nunchi vacchina ethical hackers - C Interpreter';

    // Update examples visibility
    document.querySelectorAll('.example-card').forEach(card => {
        if (card.getAttribute('data-lang') === lang) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Reset status
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    statusText.textContent = 'Ready';
    statusDot.classList.remove('running');
    statusDot.classList.remove('error');

    // Clear output
    const output = document.getElementById('output');
    output.innerHTML = '<div class="output-placeholder"><p>Output will appear here after running your code...</p></div>';
}

// Load example code
function loadExample(code) {
    if (editor) {
        editor.setValue(code);
        editor.focus();
        document.getElementById('monaco-editor-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Initialize Monaco Editor
function initializeMonaco() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            value: `# Write your Python code here...
# Example:
print('Hello, La Communauté!')
for i in range(5):
    print(f'Number: {i}')`,
            language: 'python',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
        });

        // Add keyboard shortcut for Run (Ctrl+Enter or Cmd+Enter)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
            runCode();
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('runBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exampleCards = document.querySelectorAll('.example-card');
    const languageSelect = document.getElementById('languageSelect');

    // Initialize Pyodide on page load (in background)
    initializePyodide();

    // Initialize Monaco
    initializeMonaco();

    // Run button
    runBtn.addEventListener('click', () => runCode());

    // Clear button
    clearBtn.addEventListener('click', clearEditor);

    // Language Switcher Logic
    const languageSwitchWrapper = document.getElementById('languageSwitchWrapper');
    const languageOptions = document.querySelectorAll('.language-option');

    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');

            // Update UI
            languageOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            if (lang === 'c') {
                languageSwitchWrapper.classList.add('c-active');
            } else {
                languageSwitchWrapper.classList.remove('c-active');
            }

            // Switch Language
            switchLanguage(lang);
        });
    });

    // Example cards
    exampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const code = card.getAttribute('data-code');
            loadExample(code);
        });
    });
});

// Handle page visibility to reinitialize if needed (mainly for Pyodide)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isPyodideInitialized && currentLanguage === 'python') {
        initializePyodide();
    }
});
