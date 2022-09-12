'use strict';

import * as THREE from 'three';
import * as TWEEN from 'tween';
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from './examples/jsm/controls/PointerLockControls.js';

import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from './examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from './examples/jsm/postprocessing/OutlinePass.js';

import { Assets } from './Assets.js';
import { Levels } from './Levels.js';
import { LevelSelector } from './LevelSelector.js';
import { Bow } from './Bow.js';
import { Arrow } from './Arrow.js';

class CameraManager {
    constructor() {
        this.cameras = [];
    }
    addCamera(camera, resize) {
        this.cameras.push({camera,resize});
    }
    resizeToDisplaySize(renderer, canvas) {
        if(this._resizeRendererToDisplaySize(renderer)) {
            for(const {camera,resize} of this.cameras) {
                resize(camera, canvas);
            }
        }
    }
    _resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if(canvas.width !== width || canvas.height !== height) {
            renderer.setSize(width, height, false);
            return true;
        }
        return false;
    }
}

class GameState {
    static Paused = new GameState("Paused");
    static Running = new GameState("Running");

    constructor(name) {
        this.name = name;
    }
    toString() {
        return `GameState.${this.name}`;
    }

    static _current = GameState.Paused;
    static get current() {
        return GameState._current;
    }
    static set current(value) {
        if(value instanceof GameState) {
            GameState._current = value;
            console.log(`Game state changed to ${value}`);
        }
        else {
            console.error(`Trying to set gamestate to invalid value ${value}`);
        }
    }
}

function main() {
    const manager = new THREE.LoadingManager();
    const loadingScreen = document.querySelector("#loadingscreen");
    const progressBar = document.querySelector("#progressbar");
    const infoOverlay = document.querySelector("#info");
    const scoreOverlay = document.querySelector("#score");

    manager.onLoad = () => {
        const keys = Object.keys(Assets);
        for(const key of keys) {
            Assets[key] = Assets[key].result;
        }
        infoOverlay.style.display = '';
        scoreOverlay.style.display = '';
        loadingScreen.style.display = 'none';
        init();
    };
    manager.onProgress = (url, loaded, total) => {
        console.log(`Loaded ${url} (${loaded}/${total})`);
        progressBar.style.width = `${loaded / total * 100 | 0}%`;
    };
    manager.onError = url => console.error(url);

    const loaders = {
        'texture': new THREE.TextureLoader(manager),
        'gltf': new GLTFLoader(manager),
        'cubetexture': new THREE.CubeTextureLoader(manager)
    };

    for(const asset of Object.values(Assets)) {
        const loader = loaders[asset.loader];
        if(loader) {
            loader.load(asset.url, result => asset.result = result, undefined, error => console.error(error));
        }
        else console.error(`Invalid loader ${asset.loader} for asset ${asset.url}`);
    }
}

function init() {
    const canvas = document.querySelector("#canvas");
    const renderer = new THREE.WebGLRenderer({canvas});
    renderer.autoClear = false;

    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.z = 4.2;
    camera.position.x = 0.2;

    const cameraManager = new CameraManager();
    cameraManager.addCamera(camera, (camera, canvas) => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    });

    const scene = new THREE.Scene();

    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 10, 4);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // const controls = new OrbitControls(camera, canvas);
    // controls.target.set(0, 0, 0);
    // controls.update();
    const controls = new PointerLockControls(camera, canvas);
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI - 0.1;

    const infoOverlay = document.querySelector("#info");
    infoOverlay.addEventListener('click', () => controls.lock());
    infoOverlay.addEventListener('mousedown', event => event.stopPropagation());
    infoOverlay.addEventListener('mouseup', event => event.stopPropagation());
    controls.addEventListener('lock', () => {
        infoOverlay.style.display = 'none';
        GameState.current = GameState.Running;
    });
    controls.addEventListener('unlock', () => {
        infoOverlay.style.display = '';
        GameState.current = GameState.Paused;
    });

    const gameObjects = {
        bow: new Bow(),
        arrow: new Arrow()
    };

    gameObjects.bow.arrow = gameObjects.arrow;
    gameObjects.arrow.bow = gameObjects.bow;

    scene.add(gameObjects.bow);
    scene.add(gameObjects.arrow);


    function updateFirstPersonObjects() {
        const worldPosition = new THREE.Vector3();
        const worldDirection = new THREE.Vector3();
        camera.getWorldPosition(worldPosition);
        camera.getWorldDirection(worldDirection);

        const ray = new THREE.Ray(worldPosition, worldDirection);
        ray.recast(5);

        // Translate bow a bit to the left relative to the camera,
        // to avoid it covering the view
        ray.origin.add(ray.direction.cross(camera.up).normalize().multiplyScalar(-0.5));

        const {bow, arrow} = gameObjects;
        bow.rotation.setFromQuaternion(camera.quaternion);
        bow.position.copy(ray.origin);

        arrow.updatePositionDirection();

        // if(!arrow.inFlight) {
        //     arrow.rotation.setFromQuaternion(camera.quaternion);
        //     arrow.position.copy(bow.parts["rope_top"].position);
        // }
    }
    controls.addEventListener('change', updateFirstPersonObjects);

    Levels.init();
    const levelSelector = new LevelSelector(scene);

    const raycaster = new THREE.Raycaster();

    gameObjects.bow.onMouseUp = () => {
        const {arrow} = gameObjects;
        const worldPosition = new THREE.Vector3();
        const worldDirection = new THREE.Vector3();
        camera.getWorldPosition(worldPosition);
        camera.getWorldDirection(worldDirection);

        const ray = new THREE.Ray(worldPosition, worldDirection);
        arrow.shoot(ray);
    };

    const overlay = new THREE.Scene();
    {
        const gltf = Assets.crosshair;
        gltf.scene.rotateX(Math.PI / 2);
        gltf.scene.scale.multiplyScalar(1.5);
        overlay.add(gltf.scene);
    }

    const overlayCamera = new THREE.OrthographicCamera();
    cameraManager.addCamera(overlayCamera, (camera, canvas) => {
        const divisor = Math.min(canvas.width, canvas.height);
        camera.top = canvas.height / divisor;
        camera.bottom = - canvas.height / divisor;
        camera.left = - canvas.width / divisor;
        camera.right = canvas.width / divisor;
        camera.near = -1;
        camera.far = 1;
        camera.updateProjectionMatrix();
    });

    cameraManager.resizeToDisplaySize(renderer, canvas);
    updateFirstPersonObjects();

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(new THREE.Vector2(canvas.width, canvas.height), scene, camera);
    composer.addPass(renderPass);
    composer.addPass(outlinePass);

    function render(time) {
        time *= 0.001;

        cameraManager.resizeToDisplaySize(renderer, canvas);

        if(GameState.current == GameState.Running) {
            TWEEN.update();
            levelSelector.current.animationGroup.update();

            gameObjects.arrow.checkCollision(
                levelSelector.current.obstacles.children,
                levelSelector.menu_cubes
            );

            raycaster.setFromCamera({x: 0, y: 0}, camera);
            const intersects = raycaster.intersectObjects(levelSelector.menu_cubes);

            if(intersects.length > 0) {
                const new_cube = intersects[0].object;
                outlinePass.selectedObjects = [new_cube];
            }
            else {
                outlinePass.selectedObjects = [];
            }
        }

        renderer.clear();
        composer.render();
        renderer.clearDepth();
        renderer.render(overlay, overlayCamera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
