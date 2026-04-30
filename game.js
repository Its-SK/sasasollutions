// MUST USE YOUR RENDER URL HERE
const socket = io('https://sasa-multiplayer-backend.onrender.com', {
    transports: ['websocket', 'polling']
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

let drawing = false;
let current = { color: '#0b3d91', size: 5 };

colorPicker.addEventListener('change', (e) => current.color = e.target.value);
brushSize.addEventListener('change', (e) => current.size = e.target.value);

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mouseout', onMouseUp);
canvas.addEventListener('mousemove', onMouseMove);

// Correctly calculate mouse position relative to canvas
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
    drawing = true;
    const pos = getMousePos(e);
    current.x = pos.x;
    current.y = pos.y;
}

function onMouseUp(e) {
    if (!drawing) return;
    drawing = false;
    const pos = getMousePos(e);
    drawLine(current.x, current.y, pos.x, pos.y, current.color, current.size, true);
}

function onMouseMove(e) {
    if (!drawing) return;
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

clearBtn.addEventListener('click', () => socket.emit('clearCanvas'));
socket.on('clearCanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const messages = document.getElementById('messages');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value) {
        socket.emit('chatMessage', chatInput.value);
        chatInput.value = '';
    }
});

socket.on('chatMessage', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});