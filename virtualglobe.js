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

function addMapObjects()
{
    var mapSection = createMapShape(3.5, 2, 11, 8);
    var mapSection2 = createMapShape(3, 5, -30, -20);

    mapSection.url = "./atlasmaps/test-map.html";
    mapSection2.url = "./atlasmaps/test-map2.html";
    scene.add(mapSection);
    scene.add(mapSection2);

    mapObjects.push(mapSection);
    mapObjects.push(mapSection2);

}


//This needs to be modified so that it loads a texture
//onto a custom shape on the virtual globe, before the
//animation starts
function createMapShape(shapeWd, shapeHt, shapeRotX, shapeRotY)
{
    var numCollisions = 0;

    var mapShape = new THREE.PlaneGeometry(shapeWd, shapeHt, 10, 10);
    var mapShapeMaterial = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff, transparent: true, opacity: 0.5 });
    var mapShapeMesh = new THREE.Mesh(mapShape, mapShapeMaterial);

    mapShapeMesh.material.side = THREE.DoubleSide;
    mapShapeMesh.position.z = 0;
    mapShapeMesh.position.y = 0;
    mapShapeMesh.rotation.x = shapeRotX * Math.PI /180;
    mapShapeMesh.rotation.y = shapeRotY * Math.PI /180;


    for (var vertexIndex = 0; vertexIndex < mapShapeMesh.geometry.vertices.length; vertexIndex++)
    {
        var localVertex = mapShapeMesh.geometry.vertices[vertexIndex].clone();
        localVertex.z = 20;

        var directionVector = new THREE.Vector3();
        directionVector.subVectors(earthModel.position, localVertex);
        directionVector.normalize();

        var ray = new THREE.Raycaster(localVertex, directionVector);
        var collisionResults = ray.intersectObject(earthModel);
        numCollisions += collisionResults.length;

        if (collisionResults.length > 0)
        {
            mapShapeMesh.geometry.vertices[vertexIndex].z = collisionResults[0].point.z + 0.1;
        }

    }

    mapShapeMesh.geometry.verticesNeedUpdate = true;
    mapShapeMesh.geometry.normalsNeedUpdate = true;

    return mapShapeMesh;

}