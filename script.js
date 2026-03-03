// --- WINDOW STATE MANAGEMENT ---
let zIndexCounter = 20;

// All primary windows start open. Store them in state.
// We keep track of which windows exist, and which are in the taskbar.
const windowRegistry = ['window-about', 'window-capone', 'window-projects', 'window-net', 'window-paint', 'window-minesweeper', 'window-snake', 'window-recycle', 'window-display', 'window-notepad', 'window-resume', 'window-cmd'];

const isMobile = window.innerWidth <= 768;

// State object mapped ID -> { isOpen: Boolean, isMinimized: Boolean }
const winState = {
  'window-about': { isOpen: true, isMinimized: false },
  'window-capone': { isOpen: !isMobile, isMinimized: false },
  'window-projects': { isOpen: !isMobile, isMinimized: false },
  'window-net': { isOpen: true, isMinimized: false },
  'window-paint': { isOpen: false, isMinimized: false },
  'window-minesweeper': { isOpen: false, isMinimized: false },
  'window-snake': { isOpen: false, isMinimized: false },
  'window-recycle': { isOpen: false, isMinimized: false },
  'window-display': { isOpen: false, isMinimized: false },
  'window-notepad': { isOpen: false, isMinimized: false },
  'window-resume': { isOpen: false, isMinimized: false },
  'window-cmd': { isOpen: false, isMinimized: false }
};

if (isMobile) {
  const caponeWin = document.getElementById('window-capone');
  const projectsWin = document.getElementById('window-projects');
  if (caponeWin) caponeWin.style.display = 'none';
  if (projectsWin) projectsWin.style.display = 'none';

  // Position windows dynamically for mobile
  document.querySelectorAll('.window').forEach((win, idx) => {
    if (win.id === 'window-about') {
      win.style.top = '25vh';
      win.style.bottom = 'auto';
      win.style.left = '7.5vw';
    } else if (win.id === 'window-net') {
      win.style.top = '5vh';
      win.style.left = '7.5vw';
    } else {
      win.style.left = `${5 + (idx % 3) * 3}vw`;
      win.style.top = `${5 + (idx % 3) * 3}vh`;
    }
  });
}

// Ensure dragging works on mobile by firing on touchstart
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.title-bar').forEach(bar => {
    const win = bar.closest('.window');
    if (win) {
      bar.addEventListener('touchstart', (e) => dragStart(e, win.id), { passive: false });
    }
  });
});

function dragStart(e, windowId) {
  const win = document.getElementById(windowId);

  // Bring to front
  zIndexCounter++;
  win.style.zIndex = zIndexCounter;

  // Set active state
  document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
  win.classList.remove('inactive');
  updateTaskbar();

  const rect = win.getBoundingClientRect();
  let startX = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : 0);
  let startY = e.clientY || (e.touches && e.touches.length > 0 ? e.touches[0].clientY : 0);
  let initialLeft = rect.left;
  let initialTop = rect.top;

  // Explicitly set top/left to current absolute rect position BEFORE clearing bottom/right to prevent jumping
  win.style.top = `${initialTop}px`;
  win.style.left = `${initialLeft}px`;
  // Clear bottom/right so dragging purely responds to top/left adjustments
  win.style.bottom = 'auto';
  win.style.right = 'auto';

  function dragMove(ev) {
    if (ev.type === 'touchmove') ev.preventDefault();
    const clientX = ev.clientX || (ev.touches ? ev.touches[0].clientX : 0);
    const clientY = ev.clientY || (ev.touches ? ev.touches[0].clientY : 0);
    const dx = clientX - startX;
    const dy = clientY - startY;
    win.style.left = `${initialLeft + dx}px`;
    win.style.top = `${initialTop + dy}px`;
  }

  function dragEnd() {
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);
  }

  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('touchend', dragEnd);
}

// Bring to front on any click inside window
document.querySelectorAll('.window').forEach(win => {
  win.addEventListener('mousedown', () => {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;

    document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
    win.classList.remove('inactive');
    updateTaskbar();
  });
});

