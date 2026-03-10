const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

// Size configuration
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

// Colors for tetrominoes; index 0 is empty
const COLORS = [
  null,
  "#00f0f0", // I
  "#0000f0", // J
  "#f0a000", // L
  "#f0f000", // O
  "#00f000", // S
  "#a000f0", // T
  "#f00000", // Z
];

// Tetromino shapes (matrices)
function createPiece(type) {
  switch (type) {
    case "I":
      return [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
    case "J":
      return [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ];
    case "L":
      return [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ];
    case "O":
      return [
        [4, 4],
        [4, 4],
      ];
    case "S":
      return [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ];
    case "T":
      return [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
      ];
    case "Z":
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
    default:
      return [[0]];
  }
}

function createMatrix(w, h) {
  // Creates a 2D grid (h rows × w columns) initialized to 0s for the board.
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

const board = createMatrix(COLS, ROWS);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

let dropCounter = 0;
let dropInterval = 0.8; // seconds

let lastTime = 0;
let gameOver = false;

const scoreElem = document.getElementById("score");
const messageElem = document.getElementById("message");

 function collide(matrix, player) {
   // Returns true if any non-empty cell of the current piece overlaps a filled cell on the board.
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0 && (matrix[y + o.y] && matrix[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(matrix, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        matrix[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(board, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = COLORS[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        context.strokeStyle = "#111";
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function playerDrop() {
  player.pos.y++;
  if (collide(board, player)) {
    player.pos.y--;
    merge(board, player);
    arenaSweep();
    updateScore();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  }
}

function playerHardDrop() {
  while (!collide(board, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(board, player);
  arenaSweep();
  updateScore();
  playerReset();
  dropCounter = 0;
}

function playerReset() {
  const pieces = "IJLOSTZ";
  const type = pieces[(pieces.length * Math.random()) | 0];
  player.matrix = createPiece(type);
  player.pos.y = 0;
  player.pos.x = ((board[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  if (collide(board, player)) {
    gameOver = true;
    messageElem.textContent = "Game Over – Press Enter to restart";
  }
}

function update(time = 0) {
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  if (!gameOver) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  scoreElem.textContent = player.score;
}

function resetGame() {
  for (let y = 0; y < board.length; y++) {
    board[y].fill(0);
  }
  player.score = 0;
  gameOver = false;
  messageElem.textContent = "";
  updateScore();
  playerReset();
}

 document.addEventListener("keydown", (event) => {
   if (gameOver && event.code !== "Enter") {
     return;
   }
 
   if (event.code === "ArrowLeft") {
     playerMove(-1);
   } else if (event.code === "ArrowRight") {
     playerMove(1);
   } else if (event.code === "ArrowDown") {
     playerDrop();
   } else if (event.code === "ArrowUp" || event.key === "w" || event.key === "W") {
     playerRotate(1);
   } else if (event.code === "Space") {
     event.preventDefault();
     playerHardDrop();
   } else if (event.code === "Escape") {
     if (!gameOver) {
       gameOver = true;
       messageElem.textContent = "Game ended – Press Enter to restart";
     }
   } else if (event.code === "Enter") {
     if (gameOver) {
       resetGame();
     }
   }
 });

resetGame();
update();

