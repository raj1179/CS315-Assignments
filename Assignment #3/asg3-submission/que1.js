//----------------------------------------------------------------------------
// State Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;

//Collect shape information into neat package
var shapes = {
	solidCube: { points: [], colors: [], start: 0, size: 0, type: 0 },
	floor: { points: [], colors: [], start: 0, size: 0, type: 0 },
};

//Variables for Transformation Matrices
var mv = new mat4();
var p = new mat4();
var mvLoc, projLoc, uColor;

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

//----------------------------------------------------------------------------
// Define Shape Data
//----------------------------------------------------------------------------

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


//Generate Axis Data: use LINES to draw. Three axes in red, green and blue
shapes.floor.points =
	[
		vec4(0.5, 0.0, 0.5, 1.0),
		vec4(0.5, 0.0, -0.5, 1.0),
		vec4(-0.5, 0.0, 0.5, 1.0),
		vec4(-0.5, 0.0, 0.5, 1.0),
		vec4(0.5, 0.0, -0.5, 1.0),
		vec4(-0.5, 0.0, -0.5, 1.0),
	];

shapes.floor.colors =
	[
		white, white,
		white, white,
		white, white,
	];


//Define points for a unit cube
var cubeVerts = [
	vec4(0.5, 0.5, 0.5, 1), //0
	vec4(0.5, 0.5, -0.5, 1), //1
	vec4(0.5, -0.5, 0.5, 1), //2
	vec4(0.5, -0.5, -0.5, 1), //3
	vec4(-0.5, 0.5, 0.5, 1), //4
	vec4(-0.5, 0.5, -0.5, 1), //5
	vec4(-0.5, -0.5, 0.5, 1), //6
	vec4(-0.5, -0.5, -0.5, 1), //7
];


//Solid Cube - draw with TRIANGLES, 2 triangles per face
var solidCubeLookups = [
	0, 4, 6, 0, 6, 2, //front
	1, 0, 2, 1, 2, 3, //right
	5, 1, 3, 5, 3, 7,//back
	4, 5, 7, 4, 7, 6,//left
	4, 0, 1, 4, 1, 5,//top
	6, 7, 3, 6, 3, 2,//bottom
];

//Expand Solid Cube data: each face will be a different color so you can see
//    the 3D shape better without lighting.
var colorNum = 0;
var colorList = [yellow, cyan, magenta, blue, red, green];
for (var i = 0; i < solidCubeLookups.length; i++) {
	shapes.solidCube.points.push(cubeVerts[solidCubeLookups[i]]);
	shapes.solidCube.colors.push(colorList[colorNum]);
	if (i % 6 == 5) colorNum++; //Switch color for every face. 6 vertices/face
}

//load data into points and colors arrays - runs once as page loads.
var points = [];
var colors = [];

//Convenience function:
//  - adds shape data to points and colors arrays
//  - adds primitive type to a shape
function loadShape(myShape, type) {
	myShape.start = points.length;
	points = points.concat(myShape.points);
	colors = colors.concat(myShape.colors);
	myShape.size = points.length - myShape.start;
	myShape.type = type;
}

//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------

window.onload = function init() {
	// Set up a WebGL Rendering Context in an HTML5 Canvas
	var canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext("webgl2");
	if (!gl) {
		canvas.parentNode.innerHTML("Cannot get WebGL2 Rendering Context");
	}

	//  Configure WebGL
	//  eg. - set a clear color
	//      - turn on depth testing
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.9, 0.9, 0.9, 1.0);
	gl.enable(gl.CULL_FACE);

	//  Load shaders and initialize attribute buffers
	var program = initShaders(gl, "shader.vert", "shader.frag");
	gl.useProgram(program);

	// Set up data to draw
	// Mostly done globally in this program...
	loadShape(shapes.solidCube, gl.TRIANGLES);
	loadShape(shapes.floor, gl.TRIANGLES);

	// Load the data into GPU data buffers and
	// Associate shader attributes with corresponding data buffers
	//***Vertices***
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(program.vPosition, 4, gl.FLOAT, gl.FALSE, 0, 0);
	gl.enableVertexAttribArray(program.vPosition);

	//Set up uofrGraphics
	urgl = new uofrGraphics(gl);
	urgl.connectShader(program, "vPosition", "vNormal", "stub");

	// Get addresses of shader uniforms
	projLoc = gl.getUniformLocation(program, "p");
	mvLoc = gl.getUniformLocation(program, "mv");
	uColor = gl.getUniformLocation(program, "uColor");


	//Set up projection matrix
	var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
	p = perspective(45.0, aspect, 0.1, 100.0);

	gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(transpose(p)));

	requestAnimationFrame(render);
};



//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
function render() {

	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

	var matStack = [];
	//Set initial view
	eye = vec3(radius * Math.sin(phi), 6,
		8.0);
	var at = vec3(0.0, 0.75, 0.0);
	var up = vec3(0.0, 1.0, 0.0);
	mv = lookAt(eye, at, up);

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

	matStack.push(mv);

	// Floor
	mv = mult(mv, translate(0.0, 0.0, 0.0));
	mv = mult(mv, scale(20.0, 0.0, 20.0));

	var green = vec4(0.0, 1.0, 0.0, 1.0);
	gl.uniform4fv(uColor, flatten(green));

	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
	gl.drawArrays(shapes.floor.type, shapes.floor.start, shapes.floor.size);

	mv = matStack.pop();
	matStack.push(mv);

	// Sphere
	var rez = 200;
	var sphereTF = mult(mv, translate(0, 1, 0));
	gl.uniform4fv(uColor, flatten(white));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(sphereTF)));
	urgl.drawSolidSphere(1, rez, rez);

	mv = matStack.pop();
	matStack.push(mv);

	// building 1
	mv = mult(mv, translate(1.5, 1.5, 0.0));
	mv = mult(mv, scale(1.0, 3.0, 1.0));

	// matStack.push(mv);
	gl.uniform4fv(uColor, flatten(red));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
	gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);

	mv = matStack.pop();
	matStack.push(mv);

	// building 2
	mv = mult(mv, translate(-1.5, 0.75, 0.0));
	mv = mult(mv, scale(1.0, 1.5, 1.0));
	gl.uniform4fv(uColor, flatten(blue));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
	gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);

	mv = matStack.pop();
	matStack.push(mv);

	// building 3
	mv = mult(mv, translate(0.0, 0.5, 1.5));
	mv = mult(mv, scale(2.0, 1.0, 1.0));
	gl.uniform4fv(uColor, flatten(yellow));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
	gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);
	mv = matStack.pop();
	matStack.push(mv);

	// building 4
	mv = mult(mv, translate(0.0, 0.5, -1.5));
	mv = mult(mv, scale(2.0, 1.0, 1.0));

	gl.uniform4fv(uColor, flatten(cyan));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(transpose(mv)));
	gl.drawArrays(shapes.solidCube.type, shapes.solidCube.start, shapes.solidCube.size);
	mv = matStack.pop();
	matStack.push(mv);

	phi += 0.01;

	requestAnimationFrame(render);
}