'use strict';

import * as THREE from 'three';
import * as TWEEN from 'tween';
import {OrbitControls} from './examples/jsm/controls/OrbitControls.js';
import {PointerLockControls} from './examples/jsm/controls/PointerLockControls.js';

import {GLTFLoader} from './examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from './examples/jsm/utils/SkeletonUtils.js';

import {EffectComposer} from './examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './examples/jsm/postprocessing/RenderPass.js';
import {OutlinePass} from './examples/jsm/postprocessing/OutlinePass.js';

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

const assets = {
    menu1: {url: "/assets/menu/1.jpeg", loader: "texture"},
    menu2: {url: "/assets/menu/2.jpeg", loader: "texture"},
    menu3: {url: "/assets/menu/3.jpeg", loader: "texture"},
    bow: {url: "/assets/simple_bow.glb", loader: "gltf"},
    arrow: {url: "/assets/arrow.glb", loader: "gltf"},
    crosshair: {url: "/assets/crosshair.glb", loader: "gltf"},
    target0: {url: "/assets/targets/archery_target.glb", loader: "gltf"},
    target1: {url: "/assets/targets/target.glb", loader: "gltf"},
    target2: {url: "/assets/targets/bullseye_target_custom_ue4_collison_included.glb", loader: "gltf"},
    target3: {url: "/assets/targets/poster_target.glb", loader: "gltf"},
    target4: {url: "/assets/targets/scarecrow_target.glb", loader: "gltf"},
    target5: {url: "/assets/targets/scarecrow_target2.glb", loader: "gltf"},
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

    manager.onLoad = () => {
        const keys = Object.keys(assets);
        for(const key of keys) {
            assets[key] = assets[key].result;
        }
        infoOverlay.style.display = '';
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

    const infoOverlay = document.querySelector("#info");
    infoOverlay.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => infoOverlay.style.display = 'none');
    controls.addEventListener('unlock', () => infoOverlay.style.display = '');

    //ARCO

    {
        const gltf = assets.bow;
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z = 3.7;
        gltf.scene.children[0].rotation.z = -Math.PI / 2;
        scene.add(gltf.scene);

        controls.addEventListener('change', () => {
            const worldPosition = new THREE.Vector3();
            const worldDirection = new THREE.Vector3();
            camera.getWorldPosition(worldPosition);
            camera.getWorldDirection(worldDirection);

            const ray = new THREE.Ray(worldPosition, worldDirection);
            ray.recast(5);

            // Translate bow a bit to the left relative to the camera,
            // to avoid it covering the view
            ray.origin.add(ray.direction.cross(camera.up).normalize().multiplyScalar(-0.5));

            gltf.scene.rotation.setFromQuaternion(camera.quaternion);
            gltf.scene.position.copy(ray.origin);
        });
    }

    //arrow
    let arrow;
    {
        const gltf = assets.arrow;
        gltf.scene.children[0].scale.multiplyScalar(0.03);
        gltf.scene.children[0].position.z=2.2;
        //gltf.scene.children[0].rotation.y=-12.55;
        //gltf.scene.children[0].rotation.z=-1.7;
        arrow = gltf.scene.children[0];

        scene.add( gltf.scene );
    }

    function addObstacle(level, gltf, x, y, z, scale = 1) {
        const obj = new THREE.Object3D();
        obj.position.set(x, y, z);
        obj.scale.multiplyScalar(scale);
        obj.add(SkeletonUtils.clone(gltf.scene));
        level.obstacles.add(obj);
    }

    // level 1
    const level1 = new Level(1, assets.skybox_forest);
    addObstacle(level1, assets.target0, 0, 20, -30);
    addObstacle(level1, assets.target1, 25, 0, -30, 0.3);
    addObstacle(level1, assets.target2, -30, 0, -30, 0.1);
    addObstacle(level1, assets.target0, 0, 0, -30);

    // level 2
    const level2 = new Level(2, assets.skybox_sky);
    level2.obstacles.copy(level1.obstacles);
    addObstacle(level2, assets.target4, -10, 10, -20, 4.95);

    // level 3
    const level3 = new Level(3, assets.skybox_lava);
    level3.obstacles.copy(level2.obstacles);
    addObstacle(level3, assets.target3, 10, 0, -20, 3.95);


    let current_level = level1;
    scene.add(level1.obstacles);
    scene.background = level1.skybox;


    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    function makeMenuCube(cubeGeometry, x, y, z, map) {
        const material = new THREE.MeshPhongMaterial({map});
        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(x, y, z);

        scene.add(cube);
        return cube;
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

    document.addEventListener('mouseup', () => {
        if(selected_menu !== undefined) {
            const {level} = selected_menu.userData;
            console.log(`Level change to ${level.levelId}`);

            scene.remove(current_level.obstacles);
            scene.add(level.obstacles);
            scene.background = level.skybox;

            current_level = level;
        }

        const worldPosition = new THREE.Vector3();
        const worldDirection = new THREE.Vector3();
        camera.getWorldPosition(worldPosition);
        camera.getWorldDirection(worldDirection);

        const ray = new THREE.Ray(worldPosition, worldDirection);
        ray.recast(20);

        const tween = new TWEEN.Tween(arrow.position);
        tween.to({x: ray.origin.x, y: ray.origin.y, z: ray.origin.z}, 1000);
        tween.chain(new TWEEN.Tween(arrow.position).to({x: 0, y: 0, z: 2.2}, 1));
        tween.start();
    });

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

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(new THREE.Vector2(canvas.width, canvas.height), scene, camera);
    composer.addPass(renderPass);
    composer.addPass(outlinePass);

    function render(time) {
        time *= 0.001;

        cameraManager.resizeToDisplaySize(renderer, canvas);

        TWEEN.update();

        raycaster.setFromCamera({x: 0, y: 0}, camera);
        const intersects = raycaster.intersectObjects(menu_cubes, false);

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
