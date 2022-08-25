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

    function makeInstance(geometry, color, x) {
        
       const loader = new THREE.TextureLoader();
      const material = new THREE.MeshBasicMaterial({
    	map: loader.load("../assets/1.jpeg"),
  		});

        //
        //const material = new THREE.MeshPhongMaterial({color});
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;

        scene.add(cube);
        return cube;
    }

    const cubes = [
        makeInstance(geometry, 0x44aa88,  0),
        makeInstance(geometry, 0x8844aa, -2),
        makeInstance(geometry, 0xaa8844,  2),
    ];

    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            '../assets/skybox_images/forest_lf.png',
            '../assets/skybox_images/forest_rt.png',
            '../assets/skybox_images/forest_up.png',
            '../assets/skybox_images/forest_dn.png',
            '../assets/skybox_images/forest_bk.png',
            '../assets/skybox_images/forest_ft.png'
        ]);
        scene.background = texture;
    }


    const loader = new GLTFLoader();

loader.load( '../assets/simple_bow.glb', function ( gltf ) {
  gltf.scene.children[0].scale.multiplyScalar(0.1);
  gltf.scene.children[0].position.z=1;
  gltf.scene.children[0].rotation.y=-0.5;
  gltf.scene.children[0].rotation.z=1;
	scene.add( gltf.scene );
}, undefined, function ( error ) {
	console.error( error );
} );
//archery_target
loader.load( '../assets/targets/archery_target.glb', function ( gltf ) {
    //gltf.scene.children[0].scale.multiplyScalar(0.3);
    gltf.scene.children[0].position.z=-4;
      scene.add( gltf.scene );
  }, undefined, function ( error ) {
      console.error( error );
  } );
//

  loader.load( '../assets/targets/target.glb', function ( gltf ) {
    gltf.scene.children[0].scale.multiplyScalar(0.3);
    gltf.scene.children[0].position.z=-4;
    gltf.scene.children[0].position.x=2;

      scene.add( gltf.scene );
  }, undefined, function ( error ) {
      console.error( error );

  } );
  //

  loader.load( '../assets/targets/bullseye_target_custom_ue4_collison_included.glb', function ( gltf ) {
    gltf.scene.children[0].scale.multiplyScalar(0.1);
    gltf.scene.children[0].position.z=-4;
    gltf.scene.children[0].position.x=-3;

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

    function render(time) {
        time *= 0.001;

        if(resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
            /*
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });*/

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children, false);
        if(intersects.length > 0) {
            
            intersects[0].object.material.color.setRGB(255, 255, 255);
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
