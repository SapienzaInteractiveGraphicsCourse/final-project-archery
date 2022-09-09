'use strict';

import * as THREE from 'three';
import * as TWEEN from 'tween';
import {OrbitControls} from './examples/jsm/controls/OrbitControls.js';
import {PointerLockControls} from './examples/jsm/controls/PointerLockControls.js';

import {GLTFLoader} from './examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from './examples/jsm/utils/SkeletonUtils.js';
import {ConvexHull} from './examples/jsm/math/ConvexHull.js';

import {EffectComposer} from './examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './examples/jsm/postprocessing/RenderPass.js';
import {OutlinePass} from './examples/jsm/postprocessing/OutlinePass.js';

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

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

class Level {
    constructor(levelId, skybox) {
        this.levelId = levelId;
        this.animationGroup = new TWEEN.Group();
        this.obstacles = new THREE.Object3D();
        this.skybox = skybox;
    }
}

class Arrow {
    constructor(model) {
        this.model = model;
        this.inFlight = false;
        this.collided = false;
        this.tween = null;
    }
}

class CollidableObject extends THREE.Object3D {
    constructor() {
        super();
        this.onCollisionHandler = () => {};
    }
    prepare() {
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

const assets = {
    menu1: {url: "/assets/menu/1.jpeg", loader: "texture"},
    menu2: {url: "/assets/menu/2.jpeg", loader: "texture"},
    menu3: {url: "/assets/menu/3.jpeg", loader: "texture"},
    bow: {url: "/assets/bow_divided.glb", loader: "gltf"},
    arrow: {url: "/assets/arrow.glb", loader: "gltf"},
    crosshair: {url: "/assets/crosshair.glb", loader: "gltf"},
    target0: {url: "/assets/targets/archery_target.glb", loader: "gltf"},
    target1: {url: "/assets/targets/target.glb", loader: "gltf"},
    target2: {url: "/assets/targets/bullseye_target_custom_ue4_collison_included.glb", loader: "gltf"},
    target3: {url: "/assets/targets/poster_target.glb", loader: "gltf"},
    skybox_forest: {
        url: [
            '/assets/skybox_images/forest-x.png',
            '/assets/skybox_images/forest+x.png',
            '/assets/skybox_images/forest+y.png',
            '/assets/skybox_images/forest-y.png',
            '/assets/skybox_images/forest+z.png',
            '/assets/skybox_images/forest-z.png'
        ],
        loader: 'cubetexture'
    },
    skybox_sky: {
        url: [
            '/assets/skybox_images/sky-x.png',
            '/assets/skybox_images/sky+x.png',
            '/assets/skybox_images/sky+y.png',
            '/assets/skybox_images/sky-y.png',
            '/assets/skybox_images/sky+z.png',
            '/assets/skybox_images/sky-z.png'
        ],
        loader: 'cubetexture'
    },
    skybox_lava: {
        url: [
            '/assets/skybox_images/lava-x.png',
            '/assets/skybox_images/lava+x.png',
            '/assets/skybox_images/lava+y.png',
            '/assets/skybox_images/lava-y.png',
            '/assets/skybox_images/lava+z.png',
            '/assets/skybox_images/lava-z.png'
        ],
        loader: 'cubetexture'
    }
};

function main() {
    const manager = new THREE.LoadingManager();
    const loadingScreen = document.querySelector("#loadingscreen");
    const progressBar = document.querySelector("#progressbar");
    const infoOverlay = document.querySelector("#info");
    const scoreOverlay = document.querySelector("#score");

    manager.onLoad = () => {
        const keys = Object.keys(assets);
        for(const key of keys) {
            assets[key] = assets[key].result;
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

    for(const asset of Object.values(assets)) {
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
    infoOverlay.addEventListener('mouseup', event => event.stopPropagation());
    controls.addEventListener('lock', () => infoOverlay.style.display = 'none');
    controls.addEventListener('unlock', () => infoOverlay.style.display = '');

    const gameObjects = {};
    {
        const gltf = assets.bow;
        console.log(gltf);
        gltf.scene.scale.multiplyScalar(0.1 * 0.1);
        gltf.scene.position.z = 2.6;
        gltf.scene.rotation.z = -Math.PI / 2;
        gltf.scene.rotation.y = Math.PI / 2;

        const obj = new THREE.Object3D();
        obj.add(gltf.scene);
        scene.add(obj);

        gameObjects.bow = obj;
    }
    {
        const gltf = assets.arrow;
        gltf.scene.children[0].scale.multiplyScalar(0.03);
        scene.add(gltf.scene);

        gameObjects.arrow = new Arrow(gltf.scene);
    }

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

        if(!arrow.inFlight) {
            arrow.model.rotation.setFromQuaternion(camera.quaternion);
            arrow.model.position.copy(bow.position);
        }
    }
    controls.addEventListener('change', updateFirstPersonObjects);

    let score = 0;
    const scoreText = document.querySelector("#scorenumber");

    function addObstacle(level, gltf, x, y, z, scale = 1) {
        const obj = new CollidableObject().onCollision(obj => {
            console.log(`Hit obstacle worth ${obj.userData.pointValue} points`);
            score += obj.userData.pointValue;
            scoreText.innerHTML = score;
        });
        obj.position.set(x, y, z);
        obj.scale.multiplyScalar(scale);
        obj.add(SkeletonUtils.clone(gltf.scene));

        obj.userData.pointValue = (Math.random() * 19 + 1) | 0;

        obj.prepare();
        level.obstacles.add(obj);
    }


    function animationX(l,n,val,time){
        new TWEEN.Tween(l.obstacles.children[n].position)
        .to({ x : val}, time).
        yoyo(true).
        repeat(Infinity).
        start();

    }
    function animationY(l,n,val,time){
        new TWEEN.Tween(l.obstacles.children[n].position)
        .to({ y : val}, time).
        yoyo(true).
        repeat(Infinity).
        start();

    }

    // level 1
    const level1 = new Level(1, assets.skybox_forest);
    addObstacle(level1, assets.target0, 0, 20, -20);
    addObstacle(level1, assets.target1, 20, 0, -20, 0.3);
    addObstacle(level1, assets.target2, -20, 0, -20, 0.1);
    addObstacle(level1, assets.target0, 0, 0, -20);
    addObstacle(level1, assets.target1, -20, 10, -20,0.3);

    animationX(level1,0,10,2000);
    animationX(level1,1,10,2000);
    animationX(level1,2,-10,2000);
    animationY(level1,3,10,2000);
    animationY(level1,4,0,2000);





    {
        const root = gameObjects.bow.children[0].children[0];
        const top1 = root.children[0];
        const top2 = top1.children[0];
        const bottom1 = root.children[1];
        const bottom2 = bottom1.children[0];
        const bottomRope = bottom2.children[0];
        const topRope = bottomRope.children[0];

        const ropePosition = new THREE.Vector3();
        const bowPosition = new THREE.Vector3();
        const endPosition = new THREE.Vector3();

        function updateRope() {
            gameObjects.bow.updateMatrixWorld();
            topRope.updateMatrixWorld();
            bottomRope.updateMatrixWorld();

            bowPosition.setFromMatrixPosition(gameObjects.bow.matrixWorld);
            ropePosition.setFromMatrixPosition(bottomRope.matrixWorld);
            endPosition.setFromMatrixPosition(topRope.matrixWorld);

            const worldDirection = new THREE.Vector3();
            gameObjects.bow.getWorldDirection(worldDirection);
            const ray = new THREE.Ray(bowPosition, worldDirection);
            const yOffset = ray.distanceToPoint(ropePosition);

            const ropeLength = ropePosition.distanceTo(endPosition);
            const absoluteAngle = Math.acos(clamp(yOffset / ropeLength, -1, 1));
            const relativeAngle = absoluteAngle - (bottom1.rotation.z + bottom2.rotation.z);

            bottomRope.rotation.z = relativeAngle;
            topRope.rotation.z = -relativeAngle;

            if(!gameObjects.arrow.inFlight)
            {
                topRope.updateMatrixWorld();
                endPosition.setFromMatrixPosition(topRope.matrixWorld);
                gameObjects.arrow.model.position.copy(endPosition);
            }
        }

        // controls.addEventListener('change', updateRope);


        new TWEEN.Tween(top1.rotation).to({z: Math.PI/12}, 3000)
            .repeat(Infinity).yoyo(true).onUpdate(updateRope).start();

        new TWEEN.Tween(top2.rotation).to({z: Math.PI/12}, 3000)
            .repeat(Infinity).yoyo(true).onUpdate(updateRope).start();

        new TWEEN.Tween(bottom1.rotation).to({z: -Math.PI/12}, 3000)
            .repeat(Infinity).yoyo(true).onUpdate(updateRope).start();

        new TWEEN.Tween(bottom2.rotation).to({z: -Math.PI/12}, 3000)
            .repeat(Infinity).yoyo(true).onUpdate(updateRope).start();
    }

    // level 2
    const level2 = new Level(2, assets.skybox_sky);
    addObstacle(level2, assets.target0, 0, 20, -20);
    addObstacle(level2, assets.target1, 20, 0, -20, 0.3);
    addObstacle(level2, assets.target2, -20, 0, -20, 0.1);
    addObstacle(level2, assets.target0, 0, 0, -20);
    addObstacle(level2, assets.target1, -20, 20, -20,0.3);
    addObstacle(level2, assets.target0, 17, 10, -20);

    animationX(level2,0,10,1500);
    animationX(level2,1,10,1500);
    animationX(level2,2,-10,1500);
    animationY(level2,3,10,1500);
    animationY(level2,4,10,1500);
    animationX(level2,5,2,1500);





    // level 3
    const level3 = new Level(3, assets.skybox_lava);
    addObstacle(level3, assets.target0, 0, 20, -30);
    addObstacle(level3, assets.target1, 25, 0, -30, 0.3);
    addObstacle(level3, assets.target2, -30, 0, -30, 0.1);
    addObstacle(level3, assets.target0, 0, 0, -30);
    addObstacle(level3, assets.target3, 10, 0, -20, 3.95);
    addObstacle(level3, assets.target3, -10, 10, -20, 3.95);
    //anim_3
    animationX(level3,0,10,1000);
    animationY(level3,1,15,1000);
    animationX(level3,2,-15,1000);
    animationY(level3,3,15,1000);
    animationY(level3,4,-15,1000);
    animationX(level3,5,-25,1000);








    let current_level = level1;
    scene.add(level1.obstacles);
    scene.background = level1.skybox;


    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    function makeMenuCube(cubeGeometry, x, y, z, map) {
        const obj = new CollidableObject().onCollision(obj => {
            const {level} = obj.userData;
            console.log(`Level change to ${level.levelId}`);

            scene.remove(current_level.obstacles);
            scene.add(level.obstacles);
            scene.background = level.skybox;

            current_level = level;
        });

        const material = new THREE.MeshPhongMaterial({map});
        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(x, y, z);

        obj.add(cube);
        obj.prepare();
        scene.add(obj);
        return obj;
    }

    const menu_cubes = [
        makeMenuCube(cubeGeometry, 15, 1.5, -10, assets.menu1),
        makeMenuCube(cubeGeometry, 15, 0, -10, assets.menu2),
        makeMenuCube(cubeGeometry, 15, -1.5, -10, assets.menu3),
    ];
    menu_cubes[0].userData.level = level1;
    menu_cubes[1].userData.level = level2;
    menu_cubes[2].userData.level = level3;


    const raycaster = new THREE.Raycaster();

    let selected_menu;
    const previousCheckPosition = new THREE.Vector3();

    document.addEventListener('mouseup', () => {
        const {arrow} = gameObjects;
        if(!arrow.inFlight) {
            const worldPosition = new THREE.Vector3();
            const worldDirection = new THREE.Vector3();
            camera.getWorldPosition(worldPosition);
            camera.getWorldDirection(worldDirection);

            const ray = new THREE.Ray(worldPosition, worldDirection);
            ray.recast(50);

            arrow.inFlight = true;
            arrow.collided = false;
            previousCheckPosition.setFromMatrixPosition(arrow.model.children[0].children[0].matrixWorld);

            const tween = new TWEEN.Tween(arrow.model.position);
            tween.to({x: ray.origin.x, y: ray.origin.y, z: ray.origin.z}, 1000);
            tween.chain(
                new TWEEN.Tween(arrow.model.position)
                    .to({x: 0, y: 0, z: 2.2}, 1)
                    .onComplete(() => {
                        arrow.inFlight = false;
                        arrow.model.rotation.copy(gameObjects.bow.rotation);
                        arrow.model.position.copy(gameObjects.bow.position);
                    })
            );
            tween.start();
        }
    });

    function makeSegmentRays(/**@type THREE.Vector3 */ a, /**@type THREE.Vector3 */ b) {
        return {
            forward: new THREE.Ray(a, b.clone().sub(a).normalize()),
            backward: new THREE.Ray(b, a.clone().sub(b).normalize())
        };
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
    function checkArrowCollision(...targets) {
        const {arrow} = gameObjects;
        if(!arrow.inFlight || arrow.collided) {
            return;
        }

        arrow.model.updateMatrixWorld();
        const arrowPos = new THREE.Vector3();
        arrowPos.setFromMatrixPosition(arrow.model.children[0].children[0].matrixWorld);

        const {forward, backward} = makeSegmentRays(previousCheckPosition, arrowPos);

        for(const targetGroup of targets) {
            for(const obstacle of targetGroup) {

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
                    arrow.collided = true;
                }
            }
        }

        previousCheckPosition.setFromMatrixPosition(arrow.model.children[0].children[0].matrixWorld);
    }

    const overlay = new THREE.Scene();
    {
        const gltf = assets.crosshair;
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

        TWEEN.update();
        current_level.animationGroup.update();

        checkArrowCollision(current_level.obstacles.children, menu_cubes);

        raycaster.setFromCamera({x: 0, y: 0}, camera);
        const intersects = raycaster.intersectObjects(menu_cubes);

        if(intersects.length > 0) {
            const new_cube = intersects[0].object;
            selected_menu = new_cube;
            outlinePass.selectedObjects = [selected_menu];
        }
        else {
            selected_menu = undefined;
            outlinePass.selectedObjects = [];
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
