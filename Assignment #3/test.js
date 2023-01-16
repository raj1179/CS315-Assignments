function drawVertex(a, b, c, a, c, d) {
	var indices = [a, b, c, a, c, d];
	for (var i = 0; i < indices.length; i++) {
		points.push(vertices[indices[i]]);
	}
}