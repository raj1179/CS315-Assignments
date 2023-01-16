/*
* L4D.js
* Demonstrate lighting.
*
* Adapted for WebGL by Alex Clarke, 2016.
* Adapted for WebGL2 by Alex Clarke, Feb 23, 2020.
*/


//----------------------------------------------------------------------------
// Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;
var canvas;
var vao;
var program;

var near = -1;
var far = 1;
var radius = 10;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

//Collect shape information into neat package
var shapes = {
   solidCube: { points: [], colors: [], normals: [], start: 0, size: 0, type: 0 },
   floor: { points: [], colors: [], start: 0, size: 0, type: 0 }
};

//Define points for a cube
var cubeVerts = [
   [0.5, 0.5, 0.5, 1], //0
   [0.5, 0.5, -0.5, 1], //1
   [0.5, -0.5, 0.5, 1], //2
   [0.5, -0.5, -0.5, 1], //3
   [-0.5, 0.5, 0.5, 1], //4
   [-0.5, 0.5, -0.5, 1], //5
   [-0.5, -0.5, 0.5, 1], //6
   [-0.5, -0.5, -0.5, 1] //7
];

//Look up patterns from cubeVerts for different primitive types
//Wire Cube - draw with LINE_STRIP
var wireCubeLookups = [
   0, 4, 6, 2, 0, //front
   1, 0, 2, 3, 1, //right
   5, 1, 3, 7, 5, //back
   4, 5, 7, 6, 4, //right
   4, 0, 1, 5, 4, //top
   6, 7, 3, 2, 6 //bottom
];

//Solid Cube lookups - these are indices into the cubeVerts array
var solidCubeLookups = [
   0, 4, 6, 0, 6, 2, //front
   1, 0, 2, 1, 2, 3, //right
   5, 1, 3, 5, 3, 7, //back
   4, 5, 7, 4, 7, 6, //left
   4, 0, 1, 4, 1, 5, //top
   6, 7, 3, 6, 3, 2 //bottom
];

//Expand Solid Cube data:
//  The precomputed normals used here are easy for cubes,
//  But harder for other shapes. Consider using cross
//  product per triangle instead.
var faceNum = 0;
var normalsList = [vec4(0.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0), vec4(0.0, 0.0, -1.0),
vec4(-1.0, 0.0, 0.0), vec4(0.0, 1.0, 0.0), vec4(0.0, -1.0, 0.0)];
for (var i = 0; i < solidCubeLookups.length; i++) {
   shapes.solidCube.points.push(cubeVerts[solidCubeLookups[i]]);
   shapes.solidCube.normals.push(normalsList[faceNum]);
   // if (i % 6 == 5) faceNum++; //Switch color for every face. 6 vertices/face
}

//----------------------------------------------------------------------------
// makeFlatNormals(triangles, start, num, normals)
// Calculate Flat Normals for Triangles
// Input parameters:
//  - triangles: an array of 4 component points that represent TRIANGLES
//  - start: the index of the first TRIANGLES vertex
//  - num: the number of vertices, as if you were drawing the TRIANGLES
//
// Output parameters:
//  - normals: an array of vec3's that will represent normals to be used with
//             triangles
//
// Preconditions:
//  - the data in triangles should specify triangles in counterclockwise
//    order to indicate their fronts
//  - num must be divisible by 3
//  - triangles and normals must have the types indicated above
//
// Postconditions:
//  - the normals array will contain unit length vectors from start,
//    to (start + num)
//----------------------------------------------------------------------------
makeFlatNormals(shapes.solidCube.points, 0, shapes.solidCube.points.length, shapes.solidCube.normals);
function makeFlatNormals(triangles, start, num, normals) {

   if (num % 3 != 0) {
      console.log("Warning: number of vertices is not a multiple of 3");
      return;
   }
   for (var i = start; i < start + num; i += 3) {
      var p0 = vec3(triangles[i][0], triangles[i][1], triangles[i][2]);
      var p1 = vec3(triangles[i + 1][0], triangles[i + 1][1], triangles[i + 1][2]);
      var p2 = vec3(triangles[i + 2][0], triangles[i + 2][1], triangles[i + 2][2]);
      var v1 = normalize(vec3(subtract(p1, p0))); //Vector on triangle edge one
      var v2 = normalize(vec3(subtract(p2, p1))); //Vector on triangle edge two

      var n = normalize(cross(v1, v2));
      normals[i + 0] = vec3(n);
      normals[i + 1] = vec3(n);
      normals[i + 2] = vec3(n);
   }
}

