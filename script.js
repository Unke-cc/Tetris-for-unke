// 1. 初始化和常量
// ===================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const nextPreviewContexts = [
    document.getElementById('next-1').getContext('2d'),
    document.getElementById('next-2').getContext('2d'),
    document.getElementById('next-3').getContext('2d'),
    document.getElementById('next-4').getContext('2d'),
    document.getElementById('next-5').getContext('2d'),
];

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const highScoreEl = document.getElementById('highScore');
const sprintTimerEl = document.getElementById('sprintTimer');
const sprintTimerBox = document.getElementById('sprintTimerBox');

const startScreen = document.getElementById('startScreen');
const settingsScreen = document.getElementById('settingsScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScoreText');
const quitConfirmOverlay = document.getElementById('quitConfirmOverlay');
const restartConfirmOverlay = document.getElementById('restartConfirmOverlay');

const dasSlider = document.getElementById('das-slider');
const dasValue = document.getElementById('das-value');
const arrSlider = document.getElementById('arr-slider');
const arrValue = document.getElementById('arr-value');
const ghostToggle = document.getElementById('ghost-toggle');

const ROWS = 20;
const COLS = 10;
let BLOCK_SIZE = 30;

// 自适应窗口大小计算
function calculateOptimalSize() {
    const gameArea = document.querySelector('.game-area');
    const maxWidth = Math.min(window.innerWidth * 0.4, 400);
    const maxHeight = Math.min(window.innerHeight * 0.8, 600);
    
    const blockSizeByWidth = Math.floor(maxWidth / COLS);
    const blockSizeByHeight = Math.floor(maxHeight / ROWS);
    
    BLOCK_SIZE = Math.min(blockSizeByWidth, blockSizeByHeight, 35);
    BLOCK_SIZE = Math.max(BLOCK_SIZE, 15); // 最小尺寸
    
    return {
        width: COLS * BLOCK_SIZE,
        height: ROWS * BLOCK_SIZE
    };
}
const GHOST_ALPHA = 0.3;
const QUIT_HOLD_DURATION = 1000;
const RESTART_HOLD_DURATION = 1000;

let settings = {
    das: 160,
    arr: 40,
    showGhost: true,
    keybindings: {
        moveLeft: 'a',
        moveRight: 'd',
        softDrop: 's',
        hardDrop: 'w',
        rotateCW: 'arrowright',
        rotateCCW: 'arrowleft',
        rotate180: 'arrowup',
        hold: 'arrowdown',
        pause: 'p'
    }
};

// 初始化canvas尺寸
function initializeCanvas() {
    const size = calculateOptimalSize();
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.width = size.width + 'px';
    canvas.style.height = size.height + 'px';
}

initializeCanvas();

// 窗口大小变化监听
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initializeCanvas();
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
            draw();
        }
    }, 100);
});

function initializePreviewCanvases() {
    [holdCtx, ...nextPreviewContexts].forEach(c => {
        const canvasEl = c.canvas;
        const rect = canvasEl.getBoundingClientRect();
        canvasEl.width = rect.width;
        canvasEl.height = rect.height;
    });
}

initializePreviewCanvases();

// 在窗口大小变化时也更新预览canvas
const originalResizeHandler = window.onresize;
window.addEventListener('resize', () => {
    setTimeout(initializePreviewCanvases, 150);
});

const computedStyles = getComputedStyle(document.documentElement);
const BG_COLOR = computedStyles.getPropertyValue('--bg-color').trim();

const COLORS = [
    null, 
    'linear-gradient(135deg, rgba(230, 0, 103, 0.9), rgba(230, 0, 103, 0.7))', // T - 粉红色玻璃
    'linear-gradient(135deg, rgba(0, 230, 230, 0.9), rgba(0, 230, 230, 0.7))', // I - 青色玻璃
    'linear-gradient(135deg, rgba(230, 230, 0, 0.9), rgba(230, 230, 0, 0.7))', // O - 黄色玻璃
    'linear-gradient(135deg, rgba(88, 166, 255, 0.9), rgba(88, 166, 255, 0.7))', // L - 蓝色玻璃
    'linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(124, 58, 237, 0.7))', // J - 紫色玻璃
    'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(16, 185, 129, 0.7))', // S - 绿色玻璃
    'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(239, 68, 68, 0.7))', // Z - 红色玻璃
    'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))' // 白色玻璃
];

