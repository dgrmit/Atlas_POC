/*************************************************************************************************
 Filename: transform.js
 Author: Daniel Guglielmi (#3423059)

 Description:

 All Project Files & Short Description


 Ancillary files
 jquery-1.12.3.min.js - JQuery library (used for notify.js plugin)
 notify.js - JQuery plugin used for visual notifications
 three.js - Three.js library
 trackballcontrols.js - Trackball control library file
 *************************************************************************************************/
"use strict";


//Function to calculate the linear interpolation based on the values passed to it
function lerp(k1, v1, k2, v2, k)
{
    return (k - k1) / (k2 - k1) * (v2 - v1) + v1;

}

//Function to find the upper interval value (ie: next highest value) in the array
function findInterval(keys, k)
{

    for (var i = 0; i < keys.length; i++) {
        if ((keys[i] >= k) && (keys[0] < k)) {
            return i;
        }

    }
}

//Function to call the lerp and findInterval functions and return the interpolated value
function interpolator(keys, values, key)
{

    var i;
    var interped;

    i = findInterval(keys, key);
    interped = lerp(keys[i - 1], values[i - 1], keys[i], values[i], key);

    return interped;

}


//Function which calculates the transition animation. Uses the time delta and the intersected
// map shape as arguments
function mapshapeTransform(mapShape, transMapShape, flatMapShape)
{

    //Assign the variable the clock delta value
    var dt = clock.getDelta();

    //Initialise the animation time array
    var keys = [0, 1];

    //Initialise the initial, end and transition map objects
    var initialMapShape = mapShape;
    var transitionMapShape = transMapShape;
    var endMapShape = flatMapShape;

    //Hide the initial and 2D map shapes from view
    mapShape.visible = false;
    flatMapShape.visible = false;

    //Increment the value of t by the time delta variable to advance the animation
    t += dt;

    //For loop used to update each shape vertex (9 vertices)
    for (var i = 0; i < 9; i++) {

        //Create separate arrays which contain the start and end X, Y and Z coordinates
        var xArray = [initialMapShape.geometry.vertices[i].x, endMapShape.geometry.vertices[i].x];
        var yArray = [initialMapShape.geometry.vertices[i].y, endMapShape.geometry.vertices[i].y];
        var zArray = [initialMapShape.geometry.vertices[i].z, endMapShape.geometry.vertices[i].z];

        //Pass each coordinate pair (start/end) to the interpolator for the new value
        var newX = interpolator(keys, xArray, t);
        var newY = interpolator(keys, yArray, t);
        var newZ = interpolator(keys, zArray, t);

        //Checks for the NaN value, which indicates the end of the array
        if (newZ !== newZ) {
            //Checks if the function call came from the dialog function or the mouse click function
            if (dialogClose !== true) {
                //Stops the clock (to reset it) and calls the show dialog function and passes the
                //required arguments to open the correct atlas map and call the map shape transform
                //function to reverse the animation
                clock.stop();
                showDialog(mapShape.url, mapShape, transMapShape, flatMapShape);
                return;
            }
            //
            else if (dialogClose === true) {
                //Shows the map shape on the virtual globe, re-enables the mouse listener.
                //controls and removes the transitional map from the scene
                flatMapShape.visible = true;
                document.addEventListener("mousemove", onDocumentMouseMove, false);
                document.addEventListener("click", onDocumentMouseClick, false);
                controls.enabled = true;
                scene.remove(transMapShape);
                return;
            }
        }
        //While not at the end of the array, each vertex is updated with the interpolated value
        else {

            // project point onto sphere by scaling direction vector
            var v = new THREE.Vector3(newX, newY, newZ);
            if (v.length() < earthRadius) {
                var directionVector = new THREE.Vector3(newX, newY, newZ);
                directionVector.normalize();
                directionVector.multiplyScalar((earthRadius + radOffset));
                newX = directionVector.x;
                newY = directionVector.y;
                newZ = directionVector.z;
            }

            transitionMapShape.geometry.vertices[i].x = newX;
            transitionMapShape.geometry.vertices[i].y = newY;
            transitionMapShape.geometry.vertices[i].z = newZ;
        }

    }

    //Update the transitional map vertices, renderer the new scene and request the next animation frame
    transitionMapShape.geometry.verticesNeedUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(function () {
        mapshapeTransform(initialMapShape, transitionMapShape, endMapShape);
    });

}

