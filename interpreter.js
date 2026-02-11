// Python Interpreter using Pyodide and Monaco Editor
let pyodide = null;
let isInitialized = false;
let editor = null;

// Initialize Pyodide
async function initializePyodide() {
    if (isInitialized) return;
    
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
        
        isInitialized = true;
        statusText.textContent = 'Ready';
        statusDot.classList.remove('running');
        statusDot.classList.remove('error');
        
        console.log('Pyodide initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        statusText.textContent = 'Failed to load';
        statusDot.classList.remove('running');
        statusDot.classList.add('error');
        showOutput('Error: Failed to initialize Python interpreter. Please refresh the page.', 'error');
    }
}

// Run Python code
async function runPythonCode() {
    if (!isInitialized) {
        await initializePyodide();
    }
    
    const output = document.getElementById('output');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    const runBtn = document.getElementById('runBtn');
    
    if (!editor) return;
    const code = editor.getValue().trim();
    
    if (!code) {
        showOutput('Please enter some Python code to run.', 'error');
        return;
    }
    
    // Clear previous output
    output.innerHTML = '';
    
    // Update status
    statusText.textContent = 'Running...';
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

// Load example code
function loadExample(code) {
    if (editor) {
        editor.setValue(code);
        editor.focus();
        
        // Scroll to editor (if needed, though Monaco usually handles its own focus well)
        document.getElementById('monaco-editor-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Initialize Monaco Editor
function initializeMonaco() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});

    require(['vs/editor/editor.main'], function() {
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
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function() {
            runPythonCode();
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('runBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exampleCards = document.querySelectorAll('.example-card');
    
    // Initialize Pyodide on page load
    initializePyodide();
    
    // Initialize Monaco
    initializeMonaco();
    
    // Run button
    runBtn.addEventListener('click', runPythonCode);
    
    // Clear button
    clearBtn.addEventListener('click', clearEditor);
    
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
    if (!document.hidden && !isInitialized) {
        initializePyodide();
    }
});