const GLASS_EFFECTS = [
    null,
    'rgba(230, 0, 103, 0.3)', // T
    'rgba(0, 230, 230, 0.3)', // I
    'rgba(230, 230, 0, 0.3)', // O
    'rgba(88, 166, 255, 0.3)', // L
    'rgba(124, 58, 237, 0.3)', // J
    'rgba(16, 185, 129, 0.3)', // S
    'rgba(239, 68, 68, 0.3)', // Z
    'rgba(255, 255, 255, 0.3)' // 白色
];

const TETROMINOS = [
    [], // Empty
    [[0, 1, 0], [1, 1, 1]], // T
    [[2, 2, 2, 2]],         // I
    [[3, 3], [3, 3]],       // O
    [[0, 0, 4], [4, 4, 4]], // L
    [[5, 0, 0], [5, 5, 5]], // J
    [[0, 6, 6], [6, 6, 0]], // S
    [[7, 7, 0], [0, 7, 7]]  // Z
];

let gameState = 'MENU';
let gameMode = 'CLASSIC';

let grid, piece, holdPiece, bag, nextPieces;
let score, level, lines, highScore;
let canHold, isAnimating;

const keysPressed = {};
const moveState = {
    left: { timer: 0, arrTimer: 0 },
    right: { timer: 0, arrTimer: 0 },
    down: { timer: 0, arrTimer: 0 }
};

let sprintStartTime, sprintIntervalId;
let lastTime = 0, dropCounter = 0, dropInterval = 1000;
let isRebinding = false;
let quitConfirmTimer = null;
let restartConfirmTimer = null;

// 音效系统
let audioContext;
let soundEnabled = true;

// 初始化音效系统
function initAudioSystem() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported');
        soundEnabled = false;
    }
}

// 生成音效
function playSound(type) {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency, duration, volume;
    
    switch(type) {
        case 'move':
            frequency = 220; // A3
            duration = 0.1;
            volume = 0.1;
            break;
        case 'rotate':
            frequency = 330; // E4
            duration = 0.08;
            volume = 0.08;
            break;
        case 'drop':
            frequency = 110; // A2
            duration = 0.15;
            volume = 0.15;
            break;
        case 'clear':
            frequency = 440; // A4
            duration = 0.3;
            volume = 0.2;
            break;
        default:
            return;
    }
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type === 'clear' ? 'square' : 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// 为消行添加特殊音效
function playClearSound(lineCount) {
    if (!soundEnabled || !audioContext) return;
    
    const frequencies = [440, 554, 659, 880]; // A4, C#5, E5, A5
    const baseTime = audioContext.currentTime;
    
    for (let i = 0; i < lineCount; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequencies[i] || 880, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 50);
    }
}


// 2. 游戏核心类和函数
// ===================================
class Piece {
    constructor(shape, context) {
        this.shape = shape;
        this.color = COLORS[shape.flat().find(val => val > 0)];
        this.ctx = context;
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    draw(isGhost = false) {
        if (isGhost && !settings.showGhost) return;
        
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const blockX = (this.x + x) * BLOCK_SIZE;
                    const blockY = (this.y + y) * BLOCK_SIZE;
                    
                    this.ctx.save();
                    
                    if (isGhost) {
                        this.ctx.globalAlpha = GHOST_ALPHA;
                    }
                    
                    // 创建液态玻璃效果的渐变
                    const gradient = this.ctx.createLinearGradient(
                        blockX, blockY, 
                        blockX + BLOCK_SIZE, blockY + BLOCK_SIZE
                    );
                    
                    // 解析渐变颜色
                    const colorMatch = this.color.match(/rgba\([^)]+\)/g);
                    if (colorMatch && colorMatch.length >= 2) {
                        gradient.addColorStop(0, colorMatch[0]);
                        gradient.addColorStop(1, colorMatch[1]);
                    } else {
                        // 备用颜色
                        gradient.addColorStop(0, 'rgba(88, 166, 255, 0.9)');
                        gradient.addColorStop(1, 'rgba(88, 166, 255, 0.7)');
                    }
                    
                    // 绘制主体
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    // 添加玻璃高光效果
                    const highlightGradient = this.ctx.createLinearGradient(
                        blockX, blockY, 
                        blockX + BLOCK_SIZE * 0.6, blockY + BLOCK_SIZE * 0.6
                    );
                    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    this.ctx.fillStyle = highlightGradient;
                    this.ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    // 添加边框
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(blockX + 0.5, blockY + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                    
                    this.ctx.restore();
                }
            });
        });
    }
}