// Windows open/restore via icons or taskbar
function restoreWindow(id) {
  const win = document.getElementById(id);
  winState[id].isOpen = true;
  winState[id].isMinimized = false;

  win.style.display = 'block';

  zIndexCounter++;
  win.style.zIndex = zIndexCounter;

  document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
  win.classList.remove('inactive');

  updateTaskbar();
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  // Functionally hide it from desktop but KEEP it on taskbar
  winState[id].isMinimized = true;
  win.style.display = 'none';

  updateTaskbar();
}

function closeWindow(id) {
  const win = document.getElementById(id);
  winState[id].isOpen = false;
  winState[id].isMinimized = false;
  win.style.display = 'none';

  updateTaskbar();
}

// --- TASKBAR ---
function updateTaskbar() {
  const taskbarTabs = document.getElementById('taskbar-tabs');
  taskbarTabs.innerHTML = '';

  windowRegistry.forEach(id => {
    if (!winState[id].isOpen) return; // Skip closed windows

    const win = document.getElementById(id);
    const titleText = win.querySelector('.title-bar-text').innerText.trim();

    const tab = document.createElement('div');
    tab.className = 'taskbar-tab';

    // Active logic: Window is active if it's NOT minimized AND it's NOT inactive
    const isActive = !winState[id].isMinimized && !win.classList.contains('inactive');
    if (isActive) tab.classList.add('active');

    // Tab Text
    const textSpan = document.createElement('span');
    textSpan.innerText = titleText;
    tab.appendChild(textSpan);

    // Tab Click logic
    tab.onclick = () => {
      if (winState[id].isMinimized) {
        restoreWindow(id);
      } else if (isActive) {
        // If it's already active, clicking the taskbar minimizes it
        minimizeWindow(id);
      } else {
        restoreWindow(id);
      }
    };

    taskbarTabs.appendChild(tab);
  });
}

// Initial draw
updateTaskbar();


// --- START MENU LOGIC ---
function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const startBtn = document.querySelector('.start-btn');
  if (menu.style.display === 'flex') {
    menu.style.display = 'none';
    startBtn.classList.remove('active');
  } else {
    menu.style.display = 'flex';
    startBtn.classList.add('active');
  }
}

document.addEventListener('mousedown', function (event) {
  const menu = document.getElementById('start-menu');
  const startBtn = document.querySelector('.start-btn');
  if (menu.style.display === 'flex' && !menu.contains(event.target) && !startBtn.contains(event.target)) {
    menu.style.display = 'none';
    startBtn.classList.remove('active');
  }
});


// --- SYSTEM CLOCK ---
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  document.getElementById('clock').innerText = `${hours}:${minutes} ${ampm}`;
}

setInterval(updateClock, 1000);
updateClock();


// --- EASTER EGGS ---

// 1. Fake BSOD (Blue Screen of Death)
function triggerBSOD() {
  document.getElementById('bsod').style.display = 'flex';
  // Hide native cursor to make it authentic
  document.body.style.cursor = 'none';
}

function hideBSOD() {
  document.getElementById('bsod').style.display = 'none';
  document.body.style.cursor = 'default';
}

// 2. Functional MS Paint
const paintCanvas = document.getElementById('paintCanvas');
const ctx = paintCanvas.getContext('2d');
let painting = false;

