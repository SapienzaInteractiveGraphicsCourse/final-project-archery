'use strict';

import * as THREE from 'three';
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

    manager.onLoad = () => {
        const keys = Object.keys(assets);
        for(const key of keys) {
            assets[key] = assets[key].result;
        }
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

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();
    // const controls = new PointerLockControls(camera, canvas);
    // document.addEventListener('click', () => controls.lock());

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeMenuCube(geometry, x, y,z, map) {
        const material = new THREE.MeshPhongMaterial({map});
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, z);

        scene.add(cube);
        return cube;
    }

    const menu_cubes = [
        makeMenuCube(geometry, 15, 1.5,-10, assets.menu1),
        makeMenuCube(geometry, 15, 0, -10,assets.menu2),
        makeMenuCube(geometry, 15, -1.5,-10, assets.menu3),
    ];

    for(var i = 0; i < menu_cubes.length; i++) menu_cubes[i].userData.idx = i;
    menu_cubes[0].userData.skybox = assets.skybox_forest;
    menu_cubes[1].userData.skybox = assets.skybox_sky;
    menu_cubes[2].userData.skybox = assets.skybox_lava;

    //ARCO

    {
        const gltf = assets.bow;
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z=3;
        gltf.scene.children[0].rotation.y=-12.55;
        gltf.scene.children[0].rotation.z=-1.7;
        scene.add(gltf.scene);
    }

    //arrow
    {
        const gltf = assets.arrow;
        gltf.scene.children[0].scale.multiplyScalar(0.03);
        gltf.scene.children[0].position.z=2.2;
        //gltf.scene.children[0].rotation.y=-12.55;
        //gltf.scene.children[0].rotation.z=-1.7;

        scene.add( gltf.scene );
    }

    const levels = [];

    //target0
    {
        const gltf = assets.target0;
        const scene = SkeletonUtils.clone(gltf.scene);
        const obj = new THREE.Object3D();
        obj.position.z=-30;
        obj.position.y=20;
        obj.add(scene);
        //
        levels.push(obj);//0
        levels.push(obj);//1
        //levels.push(obj);
    }

    //target1
    {
        const gltf = assets.target1;
        const scene = SkeletonUtils.clone(gltf.scene);
        const obj = new THREE.Object3D();
        obj.scale.multiplyScalar(0.3);
        obj.position.z=-30;
        obj.position.x=25;
        obj.add(scene);

        levels.push(obj);//2
        levels.push(obj);//3
        //levels.push(obj);
    }

    //target2
    {
        const gltf = assets.target2;
        const scene = SkeletonUtils.clone(gltf.scene);
        const obj = new THREE.Object3D();
        obj.scale.multiplyScalar(0.1);
        obj.position.z=-30;
        obj.position.x=-30;
        obj.add(scene);

        levels.push(obj);//4
        levels.push(obj);//5
        //levels.push(obj);
    }

        //scarecrow
{
    const gltf = assets.target4;
    const scene = SkeletonUtils.clone(gltf.scene);
    const obj = new THREE.Object3D();
    obj.scale.multiplyScalar(4.95);
    obj.position.y=10;
    obj.position.x=-10;
    obj.position.z=-20;

    obj.add(scene);

    levels.push(obj);//6
    levels.push(obj);//7
    //levels.push(obj);
}

//target0 bis
{
    const gltf = assets.target0;
    const scene = SkeletonUtils.clone(gltf.scene);
    const obj = new THREE.Object3D();
    obj.position.z=-30;
    obj.position.x=0;
    obj.add(scene);

    levels.push(obj);//8
    levels.push(obj);//9
}
//poster target
{
    const gltf = assets.target3;
    const scene = SkeletonUtils.clone(gltf.scene);
    const obj = new THREE.Object3D();
    obj.scale.multiplyScalar(3.95);

    obj.position.z=-20;
    obj.position.x=10;
    obj.add(scene);

    levels.push(obj);//10
    levels.push(obj);//11
}




    let current_level = 0;
    scene.add(levels[0]);
    scene.add(levels[2]);
    scene.add(levels[4]);
    scene.add(levels[8]);



    scene.background = assets.skybox_forest;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    document.addEventListener('mousemove', event => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    });

    let selected_menu;

    document.addEventListener('mouseup', () => {
        if(selected_menu !== undefined) {
            const {idx, skybox} = selected_menu.userData;
            console.log(`Level change to ${idx}`);

            scene.remove(levels[10]);
            scene.remove(levels[6]);
            if(idx != 0){
                scene.add(levels[6]);
                if(idx == 2){
                    scene.add(levels[10]);
                }
                //scaregrow
            }
            scene.add(levels[0]);
            scene.add(levels[2]);
            scene.add(levels[4]);
            scene.add(levels[8]);

            //scene.add(levels[idx+7]);
            current_level = idx;
            scene.background = skybox;
        }
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

        raycaster.setFromCamera(pointer, camera);
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