function generateBag() {
    const pieces = [1, 2, 3, 4, 5, 6, 7];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    bag.push(...pieces);
}

function getNextFromBag() {
    if (bag.length < 7) generateBag();
    return new Piece(TETROMINOS[bag.shift()], ctx);
}

function rotate(p, dir) {
    let tempShape;
    if (dir === 1) { // Clockwise
        tempShape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex]).reverse());
    } else if (dir === -1) { // Counter-clockwise
        tempShape = p.shape[0].map((_, colIndex) => p.shape.map(row => row[colIndex])).reverse();
    } else if (dir === 2) { // 180 degrees
        tempShape = p.shape.map(row => [...row].reverse()).reverse();
    } else {
        return;
    }

    const originalShape = p.shape;
    const originalX = p.x;
    p.shape = tempShape;

    let offset = 0;
    while (checkCollision(p, grid)) {
        offset = (offset >= 0) ? -(offset + 1) : -offset;
        p.x += offset;
        if (Math.abs(offset) > p.shape[0].length + 1) {
            p.shape = originalShape;
            p.x = originalX;
            return;
        }
    }
    playSound('rotate');
}

function checkCollision(p, g) {
    return p.shape.some((row, dy) => 
        row.some((value, dx) => {
            if (value === 0) return false;
            const newX = p.x + dx;
            const newY = p.y + dy;
            return newX < 0 || newX >= COLS || newY >= ROWS || (g[newY] && g[newY][newX] !== 0);
        })
    );
}

function lockPiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0 && piece.y + y >= 0) {
               grid[piece.y + y][piece.x + x] = value;
            }
        });
    });
}

function clearLines() {
    const newGrid = grid.filter(row => row.some(cell => cell === 0));
    const clearedCount = ROWS - newGrid.length;

    if (clearedCount > 0) {
        isAnimating = true;
        playClearSound(clearedCount);
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            flashCount++;
            if (flashCount >= 4) {
                clearInterval(flashInterval);
                isAnimating = false;
                for (let i = 0; i < clearedCount; i++) {
                    newGrid.unshift(Array(COLS).fill(0));
                }
                grid = newGrid;
                updateScore(clearedCount);
                spawnNewPiece();
            }
        }, 60);
    } else {
        spawnNewPiece();
    }
}

function spawnNewPiece() {
    piece = nextPieces.shift();
    piece.ctx = ctx;
    nextPieces.push(getNextFromBag());
    canHold = true;
    if (checkCollision(piece, grid)) {
        gameOver();
    }
}

function updateScore(clearedCount) {
    const linePoints = [0, 100, 300, 500, 800];
    score += linePoints[clearedCount] * level;
    lines += clearedCount;
    
    if (gameMode === 'CLASSIC') {
        level = Math.floor(lines / 10) + 1;
        // 增强版等级下落速度：更快的速度递增
        // 1级: 1000ms, 2级: 850ms, 3级: 700ms, 4级: 550ms, 5级: 400ms
        // 6级: 300ms, 7级: 200ms, 8级: 150ms, 9级: 100ms, 10级+: 50ms
        if (level <= 5) {
            dropInterval = Math.max(400, 1000 - (level - 1) * 150);
        } else if (level <= 8) {
            dropInterval = Math.max(100, 400 - (level - 5) * 100);
        } else if (level === 9) {
            dropInterval = 100;
        } else {
            dropInterval = 50; // 10级及以上保持最高速度
        }
    } else if (gameMode === 'SPRINT' && lines >= 40) {
        gameOver();
    }
    updateUI();
}

