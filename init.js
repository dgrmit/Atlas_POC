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
var mouse = new THREE.Vector2(), INTERSECTED;

//Trackball controls
//var controls = new THREE.TrackballControls(camera);
var controls = new THREE.OrthographicTrackballControls(camera);
controls.rotateSpeed = 5.0;
controls.minDistance = 40.0;
controls.maxDistance = 150.0;

//controls.addEventListener('change', render);
animate();

//Set the light source and position
var ambLight = new THREE.AmbientLight(0xaaaaaa);
var light = new THREE.DirectionalLight(0xffffff, 0.3);
light.position.set(50, 30, 50);

//Set up the listeners (windows resize, mouse move and mouse click)
window.addEventListener( 'resize', onWindowResize, false );
document.addEventListener( 'mousemove', onDocumentMouseMove, false );
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

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
function initScene()
{
    var container = document.createElement('div');
    document.body.appendChild(container);
    var scene = new THREE.Scene();

    //var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 500);
    var camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 100);
    camera.position.z = 70;
    camera.zoom = 12;

    var renderer = new THREE.WebGLRenderer({antialias: true});
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0x404040, 1);
    container.appendChild(renderer.domElement);

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

//Update the scene when the browser window size is changed
function onWindowResize()
{

    camera.aspect = window.innerWidth / window.innerHeight;
    /*
    camera.left = window.innerWidth / - 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / - 2;
    */
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//Monitor the mouse movement and change the colour of any map object that is moused over
function onDocumentMouseMove( event )
{

    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects(mapObjects);

    if (intersects.length > 0) {

        if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            INTERSECTED.material.color.setHex( 0xff0000 );
        }
    } else {
        if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
    }


}

//When a map shape is clicked by the mouse, open the 2D map view & hide the virtual globe
function onDocumentMouseDown( event )
{
    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = -( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(mapObjects);

    if (intersects.length > 0) {

        //intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
        showDialog(intersects[0].object.url);
        earthModel.visible = false;
        controls.enabled = false;

        for (var i = 0; i < mapObjects.length;i++){
            mapObjects[i].visible = false;
        }

    }
}



//Function to open a JQuery Dialog box which loads a HTML page
//which contains the interactive 2D atlas map.
//Function will also show the 3D elements once the 2D window is closed
function showDialog(mapURL)
{
    var page = mapURL;

    var closeFunction = function() {
        earthModel.visible = true;
        controls.enabled = true;
        for (var i = 0; i < mapObjects.length;i++){
            mapObjects[i].visible = true;
        }
    };

    var $dialog = $('<div></div>')
        .html('<iframe style="border: 0px; " src="' + page + '" width="100%" height="100%"></iframe>')
        .dialog({
            autoOpen: false,
            modal: true,
            height: 800,
            width: 1200,
            title: "Atlas Map",
            close: closeFunction
        });

    $dialog.dialog('open');

}

//Function to create and action the HTML buttons at the top of document
function initControls()
{
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    var buttonControls = document.createElement( 'div' );

    buttonControls.style.position = 'absolute';
    buttonControls.style.top = '10px';
    buttonControls.style.width = '100%';
    buttonControls.style.zIndex = '100';
    buttonControls.style.textAlign = 'center';

    container.appendChild( buttonControls );

    buttonControls.innerHTML = '<button onclick="controls.reset()">Reset Camera</button>';

}