// Function to compute the corners of a flat rectangle in world space that covers the entire view space.
// The rectangle is placed in front of the camera. The center of the rectangle is on the
// line connecting the camera position and the centre of the sphere. We use the camera direction
// vector (i.e. the vector pointing from the camera to the centre of the sphere) and the camera
// up vector (i.e. the vector pointing towards the upper border of the view space) to
// compute the four corners of the rectangle. We use the cross product of these two vectors
// to compute a third vector pointing from the camera centre to the left border of the
// view space. The four corners are then computed by adding these two vectors to the camera
// position.
function calcFlatMapShape(clickedMapShape)
{

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
    top.multiplyScalar((camera.top * (windowScale - (dialogRatio.heightRatio / 2) - 0.1)) / camera.zoom);

    // vector from mesh centre to bottom of mesh
    var bottom = new THREE.Vector3();
    bottom.copy(up);
    bottom.multiplyScalar((camera.bottom * (windowScale - (dialogRatio.heightRatio / 2))) / camera.zoom);

    // vector from mesh centre to left side of mesh
    var left = new THREE.Vector3();
    left.crossVectors(cameraDirection, up);
    left.multiplyScalar((camera.left * (windowScale - (dialogRatio.widthRatio / 2))) / camera.zoom);

    // vector from mesh centre to right side of mesh
    var right = new THREE.Vector3();
    right.crossVectors(cameraDirection, up);
    right.multiplyScalar((camera.right * (windowScale - (dialogRatio.widthRatio / 2))) / camera.zoom);

    // central position of mesh
    var meshCenter = new THREE.Vector3();
    meshCenter.copy(cameraDirection);
    // camera direction is pointing towards centre of sphere
    // use negative sign for distance multiplication to invert camera direction
    meshCenter.multiplyScalar(-(earthRadius * 2));

    // new vertex coordinates are relative to centre of mesh
    var vertices = clickedMapShape.geometry.vertices;
    vertices[0].copy(meshCenter).add(top).add(left);
    vertices[1].copy(meshCenter).add(top);
    vertices[2].copy(meshCenter).add(top).add(right);
    vertices[3].copy(meshCenter).add(left);
    vertices[4].copy(meshCenter);
    vertices[5].copy(meshCenter).add(right);
    vertices[6].copy(meshCenter).add(bottom).add(left);
    vertices[7].copy(meshCenter).add(bottom);
    vertices[8].copy(meshCenter).add(bottom).add(right);

    return clickedMapShape;
}

// Convert from view space [-1,+1] to world space. Returned 3D coordinates are on a plane
// passing through the origin of the world space.
function viewSpaceToWorldSpace(viewX, viewY)
{

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

    // vector from origin to top in view space
    var top = new THREE.Vector3();
    top.copy(up);
    top.multiplyScalar((camera.top) / camera.zoom * viewY);

    // vector from origin to right side in view space
    var right = new THREE.Vector3();
    right.crossVectors(cameraDirection, up);
    right.multiplyScalar((camera.right) / camera.zoom * viewX);

    return top.add(right);
}

// Animated move and scale of the globe
function animateGlobe(viewX, viewY, scale)
{
    var duration = 1000;
    var worldXY = viewSpaceToWorldSpace(viewX, viewY);

    var positionTween = new TWEEN.Tween(earthModel.position).to({
        x: worldXY.x,
        y: worldXY.y,
        z: worldXY.z
    }, duration).easing(TWEEN.Easing.Quartic.InOut).start();

    var scaleTween = new TWEEN.Tween(earthModel.scale).to({
        x: scale,
        y: scale,
        z: scale
    }, duration).start();
}

//Function to open a JQuery Dialog box which loads a HTML page
//which contains the interactive 2D atlas map.
//Function will also show the 3D elements once the 2D window is closed
function showDialog(mapURL, initMap, transMap, endMap)
{
    var page = mapURL;

    //Set the height & width of the dialog window to 80% of the browser window size
    var winWidth = $(window).width();
    var pWidth = winWidth * windowScale;
    var winHeight = $(window).height();
    var pHeight = winHeight * windowScale;

    //When the dialog window is closed, set the flag to indicate the map shape transform function call
    //came from here, reset the time variable, start the clock and call the map shape transform function
    //with the initial and end map coordinates reversed (so the animation goes the opposite direction)
    var closeFunction = function () {
        dialogClose = true;
        t = 0;
        clock.start();
        $dialog.dialog('destroy');
        mapshapeTransform(endMap, transMap, initMap);
        animateGlobe(0, 0, 1);
    };

    //Specifies the dialog box parameters
    var $dialog = $('<div></div>').html('<iframe style="border: 0; margin: 0; padding: 0; " src="' + page + '" width="100%" height="100%"></iframe>').dialog({
        autoOpen: false,
        modal: true,
        show: {effect: "fade", duration: 1000},
        hide: {effect: "fade", duration: 1000},
        height: pHeight,
        width: pWidth,
        title: "Atlas Map",
        close: closeFunction
    });

    $dialog.dialog('open');



}

//Function which returns the dialog window ratio to assist with setting up the transitional map
function dialogDim()
{
    var heightRatio;
    var widthRatio;

    //Set the height & width of the dialog window to 80% of the browser window size
    var winWidth = $(window).width();
    var pWidth = winWidth * windowScale;
    var winHeight = $(window).height();
    var pHeight = winHeight * windowScale;

    //Specifies the dialog box parameters
    var $dialog = $('<div></div>').html('<iframe style="border: 0; margin: 0; padding: 0; " src="./atlasmaps/test-map.html" width="100%" height="100%"></iframe>').dialog({
        autoOpen: false,
        height: pHeight,
        width: pWidth
    });

    $dialog.dialog('open');


    heightRatio = 1 - $dialog.height()/$dialog.innerHeight();
    widthRatio = 1 - $dialog.width()/$dialog.innerWidth();
    console.log("height is ",pHeight);
    console.log("Inner height is ", $dialog.innerHeight());
    console.log("Width is ", pWidth);
    console.log("Inner width is ", $dialog.innerWidth());
    console.log("dialog height is ", $dialog.height());
    console.log("dialog width is ", $dialog.width());
    console.log("title bar size is ", $dialog);
    $dialog.dialog('close');

    return {
        heightRatio: heightRatio,
        widthRatio: widthRatio
    };
}