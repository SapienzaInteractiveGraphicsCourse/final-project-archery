import * as THREE from 'three';
import * as TWEEN from 'tween';
import { Assets } from './Assets.js';
import { GameObject } from './GameObject.js';

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

export class Bow extends GameObject {
    arrow = null;

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
            for(const t of this.tweenMouseup) {
                t.stop();
            }
            this.tweenMousedown = [
                new TWEEN.Tween(top1.rotation).to({z: Math.PI/12}, 1000).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(top2.rotation).to({z: Math.PI/12}, 1000).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom1.rotation).to({z: -Math.PI/12}, 1000).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom2.rotation).to({z: -Math.PI/12}, 1000).onUpdate(() => this.updateRope())
            ];
            for(const t of this.tweenMousedown) {
                t.start();
            }
        });

        document.addEventListener('mouseup', () => {
            for(const t of this.tweenMousedown) {
                t.stop();
            }
            this.tweenMouseup = [
                new TWEEN.Tween(top1.rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(top2.rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom1.rotation).to({z: 0}, 200).onUpdate(() => this.updateRope()),
                new TWEEN.Tween(bottom2.rotation).to({z: 0}, 200).onUpdate(() => this.updateRope())
            ];
            for(const t of this.tweenMouseup) {
                t.start();
            }
        });
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

        if(this.arrow != null && !this.arrow.inFlight)
        {
            topRope.updateMatrixWorld();
            endPosition.setFromMatrixPosition(topRope.matrixWorld);
            this.arrow.position.copy(endPosition);
        }
    }

    setArrow(obj) {
        this.arrow = obj;
    }
}
