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

//Function to create the sphere and load the textures
function createGlobe(radius, wSeg, hSeg)
{

    //Create the sphere and apply a diffused material
    var geometry = new THREE.SphereGeometry(radius, wSeg, hSeg);
    var material = new THREE.MeshPhongMaterial();
    var globeMesh = new THREE.Mesh(geometry, material);

    //Load and add the textures
    var loader = new THREE.TextureLoader();
    globeMesh.material.map = loader.load("./textures/2_no_clouds_8k.jpg");
    globeMesh.material.bumpMap = loader.load("./textures/earthbump1k.jpg");
    globeMesh.material.bumpScale = 0.03;
    globeMesh.material.specularMap = loader.load("./textures/water_4k.png");
    globeMesh.material.specular = new THREE.Color("grey");

    globeMesh.name = "globeMesh";

    globeMesh.rotation.y = 135 * Math.PI /180;
    globeMesh.rotation.x = -25 * Math.PI /180;

    return globeMesh;

}


function createMap()
{

    var map = new THREE.TextureLoader().load("./textures/victoria_1m.jpg");
    var material = new THREE.SpriteMaterial( {map:map, color: 0xffffff, fog: true});
    var sprite = new THREE.Sprite(material);

    return sprite;
}