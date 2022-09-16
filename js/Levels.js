import * as THREE from 'three';
import { Assets } from './Assets.js';
import { LinearTarget0, LinearTarget1, WingedTarget, PosterTarget } from './Targets.js';

class Level {
    constructor(levelId, skybox) {
        this.levelId = levelId;
        this.obstacles = new THREE.Object3D();
        this.skybox = skybox;
    }
    startTweens() {
        for(const target of this.obstacles.children){
            target.startTweens();
        }
    }
    stopTweens() {
        for(const target of this.obstacles.children){
            target.stopTweens();
        }
    }
}

export class Levels {
    static level1;
    static level2;
    static level3;

    static init() {
        // level 1
        const level1 = new Level(1, Assets.skybox_forest);
        level1.obstacles.add(new LinearTarget0(0, 20, -30, "x", "-10", 2000));
        level1.obstacles.add(new LinearTarget1(20, 0, -30, "x", "-10", 2000));
        level1.obstacles.add(new LinearTarget0(0, 0, -30, "y", "+10", 2000));
        level1.obstacles.add(new LinearTarget1(-20, 10, -30, "y", "-10", 2000));
        this.level1 = level1;

        // level 2
        const level2 = new Level(2, Assets.skybox_sky);
        level2.obstacles.add(new LinearTarget0(0, 20, -30, "x", "-10", 1500));
        level2.obstacles.add(new LinearTarget1(20, 0, -30, "x", "-10", 1500));
        level2.obstacles.add(new LinearTarget0(0, 0, -30, "y", "+10", 1500));
        level2.obstacles.add(new LinearTarget1(-20, 10, -30, "y", "-10", 1500));
        level2.obstacles.add(new LinearTarget0(17, 10, -30, "x", "-15", 1500));
        level2.obstacles.add(new WingedTarget(-20, 0, -27));
        this.level2 = level2;

        // level 3
        const level3 = new Level(3, Assets.skybox_lava);
        level3.obstacles.add(new LinearTarget0(0, 20, -30, "x", "+10", 1000));
        level3.obstacles.add(new LinearTarget1(25, 0, -30, "y", "+15", 1000));
        level3.obstacles.add(new WingedTarget(-30, 0, -30));
        level3.obstacles.add(new LinearTarget0(0, 0, -30, "y", "+15", 1000));
        level3.obstacles.add(new PosterTarget(10, 0, -30));
        level3.obstacles.add(new PosterTarget(-10, 10, -30));
        this.level3 = level3;
    }
}
