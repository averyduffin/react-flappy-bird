import { Container, TilingSprite, AnimatedSprite, Sprite } from 'pixi.js';
import asyncSetupSprites from './utils/asyncSetupSprites';
import source from './assets/spritesheet.png';
import sprites from './sprites';
// const { Container, TilingSprite, AnimatedSprite, Sprite } = PIXI

const scale =1;
export const Settings = {
    playerFallSpeed: 8 * scale,
    playerHorizontalPosition: 100 * scale,
    playerVerticalPosition: 200 * scale,
    playerMaxVelocity: -3 * scale,
    pipeWidth: 80 * scale,
    groundHeight: 100 * scale,
    pipeHeight: 500 * scale,
    playerGravity: 0.4 * scale,
    minPipeHeight: 50 * scale,
    pipeVerticalGap: 190 * scale, //180 is pretty legit
    gameSpeed: 40 * 0.25,
};

let background = null;
let pipeContainer = null;
let ground = null;
let bird = null;

export const loadSprites = (app) => {
    const textures = asyncSetupSprites(source, sprites)
    background = new Background(textures.background);
    pipeContainer = new PipeContainer(textures.pipe);
    ground = new Ground(textures.ground);

    bird = new Bird([
      textures['bird_000'],
      textures['bird_001'],
      textures['bird_002'],
      textures['bird_001'],
    ]);

    [background, pipeContainer, ground, bird].forEach(child =>
      app.stage.addChild(child),
    );

    const stopAnimating = false;
}

export const initializeGameSettings = (app) => {
  Settings.width = app.renderer.width;
  Settings.pipeScorePosition = -(
  Settings.width - Settings.playerHorizontalPosition
  );
  Settings.height = app.renderer.height;
  Settings.skyHeight = Settings.height - Settings.groundHeight;
  Settings.pipeHorizontalGap = Settings.pipeWidth * 5;
}

export const animate = (stopAnimating, isDead, isStarted, saveHighScore, setStopAnimate, setIsDead, setScore) => {
  if (stopAnimating) {
      return;
  }

  if (isStarted) { // bird falling
    console.log('test')
    bird.updateGravity();
  }

  if(isDead) {
    bird.rotation += Math.PI / 4;
    if (bird.rotation > Math.PI / 2 && bird.position.y > Settings.skyHeight - bird.height / 2
    ) {
      saveHighScore();
      setStopAnimate(true);
    }
  } else {
    if (Math.abs(ground.tilePosition.x) > ground.width) { // move ground
        ground.tilePosition.x = 0;
    }
    ground.tilePosition.x -= Settings.gameSpeed;

    if (bird.position.y + bird.height / 2 > Settings.skyHeight) {
        hitPipe(setIsDead);
    }
    const points = pipeContainer.moveAll();
    if (points) {
      setScore()
    }
    pipeContainer.tryAddingNewPipe();

    const padding = 5;
    for (const group of pipeContainer.pipes) {
      const { pipe, pipe2, upper, lower } = group;
      if (
        boxesIntersect(bird, pipe, padding) ||
        boxesIntersect(bird, pipe2, padding)
      ) {
        hitPipe(setIsDead);
      }
    }
  }
}

export const getBird = () => {
  return bird;
}

export const getGround = () => {
  return ground
}

export const getPipesContainer = () => {
  return pipeContainer
}

export const getSettings = () => {
  return Settings;
}

export const updateBirdSpeed = () => {
  bird.speedY = Settings.playerFallSpeed;
}

export const addNewPipe = () => {
  pipeContainer.addNewPipe();
}

export const restartGame = () => {
  bird.restart();
  pipeContainer.restart();
}

export const hitPipe = (setIsDead) => {
  bird.stop();
  setIsDead(true);
};

class FlappySprite extends Sprite {
    constructor(...args) {
      super(...args);
      this.scale.set(scale);
    }
  }
  
class Ground extends TilingSprite {
    constructor(texture) {
      super(texture, Settings.width, Settings.groundHeight);
      this.tileScale.set(scale * 2);
      this.position.x = 0;
      this.position.y = Settings.skyHeight;
    }
  }
  
class Background extends FlappySprite {
    constructor(texture) {
      super(texture);
      this.position.x = 0;
      this.position.y = 0;
      this.width = Settings.width;
      this.height = Settings.height;
    }
  }
  
