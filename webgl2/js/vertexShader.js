var vertexShader = `#version 300 es
 
uniform float aspect;
//uniform float zScale;
//uniform mat4 transform;
in vec2 coordinates;
out vec2 texCoord;

//out vec4 origin;
//out vec4 direction;
 
void main() {
   	texCoord = coordinates;
   	texCoord.x *= aspect;
   	texCoord.y = texCoord.y*(-1.0);

	gl_Position = vec4(coordinates, 1.0, 1.0);
}
`;