/*************************************************************************************************
 Filename: virtualglobe.js
 Author: Daniel Guglielmi
 *************************************************************************************************/
"use strict";

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
	// Edited by Dr Bernhard Jenny
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
	globeMesh.material.bumpMap = loader.load("./textures/elev_bump_8k.jpg");
	globeMesh.material.bumpScale = 0.03;

    // specular Phong reflection
	globeMesh.material.specularMap = loader.load("./textures/water_8k.png");
	globeMesh.material.specular = new THREE.Color("grey");

    globeMesh.name = "globeMesh";

    return globeMesh;

}

//Function to convert degrees to radians
function toRadians (angle)
{
    return angle * (Math.PI / 180);
}

// Convert geographic latitude and longitude to WebGL XYZ coordinate system. This
// uses code from threejs SphereBufferGeometry.
// Edited by Dr Bernhard Jenny 
function convertLatLongToWebGLXYZ(radius, lat, lon)
{

    // SphereBufferGeometry uses a polar (or zenithal angle). Latidude is an elevation angle.
    // So convert from polar angle to elevation angle.
    lat = toRadians(90 - lat);

    // SphereGeometry starts creating the mesh at longitude -90 degrees.
    // Add 90 degrees to bring the central meridian to where the WebGL z axis intersects the sphere.
    lon = toRadians(lon + 90);

    // transformation from geographic coordinates to Cartesian coordinates
    // from SphereBufferGeometry
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
        vertexCoord = convertLatLongToWebGLXYZ((earthRadius + 0.6), latArray[i], longArray[i]);
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

    //Define the UV coordinates of the texture
    var UVs = [
        new THREE.Vector2(0, 1),
        new THREE.Vector2(0.5, 1),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 0.5),
        new THREE.Vector2(0.5, 0.5),
        new THREE.Vector2(1, 0.5),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.5, 0),
        new THREE.Vector2(1, 0)
        ];

    //UV coordinates for the texture mapping
    geometry.faceVertexUvs[0].push([UVs[0], UVs[3], UVs[1]]);
    geometry.faceVertexUvs[0].push([UVs[3], UVs[4], UVs[1]]);
    geometry.faceVertexUvs[0].push([UVs[1], UVs[4], UVs[2]]);
    geometry.faceVertexUvs[0].push([UVs[4], UVs[5], UVs[2]]);
    geometry.faceVertexUvs[0].push([UVs[3], UVs[6], UVs[4]]);
    geometry.faceVertexUvs[0].push([UVs[6], UVs[7], UVs[4]]);
    geometry.faceVertexUvs[0].push([UVs[4], UVs[7], UVs[5]]);
    geometry.faceVertexUvs[0].push([UVs[7], UVs[8], UVs[5]]);


    var material = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.2 });
    var mapShapeMesh = new THREE.Mesh(geometry, material);

    mapShapeMesh.material.wireframe = false;
    mapShapeMesh.material.side = THREE.DoubleSide;

    return mapShapeMesh;

}

//Function to create the map shapes on the virtual globe
function addMapObjects()
{
    //Define the location of each shape (top left lat/long and bottom right lat/long) and create the
    //new shape in the corresponding location on the virtual globe
    var mapSection = createMapShape(60, -12, 35, 20);
    var mapSection2 = createMapShape(-10, 112, -43, 155);
    var mapSection3 = createMapShape(32, -120, 0, -75);

    //Define the corresponding atlas map and preview image per map section
    mapSection.url = "./atlasmaps/test-map.html";
    mapSection.texture = "./atlasmaps/europemap-detailed-thumb.jpg";
    mapSection.scaleFactor = 1864 / 2048;
    mapSection.title = "Map of Western Europe";
    mapSection2.url = "./atlasmaps/test-map2.html";
    mapSection2.texture = "./atlasmaps/ausmap-thumb.jpg";
    mapSection2.scaleFactor = 1024 / 1024;
    mapSection2.title = "Map of Australia";
    mapSection3.url = "./atlasmaps/test-map3.html";
    mapSection3.texture = "./atlasmaps/centralamerica-thumb.jpg";
    mapSection3.scaleFactor = 1024 / 738;
    mapSection3.title = "Map of Central America & The Caribbean";

    //Add the new object to the map objects array and add it as a child of the virtual globe
    mapObjects.push(mapSection);
    mapObjects.push(mapSection2);
	mapObjects.push(mapSection3);
    earthModel.add(mapSection);
    earthModel.add(mapSection2);
    earthModel.add(mapSection3);

}


