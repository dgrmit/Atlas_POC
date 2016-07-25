/*************************************************************************************************
 Filename: init.js
 Author: Daniel Guglielmi (#3423059)

 Description: Main JS file which initialises the scene, camera, renderer and trackball controls.

 All Project Files & Short Description
 

 Ancillary files
 jquery-1.12.3.min.js - JQuery library (used for notify.js plugin)
 notify.js - JQuery plugin used for visual notifications
 three.js - Three.js library
 trackballcontrols.js - Trackball control library file
 *************************************************************************************************/

//Function call to initialise the scene, camera and renderer
var init = initScene();
var scene = init.scene;
var camera = init.camera;
var renderer = init.renderer;

//Trackball controls
var controls = new THREE.TrackballControls(camera);
controls.rotateSpeed = 5.0;
controls.minDistance = 1.0;
controls.maxDistance = 10.0;
controls.addEventListener('change', render);
animate();

//Set the light source and position
var ambLight = new THREE.AmbientLight(0xaaaaaa);
var light = new THREE.DirectionalLight(0xffffff, 0.3);
light.position.set(10, 3, 10);

//Monitor for pressed keys
document.onkeydown = checkKeyPressed;

//Create the virtual globe
var earthModel = createGlobe(0.5, 32, 32);

var spriteMap = createMap();
console.log(spriteMap);
spriteMap.visible = false;


//Add light to camera so that light rotates with camera object
camera.add(light);

//Adds the various components to the scene and renders the scene
scene.add(earthModel);
scene.add(spriteMap);
scene.add(ambLight);
scene.add(camera);
renderer.render(scene, camera);



/*************************************************************/
//Function to initialise the scene, camera & scene renderer
function initScene()
{
    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 500);
    camera.position.z = 2;

    var renderer = new THREE.WebGLRenderer();
    var canvasWidth = window.innerWidth - 20;
    var canvasHeight = window.innerHeight - 100;
    renderer.setSize(canvasWidth, canvasHeight);
    //renderer.setClearColor(0x404040, 1);
    document.body.appendChild(renderer.domElement);

    return {
        scene: scene,
        camera: camera,
        renderer: renderer
    };
}

//Render function used by the Trackball controls
function render()
{
    renderer.render(scene, camera);
}

//Animate function used by the Trackball controls
function animate()
{
    controls.update();
    requestAnimationFrame(animate);
    render();
}

//Function used to action key presses
function checkKeyPressed(key) {
    switch (key.keyCode) {
        case 49:
            //#1 key pressed
            $.notify("Show 2D Map");
            earthModel.position.x = -1;
            earthModel.position.z = -1;
            spriteMap.visible = true;
            break;
        case 50:
            //#2 key pressed
            $.notify("Hide 2d Map");
            earthModel.position.x = 0;
            earthModel.position.z = 0;
            spriteMap.visible = false;
            break;
    }
}