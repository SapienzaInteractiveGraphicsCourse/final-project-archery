import * as THREE from 'three';
import { Assets } from './Assets.js';
import { CollidableObject } from './GameObject.js';
import { Levels } from './Levels.js';
import { ScoreManager } from './ScoreManager.js';
import { GameTimeTween } from './GameTimeTween.js';

export class LevelSelector {
    constructor(scene) {
        this.scene = scene;

        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

        this.menu_cubes = [
            this._makeMenuCube(cubeGeometry, 10, 1.5, -4, Assets.menu1, Assets.menu1normal),
            this._makeMenuCube(cubeGeometry, 10, 0, -4, Assets.menu2, Assets.menu2normal),
            this._makeMenuCube(cubeGeometry, 10, -1.5, -4, Assets.menu3, Assets.menu3normal),
        ];
        this.menu_cubes[0].userData.level = Levels.level1;
        this.menu_cubes[1].userData.level = Levels.level2;
        this.menu_cubes[2].userData.level = Levels.level3;

        this.current = Levels.level1;
        scene.add(this.current.obstacles);
        scene.background = this.current.skybox;
        this.current.startTweens();

        this.levelChangeDiv = document.querySelector("#levelchange");
        this.levelTextDiv = document.querySelector("#leveltext");

        this._setVisibleCubes(ScoreManager.score);
        ScoreManager.addCallback(score => this._setVisibleCubes(score));
    }

    _setVisibleCubes(score) {
        // thresholds[i] := score needed to see cube i
        const thresholds = [
            0,
            100,
            350
        ];

        for(let i = 0; i < this.menu_cubes.length; i++) {
            if(score >= thresholds[i]) {
                if(!this.menu_cubes[i].visible) {
                    this.levelTextDiv.innerHTML = `Level ${i+1} unlocked`;
                    this.levelChangeDiv.style.display = '';
                    new GameTimeTween({}).to({}, 5000).onComplete(() => this.levelChangeDiv.style.display = 'none').start();
                }
                this.menu_cubes[i].visible = true;
                this.menu_cubes[i].collidable = true;
            }
            else {
                this.menu_cubes[i].visible = false;
                this.menu_cubes[i].collidable = false;
            }
        }
    }

    _makeMenuCube(cubeGeometry, x, y, z, map, normalMap) {
        const obj = new CollidableObject().onCollision(obj => this._changeLevel(obj));

        const material = new THREE.MeshPhongMaterial({map, normalMap});
        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(x, y, z);

        obj.add(cube);
        obj.prepare();
        this.scene.add(obj);
        return obj;
    }

    _changeLevel(cube) {
        const {level} = cube.userData;
        console.log(`Level change to ${level.levelId}`);

        this.current.stopTweens();
        level.startTweens();

        this.scene.remove(this.current.obstacles);
        this.scene.add(level.obstacles);
        this.scene.background = level.skybox;

        this.current = level;
    }
}
