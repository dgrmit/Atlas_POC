/*************************************************************************************************
 Filename: init.js
 Author: Daniel Guglielmi
 *************************************************************************************************/
"use strict";

//Global variables

//Adjustable variables for the globe radius, offset, window scale percentange
//and animation time
var earthRadius = 20;
var radOffset = 2;
var windowScale = 0.8;
var animationTime = 1;

//Get the dialog box ratios based on the browser window size
var dialogRatio;

//Set up the Three.js clock
var clock = new THREE.Clock();

//Initialise the variables used to control the map shape transition
var t = 0;
var dialogClose = false;

//Function call to initialise the scene, camera and renderer
var init = initScene();
var scene = init.scene;
var camera = init.camera;
var renderer = init.renderer;

//Initialise the raycaster
var raycaster = new THREE.Raycaster();

//Initialise the mouse
var mouse = new THREE.Vector2();
var mouseOver;

//Create the virtual globe
var mapObjects = [];
var earthModel = createGlobe(earthRadius, 64, 64);
addMapObjects();

//Initialise the camera controls
var controls = new THREE.OrbitControls(camera);
controls.minZoom = 0.5;
controls.maxZoom = 10;
controls.enablePan = false;
animate();

//Set the light source and position
var ambLight = new THREE.AmbientLight(0xaaabbb);
var light = new THREE.DirectionalLight(0xffffff, 0.35);
light.position.set(200, 50, 30);

//Set up the listeners (windows resize, mouse move and mouse click)
window.addEventListener("resize", onWindowResize, false);
document.addEventListener("mousemove", onDocumentMouseMove, false);
document.addEventListener("click", onDocumentMouseClick, false);

//Add light to camera so that light rotates with camera object
camera.add(light);

//Initialise the controls
initControls();

//Adds the various components to the scene and renders the scene
scene.add(earthModel);
scene.add(ambLight);
scene.add(camera);
//scene.add(createAxes(50));
renderer.render(scene, camera);


/*************************************************************/
/*************************************************************/
//Function to initialise the scene, camera & scene renderer
function initScene()
{

    var container = document.createElement("div");
    var aspectRatio = window.innerWidth / window.innerHeight;

    document.body.appendChild(container);
    scene = new THREE.Scene();

    // initial frustum for orthographic camera is size of the scene
    // near and far planes are along camera viewing axis. Near plane should > 0, as objects behind camera are never visible.
	//Contributed by Dr Bernhard Jenny
    camera = new THREE.OrthographicCamera(-earthRadius * aspectRatio, earthRadius * aspectRatio, earthRadius, -earthRadius, 1, 100);

    camera.position.z = 101;
    camera.zoom = 0.75;
    camera.updateProjectionMatrix();

	//Initialise the WebGL renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);

    return {
        scene: scene,
        camera: camera,
        renderer: renderer
    };
}

//Render function used by the Orbit controls
function render()
{
    renderer.render(scene, camera);
}

//Animate function used by the Orbit controls
function animate()
{
    controls.update();
    requestAnimationFrame(animate);
    render();
    TWEEN.update();
}

//Update the scene size when the browser window size is changed
//Edited by Dr Bernhard Jenny
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.left = -earthRadius * camera.aspect;
    camera.right = earthRadius * camera.aspect;
    camera.top = earthRadius;
    camera.bottom = -earthRadius;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    dialogRatio = dialogDim();
}

//Monitor the mouse movement and change the colour of any map object that is moused over
function onDocumentMouseMove(event)
{
	//Map the mouse position from screen coords to NDC
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight ) * 2 + 1;

	//Initialise the raycaster
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(mapObjects);

	//Check when the mouse intersects with a valid 3D object
    if (intersects.length > 0) {

		//If the mouse no longer intersects the object, return the original colour
        if (mouseOver !== intersects[0].object) {
            if (mouseOver) {
                mouseOver.material.color.setHex(mouseOver.currentHex);

            }

			//Copy the intersected variable to the mouse variable
			//Record current colour settings
			//Set the new colour & opacity and load the preview map
            mouseOver = intersects[0].object;
            mouseOver.currentHex = mouseOver.material.color.getHex();
            mouseOver.material.color.setHex(0xffffff);
            mouseOver.material.opacity = 0.6;
            mouseOver.material.map = new THREE.TextureLoader().load(mouseOver.texture);
            mouseOver.material.needsUpdate = true;

        }
    }
    else {
		//When the mouse no longer intersects, set the original colour & opacity
		//and clear the preview map
        if (mouseOver) {
            mouseOver.material.color.setHex(mouseOver.currentHex);
            mouseOver.material.map = null;
            mouseOver.material.needsUpdate = true;
            mouseOver.material.opacity = 0.2;
        }
		//Clear the mouse variable
        mouseOver = null;
    }

}

//When a map shape is clicked by the mouse, open the 2D map view & hide the virtual globe
function onDocumentMouseClick(event)
{

	//Map the mouse position from screen coords to NDC
    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
	
	//Initialise the raycaster
    raycaster.setFromCamera(mouse, camera);
    var clickedObject = raycaster.intersectObjects(mapObjects);

    //Runs the following statements when a map shape has been clicked
    //Note, distance limit set to avoid shapes on other side of globe being activated.
    if ((clickedObject.length > 0) && (clickedObject[0].distance < 100)) {

        //Get the dimensions of the dialog box based on the clicked object settings
        dialogRatio = dialogDim(clickedObject[0].object.url, clickedObject[0].object.scaleFactor);

        //Set the elapsed time variable to 0 (reset timer after any previous transitions)
        t = 0;

        //Start the clock, which is used to track elapsed time used in the animation
        clock.start();

        //Disable the orbit controls, resets the dialog box flag and disables the ThreeJS mouse listeners
        controls.enabled = false;
        dialogClose = false;
        document.removeEventListener("mousemove", onDocumentMouseMove, false);
        document.removeEventListener("click", onDocumentMouseClick, false);

        //Creates additional copies of the map shape which are used as the transitional and final 2D map shapes
        var transMapShape = new THREE.Mesh(clickedObject[0].object.geometry.clone(), clickedObject[0].object.material.clone());
        var tempMapShape = new THREE.Mesh(clickedObject[0].object.geometry.clone(), clickedObject[0].object.material.clone());
        var flatMapShape = calcFlatMapShape(tempMapShape);

        //add the transitional map shape to the scene so that the animation function displays the shape
        scene.add(transMapShape);

        //Set the transitional map shape color to white with no transparency
        //call the transform (animation) function and passes the map shape, transitional map and 2D map objects
        //as the arguments
        transMapShape.material.transparent = false;
        transMapShape.material.color.setHex(0xffffff);
        transMapShape.material.map = new THREE.TextureLoader().load(clickedObject[0].object.texture);
        mapshapeTransform(clickedObject[0].object, transMapShape, flatMapShape);
        showDialog(clickedObject[0].object.url, clickedObject[0].object.title, clickedObject[0].object, transMapShape, flatMapShape);
        animateGlobe(-1, 0.5, 0.7);
    }
}


//Function to create and action the HTML buttons at the top of document
function initControls()
{
    var container = document.createElement("div");
    document.body.appendChild(container);

    var buttonControls = document.createElement("div");

    buttonControls.style.position = "absolute";
    buttonControls.style.top = "10px";
    buttonControls.style.width = "100%";
    buttonControls.style.zIndex = "100";
    buttonControls.style.textAlign = "center";

    container.appendChild(buttonControls);

    buttonControls.innerHTML = "<button onclick='controls.reset()'>Reset Camera</button>";

}


