'use strict';




import * as THREE from 'three';
import {OrbitControls} from './examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './examples/jsm/loaders/GLTFLoader.js';

/* global THREE */

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClearColor = false;

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 10, 4);
    scene.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

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
      '../assets/skybox_images/forest_ft.png',

    ]);
    scene.background = texture;
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = 1500;
    //canvas.clientWidth;
    const height = 800;
    //canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }



  //trying gltf model
  const loader = new GLTFLoader();

loader.load( '../assets/bow.glb', function ( gltf ) {

	scene.add( gltf.scene );

}, undefined, function ( error ) {

	console.error( error );

} );

//fsd



  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
