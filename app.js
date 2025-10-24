const player = document.getElementById('player');
const gameArea = document.getElementById('game-area');
const lifeDisplay = document.getElementById('life-display');
const timeDisplay = document.getElementById('time-display');
const messageLog = document.getElementById('message-log');
const configPanel = document.getElementById('config-panel');
const configToggle = document.getElementById('config-toggle');

let meteoros = []; 
let powerUps = []; 

let playerPosition = { x: 500, y: 350 }; 

let isRunning = false; 
let isInvulnerable = false; 
let currentLife = 3; 
let animationFrameId;

let score = 0;
let scoreInterval; 
let spawnInterval; 
let powerUpInterval; 

let gameSettings = {
    numEnemies: 1, 
    speedFactor: 1.0, 
    startLife: 3, 
    baseSpeed: 10, 
    invulnerabilityDuration: 1000
};

const sizes = {
    player: 30, 
    large: 40,  
    small: 25,
    powerUp: 30
};

player.style.width = `${sizes.player}px`;
player.style.height = `${sizes.player}px`;

let uniqueIdCounter = 0; 


function updateMessage(message, type = 'default') {
    messageLog.textContent = message;
    const colorMap = {
        'damage': '#e74c3c', 
        'heal': '#2ecc71',   
        'default': '#2ecc71'
    };
    messageLog.style.color = colorMap[type] || colorMap['default'];
}

function startScoreCounter() {
    score = 0;
    timeDisplay.textContent = score;
    scoreInterval = setInterval(() => {
        score++;
        timeDisplay.textContent = score;
    }, 1000);
}

function stopScoreCounter() {
    clearInterval(scoreInterval);
    scoreInterval = null;
}


function createMeteor(x, y, type = 'large') {
    const size = sizes[type];
    const id = `meteor-${uniqueIdCounter++}`;
    const newMeteor = document.createElement('div');
    newMeteor.classList.add('character', 'meteor', type);
    newMeteor.id = id;
    newMeteor.style.width = `${size}px`;
    newMeteor.style.height = `${size}px`;
    gameArea.appendChild(newMeteor);

    meteoros.push({
        id: id,
        x: x, 
        y: y,
        type: type,
        size: size,
        element: newMeteor
    });
}

function spawnMeteor() {
    const type = Math.random() < 0.7 ? 'small' : 'large'; 
    const size = sizes[type];
    const side = Math.floor(Math.random() * 4); 
    let x, y;

    switch (side) {
        case 0: x = Math.random() * gameArea.clientWidth; y = -size; break;
        case 1: x = gameArea.clientWidth; y = Math.random() * gameArea.clientHeight; break;
        case 2: x = Math.random() * gameArea.clientWidth; y = gameArea.clientHeight; break;
        case 3: x = -size; y = Math.random() * gameArea.clientHeight; break;
    }

    createMeteor(x, y, type);
}

function startSpawnMechanism() {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnMeteor, 1000); 
}

function spawnPowerUp() {
    const type = 'health'; 
    const size = sizes.powerUp;
    const x = Math.random() * (gameArea.clientWidth - size);
    const y = Math.random() * (gameArea.clientHeight - size);

    const id = `powerup-${uniqueIdCounter++}`;
    const newPowerUp = document.createElement('div');
    newPowerUp.classList.add('character', 'power-up', `${type}-powerup`);
    newPowerUp.id = id;
    newPowerUp.textContent = ''; 
    gameArea.appendChild(newPowerUp);

    powerUps.push({
        id: id,
        x: x, 
        y: y,
        type: type,
        size: size,
        element: newPowerUp
    });
}

function startPowerUpSpawn() {
    if (powerUpInterval) clearInterval(powerUpInterval);
    powerUpInterval = setInterval(spawnPowerUp, 10000); 
}


function updateLifeDisplay() {
    const maxLife = gameSettings.startLife;
    lifeDisplay.textContent = '❤️'.repeat(currentLife) + '🖤'.repeat(Math.max(0, maxLife - currentLife));
}

function activateInvulnerability() {
    isInvulnerable = true;
    player.classList.add('flashing'); 

    setTimeout(() => {
        isInvulnerable = false;
        player.classList.remove('flashing'); 
        if (isRunning) updateMessage('Juego en curso...');
    }, gameSettings.invulnerabilityDuration);
}

function pauseGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    isRunning = false;
    stopScoreCounter();
    clearInterval(spawnInterval); 
    clearInterval(powerUpInterval);
    
    configPanel.classList.remove('hidden'); 
    gameArea.style.border = '5px solid #e67e22'; 
    configToggle.textContent = '▶️ Reanudar (ENTER)';
    updateMessage('Juego PAUSADO. Presiona ENTER para reanudar.', 'damage');
}

function resumeGame() {
    if (!isRunning) {
        isRunning = true;
        configPanel.classList.add('hidden');
        gameArea.style.border = '5px solid #3498db'; 
        configToggle.textContent = '⚙️ Configuración (ENTER)';
        
        startScoreCounter();
        startSpawnMechanism(); 
        startPowerUpSpawn(); 
        updateMessage('Juego Reanudado. ¡Mucha suerte!');

        if (!animationFrameId) gameLoop();
    }
}