function handleHold() {
    if (!canHold) return;

    if (holdPiece) {
        [piece, holdPiece] = [new Piece(holdPiece.shape, ctx), new Piece(piece.shape, holdCtx)];
        piece.x = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
        piece.y = 0;
        if (checkCollision(piece, grid)) {
            gameOver();
        }
    } else {
        holdPiece = new Piece(piece.shape, holdCtx);
        spawnNewPiece();
    }
    canHold = false;
    drawHoldPiece();
}

// 3. Game State & Main Loop
// ===================================
function startGame(mode) {
    // 初始化音频系统（需要用户交互）
    if (!audioContext) {
        initAudioSystem();
    }
    
    // 恢复音频上下文（如果被暂停）
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    gameMode = mode;
    gameState = 'PLAYING';
    
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    bag = [];
    nextPieces = [];
    for (let i = 0; i < 5; i++) {
        nextPieces.push(getNextFromBag());
    }
    spawnNewPiece();

    holdPiece = null;
    canHold = true;
    isAnimating = false;

    score = 0; lines = 0; level = 1;
    dropInterval = 1000;
    
    Object.keys(keysPressed).forEach(key => keysPressed[key] = false);
    Object.keys(moveState).forEach(dir => {
        moveState[dir].timer = 0;
        moveState[dir].arrTimer = 0;
    });

    [startScreen, pauseScreen, gameOverScreen, settingsScreen, quitConfirmOverlay, restartConfirmOverlay].forEach(s => s.classList.remove('visible'));
    
    if (gameMode === 'SPRINT') {
        sprintTimerBox.style.display = 'block';
        sprintStartTime = Date.now();
        sprintIntervalId = setInterval(() => {
            if (gameState === 'PLAYING') {
                const elapsed = (Date.now() - sprintStartTime) / 1000;
                sprintTimerEl.textContent = elapsed.toFixed(2);
            }
        }, 50);
    } else {
        sprintTimerBox.style.display = 'none';
    }

    loadHighScore();
    updateUI();
    drawHoldPiece();
    
    lastTime = 0;
    gameLoop();
}

function showStartScreen() {
    startScreen.classList.add('visible');
    gameOverScreen.classList.remove('visible');
    settingsScreen.classList.remove('visible');
    document.getElementById('aboutScreen').classList.remove('visible');
    gameState = 'MENU';
}

function togglePause() {
    if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;
    gameState = (gameState === 'PAUSED') ? 'PLAYING' : 'PAUSED';
    pauseScreen.classList.toggle('visible', gameState === 'PAUSED');
    if (gameState === 'PLAYING') gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    saveHighScore();
    
    if (gameMode === 'SPRINT') {
        clearInterval(sprintIntervalId);
        finalScoreText.innerHTML = (lines >= 40)
            ? `40行完成!<br>时间: ${sprintTimerEl.textContent}`
            : `游戏结束<br>行数: ${lines} / 40`;
    } else {
        finalScoreText.innerHTML = `最终得分: ${score}`;
    }
    
    gameOverScreen.classList.add('visible');
}

function handleMovement(deltaTime) {
    if (isAnimating || gameState !== 'PLAYING') return;

    if (keysPressed[settings.keybindings.moveLeft]) moveState.left.timer += deltaTime;
    if (keysPressed[settings.keybindings.moveRight]) moveState.right.timer += deltaTime;
    if (keysPressed[settings.keybindings.softDrop]) moveState.down.timer += deltaTime;

    if (moveState.left.timer > settings.das) {
        moveState.left.arrTimer += deltaTime;
        if (moveState.left.arrTimer > settings.arr) {
            const oldX = piece.x;
            piece.x--;
            if (checkCollision(piece, grid)) {
                piece.x++;
            } else if (oldX !== piece.x) {
                playSound('move');
            }
            moveState.left.arrTimer = 0;
        }
    }
    if (moveState.right.timer > settings.das) {
        moveState.right.arrTimer += deltaTime;
        if (moveState.right.arrTimer > settings.arr) {
            const oldX = piece.x;
            piece.x++;
            if (checkCollision(piece, grid)) {
                piece.x--;
            } else if (oldX !== piece.x) {
                playSound('move');
            }
            moveState.right.arrTimer = 0;
        }
    }
    if (moveState.down.timer > 0) {
         moveState.down.arrTimer += deltaTime;
         if(moveState.down.arrTimer > settings.arr / 2){
            const oldY = piece.y;
            piece.y++;
            if (checkCollision(piece, grid)) {
                piece.y--;
            } else {
                if (gameMode === 'CLASSIC') score += 1;
                dropCounter = 0;
                if (oldY !== piece.y) {
                    playSound('move');
                }
            }
            moveState.down.arrTimer = 0;
         }
    }
}

