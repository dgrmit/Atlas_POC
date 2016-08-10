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
    //globeMesh.rotation.x = -25 * Math.PI /180;

    return globeMesh;

}

function addMapObjects()
{
    var mapSection = createMapShape(-30, 142, -40, 155);
    //var mapSection2 = createMapShape(3, 5, -30, -20);

    mapSection.url = "./atlasmaps/test-map.html";
    //mapSection2.url = "./atlasmaps/test-map2.html";
    //scene.add(mapSection);
    //scene.add(mapSection2);


    console.log(mapSection);

    mapObjects.push(mapSection);
    //mapObjects.push(mapSection2);
    earthModel.add(mapSection);

}


//Create a custom shape based on the Lat/Long of top left and bottom
//right coords of 2D atlas map. Function calculates coords to subdivide shape
//into 8 triangles, converts coords to sphere XYZ coords and creates the shape
function createMapShape(lat1, long1, lat2, long2)
{
    var latArray = [];
    var longArray = [];


    //Compute and store the 9 coordinate pairs in the each array
    latArray[0] = lat1;
    latArray[1] = lat1;
    latArray[2] = lat1;
    latArray[3] = 0.5 * (lat2 - lat1) + lat1;
    latArray[4] = 0.5 * (lat2 - lat1) + lat1;
    latArray[5] = 0.5 * (lat2 - lat1) + lat1;
    latArray[6] = lat2;
    latArray[7] = lat2;
    latArray[8] = lat2;

    longArray[0] = long1 + 90;
    longArray[1] = (0.5 * (long2 - long1) + long1) + 90;
    longArray[2] = long2 + 90;
    longArray[3] = long1 + 90;
    longArray[4] = (0.5 * (long2 - long1) + long1) + 90;
    longArray[5] = long2 + 90;
    longArray[6] = long1 + 90;
    longArray[7] = (0.5 * (long2 - long1) + long1) + 90;
    longArray[8] = long2 + 90;

    //Create the new shape using the coords from the Lat/Long arrays
    var geometry = new THREE.Geometry();

    var vertexCoord;

    for (var i = 0; i < 9; i++){
        vertexCoord = convertLatLong(latArray[i], longArray[i]);
        geometry.vertices.push(new THREE.Vector3(vertexCoord.x, vertexCoord.y, vertexCoord.z));
    }

    geometry.faces.push(new THREE.Face3(0, 3, 1));
    geometry.faces.push(new THREE.Face3(3, 4, 1));
    geometry.faces.push(new THREE.Face3(1, 4, 2));
    geometry.faces.push(new THREE.Face3(4, 5, 2));
    geometry.faces.push(new THREE.Face3(3, 6, 4));
    geometry.faces.push(new THREE.Face3(6, 7, 4));
    geometry.faces.push(new THREE.Face3(4, 7, 5));
    geometry.faces.push(new THREE.Face3(7, 8, 5));

    var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff, transparent: true, opacity: 0.5 });
    var mapShapeMesh = new THREE.Mesh(geometry, material);
    mapShapeMesh.material.wireframe = false;
    mapShapeMesh.material.side = THREE.DoubleSide;



    return mapShapeMesh;


}


function convertLatLong(lat, long)
{
    var x = Math.sin(toRadians(long)) * Math.cos(toRadians(-lat)) * 20.1;
    var y = Math.sin(toRadians(long)) * Math.sin(toRadians(-lat)) * 20.1;
    var z = Math.cos(toRadians(long)) * 20.1;

    return {
        x: x,
        y: y,
        z: z
    };
}

/*
//Alternate method to create custom shape on the virtual globe
//Uses the 2D map extents and translates Lat/Long to XYZ coords
function createMapShape(lat1, long1, lat2, long2)
{
    var numCollisions = 0;

    //Determine the shape size
    var planeHeight = Math.abs(lat1 - lat2);
    var planeWidth =  Math.abs(long2 - long1);

    //Find the mid-point between coords
    var planeCentreLat = 0.5 * (lat2 - lat1) + lat1;
    var planeCentreLong = ((long1 + long2) / 2) + 90;

    //Convert the Plane centre Lat/Long to XYZ
    var planeX = Math.sin(toRadians(planeCentreLong)) * Math.cos(toRadians(planeCentreLat)) * 20;
    var planeY = Math.sin(toRadians(planeCentreLong)) * Math.sin(toRadians(planeCentreLat)) * 20;
    var planeZ = Math.cos(toRadians(planeCentreLong)) * 20;

    console.log("x: ", planeX);
    console.log("y: ", planeY);
    console.log("z: ", planeZ);

    var mapShape = new THREE.PlaneGeometry(planeWidth, planeHeight, 10, 10);
    var mapShapeMaterial = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff, transparent: true, opacity: 0.5 });
    var mapShapeMesh = new THREE.Mesh(mapShape, mapShapeMaterial);

    mapShapeMesh.material.side = THREE.DoubleSide;
    mapShapeMesh.position.z = planeZ;
    mapShapeMesh.position.y = planeY;
    mapShapeMesh.position.x = planeX;

    mapShapeMesh.rotation.x = -toRadians(planeCentreLat);
    mapShapeMesh.rotation.y = -toRadians(planeCentreLong - 90);

    return mapShapeMesh;
}
*/



/*
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
    */


function toRadians (angle)
{
    return angle * (Math.PI / 180);
}