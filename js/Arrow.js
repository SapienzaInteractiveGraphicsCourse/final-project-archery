import * as THREE from 'three';
import { Assets } from './Assets.js';
import { GameObject } from './GameObject.js';
import { GameTimeTween } from './GameTimeTween.js';

export class Arrow extends GameObject {
    bow = null;

    constructor() {
        super();
        this.inFlight = false;
        this.collided = false;

        const gltf = Assets.arrow;
        gltf.scene.children[0].scale.multiplyScalar(0.05);
        this.add(gltf.scene);

        this.prepare();

        this.previousCheckPosition = new THREE.Vector3();
        this.savedRotation = new THREE.Euler();
    }

    updatePositionDirection() {
        if(!this.inFlight) {
            this.rotation.copy(this.bow.rotation);
            this.bow.getArrowPosition(this.position);
        }
        else {
            this.savedRotation.copy(this.bow.rotation);
        }
    }

    shoot(ray) {
        ray.recast(50);

        this.inFlight = true;
        this.collided = false;
        this.previousCheckPosition.setFromMatrixPosition(this.parts["arrow_tip"].matrixWorld);
        this.savedRotation.copy(this.bow.rotation);

        const tween = new GameTimeTween(this.position);
        tween.to({x: ray.origin.x, y: ray.origin.y, z: ray.origin.z}, 1000);
        tween.chain(
            new GameTimeTween(this.position)
                .to({x: 0, y: 0, z: 2.2}, 1)
                .onComplete(() => {
                    this.inFlight = false;
                    this.rotation.copy(this.savedRotation);
                    this.bow.getArrowPosition(this.position);
                })
        );
        tween.start();
    }

    // Since the targets are thin, simply checking that the arrow intersects
    // their convex hull isn't sufficient: the arrow could go from one side
    // of the target to the other in a single frame.
    // Instead, check for intersection between the convex hull and the segment
    // connecting the arrow's position in the previous frame and the current
    // position.
    // ConvexHull only supports ray intersection, so to check for segment
    // intersection verify that both the A->B and B->A rays intersect with the
    // hull.
    checkCollision(...targets) {
        if(!this.inFlight || this.collided) {
            return;
        }

        this.updateMatrixWorld();
        const arrowPos = new THREE.Vector3();
        arrowPos.setFromMatrixPosition(this.parts["arrow_tip"].matrixWorld);

        const {forward, backward} = this._makeSegmentRays(this.previousCheckPosition, arrowPos);

        for(const targetGroup of targets) {
            for(const obstacle of targetGroup) {

                if(!obstacle.collidable) {
                    continue;
                }

                // The convex hulls are computed at obstacle creation, and are not transformed
                // when animating. To compensate for this, translate the segment in the
                // opposite direction of the current translation of this obstacle
                const offset = new THREE.Vector3();
                offset.setFromMatrixPosition(obstacle.matrixWorld);
                offset.sub(obstacle.userData.originalPosition);

                const translatedForward = new THREE.Ray(forward.origin.clone().sub(offset), forward.direction);
                const translatedBackward = new THREE.Ray(backward.origin.clone().sub(offset), backward.direction);

                const convexHull = obstacle.userData.convexHull;
                if(convexHull.intersectsRay(translatedForward) && convexHull.intersectsRay(translatedBackward)) {
                    obstacle.onCollisionHandler(obstacle);
                    this.collided = true;
                }
            }
        }

        this.previousCheckPosition.copy(arrowPos);
    }

    _makeSegmentRays(/**@type THREE.Vector3 */ a, /**@type THREE.Vector3 */ b) {
        return {
            forward: new THREE.Ray(a, b.clone().sub(a).normalize()),
            backward: new THREE.Ray(b, a.clone().sub(b).normalize())
        };
    }
}
