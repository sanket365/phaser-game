const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player, cursors, platforms, bullets, enemies, fireKey, healthText;
let health = 3; 
let lastFired = 0; 
let gameOverScreen, restartButton, exitButton;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('button', 'assets/button.png'); 
}

function create() {
    this.add.image(400, 300, 'background');

    // Create Platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 580, 'ground').setScale(2).refreshBody();

    // Create Player
    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Create Bullets
    bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 10 });

    // Create Enemies
    enemies = this.physics.add.group();
    this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    this.physics.add.collider(bullets, enemies, destroyEnemy, null, this);
    this.physics.add.collider(player, enemies, playerHit, null, this);

    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Health UI
    healthText = this.add.text(20, 20, 'Health: 3 ❤️', { fontSize: '20px', fill: '#fff' });

    // ✅ Create Game Over UI (Hidden Initially)
    gameOverScreen = this.add.container(400, 300).setVisible(false);

    let gameOverText = this.add.text(0, -50, 'Game Over!', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
    
    restartButton = this.add.image(0, 20, 'button').setInteractive().setScale(0.5);
    let restartText = this.add.text(0, 20, 'Restart', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);
    
    exitButton = this.add.image(0, 80, 'button').setInteractive().setScale(0.5);
    let exitText = this.add.text(0, 80, 'Exit', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);

    // ✅ Add Functionality to Restart Button
    restartButton.on('pointerdown', () => {
        health = 3;
        gameOverScreen.setVisible(false);
        player.clearTint();
        this.scene.restart(); 
    });

    // ✅ Add Functionality to Exit Button
    exitButton.on('pointerdown', () => {
        window.location.reload(); // ✅ Reload the page to fully reset the game
    });

    gameOverScreen.add([gameOverText, restartButton, restartText, exitButton, exitText]);
}

function update(time) {
    player.setVelocityX(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    }

    if (cursors.up.isDown && player.body.onFloor()) {
        player.setVelocityY(-400);
    }

    if (Phaser.Input.Keyboard.JustDown(fireKey) && time > lastFired) {
        shootBullet();
        lastFired = time + 300;
    }

    enemies.children.iterate(function (enemy) {
        if (enemy.active) {
            let direction = player.x > enemy.x ? 1 : -1;
            enemy.setVelocityX(100 * direction); 
        }
    });
}

function shootBullet() {
    let bullet = bullets.create(player.x + 30, player.y, 'bullet');
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.allowGravity = false;
        bullet.setVelocityX(300);
    }
}

function spawnEnemy() {
    let enemyY = Phaser.Math.Between(300, 500); 
    let enemy = enemies.create(800, enemyY, 'enemy'); 
    enemy.setCollideWorldBounds(true);
    enemy.setVelocityX(-100); 
}

function destroyEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
}

function playerHit(player, enemy) {
    enemy.destroy(); 
    health--; 
    healthText.setText('Health: ' + health + ' ❤️'); 

    if (health <= 0) {
        gameOver(this); 
    }
}

function gameOver(scene) {
    player.setTint(0xff0000); // Make player red
    player.setVelocity(0, 0); // Stop movement
    scene.physics.pause(); // ✅ Properly pause the physics

    // Create a semi-transparent overlay
    let overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7); // Dark background
    overlay.fillRect(0, 0, scene.game.config.width, scene.game.config.height);

    // Display "Game Over" text
    let gameOverText = scene.add.text(scene.game.config.width / 2, 200, 'Game Over!', {
        fontSize: '50px',
        fill: '#fff',
        fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Create Restart Button
    let restartButton = scene.add.text(scene.game.config.width / 2, 300, 'Restart', {
        fontSize: '30px',
        fill: '#0f0',
        fontFamily: 'Arial',
        backgroundColor: '#222',
        padding: { x: 15, y: 10 }
    }).setOrigin(0.5).setInteractive();

    restartButton.on('pointerdown', () => {
        scene.scene.restart(); // ✅ Restart the scene properly
    });

    // Create Exit Button
    let exitButton = scene.add.text(scene.game.config.width / 2, 360, 'Exit', {
        fontSize: '30px',
        fill: '#f00',
        fontFamily: 'Arial',
        backgroundColor: '#222',
        padding: { x: 15, y: 10 }
    }).setOrigin(0.5).setInteractive();

    exitButton.on('pointerdown', () => {
        window.location.reload(); // ✅ Reload the page to fully reset the game
    });

    // Add elements to the scene
    scene.add.container(0, 0, [overlay, gameOverText, restartButton, exitButton]);
}