function gameLoop(time = 0) {
    if (gameState !== 'PLAYING') return;

    const deltaTime = time - lastTime;
    lastTime = time;

    handleMovement(deltaTime);

    if (!isAnimating) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            piece.y++;
            if (checkCollision(piece, grid)) {
                piece.y--;
                playSound('drop');
                lockPiece();
                clearLines();
            }
            dropCounter = 0;
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// 4. Drawing & UI
// ===================================
function draw() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const blockX = x * BLOCK_SIZE;
                const blockY = y * BLOCK_SIZE;
                
                // 创建液态玻璃效果的渐变
                const gradient = ctx.createLinearGradient(
                    blockX, blockY, 
                    blockX + BLOCK_SIZE, blockY + BLOCK_SIZE
                );
                
                // 解析渐变颜色
                const color = COLORS[value];
                const colorMatch = color.match(/rgba\([^)]+\)/g);
                if (colorMatch && colorMatch.length >= 2) {
                    gradient.addColorStop(0, colorMatch[0]);
                    gradient.addColorStop(1, colorMatch[1]);
                } else {
                    // 备用颜色
                    gradient.addColorStop(0, 'rgba(88, 166, 255, 0.9)');
                    gradient.addColorStop(1, 'rgba(88, 166, 255, 0.7)');
                }
                
                // 绘制主体
                ctx.fillStyle = gradient;
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                
                // 添加玻璃高光效果
                const highlightGradient = ctx.createLinearGradient(
                    blockX, blockY, 
                    blockX + BLOCK_SIZE * 0.6, blockY + BLOCK_SIZE * 0.6
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = highlightGradient;
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                
                // 添加边框
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(blockX + 0.5, blockY + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });
    
    if (gameState === 'PLAYING' && !isAnimating) {
        const ghost = new Piece(piece.shape, ctx);
        ghost.x = piece.x; ghost.y = piece.y;
        while (!checkCollision(ghost, grid)) ghost.y++;
        ghost.y--;
        ghost.draw(true);
        piece.draw();
    }
    
    drawNextPieces();
}

function drawPreview(p, context) {
    const canvasEl = context.canvas;
    context.fillStyle = BG_COLOR;
    context.fillRect(0, 0, canvasEl.width, canvasEl.height);
    if (!p) return;
    
    const shape = p.shape;
    const blockSize = Math.min(canvasEl.width / 6, canvasEl.height / 6);
    const shapeWidth = shape[0].length * blockSize;
    const shapeHeight = shape.length * blockSize;
    const startX = (canvasEl.width - shapeWidth) / 2;
    const startY = (canvasEl.height - shapeHeight) / 2;
    
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const blockX = startX + x * blockSize;
                const blockY = startY + y * blockSize;
                
                // 创建液态玻璃效果的渐变
                const gradient = context.createLinearGradient(
                    blockX, blockY, 
                    blockX + blockSize, blockY + blockSize
                );
                
                // 解析渐变颜色
                const color = COLORS[value];
                const colorMatch = color.match(/rgba\([^)]+\)/g);
                if (colorMatch && colorMatch.length >= 2) {
                    gradient.addColorStop(0, colorMatch[0]);
                    gradient.addColorStop(1, colorMatch[1]);
                } else {
                    gradient.addColorStop(0, 'rgba(88, 166, 255, 0.9)');
                    gradient.addColorStop(1, 'rgba(88, 166, 255, 0.7)');
                }
                
                // 绘制主体
                context.fillStyle = gradient;
                context.fillRect(blockX, blockY, blockSize, blockSize);
                
                // 添加玻璃高光效果
                const highlightGradient = context.createLinearGradient(
                    blockX, blockY, 
                    blockX + blockSize * 0.6, blockY + blockSize * 0.6
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                context.fillStyle = highlightGradient;
                context.fillRect(blockX, blockY, blockSize, blockSize);
                
                // 添加边框
                context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                context.lineWidth = 1;
                context.strokeRect(blockX + 0.5, blockY + 0.5, blockSize - 1, blockSize - 1);
            }
        });
    });
}

