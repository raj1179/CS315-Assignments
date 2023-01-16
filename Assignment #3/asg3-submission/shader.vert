#version 300 es

in  vec3 vPosition;
in vec4 vColor; //Note per-vertex colour attribute...

uniform mat4 p,mv;
uniform vec4 uColor;

out vec4 color;

void main() 
{
    //Move vertex to view
    vec4 mvPosition = mv*vec4(vPosition,1);

    //Apply projection and send out
    gl_Position = p*mvPosition;

    //copy colour
    color = uColor;
}