export const boxesIntersect = (a, b, paddingA = 0) => {
    const ab = a.getBounds();
    ab.x += paddingA;
    ab.width -= paddingA * 2;
    ab.y += paddingA;
    ab.height -= paddingA * 2;
  
    const bb = b.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  }

class PipeContainer extends Container {
    pipes = [];
    pipeIndex = 0;
  
    constructor(pipeTexture) {
      super();
      this.pipeTexture = pipeTexture;
      this.position.x = Settings.width + Settings.pipeWidth / 2;
    }
  
    tryAddingNewPipe = () => {
      if (!this.pipes.length) return;
      const { pipe } = this.pipes[this.pipes.length - 1];
      if (-pipe.position.x >= Settings.pipeHorizontalGap) {
        this.addNewPipe();
      }
    };
  
    moveAll = () => {
      let score = 0;
      for (let index = 0; index < this.pipes.length; index++) {
        this.move(index);
        if (this.tryScoringPipe(index)) {
          score += 1;
        }
      }
      return score;
    };
  
    tryScoringPipe = index => {
      const group = this.pipes[index];
  
      if (
        !group.scored &&
        this.toGlobal(group.pipe.position).x < Settings.playerHorizontalPosition
      ) {
        group.scored = true;
        return true;
      }
      return false;
    };
  
    move = index => {
      const { pipe, pipe2 } = this.pipes[index];
      pipe.position.x -= Settings.gameSpeed;
      pipe2.position.x -= Settings.gameSpeed;
    };
  
    addNewPipe = () => {
      const pipeGroup = {};
      const pipe = new Pipe(this.pipeTexture);
      const pipe2 = new Pipe(this.pipeTexture);
      pipe.rotation = Math.PI;
  
      const maxPosition =
        Settings.skyHeight -
        Settings.minPipeHeight -
        Settings.pipeVerticalGap -
        pipe.height / 2;
      const minPosition = -(pipe.height / 2 - Settings.minPipeHeight);
  
      pipe.position.y = Math.floor(
        Math.random() * (maxPosition - minPosition + 1) + minPosition,
      );
  
      pipe2.position.y = pipe.height + pipe.position.y + Settings.pipeVerticalGap;
      pipe.position.x = pipe2.position.x = 0;
  
      pipeGroup.upper = pipe.position.y + pipe.height / 2;
      pipeGroup.lower = pipeGroup.upper + Settings.pipeVerticalGap;
      pipeGroup.pipe = pipe;
      pipeGroup.pipe2 = pipe2;
  
      this.addChild(pipe);
      this.addChild(pipe2);
      this.pipes.push(pipeGroup);
      this.tryRemovingLastGroup();
    };
  
    tryRemovingLastGroup = () => {
      if (
        this.pipes[0].pipe.position.x + Settings.pipeWidth / 2 >
        Settings.width
      ) {
        this.pipes.shift();
      }
    };
  
    setXforGroup = (index, x) => {
      const { pipe, pipe2 } = this.pipes[index];
      pipe.position.x = x;
      pipe2.position.x = x;
    };
  
    getX = index => {
      const { pipe } = this.pipes[index];
      return this.toGlobal(pipe.position).x;
    };
  
    restart = () => {
      this.pipeIndex = 0;
      this.pipes = [];
      this.children = [];
    };
  }
  
class Pipe extends FlappySprite {
    constructor(texture) {
      super(texture);
      this.width = Settings.pipeWidth;
      this.height = Settings.pipeHeight;
      this.anchor.set(0.5);
    }
  }
  
class Bird extends AnimatedSprite {
    constructor(textures) {
      super(textures);
      this.animationSpeed = 0.2;
      this.anchor.set(0.5);
      this.width = 60 * scale;
      this.height = 48 * scale;
  
      this.speedY = Settings.playerFallSpeed;
      this.rate = Settings.playerGravity;
  
      this.restart();
    }
  
    restart = () => {
      this.play();
      this.rotation = 0;
      this.position.x = Settings.playerHorizontalPosition;
      this.position.y = Settings.playerVerticalPosition;
    };
  
    updateGravity = () => {
      this.position.y -= this.speedY;
      this.speedY -= this.rate;
  
      const FLAP = 35;
      this.rotation = -Math.min(
        Math.PI / 4,
        Math.max(-Math.PI / 2, (FLAP + this.speedY) / FLAP),
      );
    };
  }
  