function getCoords(e) {
  const rect = paintCanvas.getBoundingClientRect();
  const scaleX = paintCanvas.width / rect.width;
  const scaleY = paintCanvas.height / rect.height;
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startPosition(e) {
  if (e.type === 'touchstart') e.preventDefault();
  painting = true;
  draw(e);
}
function endPosition(e) {
  painting = false;
  ctx.beginPath();
}
function draw(e) {
  if (!painting) return;
  if (e.type === 'touchmove') e.preventDefault();

  const coords = getCoords(e);

  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
}

// Basic white background for canvas
ctx.fillStyle = "white";
ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

paintCanvas.addEventListener('mousedown', startPosition);
paintCanvas.addEventListener('mouseup', endPosition);
paintCanvas.addEventListener('mousemove', draw);
paintCanvas.addEventListener('mouseout', endPosition);

paintCanvas.addEventListener('touchstart', startPosition, { passive: false });
paintCanvas.addEventListener('touchend', endPosition, { passive: false });
paintCanvas.addEventListener('touchmove', draw, { passive: false });
paintCanvas.addEventListener('touchcancel', endPosition, { passive: false });

function clearPaint() {
  ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}

// 3. Functional Minesweeper Clone
const COLS = 10;
const ROWS = 10;
const MINES = 10;
let grid = [];
let gameOver = false;
let revealedCount = 0;

function initMinesweeper() {
  const container = document.getElementById('minesweeperGrid');
  document.getElementById('minesweeperFace').innerText = '🙂';
  container.innerHTML = '';
  grid = [];
  gameOver = false;
  revealedCount = 0;

  // Initialize empty grid
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
      const cell = document.createElement('div');
      cell.className = 'ms-cell';
      cell.id = `ms_${r}_${c}`;
      cell.onmousedown = (e) => handleMsClick(r, c, e);
      cell.oncontextmenu = (e) => { e.preventDefault(); }; // prevent default right click
      container.appendChild(cell);
    }
  }

  // Place mines
  let placed = 0;
  while (placed < MINES) {
    let r = Math.floor(Math.random() * ROWS);
    let c = Math.floor(Math.random() * COLS);
    if (!grid[r][c].mine) {
      grid[r][c].mine = true;
      placed++;
    }
  }

  // Calculate numbers
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].mine) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (r + i >= 0 && r + i < ROWS && c + j >= 0 && c + j < COLS && grid[r + i][c + j].mine) count++;
          }
        }
        grid[r][c].count = count;
      }
    }
  }
}

function handleMsClick(r, c, e) {
  if (gameOver || grid[r][c].revealed) return;

  if (e.button === 2) { // Right click
    grid[r][c].flagged = !grid[r][c].flagged;
    document.getElementById(`ms_${r}_${c}`).innerText = grid[r][c].flagged ? '🚩' : '';
    return;
  }

  if (grid[r][c].flagged) return; // Cant left click flagged

  revealCell(r, c);

  if (grid[r][c].mine) {
    gameOver = true;
    document.getElementById('minesweeperFace').innerText = '😵';
    // Reveal all mines
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (grid[i][j].mine) {
          const el = document.getElementById(`ms_${i}_${j}`);
          el.classList.add('revealed');
          el.innerText = '💣';
          if (i === r && j === c) el.classList.add('bomb');
        }
      }
    }
  } else if (revealedCount === (ROWS * COLS) - MINES) {
    gameOver = true;
    document.getElementById('minesweeperFace').innerText = '😎';
  }
}

function revealCell(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS || grid[r][c].revealed || grid[r][c].flagged) return;

  grid[r][c].revealed = true;
  revealedCount++;
  const el = document.getElementById(`ms_${r}_${c}`);
  el.classList.add('revealed');

  if (grid[r][c].count > 0) {
    el.innerText = grid[r][c].count;
    el.classList.add(`c${grid[r][c].count}`);
  } else if (!grid[r][c].mine) {
    // Flood fill zeros
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        revealCell(r + i, c + j);
      }
    }
  }
}

// Ensure init happens on load
setTimeout(initMinesweeper, 500);

// 4. Clippy
function dismissClippy() {
  const el = document.getElementById('clippy');
  el.style.display = 'none';
}

function centerAndOpenConnect() {
  dismissClippy();
  restoreWindow('window-net');

  setTimeout(() => {
    const win = document.getElementById('window-net');
    const rect = win.getBoundingClientRect();
    win.style.left = `calc(50vw - ${rect.width / 2}px)`;
    win.style.top = `calc(50vh - ${rect.height / 2}px)`;

    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
  }, 10);
}

function playWin98Sound() {
  // Reliable publicly hosted MP3 instead of raw github wav
  const audio = new Audio("https://www.myinstants.com/media/sounds/windows-98-startup.mp3");
  audio.volume = 0.5;
  audio.play().catch(e => {
    alert("Audio playback prevented by browser policy. *BEEP*");
  });
}

// 5. Display Properties
function applyDisplaySettings() {
  const bgSelect = document.getElementById('desktop-bg');
  document.body.style.backgroundColor = bgSelect.value;
}

