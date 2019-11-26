class Entity extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, type) {
        super(scene, x, y, key);
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this, 0);
        this.setData('type', type);
        this.setData('isDead', false);
    }

    explode(canDestroy) {
        if (!this.getData('isDead')) {
            // Set the texture to the explosion image, then play the animation
            this.setTexture('sprExplosion');  // this refers to the same animation key we used when we added this.anims.create previously
            this.play('sprExplosion'); // play the animation
            // pick a random explosion sound within the array we defined in this.sfx in SceneMain
            this.scene.sfx.explosions[Phaser.Math.Between(0, this.scene.sfx.explosions.length - 1)].play();
            if (this.shootTimer !== undefined) {
                if (this.shootTimer) {
                 this.shootTimer.remove(false);
                }
            }
            this.setAngle(0);
            this.body.setVelocity(0, 0);
            this.on('animationcomplete', function() {
                if (canDestroy) {
                    this.destroy();
                }
                else {
                    this.setVisible(false);
                }
            }, this);
            this.setData('isDead', true);
        }
    }
}

class Player extends Entity {
    constructor(scene, x, y, key) {
        super(scene, x, y, key, 'Player');
        this.setData('speed', 200);
        this.setData('isShooting', true);
        this.setData('timerShootDelay', 10);
        this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    }

    // player movement
    moveLeft() {
        this.body.velocity.x = -this.getData('speed');
    }
    moveRight() {
        this.body.velocity.x = this.getData('speed');
    }

    onDestroy() {
        this.scene.time.addEvent({ // go to game over scene
            delay: 1000,
            callback: function() {
                this.scene.scene.start('SceneGameOver');
            },
            callbackScope: this,
            loop: false
        });
    }

    update() {
        this.body.setVelocity(0, 0);  //

        //
        this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width);

        if (this.getData('isShooting')) {
            if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
                this.setData('timerShootTick', this.getData('timerShootTick') + 1); // every game update, increase timerShootTick by one until we reach the value of timerShootDelay
            }
            else { // when the 'manual timer' is triggered:
                if (this.scene.turretType == 1){
                var laser = new HomingLaser(this.scene, this.x, this.y);
                     console.log(this.scene.turretType);
                }
                
                else{
                     var laser = new PlayerLaser(this.scene, this.x, this.y);
                     console.log(this.scene.turretType);
                }
                this.scene.playerLasers.add(laser);
                this.scene.sfx.laser.play(); // play the laser sound effect
                this.setData('timerShootTick', 0);
            }
        }
    }
}

class PlayerLaser extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprLaserPlayer');
        this.body.velocity.y = -200;
    }
}



class HomingLaser extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprLaserPlayer');
        this.body.velocity.y = -200;
        

        this.states = {
        MOVE_DOWN: 'MOVE_DOWN',
        CHASE: 'CHASE'
        };
        this.state = this.states.MOVE_DOWN;        
    }
    
    
    update() {
        

                
                
            



        if (this.scene.enemies.getChildren()[0]){
            var randomNum = Phaser.Math.Between(0, (this.scene.enemies.getChildren().length)-1);
            
            var enemy = this.scene.enemies.getChildren()[0];
            

                this.state = this.states.CHASE;
            

            if (this.state == this.states.CHASE) {
                var dx = enemy.x - this.x;
                var dy = enemy.y - this.y;

                var angle = Math.atan2(dy, dx);

                var speed = 200;
                this.body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );

                if (this.x < enemy.x) {
                    this.angle -= 5;
                }
                else {
                    this.angle += 5;
                } 
            }
            if (enemy.getData('isDead'))
            {
                this.destroy();
            }
            
                    
        }
        

    }  
    
}

class EnemyLaser extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprLaserEnemy0');
        this.body.velocity.y = 200;
    }
}

class ChaserShip extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprEnemy1', 'ChaserShip');

        this.body.velocity.y = Phaser.Math.Between(50, 100);

        this.states = {
        MOVE_DOWN: 'MOVE_DOWN',
        CHASE: 'CHASE'
        };
        this.state = this.states.MOVE_DOWN;
    }

    update() {
        if (!this.getData('isDead') && this.scene.player) {
            if (Phaser.Math.Distance.Between(
                this.x,
                this.y,
                this.scene.player.x,
                this.scene.player.y
            ) < 320) {
                this.state = this.states.CHASE;
            }

            if (this.state == this.states.CHASE) {
                var dx = this.scene.player.x - this.x;
                var dy = this.scene.player.y - this.y;

                var angle = Math.atan2(dy, dx);

                var speed = 100;
                this.body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );

                if (this.x < this.scene.player.x) {
                    this.angle -= 5;
                }
                else {
                    this.angle += 5;
                } 
            }
        }
    }
}

class GunShip extends Entity {
    constructor(scene, x, y, key) {
        super(scene, x, y, key, 'GunShip');
        //this.play(key);

        if (this.scene.level == 1){
            
        this.body.velocity.y = 50;

        }
        else{
        this.body.velocity.y = Phaser.Math.Between(50, 100);    }   


        this.shootTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: function() {
                var laser = new EnemyLaser(
                    this.scene,
                    this.x,
                    this.y
                );
                laser.setScale(this.scaleX);
                this.scene.enemyLasers.add(laser);
            },
            callbackScope: this,
            loop: true
        });
    }

    onDestroy() {
        if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
                this.shootTimer.remove(false);
            }
        }
    }
}

