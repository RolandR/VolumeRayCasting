var vertexShader = `#version 300 es
 
uniform float aspect;
in vec2 coordinates;
out vec2 texCoord;
 
void main() {
   	texCoord = coordinates;
   	texCoord.x *= aspect;
   	texCoord.y = texCoord.y*(-1.0);

	gl_Position = vec4(coordinates, 1.0, 1.0);
}
`;