const drawNextPieces = () => nextPieces.forEach((p, i) => drawPreview(p, nextPreviewContexts[i]));
const drawHoldPiece = () => drawPreview(holdPiece, holdCtx);

function updateUI() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = (gameMode === 'SPRINT') ? `${lines} / 40` : lines;
    highScoreEl.textContent = highScore;
}

function loadHighScore() {
    highScore = parseInt(localStorage.getItem('tetrisHighScore_v4') || 0, 10);
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore_v4', highScore);
        updateUI(); // FIX: Update UI immediately when a new high score is set.
    }
}

// 5. Settings & Keybinding
// ===================================
function loadSettings() {
    const savedSettings = localStorage.getItem('tetrisSettings_v3');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
}

function saveSettings() {
    settings.das = parseInt(dasSlider.value, 10);
    settings.arr = parseInt(arrSlider.value, 10);
    settings.showGhost = ghostToggle.checked;
    localStorage.setItem('tetrisSettings_v3', JSON.stringify(settings));
    showStartScreen();
}

function showSettingsScreen() {
    startScreen.classList.remove('visible');
    settingsScreen.classList.add('visible');

    dasSlider.value = settings.das;
    dasValue.textContent = settings.das;
    arrSlider.value = settings.arr;
    arrValue.textContent = settings.arr;
    ghostToggle.checked = settings.showGhost;
    updateKeybindingButtons();
}

function showAboutScreen() {
    startScreen.classList.remove('visible');
    document.getElementById('aboutScreen').classList.add('visible');
}

dasSlider.addEventListener('input', (e) => dasValue.textContent = e.target.value);
arrSlider.addEventListener('input', (e) => arrValue.textContent = e.target.value);

function updateKeybindingButtons() {
    document.querySelectorAll('.keybind-button').forEach(button => {
        const action = button.dataset.action;
        button.textContent = formatKeyName(settings.keybindings[action]);
    });
}

function startRebinding(action, button) {
    if (isRebinding) return;
    isRebinding = true;
    button.textContent = "按下一个键";
    button.classList.add('is-binding');

    const keydownHandler = (e) => {
        e.preventDefault();
        const newKey = e.key.toLowerCase();
        
        for(const act in settings.keybindings){
            if(settings.keybindings[act] === newKey){
                settings.keybindings[act] = null;
            }
        }

        settings.keybindings[action] = newKey;
        isRebinding = false;
        button.classList.remove('is-binding');
        updateKeybindingButtons();
        window.removeEventListener('keydown', keydownHandler, true);
    };
    
    window.addEventListener('keydown', keydownHandler, true);
}

document.querySelectorAll('.keybind-button').forEach(button => {
    button.addEventListener('click', () => {
        startRebinding(button.dataset.action, button);
    });
});

function formatKeyName(key) {
    if (!key) return 'N/A';
    const keyMap = {
        'arrowup': '↑', 'arrowdown': '↓', 'arrowleft': '←', 'arrowright': '→', ' ': '空格'
    };
    return keyMap[key] || key.toUpperCase();
}

