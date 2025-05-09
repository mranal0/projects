const games = new Map();

class TicTacToe {
    constructor() {
        this.board = Array(9).fill(' ');
        this.currentPlayer = 'X';
        this.gameWon = false;
        this.players = { X: null, O: null };
    }

    makeMove(index, playerId) {
        if (this.gameWon || this.board[index] !== ' ' || 
            this.players[this.currentPlayer] !== playerId) {
            return false;
        }

        this.board[index] = this.currentPlayer;
        
        if (this.checkWin()) {
            this.gameWon = true;
            return true;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return true;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] !== ' ' &&
                   this.board[a] === this.board[b] &&
                   this.board[b] === this.board[c];
        });
    }

    isBoardFull() {
        return !this.board.includes(' ');
    }

    addPlayer(playerId) {
        if (!this.players.X) {
            this.players.X = playerId;
            return 'X';
        } else if (!this.players.O) {
            this.players.O = playerId;
            return 'O';
        }
        return null;
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameWon: this.gameWon,
            isDraw: this.isBoardFull() && !this.gameWon,
            players: this.players
        };
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, gameId, playerId, position } = JSON.parse(event.body);

        switch (action) {
            case 'create':
                const newGameId = Math.random().toString(36).substring(2, 8);
                const game = new TicTacToe();
                const playerSymbol = game.addPlayer(playerId);
                games.set(newGameId, game);
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        gameId: newGameId,
                        playerSymbol,
                        gameState: game.getGameState()
                    })
                };

            case 'join':
                const existingGame = games.get(gameId);
                if (!existingGame) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Game not found' })
                    };
                }
                const symbol = existingGame.addPlayer(playerId);
                if (!symbol) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Game is full' })
                    };
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        playerSymbol: symbol,
                        gameState: existingGame.getGameState()
                    })
                };

            case 'move':
                const gameInstance = games.get(gameId);
                if (!gameInstance) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Game not found' })
                    };
                }
                const moveSuccess = gameInstance.makeMove(position, playerId);
                return {
                    statusCode: moveSuccess ? 200 : 400,
                    body: JSON.stringify({
                        success: moveSuccess,
                        gameState: gameInstance.getGameState()
                    })
                };

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
}; 