class CarrierShip extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprEnemy2', 'CarrierShip');
        this.play('sprEnemy2');

        this.body.velocity.y = Phaser.Math.Between(50, 100);
    }
}


class Turret1 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'probe1', 'Turret');

        this.setData('isShooting', false);
        this.setData('timerShootDelay', 10);
        this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    }

    place(i, j) {
        this.y = i * 64 + 64/2;
        this.x = j * 64 + 64/2;
        map[i][j] = 1;
    }

    onDestroy() {
        this.setData('isShooting', false);
    }    
    
    update() {
        this.body.setVelocity(0, 0);

        this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width);

        if (this.getData('isShooting')) {
            
            if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
                this.setData('timerShootTick', this.getData('timerShootTick') + 1);
            }
            else {
                if (this.scene.level == 1){
                    var rotateleft = -30;
                    var rotateright = 30;
                    var laser = new PlayerLaser(this.scene, this.x, this.y);
                    this.scene.playerLasers.add(laser);
                    
                    if (this.scene.axis ==0) {
                        this.scene.axisIncrease += 10;
                        
                        if (this.scene.axisIncrease == 30) {
                            this.scene.axis = 1;
                        }
                    }
                    else {
                        this.scene.axisIncrease -= 10;
                        
                        if (this.scene.axisIncrease == -30) {
                            this.scene.axis = 0;
                        }
                    } 
    
                    laser.body.velocity.x = this.scene.axisIncrease;
                    this.scene.sfx.laser.play();
                    this.setData('timerShootTick', 0);
                }
                else if (this.scene.level == 2){
                    
                    var laser = new PlayerLaser(this.scene, this.x, this.y);
                    var laser2 = new PlayerLaser(this.scene, this.x, this.y);  
                    var laser3 = new PlayerLaser(this.scene, this.x, this.y);                      
                    this.scene.playerLasers.add(laser);  
                    this.scene.playerLasers.add(laser2);   
                    this.scene.playerLasers.add(laser3);                      
                    laser.body.velocity.x = -30
                    laser2.body.velocity.x = 0       
                    laser3.body.velocity.x = 30                       
                    
                    //this.scene.sfx.laser.play();
                    this.setData('timerShootTick', 0);    
                    
                }
                
                
            }
        }
    }
}


class Turret2 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'probe2', 'Turret');

        this.setData('isShooting', false);
        this.setData('timerShootDelay', 10);
        this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    }

    place(i, j) {
        this.y = i * 64 + 64/2;
        this.x = j * 64 + 64/2;
        map[i][j] = 1;
    }

    onDestroy() {
        this.setData('isShooting', false);
    }    
    
    update() {
        this.body.setVelocity(0, 0);

        this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width);

        if (this.getData('isShooting')) {
            if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
                this.setData('timerShootTick', this.getData('timerShootTick') + 1);
            }
            else {
                var rotateleft = -30;
                var rotateright = 30;
                var laser = new PlayerLaser(this.scene, this.x, this.y);
                this.scene.playerLasers.add(laser);
                
                if (this.scene.axis ==0) {
                    this.scene.axisIncrease += 10;
                    
                    if (this.scene.axisIncrease == 30) {
                        this.scene.axis = 1;
                    }
                }
                else {
                    this.scene.axisIncrease -= 10;
                    
                    if (this.scene.axisIncrease == -30) {
                        this.scene.axis = 0;
                    }
                } 

                laser.body.velocity.x = this.scene.axisIncrease;
                this.scene.sfx.laser.play();
                this.setData('timerShootTick', 0);
            }
        }
    }
}


class Turret3 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'probe3', 'Turret');

        this.setData('isShooting', false);
        this.setData('timerShootDelay', 10);
        this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    }

    place(i, j) {
        this.y = i * 64 + 64/2;
        this.x = j * 64 + 64/2;
        map[i][j] = 1;
    }

    onDestroy() {
        this.setData('isShooting', false);
    }    
    
    update() {
        this.body.setVelocity(0, 0);

        this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width);

        if (this.getData('isShooting')) {
            if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
                this.setData('timerShootTick', this.getData('timerShootTick') + 1);
            }
            else {
                var rotateleft = -30;
                var rotateright = 30;
                var laser = new PlayerLaser(this.scene, this.x, this.y);
                this.scene.playerLasers.add(laser);
                
                if (this.scene.axis ==0) {
                    this.scene.axisIncrease += 10;
                    
                    if (this.scene.axisIncrease == 30) {
                        this.scene.axis = 1;
                    }
                }
                else {
                    this.scene.axisIncrease -= 10;
                    
                    if (this.scene.axisIncrease == -30) {
                        this.scene.axis = 0;
                    }
                } 

                laser.body.velocity.x = this.scene.axisIncrease;
                this.scene.sfx.laser.play();
                this.setData('timerShootTick', 0);
            }
        }
    }
}

class Tower extends Entity {
    constructor(scene, x, y, key) {
        super(scene, x, y, key, 'Tower');
    }
}