// 6. Controls Event Listeners
// ===================================
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    
    if (key === settings.keybindings.pause) {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') togglePause();
        return;
    }

    if (key === 'escape' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
        if (!quitConfirmTimer && !e.repeat) {
            quitConfirmOverlay.classList.add('visible');
            quitConfirmTimer = setTimeout(() => {
                quitConfirmOverlay.classList.remove('visible');
                showStartScreen();
            }, QUIT_HOLD_DURATION);
        }
        return;
    }
    
    if (key === 'r' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
        if (!restartConfirmTimer && !e.repeat) {
            restartConfirmOverlay.classList.add('visible');
            restartConfirmTimer = setTimeout(() => {
                restartConfirmOverlay.classList.remove('visible');
                startGame(gameMode);
            }, RESTART_HOLD_DURATION);
        }
        return;
    }

    if (isRebinding) return;
    
    if (keysPressed[key] && [settings.keybindings.moveLeft, settings.keybindings.softDrop, settings.keybindings.moveRight].includes(key)) return;
    keysPressed[key] = true;

    if (gameState !== 'PLAYING' || isAnimating) return;

    let actionTaken = true;
    
    if (!e.repeat) {
        if (key === settings.keybindings.hardDrop) {
            while (!checkCollision(piece, grid)) piece.y++;
            piece.y--;
            playSound('drop');
            lockPiece();
            clearLines();
            actionTaken = false;
        } else if (key === settings.keybindings.moveLeft) {
            const oldX = piece.x;
            piece.x--;
            if (checkCollision(piece, grid)) {
                piece.x++;
            } else if (oldX !== piece.x) {
                playSound('move');
            }
        } else if (key === settings.keybindings.moveRight) {
            const oldX = piece.x;
            piece.x++;
            if (checkCollision(piece, grid)) {
                piece.x--;
            } else if (oldX !== piece.x) {
                playSound('move');
            }
        } else if (key === settings.keybindings.softDrop) {
            const oldY = piece.y;
            piece.y++;
            if (checkCollision(piece, grid)) {
                piece.y--;
            } else {
                dropCounter = 0;
                if (gameMode === 'CLASSIC') score += 1;
                if (oldY !== piece.y) {
                    playSound('move');
                }
            }
        } else if (key === settings.keybindings.rotate180) {
            rotate(piece, 2);
        } else if (key === settings.keybindings.rotateCW) {
            rotate(piece, 1);
        } else if (key === settings.keybindings.rotateCCW) {
            rotate(piece, -1);
        } else if (key === settings.keybindings.hold) {
            handleHold();
        } else {
            actionTaken = false;
        }
    } else {
        actionTaken = false;
    }

    if (actionTaken) {
         draw();
    }
});

document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    
    if (key === 'escape') {
        clearTimeout(quitConfirmTimer);
        quitConfirmTimer = null;
        quitConfirmOverlay.classList.remove('visible');
    }
    
    if (key === 'r') {
        clearTimeout(restartConfirmTimer);
        restartConfirmTimer = null;
        restartConfirmOverlay.classList.remove('visible');
    }

    keysPressed[key] = false;
    if (key === settings.keybindings.moveLeft) {
        moveState.left.timer = 0;
        moveState.left.arrTimer = 0;
    } else if (key === settings.keybindings.moveRight) {
        moveState.right.timer = 0;
        moveState.right.arrTimer = 0;
    } else if (key === settings.keybindings.softDrop) {
        moveState.down.timer = 0;
        moveState.down.arrTimer = 0;
    }
});

// 添加用户交互事件来启动音频
document.addEventListener('click', function initAudioOnFirstClick() {
    if (!audioContext) {
        initAudioSystem();
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // 移除事件监听器，只需要执行一次
    document.removeEventListener('click', initAudioOnFirstClick);
});

// 键盘事件也可以启动音频
document.addEventListener('keydown', function initAudioOnFirstKey() {
    if (!audioContext) {
        initAudioSystem();
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // 移除事件监听器，只需要执行一次
    document.removeEventListener('keydown', initAudioOnFirstKey);
});

// Initial Load
loadSettings();
loadHighScore();
updateUI();

// 预初始化音频系统（但不会真正启动，直到用户交互）
initAudioSystem();

// 全局函数，供HTML调用
window.startGame = startGame;
window.showStartScreen = showStartScreen;
window.showSettingsScreen = showSettingsScreen;
window.showAboutScreen = showAboutScreen;
window.saveSettings = saveSettings;
window.togglePause = togglePause;