//Convenience function:
//  - adds shape data to global points array
//  - adds primitive type to a shape
//load data into points and colors arrays - runs once as page loads.
var points = [];
var colors = [];
var normals = [];

//Convenience function:
//  - adds shape data to points and colors arrays
//  - adds primitive type to a shape
function loadShape(myShape, type) {
   myShape.start = points.length;
   points = points.concat(myShape.points);
   normals = normals.concat(myShape.normals);
   myShape.size = myShape.points.length;
   myShape.type = type;
}

//Some colours
var red = vec4(1.0, 0.0, 0.0, 1.0);
var green = vec4(0.0, 1.0, 0.0, 1.0);
var blue = vec4(0.0, 0.0, 1.0, 1.0);
var yellow = vec4(1.0, 1.0, 0.0, 1.0);
var cyan = vec4(0.0, 1.0, 1.0, 1.0);
var magenta = vec4(1.0, 0.0, 1.0, 1.0);
var white = vec4(1.0, 1.0, 1.0, 1.0);
var black = vec4(0.0, 0.0, 0.0, 1.0);

var lightred = vec4(1.0, 0.5, 0.5, 1.0);
var lightgreen = vec4(0.5, 1.0, 0.5, 1.0);
var lightblue = vec4(0.5, 0.5, 1.0, 1.0);



//Variables for Transformation Matrices
var mv = new mat4();
var p = new mat4();
var mvLoc, projLoc;


//Variables for Lighting
var light;
var material;
var lighting;
var uColor;



//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------
window.onload = function init() {
   // Set up a WebGL Rendering Context in an HTML5 Canvas
   canvas = document.getElementById("gl-canvas");
   gl = canvas.getContext("webgl2"); // basic webGL2 context
   if (!gl) {
      canvas.parentNode.innerHTML("Cannot get WebGL2 Rendering Context");
   }

   //  Configure WebGL
   //  eg. - set a clear color
   //      - turn on depth testing
   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.enable(gl.DEPTH_TEST);

   //  Load shaders and initialize attribute buffers
   program = initShaders(gl, "Shaders/diffuse.vert", "Shaders/diffuse.frag");
   gl.useProgram(program);

   // Set up local data buffers
   // Mostly done globally or with urgl in this program...
   loadShape(shapes.solidCube, gl.TRIANGLES);


   //Create a vertex array object to allow us to switch back to local
   //data buffers after using uofrGraphics calls.
   vao = gl.createVertexArray();
   gl.bindVertexArray(vao);


   // Load the data into GPU data buffers and
   // Associate shader attributes with corresponding data buffers
   //***Vertices***
   vertexBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
   program.vPosition = gl.getAttribLocation(program, "vPosition");
   gl.vertexAttribPointer(program.vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vPosition);


   //***Normals***
   normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
   program.vNormal = gl.getAttribLocation(program, "vNormal");
   gl.vertexAttribPointer(program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vNormal);


   // Get addresses of transformation uniforms
   projLoc = gl.getUniformLocation(program, "p");
   mvLoc = gl.getUniformLocation(program, "mv");
   var uColor = gl.getUniformLocation(program, "uColor");

   //Set up viewport
   gl.viewportWidth = canvas.width;
   gl.viewportHeight = canvas.height;
   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

   //Set up projection matrix
   p = perspective(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
   gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(transpose(p)));


   // Get  light uniforms
   light = {};   // initialize this light object
   light.diffuse = gl.getUniformLocation(program, "light.diffuse");
   light.ambient = gl.getUniformLocation(program, "light.ambient");
   light.position = gl.getUniformLocation(program, "light.position");


   // Get material uniforms
   material = {};
   material.diffuse = gl.getUniformLocation(program, "material.diffuse");
   material.ambient = gl.getUniformLocation(program, "material.ambient");

   // Get and set other lighting state
   // Enable Lighting
   lighting = gl.getUniformLocation(program, "lighting");
   gl.uniform1i(lighting, 1);

   //Set color to use when lighting is disabled
   uColor = gl.getUniformLocation(program, "uColor");
   gl.uniform4fv(uColor, white);

   //Set up uofrGraphics
   urgl = new uofrGraphics(gl);
   urgl.connectShader(program, "vPosition", "vNormal", "stub");

   requestAnimationFrame(render);
};



