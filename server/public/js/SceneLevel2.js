class SceneLevel2 extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneLevel2' });
    }
  
    preload() {
        // images
        this.load.image('sprEnemy1', 'assets/P3SpaceShooterContent/sprEnemy1.png');       
        this.load.image('sprLaserEnemy0', 'assets/P3SpaceShooterContent/sprLaserEnemy0.png');
        this.load.image('sprLaserPlayer', 'assets/P3SpaceShooterContent/sprLaserPlayer.png');
        this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');

        // spritesheets
        this.load.spritesheet('sprPlayer', 
            'assets/games/invaders/player.png', 
            { frameWidth: 28, frameHeight: 21 }
        );
        this.load.spritesheet('sprEnemy0', 
            'assets/P3SpaceShooterContent/sprEnemy0.png', 
            { frameWidth: 16, frameHeight: 16 }
        );
        this.load.spritesheet('sprEnemy2', 
            'assets/P3SpaceShooterContent/sprEnemy2.png', 
            { frameWidth: 16, frameHeight: 16 }
        );
        this.load.spritesheet('sprExplosion', 
            'assets/P3SpaceShooterContent/sprExplosion.png', 
            { frameWidth: 32, frameHeight: 32 }
        );

        // sfx
        this.load.audio('sndExplode0', 'assets/P3SpaceShooterContent/sndExplode0.wav');
        this.load.audio('sndExplode1', 'assets/P3SpaceShooterContent/sndExplode1.wav');
        this.load.audio('sndLaser', 'assets/P3SpaceShooterContent/sndLaser.wav');
    }

    create() {
        // draw grid lines
        this.drawLines();

        // animations
        this.anims.create({
            key: 'sprPlayer',
            frames: this.anims.generateFrameNumbers('sprPlayer'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprEnemy0',
            frames: this.anims.generateFrameNumbers('sprEnemy0'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprEnemy2',
            frames: this.anims.generateFrameNumbers('sprEnemy2'),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprExplosion',
            frames: this.anims.generateFrameNumbers('sprExplosion'),
            frameRate: 20,
            repeat: 0
        });

        // sfx
        this.sfx = {
            explosions: [
                this.sound.add('sndExplode0'),
                this.sound.add('sndExplode1')
            ],
            laser: this.sound.add('sndLaser')
        };

        // level text
        lvlText = this.add.text(this.game.config.width * 0.07, this.game.config.height * 0.05, 'Level 2', {
            fontFamily: 'monospace',
            fontSize: 24,
            color: '#ffffff',
            align: 'left'
        });
        lvlText.setOrigin(0.5);

        // energy text
        energyText = this.add.text(this.game.config.width * 0.9, this.game.config.height * 0.05, 'Energy: ' + energy, {
            fontFamily: 'monospace',
            fontSize: 24,
            color: '#ffffff',
            align: 'right'
        });
        energyText.setOrigin(0.5);

        // scrolling background
        this.backgrounds = [];
        for (var i = 0; i < 3; i++) {
            var bg = new ScrollingBackground(this, 'sprBg0', i * 10);
            this.backgrounds.push(bg);
        }

        // create player instance
        this.player = new Player(
            this,
            this.game.config.width * 0.5,
            this.game.config.height - 96,
            'sprPlayer'
        );

        // player movement keys
        this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        // player fire w/ spacbar
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // create turrets
        this.turrets = this.add.group({ classType: Turret});

        // place turret on click
        this.input.on('pointerdown', this.placeTurret);

        // towers
        this.towers = this.add.group({
            classType: Tower,
            key: 'sprEnemy1',
            repeat: 15,
            setXY: { x: 32, y: this.game.config.height - 32, stepX: 64 }
        });

        // create enemy instance groups
        this.enemies = this.add.group();
        this.enemyLasers = this.add.group();
        this.playerLasers = this.add.group();

        // spawn enemies timer event
        this.time.addEvent({
            delay: 1500,
            callback: function() {
                var enemy = null;

                if (Phaser.Math.Between(0, 10) >= 3) {
                    enemy = new GunShip(
                        this,
                        (Phaser.Math.Between(0, 15) * 64) + 32,
                        0   
                    );
                }
                else if (Phaser.Math.Between(0, 10) >= 5) {
                    if (this.getEnemiesByType('ChaserShip').length < 5) {
                        enemy = new ChaserShip(
                            this,
                            (Phaser.Math.Between(0, 15) * 64) + 32,
                            0
                        );
                    }
                }
                else {
                    enemy = new CarrierShip(
                        this,
                        (Phaser.Math.Between(0, 15) * 64) + 32,
                        0
                    );
                }
    
                if (enemy !== null) {
                    enemy.setScale(Phaser.Math.Between(10, 20) * 0.1);
                    this.enemies.add(enemy);
                }
            },
            callbackScope: this,
            loop: true
        });

        // player-enemy collision
        this.physics.add.overlap(this.player, this.enemies, function(player, enemy) {
            if (!player.getData('isDead') &&
                !enemy.getData('isDead')) {
                    player.explode(false);
                    player.onDestroy();
                    enemy.explode(true);
                    energy += 10;
                    energyText.setText('Energy: ' + energy);
            }
        });

        // playerLaser-enemy collision
        this.physics.add.overlap(this.playerLasers, this.enemies, function(playerLaser, enemy) {
            if (enemy) {
                if (enemy.onDestroy !== undefined) {
                    enemy.onDestroy();
                }
                enemy.explode(true);
                playerLaser.destroy();
                energy += 10;
                energyText.setText('Energy: ' + energy);
            }
        });

        // player-laser collision
        this.physics.add.overlap(this.player, this.enemyLasers, function(player, laser) {
            if (!player.getData('isDead') &&
                !laser.getData('isDead')) {
                    player.explode(false);
                    player.onDestroy();
                    laser.destroy();
                    energy += 10;
                    energyText.setText('Energy: ' + energy);
            }
        });

        // turret-enemy collision
        this.physics.add.overlap(this.turrets, this.enemies, function(turret, enemy) {
            if (enemy) {
                if (enemy.onDestroy !== undefined) {
                    enemy.onDestroy();
                }
                enemy.explode(true);
                turret.destroy();
            }
        });

        // enemyLaser-turret collision
        this.physics.add.overlap(this.enemyLasers, this.turrets, function(enemyLaser, turret) {
            if (turret) {
                if (turret.onDestroy !== undefined) {
                    turret.onDestroy();
                }
                turret.explode(true);
                enemyLaser.destroy();
            }
        });

        // enemy-tower collision
        this.physics.add.overlap(this.enemies, this.towers, function(enemy, tower) {
            if (enemy) {
                if (enemy.onDestroy !== undefined) {
                    enemy.onDestroy();
                }
                enemy.explode(true);
                tower.destroy();
            }
        });

        // tower-enemyLaser collision
        this.physics.add.overlap(this.enemyLasers, this.towers, function(enemyLaser, tower) {
            if (tower) {
                if (tower.onDestroy !== undefined) {
                    tower.onDestroy();
                }
                tower.explode(true);
                enemyLaser.destroy();
            }
        });

        this.axis = 0;
        this.axisIncrease = 0;
        this.level = 2;
    }

    getEnemiesByType(type) {
        var arr = [];
        for (var i = 0; i < this.enemies.getChildren().length; i++) {
            var enemy = this.enemies.getChildren()[i];
            if (enemy.getData('type') == type) {
                arr.push(enemy);
            }
        }
        return arr;
    }

    drawLines() {
        // top/enemy row
        var graphics = this.add.graphics();
        graphics.lineStyle(1, 0x85180f, 0.8);
        graphics.moveTo(0, 64);
        graphics.lineTo(this.game.config.width, 64);
        graphics.strokePath();

        // player row
        graphics = this.add.graphics();
        graphics.lineStyle(1, 0x004a05, 0.8);
        graphics.moveTo(0, this.game.config.height - 128);
        graphics.lineTo(this.game.config.width, this.game.config.height - 128);
        graphics.strokePath();

        // bottom row
        graphics = this.add.graphics();
        graphics.lineStyle(1, 0x000987, 0.8);
        graphics.moveTo(0, this.game.config.height - 64);
        graphics.lineTo(this.game.config.width, this.game.config.height - 64);
        for (var i = 0; i < (this.game.config.width / 64); i++) {
            graphics.moveTo(i * 64, this.game.config.height);
            graphics.lineTo(i * 64, this.game.config.height - 64);
        }
        graphics.strokePath();

        // horizotal lines
        graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.8);
        for (var i = 3; i < (this.game.config.height / 64) - 1; i++) {
            graphics.moveTo(0, this.game.config.height - (i * 64));
            graphics.lineTo(this.game.config.width, this.game.config.height - (i * 64));
        }
        // vertical lines
        for (var i = 1; i < (this.game.config.width / 64); i++) {
            graphics.moveTo(i * 64, this.game.config.height - 128);
            graphics.lineTo(i * 64, 64);
        }
        graphics.strokePath();
    }

    placeTurret = (pointer) => {
        var i = Math.floor(pointer.y / 64);
        var j = Math.floor(pointer.x / 64);
        if (this.canPlaceTurret(i, j)) {
            var turret = this.turrets.get();
            if (turret) {
                turret.setActive(true);
                turret.setVisible(true);
                turret.place(i, j);
            }   
        }
    }

    canPlaceTurret(i, j) {
        return map[i][j] === 0;
    }

    update() {
        // while player is still alive
        if (!this.player.getData('isDead')) {
            this.player.update();

            // player movement keys
            if (this.keyLEFT.isDown) {
                this.player.moveLeft();
            }
            else if (this.keyRIGHT.isDown) {
                this.player.moveRight();
            }

            // player fire w/ spacebar
            if (this.keySpace.isDown) {
                this.player.setData('isShooting', true);
            }
            else {  // create delay between laser fire
                this.player.setData('timerShootTick', this.player.getData('timerShootDelay') - 1);
                this.player.setData('isShooting', false);
            }
        }

        for (var i = 0; i < this.turrets.getChildren().length; i++) {
            var turret1 = this.turrets.getChildren()[i];
            turret1.setData('isShooting', true);                    
            turret1.update();
        }

        for (var i = 0; i < this.enemies.getChildren().length; i++) {
            var enemy = this.enemies.getChildren()[i];
            
            enemy.update();
            
            if (enemy.x < -enemy.displayWidth || 
                enemy.x > this.game.config.width + enemy.displayWidth ||
                enemy.y < -enemy.displayHeight * 4 ||
                enemy.y > this.game.config.height + enemy.displayHeight) {
                if (enemy) {
                    if (enemy.onDestroy !== undefined) {
                        enemy.onDestroy();
                    }
                    enemy.destroy();
                }
            }
        }

        for (var i = 0; i < this.enemyLasers.getChildren().length; i++) {
            var laser = this.enemyLasers.getChildren()[i];

            laser.update();

            if (laser.x < -laser.displayWidth ||
                laser.x > this.game.config.width + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > this.game.config.height + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }

        for (var i = 0; i < this.playerLasers.getChildren().length; i++) {
            var laser = this.playerLasers.getChildren()[i];

            laser.update();

            if (laser.x < -laser.displayWidth ||
                laser.x > this.game.config.width + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > this.game.config.height + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }

        // scrolling background
        for (var i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update();
        }

        // advance to next level
        if (energy >= 100) {
            this.scene.start('SceneLevel3');
        }
    }
}