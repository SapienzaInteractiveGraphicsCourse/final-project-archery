import * as TWEEN from 'tween';
import * as SkeletonUtils from './examples/jsm/utils/SkeletonUtils.js';
import { Assets } from './Assets.js';
import { CollidableObject } from './GameObject.js';
import { ScoreManager } from './ScoreManager.js';

class LinearTarget extends CollidableObject {
    constructor(x, y, z, axis, offset, time, model, scale) {
        super();

        this.onCollision(obj => {
            ScoreManager.add(obj.userData.pointValue);
        });

        this.position.set(x, y, z);
        this.scale.multiplyScalar(scale);
        this.add(SkeletonUtils.clone(model.scene));

        this.userData.pointValue = 20;

        this.prepare();

        const to = (axis == "x") ? {x: offset} : {y: offset};
        new TWEEN.Tween(this.position).to(to, time)
            .yoyo(true).repeat(Infinity).start();
    }
}

export class LinearTarget0 extends LinearTarget {
    constructor(x, y, z, axis, offset, time) {
        super(x, y, z, axis, offset, time, Assets.target0, 1.5);
    }
}

export class LinearTarget1 extends LinearTarget {
    constructor(x, y, z, axis, offset, time) {
        super(x, y, z, axis, offset, time, Assets.target1, 0.45);
    }
}

export class WingedTarget extends CollidableObject {
    constructor(x, y, z) {
        super();

        this.onCollision(obj => {
            ScoreManager.add(obj.userData.pointValue);
        });

        this.position.set(x, y, z);
        this.scale.multiplyScalar(0.15);
        this.add(SkeletonUtils.clone(Assets.target2.scene));

        this.userData.pointValue = 50;

        this.prepare();

        // Wings
        new TWEEN.Tween(this.parts["left_wing"].rotation)
            .to({y: Math.PI / 6}, 1000)
            .yoyo(true).repeat(Infinity)
            .start();
        new TWEEN.Tween(this.parts["right_wing"].rotation)
            .to({y: Math.PI / 6}, 1000)
            .yoyo(true).repeat(Infinity)
            .start();

        // Move in a circle
        const radius = 5;
        const duration = 3000;

        // x axis
        new TWEEN.Tween(this.position)
            .to({x: `+${2*radius}`}, duration)
            .yoyo(true).repeat(Infinity)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();

        // y axis
        const a = new TWEEN.Tween(this.position)
            .to({y: `+${radius}`}, duration / 2)
            .easing(TWEEN.Easing.Sinusoidal.Out);
        const b = new TWEEN.Tween(this.position)
            .to({y: `-${2*radius}`}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut);
        const c = new TWEEN.Tween(this.position)
            .to({y: `+${radius}`}, duration / 2)
            .easing(TWEEN.Easing.Sinusoidal.In);

        a.chain(b);
        b.chain(c);
        c.chain(a);
        a.start();
    }
}

export class PosterTarget extends CollidableObject {
    constructor(x, y, z) {
        super();

        this.onCollision(obj => {
            ScoreManager.add(obj.userData.pointValue);
        });

        this.position.set(x, y, z);
        this.scale.multiplyScalar(6);
        this.add(SkeletonUtils.clone(Assets.target3.scene));

        this.userData.pointValue = 100;

        this.prepare();
    }
}
