var vertexShader = `#version 300 es
 
uniform float aspect;
uniform float zScale;
uniform mat4 transform;
in vec2 coordinates;
//out vec2 texCoord;

out vec4 origin;
out vec4 direction;
 
void main() {
   	vec2 texCoord = coordinates;
   	texCoord.x *= aspect;
   	texCoord.y = texCoord.y*(-1.0);

   	origin = vec4(texCoord, 0.0, 1.0);
	origin = transform * origin;
	origin = origin / origin.w;
	origin.z = origin.z / zScale;
	origin = origin + 0.5;

	direction = vec4(0.0, 0.0, 1.0, 1.0);
	direction = transform * direction;

	gl_Position = vec4(coordinates, 1.0, 1.0);
}
`;