//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
var rx = 0, ry = 0;
function render() {
   gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

   // Set up some default light properties
   gl.uniform4fv(light.diffuse, white);
   gl.uniform4fv(light.ambient, vec4(0.2, 0.2, 0.2, 1.0));

   var lpos = vec4(radius * Math.sin(phi), 5.0, 10.0, 0.0);
   gl.uniform4fv(light.position, mult(mv, lpos));

   //Set up some default material properties
   gl.uniform4fv(material.diffuse, vec4(1.0, 0.0, 1.0, 1.0));
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));

   var matStack = [];
   //Set initial view
   eye = vec3(radius * Math.sin(phi), 6, 8.0);
   var at = vec3(0.0, 0.75, 0.0);
   var up = vec3(0.0, 1.0, 0.0);
   mv = lookAt(eye, at, up);

   gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

   matStack.push(mv);

   // Floor
   mv = mult(mv, translate(0.01, 0.01, 0.01));
   mv = mult(mv, scale(20.0, 0.0, 20.0));

   gl.uniform4fv(material.diffuse, vec4(1.0, 0.0, 1.0, 1.0));
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));


   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
   gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);

   mv = matStack.pop();
   matStack.push(mv);

   // Sphere
   var rez = 200;
   var sphereTF = mult(mv, translate(0, 1, 0));
   gl.uniform4fv(material.diffuse, vec4(1.0, 1.0, 1.0, 1.0));
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(sphereTF)));
   urgl.drawSolidSphere(1, rez, rez);

   mv = matStack.pop();
   matStack.push(mv);

   // building 1
   mv = mult(mv, translate(1.5, 1.5, 0.0));
   mv = mult(mv, scale(1.0, 3.0, 1.0));

   // matStack.push(mv);
   gl.uniform4fv(material.diffuse, vec4(0.0, 1.0, 0.0, 1.0));
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));

   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
   gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);

   mv = matStack.pop();
   matStack.push(mv);

   // building 2
   mv = mult(mv, translate(-1.5, 0.75, 0.0));
   mv = mult(mv, scale(1.0, 1.5, 1.0));
   gl.uniform4fv(material.diffuse, vec4(0.0, 0.0, 1.0, 1.0));
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
   gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);

   mv = matStack.pop();
   matStack.push(mv);

   // building 3
   mv = mult(mv, translate(0.0, 0.5, 1.5));
   mv = mult(mv, scale(2.0, 1.0, 1.0));
   gl.uniform4fv(material.diffuse, red);
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
   gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);
   mv = matStack.pop();
   matStack.push(mv);

   // building 4
   mv = mult(mv, translate(0.0, 0.5, -1.5));
   mv = mult(mv, scale(2.0, 1.0, 1.0));

   gl.uniform4fv(material.diffuse, magenta);
   gl.uniform4fv(material.ambient, vec4(1.0, 1.0, 1.0, 1.0));;
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
   gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);
   mv = matStack.pop();
   matStack.push(mv);

   phi += 0.03;

   requestAnimationFrame(render);
}