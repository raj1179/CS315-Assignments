var canvas;
var gl;

var numTimesToSubdivide = 5;

var index = 0;

var pointsArray = [];
var normalsArray = [];

// Camera parameters for the "lookAt( )" function.
var eye = vec3(6.0, 6.0, 6.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var viewerPos;

// Perspective projection parameters
var near = 0.3;
var far = 20.0;
var fovy = 55.0;	// Field-of-view in Y direction angle
var aspect = 1.0;	// Viewport aspect ratio


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

// NEW: Lights and shading parameters
var lightPosition = vec4(-10.0, 4.0, -10.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.8, 0.0, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 500.0;

var ambientColor, diffuseColor, specularColor;
// End of NEW.

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

    // Since points a, b, and c are on the sphere of unit
    // length radius and centered at the origin, so their
    // coordinates can also be trated as vectors from the
    // origin to these points respectively. These vectors
    // are just the normals at each point respectively.
    normalsArray.push(vec3(a));
    normalsArray.push(vec3(b));
    normalsArray.push(vec3(c));

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

function quad(a, b, c, d) {
    var aa, bb, cc, dd;

    aa = mult(modelTranslation, mult(modelScaling, vertices[a]));
    bb = mult(modelTranslation, mult(modelScaling, vertices[b]));
    cc = mult(modelTranslation, mult(modelScaling, vertices[c]));
    dd = mult(modelTranslation, mult(modelScaling, vertices[d]));

    // NEW: the normal is obtained from the cross-product of
    //      two vectors on the plane.
    var t1 = subtract(bb, aa);
    var t2 = subtract(cc, bb);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    normal = normalize(normal);


    pointsArray.push(aa);
    pointsArray.push(bb);
    pointsArray.push(cc);
    pointsArray.push(aa);
    pointsArray.push(cc);
    pointsArray.push(dd);

    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);

}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);	// The background is
    // set to black, so the usually very dim ambient
    // shading component can be observed.

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Floor: 10 X 10 rectangle, centered at the (0, 0, 0), and
    // perpendicular to y-axis


    // Sphere: radius = 1, centered at (0, 1, 0)
    modelScaling = scale(1.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 1.0, 0.0);
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);


    // Building 1: 1 X 3 X 1, centered at (1.5, 1.5, 0.0)
    modelScaling = scale(1.0, 3.0, 1.0);
    modelTranslation = translate(1.5, 1.5, 0.0);
    colorCube();
    index = index + 36;

    // Building 2: 1 X 1.5 X 1, centered at (-1.5, 0.75, 0.0)
    modelScaling = scale(1.0, 1.5, 1.0);
    modelTranslation = translate(-1.5, 0.75, 0.0);
    colorCube();
    index = index + 36;


    // Building 3: 2 X 1 X 1, centered at (0.0, 0.5, 1.5)
    modelScaling = scale(2.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 0.5, 1.5);
    colorCube();
    index = index + 36;


    // Building 4: 2 X 1 X 1, centered at (0.0, 0.5, -1.5)
    modelScaling = scale(2.0, 1.0, 1.0);
    modelTranslation = translate(0.0, 0.5, -1.5);
    colorCube();
    index = index + 36;


    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //viewerPos = vec3(0.0, 0.0, -20.0 );
    viewerPos = eye;

    // NEW: Shading calculation variables
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    // End of NEW


    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    render();
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, index);

    window.requestAnimFrame(render);
}
