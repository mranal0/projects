const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const status = document.getElementById('status');
const roomInfo = document.getElementById('roomInfo');
const restartButton = document.getElementById('restartButton');
const createRoomButton = document.getElementById('createRoomButton');
const joinRoomButton = document.getElementById('joinRoomButton');
const roomInput = document.getElementById('roomInput');

let gameState = {
    currentPlayer: 'X',
    gameId: null,
    playerId: null,
    playerSymbol: null
};

// Generate a unique player ID
gameState.playerId = localStorage.getItem('playerId') || Math.random().toString(36).substring(2, 15);
localStorage.setItem('playerId', gameState.playerId);

async function makeMove(index) {
    try {
        const response = await fetch('/.netlify/functions/game', {
            method: 'POST',
            body: JSON.stringify({
                action: 'move',
                gameId: gameState.gameId,
                playerId: gameState.playerId,
                position: index
            })
        });

        const data = await response.json();
        if (data.success) {
            updateGameState(data.gameState);
        }
    } catch (error) {
        console.error('Error making move:', error);
    }
}

async function createRoom() {
    try {
        const response = await fetch('/.netlify/functions/game', {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                playerId: gameState.playerId
            })
        });

        const data = await response.json();
        gameState.gameId = data.gameId;
        gameState.playerSymbol = data.playerSymbol;
        updateGameState(data.gameState);
        
        roomInfo.textContent = `Room Code: ${gameState.gameId}`;
    } catch (error) {
        console.error('Error creating room:', error);
    }
}

async function joinRoom(roomCode) {
    try {
        const response = await fetch('/.netlify/functions/game', {
            method: 'POST',
            body: JSON.stringify({
                action: 'join',
                gameId: roomCode,
                playerId: gameState.playerId
            })
        });

        const data = await response.json();
        if (response.ok) {
            gameState.gameId = roomCode;
            gameState.playerSymbol = data.playerSymbol;
            updateGameState(data.gameState);
            roomInfo.textContent = `Room Code: ${gameState.gameId}`;
        } else {
            alert(data.error || 'Error joining room');
        }
    } catch (error) {
        console.error('Error joining room:', error);
    }
}

function updateGameState(newState) {
    cells.forEach((cell, index) => {
        cell.classList.remove('x', 'o');
        const mark = newState.board[index];
        if (mark !== ' ') {
            cell.classList.add(mark.toLowerCase());
        }
    });

    if (newState.gameWon) {
        status.textContent = `Player ${newState.currentPlayer} Wins!`;
    } else if (newState.isDraw) {
        status.textContent = "Game is a Draw!";
    } else {
        status.textContent = `Player ${newState.currentPlayer}'s Turn`;
    }
}

cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        if (!gameState.gameId || !gameState.playerSymbol) {
            alert('Please join or create a room first!');
            return;
        }
        makeMove(index);
    });
});

createRoomButton.addEventListener('click', createRoom);

joinRoomButton.addEventListener('click', () => {
    const roomCode = roomInput.value.trim();
    if (roomCode) {
        joinRoom(roomCode);
    } else {
        alert('Please enter a room code');
    }
});

restartButton.addEventListener('click', createRoom); 