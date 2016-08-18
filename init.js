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

//Initialise the raycaster
var raycaster = new THREE.Raycaster();

//Initialise the mouse
var mouse = new THREE.Vector2(),
    INTERSECTED;

controls = new THREE.OrbitControls(camera/*, renderer.domElement*/ );
//controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
controls.minZoom = 0.5;
controls.maxZoom = 10;
controls.enablePan = false;
animate();

//Set the light source and position
var ambLight = new THREE.AmbientLight(0xaaaaaa);
var light = new THREE.DirectionalLight(0xffffff, 0.3);
light.position.set(50, 30, 50);

//Set up the listeners (windows resize, mouse move and mouse click)
window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('click', onDocumentMouseClick, false);

//Create the virtual globe
var mapObjects = [];
var earthModel = createGlobe(20, 64, 64);
addMapObjects();

//Add light to camera so that light rotates with camera object
camera.add(light);

//Initialise the controls
initControls();

//Adds the various components to the scene and renders the scene
scene.add(earthModel);
scene.add(ambLight);
scene.add(camera);
scene.add(createAxes(50));
renderer.render(scene, camera);

/*************************************************************/
//Function to initialise the scene, camera & scene renderer
function initScene() {
	var container = document.createElement('div');
	document.body.appendChild(container);
	var scene = new THREE.Scene();
	// FIXME hard-coded radius
	var r = 20;
	//  FIXME should use size of container instead of window
	var aspectRatio = window.innerWidth / window.innerHeight;

	// initial frustum for orthographic camera is size of the scene
	// near and far planes are along camera viewing axis. Near plane should > 0, as objects behind camera are never visible.
	var camera = new THREE.OrthographicCamera(-r * aspectRatio, r * aspectRatio, r, -r, 1, r * 5);

	// position along z axis does not change apparent size of scene
	//update: needed to add updateProjectMatrix to apply the zoom change.
	camera.position.z = r * 2;
	camera.zoom = 0.75;
	camera.updateProjectionMatrix();

	var renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	//renderer.setPixelRatio(window.devicePixelRatio);

	//  FIXME should use size of container instead of window
	renderer.setSize(window.innerWidth, window.innerHeight);
	//renderer.setClearColor(0x404040, 1);
	container.appendChild(renderer.domElement);

	return {
		scene : scene,
		camera : camera,
		renderer : renderer
	};
}

//Render function used by the Trackball controls
function render() {
	renderer.render(scene, camera);
}

//Animate function used by the Trackball controls
function animate() {
	controls.update();
	requestAnimationFrame(animate);
	render();
}