// 6. About Me Tabs
function switchAboutTab(tabName) {
  const tabs = ['summary', 'experience', 'education', 'skills'];
  tabs.forEach(t => {
    document.getElementById(`tab-about-${t}`).classList.remove('active');
    document.getElementById(`content-about-${t}`).style.display = 'none';
  });

  document.getElementById(`tab-about-${tabName}`).classList.add('active');
  document.getElementById(`content-about-${tabName}`).style.display = 'block';
}

// ==================================
//         SNAKE GAME LOGIC
// ==================================
let snakeBoardWidth = 15;
let snakeBoardHeight = 15;
let snakeArr = [];
let snakeDirection = 'right';
let snakeNextDirection = 'right';
let snakeFoodPos = null;
let snakeIntervalId = null;
let snakeGameScore = 0;
let snakeGameHighScore = 0;

function initSnake() {
  const grid = document.getElementById('snakeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Create DOM cells
  for (let i = 0; i < snakeBoardWidth * snakeBoardHeight; i++) {
    const cell = document.createElement('div');
    cell.className = 'snake-cell bg-silver';
    grid.appendChild(cell);
  }

  snakeArr = [
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 }
  ];
  snakeDirection = 'right';
  snakeNextDirection = 'right';
  snakeGameScore = 0;

  const scoreEl = document.getElementById('snakeScore');
  if (scoreEl) scoreEl.innerText = '000';

  spawnSnakeFood();
  renderSnake();

  if (snakeIntervalId) clearInterval(snakeIntervalId);
  snakeIntervalId = setInterval(snakeLoop, 150);
  grid.focus();
}

function spawnSnakeFood() {
  while (true) {
    const x = Math.floor(Math.random() * snakeBoardWidth);
    const y = Math.floor(Math.random() * snakeBoardHeight);
    const onSnake = snakeArr.some(segment => segment.x === x && segment.y === y);
    if (!onSnake) {
      snakeFoodPos = { x, y };
      break;
    }
  }
}

function renderSnake() {
  const grid = document.getElementById('snakeGrid');
  const cells = grid.children;
  if (cells.length === 0) return;

  // clear all
  for (let i = 0; i < cells.length; i++) {
    cells[i].className = 'snake-cell bg-silver';
  }

  // draw food
  if (snakeFoodPos) {
    const fIdx = snakeFoodPos.y * snakeBoardWidth + snakeFoodPos.x;
    if (cells[fIdx]) cells[fIdx].classList.add('snake-food');
  }

  // draw snake
  for (let i = 0; i < snakeArr.length; i++) {
    const seg = snakeArr[i];
    const idx = seg.y * snakeBoardWidth + seg.x;
    if (cells[idx]) {
      if (i === 0) cells[idx].classList.add('snake-head');
      else cells[idx].classList.add('snake-body');
    }
  }
}

function snakeLoop() {
  snakeDirection = snakeNextDirection;
  const head = Object.assign({}, snakeArr[0]);

  if (snakeDirection === 'right') head.x++;
  else if (snakeDirection === 'left') head.x--;
  else if (snakeDirection === 'up') head.y--;
  else if (snakeDirection === 'down') head.y++;

  // Check collisions wall
  if (head.x < 0 || head.x >= snakeBoardWidth || head.y < 0 || head.y >= snakeBoardHeight) {
    return gameOverSnake();
  }
  // Check collision self
  for (let i = 0; i < snakeArr.length; i++) {
    if (head.x === snakeArr[i].x && head.y === snakeArr[i].y) {
      return gameOverSnake();
    }
  }

  snakeArr.unshift(head);

  // Check food
  if (snakeFoodPos && head.x === snakeFoodPos.x && head.y === snakeFoodPos.y) {
    snakeGameScore += 10;
    const scoreEl = document.getElementById('snakeScore');
    if (scoreEl) scoreEl.innerText = snakeGameScore.toString().padStart(3, '0');
    if (snakeGameScore > snakeGameHighScore) {
      snakeGameHighScore = snakeGameScore;
      const highEl = document.getElementById('snakeHigh');
      if (highEl) highEl.innerText = snakeGameHighScore.toString().padStart(3, '0');
    }
    spawnSnakeFood();
  } else {
    snakeArr.pop();
  }

  renderSnake();
}

