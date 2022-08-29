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

function main() {
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

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance1(geometry, color, x) {

        const loader = new THREE.TextureLoader();

        const material = new THREE.MeshPhongMaterial({
            map: loader.load("/assets/menu/1.jpeg"),
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        cube.position.y = 1.5;

        scene.add(cube);
        return cube;
    }
    function makeInstance2(geometry, color, x) {

        const loader = new THREE.TextureLoader();

        const material = new THREE.MeshPhongMaterial({
            map: loader.load("/assets/menu/2.jpeg"),
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;

        scene.add(cube);
        return cube;
    }
    function makeInstance3(geometry, color, x) {

        const loader = new THREE.TextureLoader();

        const material = new THREE.MeshPhongMaterial({
            map: loader.load("/assets/menu/3.jpeg"),
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

    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            '/assets/skybox_images/forest-x.png',
            '/assets/skybox_images/forest+x.png',
            '/assets/skybox_images/forest+y.png',
            '/assets/skybox_images/forest-y.png',
            '/assets/skybox_images/forest+z.png',
            '/assets/skybox_images/forest-z.png'
        ]);
        scene.background = texture;
    }


    const loader = new GLTFLoader();
    //ARCO

    loader.load( '/assets/simple_bow.glb', function ( gltf ) {
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z=3;
        gltf.scene.children[0].rotation.y=-12.55;
        gltf.scene.children[0].rotation.z=-1.7;

        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    });
//arrow kwroeop
    loader.load( '/assets/arrow.glb', function ( gltf ) {
        gltf.scene.children[0].scale.multiplyScalar(0.03);
        gltf.scene.children[0].position.z=2.2;
        //gltf.scene.children[0].rotation.y=-12.55;
        //gltf.scene.children[0].rotation.z=-1.7;

        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    });

    //target0
    loader.load( '/assets/targets/archery_target.glb', function ( gltf ) {
        //gltf.scene.children[0].scale.multiplyScalar(0.3);
        gltf.scene.children[0].position.z=-24;
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );
    //

    //target1
    loader.load( '/assets/targets/target.glb', function ( gltf ) {
        gltf.scene.children[0].scale.multiplyScalar(0.3);
        gltf.scene.children[0].position.z=-10;
        gltf.scene.children[0].position.x=7;

        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );

    } );
    //
    //target2
    loader.load( '/assets/targets/bullseye_target_custom_ue4_collison_included.glb', function ( gltf ) {
        gltf.scene.children[0].scale.multiplyScalar(0.1);
        gltf.scene.children[0].position.z=-10;
        gltf.scene.children[0].position.x=-7;

        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

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
