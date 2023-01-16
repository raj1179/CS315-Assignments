//
//	Sample program for Question 2 of Assignment 3.
//
//	Note: The question requires camera motion only once from
//	  the starting point S0 to the ending point S1.
//	  This demo program, however, moves camera between S0 and
//	  S1 back and forth repeately.
//
//	By Xue Dong Yang
//	March 20, 2021
//



var canvas;
var gl;

var numTimesToSubdivide = 5;

var index = 0;

var pointsArray = [];
var colorsArray = [];

// Perspective projection parameters
var near = 0.3;
var far = 20.0;
var fovy = 45.0;	// Field-of-view in Y direction angle
var aspect = 1.0;	// Viewport aspect ratio

// The camera is to fly in a circular spiral path from S0 to
// S1 around the scene.
//    S0 = (0.0, 5.0, 10.0)
//    S1 = (0.0, 0.0, 10.0)
//    The radius of the circle: R = 10.0
//   - The center of the scene: At = (0.0, 0.75, 0.0)

var angle = 0.0;
var height = 5.0;
var radius = 10.0;
var NoOfSteps = 200.0;
var angleInc = 2.0 * Math.PI / NoOfSteps;
var heightDec = -5.0 / NoOfSteps;

// Camera parameters for the "lookAt( )" function.
var eye = vec3(radius * Math.sin(angle), height, radius * Math.cos(angle));
// start at S0.
var at = vec3(0.0, 0.75, 0.0);
var up = vec3(0.0, 1.0, 0.0);


// Tetrahedron as the starting shape of sphere centered at the
// origin with radius 1.
var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

// Unit length cube centered at the origin.    
var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

// colors in [R, G, B, A] format.
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];


var ctm;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var modelScaling;
var modelTranslation;

// *****************************************************
// Recursive subdivision algorithm for Sphere Generation
//   - The default sphere is centered at the orogin and
//     with a radius 1.
//   - The final vertex, before it is stored into the array,
//     will be scaled by the matrix "modelScaling" and
//     moved to a position determined by the matrix
//     "modelTranslation"
// ***************************************************** 

function triangle(a, b, c) {
    var aa, bb, cc;

    colorsArray.push(vertexColors[1]);
    colorsArray.push(vertexColors[1]);
    colorsArray.push(vertexColors[1]);

    // Scale and translate the vertex.
    aa = mult(modelTranslation, mult(modelScaling, a));
    bb = mult(modelTranslation, mult(modelScaling, b));
    cc = mult(modelTranslation, mult(modelScaling, c));

    pointsArray.push(aa);
    pointsArray.push(bb);
    pointsArray.push(cc);

    index += 3;
}


function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}


// ******************************************************
// Vertex generation for Cube
//    - The default cube is unit length and centered at
//      the origin.
//    - The generated vertex will be scaled by the matrix
//      "modelScaling" and moved by the matrix
//      "modelTranslation".
// ******************************************************

function quad(a, b, c, d, color) {
    var aa, bb, cc, dd;

    aa = mult(modelTranslation, mult(modelScaling, vertices[a]));
    bb = mult(modelTranslation, mult(modelScaling, vertices[b]));
    cc = mult(modelTranslation, mult(modelScaling, vertices[c]));
    dd = mult(modelTranslation, mult(modelScaling, vertices[d]));

    pointsArray.push(aa);
    pointsArray.push(bb);
    pointsArray.push(cc);
    pointsArray.push(aa);
    pointsArray.push(cc);
    pointsArray.push(dd);

    colorsArray.push(color);
    colorsArray.push(color);
    colorsArray.push(color);
    colorsArray.push(color);
    colorsArray.push(color);
    colorsArray.push(color);

}

function colorCube() {
    quad(1, 0, 3, 2, vertexColors[1]);
    quad(2, 3, 7, 6, vertexColors[2]);
    quad(3, 0, 4, 7, vertexColors[3]);
    quad(6, 5, 1, 2, vertexColors[4]);
    quad(4, 5, 6, 7, vertexColors[5]);
    quad(5, 4, 0, 1, vertexColors[6]);
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Floor: 10 X 10 rectangle, centered at the (0, 0, 0), and
    // perpendicular to y-axis


    // Sphere: radius = 1, centered at (0, 1, 0)
    modelScaling = scalem(1.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 1.0, 0.0);
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // Building 1: 1 X 3 X 1, centered at (1.5, 1.5, 0.0)
    modelScaling = scalem(1.0, 3.0, 1.0);
    modelTranslation = translate(1.5, 1.5, 0.0);
    colorCube();
    index = index + 36;

    // Building 2: 1 X 1.5 X 1, centered at (-1.5, 0.75, 0.0)
    modelScaling = scalem(1.0, 1.5, 1.0);
    modelTranslation = translate(-1.5, 0.75, 0.0);
    colorCube();
    index = index + 36;


    // Building 3: 2 X 1 X 1, centered at (0.0, 0.5, 1.5)
    modelScaling = scalem(2.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 0.5, 1.5);
    colorCube();
    index = index + 36;


    // Building 4: 2 X 1 X 1, centered at (0.0, 0.5, -1.5)
    modelScaling = scalem(2.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 0.5, -1.5);
    colorCube();
    index = index + 36;


    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    render();
}


var count = 0;				// animation iteration counter
var direction = true;			// forward/backward control

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(radius * Math.sin(angle), height, radius * Math.cos(angle));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, index);

    if (direction) {
        angle += angleInc;
        height += heightDec;
    } else {
        angle -= angleInc;
        height -= heightDec;
    }

    if (count < NoOfSteps)
        count += 1;
    else {				// if reaching the end
        count = 0;				// reset the counter
        direction = !direction;	// reverse the direction
    }
    requestAnimFrame(render);
}
