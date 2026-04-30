const socket = io('https://sasa-multiplayer-backend.onrender.com', {
    transports: ['websocket', 'polling']
});

// --- LOBBY & ROOM LOGIC ---
const lobbyContainer = document.getElementById('lobbyContainer');
const mainGameContainer = document.getElementById('mainGameContainer');
const playerNameInput = document.getElementById('playerNameInput');
const showCreateBtn = document.getElementById('showCreateBtn');
const showJoinBtn = document.getElementById('showJoinBtn');
const joinRoomDetails = document.getElementById('joinRoomDetails');
const roomIdInput = document.getElementById('roomIdInput');
const joinSubmitBtn = document.getElementById('joinSubmitBtn');
const joinError = document.getElementById('joinError');
const displayRoomId = document.getElementById('displayRoomId');

let myPlayerName = '';
let currentRoomId = '';

// Toggles the Join input field
showJoinBtn.addEventListener('click', () => {
    joinRoomDetails.style.display = 'block';
});

// Handle Create Room
showCreateBtn.addEventListener('click', () => {
    myPlayerName = playerNameInput.value.trim();
    if (!myPlayerName) return alert("Please enter your name first!");

    socket.emit('createRoom', myPlayerName, (response) => {
        if (response.success) {
            enterGame(response.roomId);
        }
    });
});

// Handle Join Room
joinSubmitBtn.addEventListener('click', () => {
    myPlayerName = playerNameInput.value.trim();
    const roomToJoin = roomIdInput.value.trim().toUpperCase();
    
    if (!myPlayerName) return alert("Please enter your name!");
    if (roomToJoin.length !== 4) return alert("Room ID must be 4 letters.");

    socket.emit('joinRoom', { playerName: myPlayerName, roomId: roomToJoin }, (response) => {
        if (response.success) {
            enterGame(response.roomId);
        } else {
            joinError.textContent = response.message;
            joinError.style.display = 'block';
        }
    });
});

// Hides lobby and shows game
function enterGame(roomId) {
    currentRoomId = roomId;
    lobbyContainer.style.display = 'none';
    mainGameContainer.style.display = 'flex'; // Changed to flex to match your CSS setup
    displayRoomId.textContent = roomId;
}


// --- WORD SELECTION & DRAWING LOGIC ---
const startTurnBtn = document.getElementById('startTurnBtn');
const wordChoicesDiv = document.getElementById('wordChoices');
const currentWordDisplay = document.getElementById('currentWordDisplay');
let amIDrawing = false; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

let drawing = false;
let current = { color: '#0b3d91', size: 5 };

colorPicker.addEventListener('change', (e) => current.color = e.target.value);
brushSize.addEventListener('change', (e) => current.size = e.target.value);

startTurnBtn.addEventListener('click', () => socket.emit('requestWords'));

socket.on('wordChoices', (choices) => {
    startTurnBtn.style.display = 'none'; 
    wordChoicesDiv.style.display = 'flex'; 
    wordChoicesDiv.innerHTML = ''; 
    
    choices.forEach(word => {
        const btn = document.createElement('button');
        btn.textContent = word;
        btn.className = 'btn-primary';
        btn.style.background = '#28a745'; 
        btn.style.margin = '0 5px';
        btn.style.border = 'none';
        btn.style.padding = '8px 15px';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '4px';
        btn.style.color = 'white';
        
        btn.addEventListener('click', () => {
            socket.emit('wordSelected', word); 
            wordChoicesDiv.style.display = 'none';
            currentWordDisplay.style.display = 'block';
            currentWordDisplay.textContent = `You are drawing: ${word}`;
            amIDrawing = true; 
            socket.emit('clearCanvas'); 
        });
        wordChoicesDiv.appendChild(btn);
    });
});

// Canvas Events
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
    if (!amIDrawing) return; 
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

socket.on('drawing', (data) => drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false));

clearBtn.addEventListener('click', () => {
    if (amIDrawing) socket.emit('clearCanvas');
});
socket.on('clearCanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));


// --- CHAT LOGIC ---
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const messages = document.getElementById('messages');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value) {
        if (amIDrawing) {
            alert("No cheating! You cannot type in chat while you are the drawer.");
        } else {
            socket.emit('chatMessage', chatInput.value);
        }
        chatInput.value = '';
    }
});

// Normal Chat Message (Allows HTML inside so we can bold names)
socket.on('chatMessage', (msg) => {
    const item = document.createElement('li');
    item.innerHTML = msg; // Changed to innerHTML to render the <strong> tags from the server
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// System Game Status Messages
socket.on('gameStatus', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    item.style.fontWeight = 'bold';
    item.style.color = '#d9534f'; 
    item.style.background = '#fcf8e3'; 
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    
    if (msg.includes("guessed it")) {
        amIDrawing = false; 
        currentWordDisplay.style.display = 'none'; 
        startTurnBtn.style.display = 'inline-block'; 
    }
});
