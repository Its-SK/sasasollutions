// MUST USE YOUR RENDER URL HERE
const socket = io('https://sasa-multiplayer-backend.onrender.com', {
    transports: ['websocket', 'polling']
});

// --- NEW: Word Selection DOM Elements ---
const startTurnBtn = document.getElementById('startTurnBtn');
const wordChoicesDiv = document.getElementById('wordChoices');
const currentWordDisplay = document.getElementById('currentWordDisplay');
let amIDrawing = false; // Tracks if this player is the one currently drawing

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

let drawing = false;
let current = { color: '#0b3d91', size: 5 };

colorPicker.addEventListener('change', (e) => current.color = e.target.value);
brushSize.addEventListener('change', (e) => current.size = e.target.value);

// --- NEW: Word Selection Logic ---
startTurnBtn.addEventListener('click', () => {
    socket.emit('requestWords');
});

socket.on('wordChoices', (choices) => {
    startTurnBtn.style.display = 'none'; // Hide the start button
    wordChoicesDiv.style.display = 'flex'; // Show the choices area
    wordChoicesDiv.innerHTML = ''; // Clear old choices
    
    choices.forEach(word => {
        const btn = document.createElement('button');
        btn.textContent = word;
        btn.className = 'btn-primary';
        btn.style.background = '#28a745'; // Green color for choices
        btn.style.margin = '0 5px';
        btn.style.border = 'none';
        btn.style.padding = '8px 15px';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '4px';
        btn.style.color = 'white';
        
        btn.addEventListener('click', () => {
            socket.emit('wordSelected', word); // Send choice to server
            
            // Update UI for the drawer
            wordChoicesDiv.style.display = 'none';
            currentWordDisplay.style.display = 'block';
            currentWordDisplay.textContent = `You are drawing: ${word}`;
            amIDrawing = true; // Allow this player to draw!
            
            // Clear the canvas for a fresh drawing
            socket.emit('clearCanvas'); 
        });
        
        wordChoicesDiv.appendChild(btn);
    });
});

// --- UPDATED: Drawing Logic (Restricted to Drawer) ---
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mouseout', onMouseUp);
canvas.addEventListener('mousemove', onMouseMove);

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   
    const scaleY = canvas.height / rect.height; 
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    }
}

function onMouseDown(e) {
    if (!amIDrawing) return; // Prevent non-drawers from drawing
    drawing = true;
    const pos = getMousePos(e);
    current.x = pos.x;
    current.y = pos.y;
}

function onMouseUp(e) {
    if (!drawing || !amIDrawing) return;
    drawing = false;
    const pos = getMousePos(e);
    drawLine(current.x, current.y, pos.x, pos.y, current.color, current.size, true);
}

function onMouseMove(e) {
    if (!drawing || !amIDrawing) return;
    const pos = getMousePos(e);
    drawLine(current.x, current.y, pos.x, pos.y, current.color, current.size, true);
    current.x = pos.x;
    current.y = pos.y;
}

function drawLine(x0, y0, x1, y1, color, size, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socket.emit('drawing', { x0, y0, x1, y1, color, size });
}

socket.on('drawing', (data) => {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
});

// Allow the active drawer to clear the canvas
clearBtn.addEventListener('click', () => {
    if (amIDrawing) socket.emit('clearCanvas');
});
socket.on('clearCanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// --- UPDATED: Chat Logic ---
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const messages = document.getElementById('messages');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value) {
        // Prevent the drawer from giving away the answer in chat!
        if (amIDrawing) {
            alert("No cheating! You cannot type in chat while you are the drawer.");
        } else {
            socket.emit('chatMessage', chatInput.value);
        }
        chatInput.value = '';
    }
});

socket.on('chatMessage', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// --- NEW: System Game Status Messages ---
socket.on('gameStatus', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    item.style.fontWeight = 'bold';
    item.style.color = '#d9534f'; // Red text
    item.style.background = '#fcf8e3'; // Yellow background
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    
    // If the word was guessed, reset the turn so someone else can go!
    if (msg.includes("guessed the word correctly")) {
        amIDrawing = false; // Stop the drawer from drawing
        currentWordDisplay.style.display = 'none'; // Hide the word
        startTurnBtn.style.display = 'inline-block'; // Show the start button again
    }
});
