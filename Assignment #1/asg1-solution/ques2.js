"use strict";

var canvas;
var gl;

var positions = [];

var numTimesToSubdivide = 3;

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    //  Initialize our data for the Sierpinski Gasket

    // First, initialize the corners of our gasket with three positions.
    var vertices = [
        vec2(-1 / 2, -1 / 2),   // point A
        vec2(0, 1 / 2),         // point B
        vec2(1 / 2, -1 / 2)     // point C
    ];

    // divide each side, AB, BC, CA
    divideTriangle(vertices[0], vertices[1], numTimesToSubdivide);
    divideTriangle(vertices[1], vertices[2], numTimesToSubdivide);
    divideTriangle(vertices[2], vertices[0], numTimesToSubdivide);

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    render();
};

// RotateX function is used to rotate the X component of the vector.
// The function radians() was used to convert degree to radian, 
// the function is from MVnew.js
// Internet resource was referred for the rotation matrix
// Source: https://en.wikipedia.org/wiki/Rotation_matrix#Direction
function rotateX(theta, A) {
    var A_x = A[0];
    var A_y = A[1];
    var xPos = ((A_x * Math.cos(radians(theta))) - (A_y * Math.sin(radians(theta))));
    return xPos;
}
// RotateY function is used to rotate the Y component of the vector.
// The function radians() was used to convert degree to radian, 
// the function is from MVnew.js
// Internet resource was referred for the rotation matrix
// Source: https://en.wikipedia.org/wiki/Rotation_matrix#Direction
function rotateY(theta, A) {
    var A_x = A[0];
    var A_y = A[1];
    var yPos = ((A_x * Math.sin(radians(theta))) + (A_y * Math.cos(radians(theta))));
    return yPos;
}

function triangle(a, b) {
    positions.push(a, b);
}

function divideTriangle(a, b, count) {

    // check for end of recursion

    if (count === 0) {
        triangle(a, b);
    }
    else {

        var vector_AB = subtract(b, a);     // find the vector AB
        var vPrime = scale((1 / 3), vector_AB);     // scale the vector AB by one-third and call it V'. The scale function was used from MVnew.js library.

        var AB2 = mix(a, b, 2 / 3);     // scale the second half of the side by two-third going from vertex A to B.

        var C = add(vPrime, a);     // find the vertex C by adding vector V' and vertex a.
        var vDoublePrime_x = rotateX(60, vPrime);   // rotate the x component of vector V' by 60 degree
        var vDoublePrime_y = rotateY(60, vPrime);   // rotate the y component of vector V' by 60 degree
        var vDoublePrime = vec2(vDoublePrime_x, vDoublePrime_y);    // call the rotated vector V"
        var E = add(vDoublePrime, C);   // The new co-ordinate can be found by adding vector V" and vertex C.
        --count;

        // divide each segment of each edge(side).
        divideTriangle(a, C, count);
        divideTriangle(C, E, count);
        divideTriangle(E, AB2, count);
        divideTriangle(AB2, b, count);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, positions.length);
}
