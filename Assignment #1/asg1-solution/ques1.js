"use strict";

var canvas;
var gl;
var randomX;
var randomY;
var K = 6;

var positions = [];

var numTimesToSubdivide = 3;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    //  Initialize our data for the Sierpinski Gasket

    // First, initialize the corners of our gasket with three positions.
    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    divideTriangle(vertices[0], vertices[1], vertices[2],
        numTimesToSubdivide);

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

function distance(a, b) {
    var x1 = a[0];
    var y1 = a[1];
    var x2 = b[0];
    var y2 = b[1];
    var L = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    return L;
}

function triangle(a, b, c) {
    positions.push(a, b, c);
}

function divideTriangle(a, b, c, count) {

    // check for end of recursion

    if (count === 0) {
        triangle(a, b, c);
    }
    else {

        // find the distance between vertex A and B.
        var L = distance(a, b);

        //bisect the sides
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        // find the random number for each component in the range of (L/K).
        randomX = (Math.random() * (L / K));
        randomY = (Math.random() * (L / K));

        // save the random generated X and Y component in a vertex.
        var randomVec = vec2(randomX, randomY);

        // add the random generated vertex with the each vector AB, AC and BC.
        ab = add(ab, randomVec);
        ac = add(ac, randomVec);
        bc = add(bc, randomVec);

        --count;

        // three new triangles
        divideTriangle(a, ab, ac, count);
        divideTriangle(c, ac, bc, count);
        divideTriangle(b, bc, ab, count);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
}
