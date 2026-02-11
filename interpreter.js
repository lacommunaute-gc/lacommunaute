// Python Interpreter using Pyodide
let pyodide = null;
let isInitialized = false;

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
    
    const codeEditor = document.getElementById('codeEditor');
    const output = document.getElementById('output');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    const runBtn = document.getElementById('runBtn');
    
    const code = codeEditor.value.trim();
    
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
    const codeEditor = document.getElementById('codeEditor');
    codeEditor.value = '';
    codeEditor.focus();
}

// Load example code
function loadExample(code) {
    const codeEditor = document.getElementById('codeEditor');
    codeEditor.value = code;
    codeEditor.focus();
    
    // Scroll to editor
    codeEditor.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('runBtn');
    const clearBtn = document.getElementById('clearBtn');
    const codeEditor = document.getElementById('codeEditor');
    const exampleCards = document.querySelectorAll('.example-card');
    
    // Initialize Pyodide on page load
    initializePyodide();
    
    // Run button
    runBtn.addEventListener('click', runPythonCode);
    
    // Clear button
    clearBtn.addEventListener('click', clearEditor);
    
    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
    codeEditor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runPythonCode();
        }
    });
    
    // Example cards
    exampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const code = card.getAttribute('data-code');
            loadExample(code);
        });
    });
    
    // Focus editor on load
    codeEditor.focus();
});

// Handle page visibility to reinitialize if needed
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isInitialized) {
        initializePyodide();
    }
});

