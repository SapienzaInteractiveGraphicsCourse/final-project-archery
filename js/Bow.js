import * as THREE from 'three';
import * as TWEEN from 'tween';
import { Assets } from './Assets.js';
import { GameObject } from './GameObject.js';

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

class BowState {
    static Waiting = new BowState("Waiting");
    static Loading = new BowState("Loading");
    static LoadingReleased = new BowState("LoadingReleased");
    static Ready = new BowState("Ready");

    constructor(name) {
        this.name = name;
    }
    toString() {
        return `BowState.${this.name}`;
    }

    static current = BowState.Waiting;
}

export class Bow extends GameObject {
    arrow = null;
    state = BowState.Waiting;
    onMouseUp = null;

    constructor() {
        super();

        const gltf = Assets.bow;
        gltf.scene.scale.multiplyScalar(0.1 * 0.1);
        gltf.scene.position.z = 2.6;
        gltf.scene.rotation.z = -Math.PI / 2;
        gltf.scene.rotation.y = Math.PI / 2;

        this.add(gltf.scene);

        this.prepare();

        const top1 = this.parts["top1"];
        const top2 = this.parts["top2"];
        const bottom1 = this.parts["bottom1"];
        const bottom2 = this.parts["bottom2"];

        this.tweenMousedown = [];
        this.tweenMouseup = [];

        document.addEventListener('mousedown', () => {
            if(this.state != BowState.Waiting || this.arrow.inFlight) {
                return;
            }
            this.state = BowState.Loading;

            for(const t of this.tweenMouseup) {
                t.stop();
            }
            this.tweenMousedown = [
                new TWEEN.Tween(top1.rotation).to({z: Math.PI/12}, 1000).onUpdate(() => this.updateRope()).onComplete(() => {
                    if(this.state == BowState.LoadingReleased) {
                        this.state = BowState.Waiting;
                        this._startMouseUpAnimation();
                    }
                    else if(this.state == BowState.Loading) {
                        this.state = BowState.Ready;
                    }
                }),
                new TWEEN.Tween(top2.rotation).to({z: Math.PI/12}, 1000).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom1.rotation).to({z: -Math.PI/12}, 1000).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom2.rotation).to({z: -Math.PI/12}, 1000).onUpdate(() => this.updateRope())
            ];
            for(const t of this.tweenMousedown) {
                t.start();
            }
        });

        document.addEventListener('mouseup', () => {
            if(this.state == BowState.Loading) {
                this.state = BowState.LoadingReleased;
                return;
            }
            else if(this.state == BowState.Ready) {
                this.state = BowState.Waiting;
                this._startMouseUpAnimation();
            }
        });
    }

    _startMouseUpAnimation() {
        for(const t of this.tweenMousedown) {
            t.stop();
        }
        this.tweenMouseup = [
            new TWEEN.Tween(this.parts["top1"].rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
            new TWEEN.Tween(this.parts["top2"].rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
            new TWEEN.Tween(this.parts["bottom1"].rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
            new TWEEN.Tween(this.parts["bottom2"].rotation).to({z: 0}, 200).onUpdate(() => this.updateRope())
        ];
        for(const t of this.tweenMouseup) {
            t.start();
        }

        if(this.onMouseUp != null) {
            this.onMouseUp();
        }
    }

    updateRope() {
        const ropePosition = new THREE.Vector3();
        const bowPosition = new THREE.Vector3();
        const endPosition = new THREE.Vector3();
        const bottomRope = this.parts["rope_bottom"];
        const topRope = this.parts["rope_top"];
        const bottom1 = this.parts["bottom1"];
        const bottom2 = this.parts["bottom2"];

        this.updateMatrixWorld();
        topRope.updateMatrixWorld();
        bottomRope.updateMatrixWorld();

        bowPosition.setFromMatrixPosition(this.matrixWorld);
        ropePosition.setFromMatrixPosition(bottomRope.matrixWorld);
        endPosition.setFromMatrixPosition(topRope.matrixWorld);

        const worldDirection = new THREE.Vector3();
        this.getWorldDirection(worldDirection);
        const ray = new THREE.Ray(bowPosition, worldDirection);
        const yOffset = ray.distanceToPoint(ropePosition);

        const ropeLength = ropePosition.distanceTo(endPosition);
        const absoluteAngle = Math.acos(clamp(yOffset / ropeLength, -1, 1));
        const relativeAngle = absoluteAngle - (bottom1.rotation.z + bottom2.rotation.z);

        bottomRope.rotation.z = relativeAngle;
        topRope.rotation.z = -relativeAngle;

        if(this.arrow != null && !this.arrow.inFlight) {
            this.getArrowPosition(this.arrow.position);
        }
    }

    getArrowPosition(target) {
        const topRope = this.parts["rope_top"];
        this.updateMatrixWorld();
        target.setFromMatrixPosition(topRope.matrixWorld);
    }
}
