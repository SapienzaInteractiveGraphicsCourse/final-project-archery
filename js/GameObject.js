import * as THREE from 'three';
import { ConvexHull } from './examples/jsm/math/ConvexHull.js';

export class GameObject extends THREE.Object3D {
    constructor() {
        super();
        this.parts = {};
    }
    prepare() {
        this._visit(this);
    }
    _visit(obj) {
        if(obj.name != "") {
            this.parts[obj.name] = obj;
        }
        for(const child of obj.children) {
            this._visit(child);
        }
    }
}

export class CollidableObject extends GameObject {
    constructor() {
        super();
        this.onCollisionHandler = () => {};
    }
    prepare() {
        super.prepare();

        const convexHull = new ConvexHull();
        convexHull.setFromObject(this);
        this.userData.convexHull = convexHull;

        this.updateMatrixWorld();
        this.userData.originalPosition = new THREE.Vector3();
        this.userData.originalPosition.setFromMatrixPosition(this.matrixWorld);
    }
    onCollision(handler) {
        this.onCollisionHandler = handler;
        return this;
    }
}
