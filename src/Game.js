import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import asyncSetupSprites from './utils/asyncSetupSprites';
import source from './assets/spritesheet.png';
import sprites from './sprites';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import { loadSprites, initializeGameSettings, animate, updateBirdSpeed, addNewPipe, restartGame } from './gameObjects';

const Game = () => {
    const [isStarted, setIsStarted] = useState(false);
    const [pixiApp, setPixiApp] = useState();
    const [isDead, setIsDead] = useState(false);
    const [stopAnimating, setStopAnimating] = useState(false);
    const [score, setScore] = useState(0);
    const gameCanvas = useRef();

    const saveHighScore = (value) => console.log(value)
    const onScore = useCallback(() => setScore((points) => (points + 1)))

    const startGame = () => {
        if (!isStarted) {
            setIsStarted(true);
            setScore(0);
            addNewPipe()
        }
        updateBirdSpeed()
    }

    const restart = () => {
        setIsStarted(false);
        setIsDead(false);
        setStopAnimating(false)
        setScore(0)
        restartGame()
        animate(stopAnimating, isDead, isStarted, saveHighScore, setStopAnimating, setIsDead, onScore)
    };

    const onPress = () => {
        console.log(isDead)
        // if (isDead) {
        //     restart();
        // } else {
        //     startGame();
        // }
    }

    const runAnimation = useCallback(() => {
        animate(stopAnimating, isDead, isStarted, saveHighScore, setStopAnimating, setIsDead, onScore)
    }, [stopAnimating, isDead, isStarted])

    const resize = () => pixiApp.view.parentNode;

    useEffect(() => {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        const app = initializePixi(gameCanvas, window.innerWidth, window.innerHeight)
        gameCanvas.current.appendChild(app.view);
        app.ticker.add(runAnimation)
        initializeGameSettings(app);
        loadSprites(app)
        setPixiApp(app);
    }, [])

    return (
        <div>
            <KeyboardEventHandler
                handleKeys={['all']}
                onKeyEvent={(key, e) => onPress()} 
            />
            <div ref={gameCanvas} />
        </div>
    );
}

export default Game;

const initializePixi = (gameCanvas, width, height) => {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    const app = new PIXI.Application({
        gameCanvas,
        autoResize: false,
        width,
        height,
      });
    return app;
}