function gameOverSnake() {
  clearInterval(snakeIntervalId);
  alert('Snake.exe CRASH! Final Score: ' + snakeGameScore);
}

function handleSnakeKey(e) {
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && snakeDirection !== 'down') snakeNextDirection = 'up';
  if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && snakeDirection !== 'up') snakeNextDirection = 'down';
  if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && snakeDirection !== 'right') snakeNextDirection = 'left';
  if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && snakeDirection !== 'left') snakeNextDirection = 'right';
  e.preventDefault();
}

// Mobile swipe support for Snake
let touchStartX = null;
let touchStartY = null;

const snakeGridEl = document.getElementById('snakeGrid');
if (snakeGridEl) {
  snakeGridEl.addEventListener('touchstart', function (e) {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
    }
  }, { passive: false });

  snakeGridEl.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

  snakeGridEl.addEventListener('touchend', function (e) {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && snakeDirection !== 'left') snakeNextDirection = 'right';
      else if (dx < -30 && snakeDirection !== 'right') snakeNextDirection = 'left';
    } else {
      if (dy > 30 && snakeDirection !== 'up') snakeNextDirection = 'down';
      else if (dy < -30 && snakeDirection !== 'down') snakeNextDirection = 'up';
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: false });
}

// ==================================
//         COMMAND PROMPT LOGIC
// ==================================
const cmdInput = document.getElementById('cmd-input');
const cmdOutput = document.getElementById('cmd-output');
const cmdContainer = document.getElementById('cmd-container');
let currentPath = "C:\\WINDOWS>";

if (cmdInput) {
  cmdInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const val = this.value.trim();
      this.value = '';

      // Print command
      const cmdLine = document.createElement('div');
      cmdLine.innerText = currentPath + val;
      cmdOutput.appendChild(cmdLine);

      processCommand(val);

      // Scroll to bottom
      if (cmdContainer) {
        cmdContainer.scrollTop = cmdContainer.scrollHeight;
      }
    }
  });
}

function processCommand(cmd) {
  if (!cmd) return;

  let args = cmd.split(' ');
  let command = args[0].toLowerCase();

  let output = '';

  switch (command) {
    case 'help':
      output = `Supported commands:
HELP    - Provides Help information for Windows commands.
DIR     - Displays a list of files and subdirectories in a directory.
ECHO    - Displays messages.
CLS     - Clears the screen.
DATE    - Displays the date.
TIME    - Displays the system time.
EXIT    - Quits the CMD.EXE program (command interpreter).`;
      break;
    case 'dir':
      output = ` Volume in drive C is WINDOWS98
 Volume Serial Number is 1F5Q-0418
 Directory of C:\\WINDOWS
 
03/03/2026  01:29 PM    <DIR>          .
03/03/2026  01:29 PM    <DIR>          ..
03/03/2026  10:14 AM    <DIR>          SYSTEM
03/03/2026  10:14 AM    <DIR>          SYSTEM32
03/03/2026  11:22 AM             1,452 NOTEPAD.EXE
03/03/2026  11:22 AM             2,185 CALC.EXE
03/03/2026  01:25 PM               402 CONFIG.SYS
               3 File(s)          4,039 bytes
               4 Dir(s)   2,147,483,648 bytes free`;
      break;
    case 'echo':
      output = args.slice(1).join(' ');
      break;
    case 'cls':
    case 'clear':
      cmdOutput.innerHTML = '';
      return;
    case 'date':
      let today = new Date();
      output = `The current date is: ${today.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/,/g, '')}`;
      break;
    case 'time':
      let now = new Date();
      output = `The current time is: ${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}`;
      break;
    case 'exit':
      closeWindow('window-cmd');
      return;
    default:
      output = `'${command}' is not recognized as an internal or external command,
operable program or batch file.`;
  }

  if (output) {
    const outDiv = document.createElement('div');
    outDiv.style.whiteSpace = 'pre-wrap';
    outDiv.innerText = output;
    cmdOutput.appendChild(outDiv);
  }

  const br = document.createElement('br');
  cmdOutput.appendChild(br);
}