function resetGame() {
    playerPosition = { 
        x: gameArea.clientWidth / 2 - sizes.player / 2, 
        y: gameArea.clientHeight / 2 - sizes.player / 2 
    };
    
    currentLife = gameSettings.startLife;
    isInvulnerable = false;
    player.classList.remove('flashing');
    
    document.querySelectorAll('.meteor, .power-up').forEach(el => el.remove());
    meteoros = [];
    powerUps = [];

    for (let i = 0; i < gameSettings.numEnemies; i++) {
        const x = Math.random() * (gameArea.clientWidth - sizes.large);
        const y = Math.random() * (gameArea.clientHeight - sizes.large);
        createMeteor(x, y, 'large');
    }

    updateLifeDisplay();
    updatePosition();
}

function applySettingsAndRestart() {
    pauseGame(); 

    gameSettings.numEnemies = Math.min(5, Math.max(0, parseInt(document.getElementById('num-enemies').value)));
    gameSettings.speedFactor = Math.min(3, Math.max(1, parseInt(document.getElementById('speed-factor').value)));
    gameSettings.startLife = Math.min(5, Math.max(1, parseInt(document.getElementById('start-life').value)));

    resetGame();
    updateMessage('Configuración aplicada. Presiona ENTER para jugar.');
}


function updatePosition() {
    player.style.transform = `translate(${playerPosition.x}px, ${playerPosition.y}px)`;
    
    meteoros.forEach(meteor => {
        meteor.element.style.transform = `translate(${meteor.x}px, ${meteor.y}px)`;
    });
    
    powerUps.forEach(p => {
        p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
}

function moveMeteors() {
    const currentSpeed = gameSettings.speedFactor * gameSettings.baseSpeed * 0.1; 
    const separationDistance = 70; 

    meteoros.forEach(meteor => {
        meteoros.forEach(other => {
            if (meteor.id === other.id) return;
            const dx_repel = other.x - meteor.x;
            const dy_repel = other.y - meteor.y;
            const dist = Math.sqrt(dx_repel * dx_repel + dy_repel * dy_repel);

            if (dist < separationDistance) {
                const repelFactor = (separationDistance - dist) / separationDistance;
                meteor.x -= dx_repel * repelFactor * 0.1; 
                meteor.y -= dy_repel * repelFactor * 0.1;
            }
        });


        let dx = playerPosition.x - meteor.x;
        let dy = playerPosition.y - meteor.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        if (distanceToPlayer > currentSpeed) {
            meteor.x += (dx / distanceToPlayer) * currentSpeed;
            meteor.y += (dy / distanceToPlayer) * currentSpeed;
        } 

        meteor.x = Math.round(meteor.x);
        meteor.y = Math.round(meteor.y);
    });
}

function checkCollisions() {
    const playerSize = sizes.player;
    const playerCenter = { x: playerPosition.x + playerSize / 2, y: playerPosition.y + playerSize / 2 };

    meteoros = meteoros.filter(meteor => {
        const meteorCenter = { x: meteor.x + meteor.size / 2, y: meteor.y + meteor.size / 2 };
        const minDistance = (playerSize / 2) + (meteor.size / 2);
        
        const dist = Math.sqrt(Math.pow(playerCenter.x - meteorCenter.x, 2) + Math.pow(playerCenter.y - meteorCenter.y, 2));

        if (dist < minDistance * 0.8) {
            if (!isInvulnerable) {
                currentLife--; 
                updateLifeDisplay();
                
                if (currentLife <= 0) { 
                    pauseGame();
                    updateMessage(`💀 Game Over. Tiempo de supervivencia: ${score}s.`, 'damage');
                } else {
                    updateMessage(`💔 Daño recibido! Vida restante: ${currentLife}`, 'damage');
                    activateInvulnerability();
                }
            }
        }
        return true;
    });

    powerUps = powerUps.filter(p => {
        const powerUpCenter = { x: p.x + p.size / 2, y: p.y + p.size / 2 };
        const minDistance = (playerSize / 2) + (p.size / 2);
        
        const dist = Math.sqrt(Math.pow(playerCenter.x - powerUpCenter.x, 2) + Math.pow(playerCenter.y - powerUpCenter.y, 2));

        if (dist < minDistance * 0.9) {
            p.element.remove(); 
            
            if (p.type === 'health') {
                if (currentLife < gameSettings.startLife) {
                    currentLife = Math.min(gameSettings.startLife, currentLife + 1);
                    updateLifeDisplay();
                    updateMessage('💚 ¡Salud! Vida restaurada.', 'heal');
                } else {
                    updateMessage('La vida ya está al máximo. ¡Sigue esquivando!', 'default');
                }
            }
            return false;
        }
        return true;
    });
}

function gameLoop() {
    if (isRunning) {
        moveMeteors();
        checkCollisions();
        updatePosition();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}


gameArea.addEventListener('mousemove', (event) => {
    if (!isRunning) return; 

    const rect = gameArea.getBoundingClientRect();
    let newX = event.clientX - rect.left - sizes.player / 2;
    let newY = event.clientY - rect.top - sizes.player / 2;

    playerPosition.x = Math.max(0, Math.min(gameArea.clientWidth - sizes.player, newX));
    playerPosition.y = Math.max(0, Math.min(gameArea.clientHeight - sizes.player, newY));
});

configToggle.addEventListener('click', () => {
    if (isRunning) {
        pauseGame();
    } else {
        resumeGame();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { 
        event.preventDefault(); 
        
        if (isRunning) {
            pauseGame();
        } else {
            resumeGame();
        }
    }
});

document.getElementById('apply-config').addEventListener('click', applySettingsAndRestart);

applySettingsAndRestart();