//Update the scene when the browser window size is changed
function onWindowResize() {
	//  FIXME should use size of container instead
	var r = 20;
	// FIXME hard-coded radius
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.left = -r * camera.aspect;
	camera.right = r * camera.aspect;
	camera.top = r;
	camera.bottom = -r;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

//Monitor the mouse movement and change the colour of any map object that is moused over
function onDocumentMouseMove(event) {

	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(mapObjects);

	if (intersects.length > 0) {

		if (INTERSECTED != intersects[0].object) {
			if (INTERSECTED)
				INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
			INTERSECTED = intersects[0].object;
			INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
			INTERSECTED.material.color.setHex(0xff0000);
		}
	} else {
		if (INTERSECTED)
			INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
		INTERSECTED = null;
	}

}

//When a map shape is clicked by the mouse, open the 2D map view & hide the virtual globe
function onDocumentMouseClick(event) {
	event.preventDefault();

	mouse.x = (event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = -(event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(mapObjects);

	if (intersects.length > 0) {
		// Compute the corners of a flat rectangle in world space that covers the entire view space.
		// The rectangle is placed in front of the camera. The center of the rectangle is on the
		// line connecting the camera position and the centre of the sphere. We use the camera direction
		// vector (i.e. the vector pointing from the camera to the centre of the sphere) and the camera
		// up vector (i.e. the vector pointing towards the upper border of the view space) to 
		// compute the four corners of the rectangle. We use the cross product of these two vectors
		// to compute a third vector pointing from the camera centre to the left border of the 
		// view space. The four corners are then computed by adding these two vectors to the camera
		// position.   
		
		// compute the camera direction in world space
		// this vector is pointing from the camera position towards the centre of the sphere
		var cameraDirection = new THREE.Vector3();
		camera.getWorldDirection(cameraDirection);

		// compute camera up vector in world space
		// this direction vector points from the camera position towards the upper border of the image plane
		// the length of up is 1.
		var up = new THREE.Vector3();
		var worldQuaternion = new THREE.Quaternion();
		camera.getWorldQuaternion(worldQuaternion);
		up.copy(camera.up).applyQuaternion(worldQuaternion);
		
		// vector from mesh centre to top of mesh
		var top = new THREE.Vector3();
		top.copy(up);
		top.multiplyScalar(camera.top / camera.zoom);

		// vector from mesh centre to bottom of mesh
		var bottom = new THREE.Vector3();
		bottom.copy(up);
		bottom.multiplyScalar(camera.bottom / camera.zoom);
		
		// vector from mesh centre to left side of mesh
		var left = new THREE.Vector3();
		left.crossVectors(cameraDirection, up);
		left.multiplyScalar(camera.left / camera.zoom);

		// vector from mesh centre to right side of mesh
		var right = new THREE.Vector3();
		right.crossVectors(cameraDirection, up);
		right.multiplyScalar(camera.right / camera.zoom);

		// central position of mesh
		var meshCenter = new THREE.Vector3();
		meshCenter.copy(cameraDirection);
		// camera direction is pointing towards centre of sphere
		// use negative sign for distance multiplication to invert camera direction
		// FIXME hard-coded radius plus offset
		meshCenter.multiplyScalar(-(20 + 1));
		
		// new vertex coordinates are relative to centre of mesh
		var vertices = intersects[0].object.geometry.vertices;
		vertices[0].copy(meshCenter).add(top).add(left);
		vertices[1].copy(meshCenter).add(top);
		vertices[2].copy(meshCenter).add(top).add(right);
		vertices[3].copy(meshCenter).add(left);
		vertices[4].copy(meshCenter);
		vertices[5].copy(meshCenter).add(right);
		vertices[6].copy(meshCenter).add(bottom).add(left);
		vertices[7].copy(meshCenter).add(bottom);
		vertices[8].copy(meshCenter).add(bottom).add(right);
		intersects[0].object.geometry.verticesNeedUpdate = true;
	}
}

//Function to open a JQuery Dialog box which loads a HTML page
//which contains the interactive 2D atlas map.
//Function will also show the 3D elements once the 2D window is closed
function showDialog(mapURL) {
	var page = mapURL;

	//Set the height & width of the dialog window to 80% of the browser window size
	var winWidth = $(window).width();
	var pWidth = winWidth * 0.8;
	var winHeight = $(window).height();
	var pHeight = winHeight * 0.8;

	//When the dialog window is closed, show the virtual globe and re-enable the controls
	var closeFunction = function() {
		earthModel.visible = true;
		controls.enabled = true;
		for (var i = 0; i < mapObjects.length; i++) {
			mapObjects[i].visible = true;
		}
	};

	var $dialog = $('<div></div>').html('<iframe style="border: 0px; " src="' + page + '" width="100%" height="100%"></iframe>').dialog({
		autoOpen : false,
		modal : true,
		height : pHeight,
		width : pWidth,
		title : "Atlas Map",
		close : closeFunction
	});

	$dialog.dialog('open');

}

//Function to create and action the HTML buttons at the top of document
function initControls() {
	container = document.createElement('div');
	document.body.appendChild(container);

	var buttonControls = document.createElement('div');

	buttonControls.style.position = 'absolute';
	buttonControls.style.top = '10px';
	buttonControls.style.width = '100%';
	buttonControls.style.zIndex = '100';
	buttonControls.style.textAlign = 'center';

	container.appendChild(buttonControls);

	buttonControls.innerHTML = '<button onclick="controls.reset()">Reset Camera</button>';

}

