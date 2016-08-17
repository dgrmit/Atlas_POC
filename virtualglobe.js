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

    // Create the sphere
    // The default for SphereGeometry is to start creating the mesh at -90 deg west (in geographic coordinates).
    // The mesh is then grown in eastwards direction. We want the grid to start at -180 deg, such that a 
    // standard texture in geographic coordinates from -180 to +180 degrees appears centered on the central
    // meridian (defined by x = 0). The location at lon=0 and lat=0 is where the WebGL z-axis intersects the sphere.
    // So move the starting point for construcint the sphere geometry by 90 degrees westwards. This will align 
    // the UV coordinates with the texture in geographic coordinates. Hence phiStart equals -Math.PI / 2. 
    // 
    // The documentation seems to be wrong for SphereGeometry. It explains that the vertical sweep is around 
    // the Z axis, however, this is the X axis.
    var geometry = new THREE.SphereGeometry(radius, wSeg, hSeg, -Math.PI / 2, Math.PI * 2, 0, Math.PI);

    // apply a diffused material
    var material = new THREE.MeshPhongMaterial();
    var globeMesh = new THREE.Mesh(geometry, material);

    //Load and add the textures
    var loader = new THREE.TextureLoader();
    globeMesh.material.map = loader.load("./textures/2_no_clouds_8k.jpg");

    // enable mipmaps and anisotropic filtering for better looking texturing
    // note: mipmaps need power-of-2 texture size
    globeMesh.material.map.anisotropy = renderer.getMaxAnisotropy();
    globeMesh.material.map.magFilter = THREE.NearestFilter;
    globeMesh.material.map.minFilter = THREE.LinearMipMapLinearFilter;
    
    // bump mapping
    globeMesh.material.bumpMap = loader.load("./textures/earthbump1k.jpg");
    globeMesh.material.bumpScale = 0.03;

    // specular Phong reflection
    globeMesh.material.specularMap = loader.load("./textures/water_4k.png");
    globeMesh.material.specular = new THREE.Color("grey");

    globeMesh.name = "globeMesh";

    return globeMesh;

}

function addMapObjects()
{
    var mapSection = createMapShape(49, 4, 44, 15);
    var mapSection2 = createMapShape(-30, 140, -38, 150);

    mapSection.url = "./atlasmaps/test-map.html";
    mapSection2.url = "./atlasmaps/test-map2.html";
    //scene.add(mapSection);
    //scene.add(mapSection2);



    mapObjects.push(mapSection);
    mapObjects.push(mapSection2);
    earthModel.add(mapSection);
    earthModel.add(mapSection2);

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

    longArray[0] = long1;
    longArray[1] = (0.5 * (long2 - long1) + long1);
    longArray[2] = long2;
    longArray[3] = long1;
    longArray[4] = (0.5 * (long2 - long1) + long1);
    longArray[5] = long2;
    longArray[6] = long1;
    longArray[7] = (0.5 * (long2 - long1) + long1);
    longArray[8] = long2;

    //Create the new shape using the coords from the Lat/Long arrays
    var geometry = new THREE.Geometry();

    var vertexCoord;

    for (var i = 0; i < 9; i++){
        vertexCoord = convertLatLongToWebGLXYZ(20.1, latArray[i], longArray[i]);
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

/**
 * Convert geographic latitude and longitude to WebGL XYZ coordinate system. This 
 * uses code from threejs SphereBufferGeometry.
 */
function convertLatLongToWebGLXYZ(radius, lat, lon) {
    
    // SphereBufferGeometry uses a polar (or zenithal angle). Latidude is an elevation angle. 
    // So convert from polar angle to elevation angle. 
    lat = toRadians(90 - lat);
    
    // SphereGeometry starts creating the mesh at longitude -90 degrees. 
    // Add 90 degrees to bring the central meridian to where the WebGL z axis intersects the sphere. 
    lon = toRadians(lon + 90);
    
    // transformation from spherical coordinates to Cartesian coordinates 
    // copied from SphereBufferGeometry
    // https://github.com/mrdoob/three.js/blob/master/src/extras/geometries/SphereBufferGeometry.js
    var x = -radius * Math.cos(lon) * Math.sin(lat);
    var y = radius * Math.cos(lat);
    var z = radius * Math.sin(lon) * Math.sin(lat);

    return {
        x : x,
        y : y,
        z : z
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