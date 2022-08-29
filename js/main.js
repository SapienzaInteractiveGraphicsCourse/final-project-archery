'use strict';

import * as THREE from 'three';
import {OrbitControls} from './examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './examples/jsm/loaders/GLTFLoader.js';


function resizeRendererToDisplaySize(/**@type THREE.WebGLRenderer*/ renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if(canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        return true;
    }
    return false;
}

const assets = {
    menu1: {url: "/assets/menu/1.jpeg", loader: "texture"},
    menu2: {url: "/assets/menu/2.jpeg", loader: "texture"},
    menu3: {url: "/assets/menu/3.jpeg", loader: "texture"},
    bow: {url: "/assets/simple_bow.glb", loader: "gltf"},
    arrow: {url: "/assets/arrow.glb", loader: "gltf"},
    target0: {url: "/assets/targets/archery_target.glb", loader: "gltf"},
    target1: {url: "/assets/targets/target.glb", loader: "gltf"},
    target2: {url: "/assets/targets/bullseye_target_custom_ue4_collison_included.glb", loader: "gltf"},
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
            loader.load(asset.url, (result) => asset.result = result, undefined, error => console.error(error));
        }
        else console.error(`Invalid loader ${asset.loader} for asset ${asset.url}`);
    }
}

function init() {
    const canvas = document.querySelector("#canvas");
    const renderer = new THREE.WebGLRenderer({canvas});

    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.z = 2;

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

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance1(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({
            map: assets.menu1,
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        cube.position.y = 1.5;

        scene.add(cube);
        return cube;
    }
    function makeInstance2(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({
            map: assets.menu2,
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;

        scene.add(cube);
        return cube;
    }
    function makeInstance3(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({
            map: assets.menu3,
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        cube.position.y=-1.5;

        scene.add(cube);
        return cube;
    }

    const menu_cubes = [
        makeInstance1(geometry, 0x8844aa, 8),
        makeInstance2(geometry, 0x44aa88, 8),
        makeInstance3(geometry, 0xaa8844, 8),
    ];

    scene.background = assets.skybox_forest;

    //ARCO

    {
        const gltf = assets.bow;
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z=3;
        gltf.scene.children[0].rotation.y=-12.55;
        gltf.scene.children[0].rotation.z=-1.7;
        scene.add(gltf.scene);
    }

    //arrow kwroeop
    {
        const gltf = assets.arrow;
        gltf.scene.children[0].scale.multiplyScalar(0.03);
        gltf.scene.children[0].position.z=2.2;
        //gltf.scene.children[0].rotation.y=-12.55;
        //gltf.scene.children[0].rotation.z=-1.7;

        scene.add( gltf.scene );
    }

    //target0
    {
        const gltf = assets.target0;
        gltf.scene.children[0].position.z=-24;
        scene.add( gltf.scene );
    }

    //target1
    {
        const gltf = assets.target1;
        gltf.scene.children[0].scale.multiplyScalar(0.3);
        gltf.scene.children[0].position.z=-10;
        gltf.scene.children[0].position.x=7;

        scene.add( gltf.scene );
    }

    //target2
    {
        const gltf = assets.target2;
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z=-10;
        gltf.scene.children[0].position.x=-7;

        scene.add( gltf.scene );
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerMove( event ) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }
    document.addEventListener('mousemove', onPointerMove);

    let selected_menu;

    document.addEventListener('mouseup', () => {
        if(selected_menu !== undefined) {
            console.log('Level change');
        }
    });

    function render(time) {
        time *= 0.001;

        if(resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(menu_cubes, false);

        if(selected_menu !== undefined) {
            selected_menu.material.emissive.setRGB(0,0,0);
        }
        if(intersects.length > 0) {
            const new_cube = intersects[0].object;
            new_cube.material.emissive.setRGB(0,10,10);
            selected_menu = new_cube;
        }
        else selected_menu = undefined;

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
