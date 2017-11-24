var vertexShader = `#version 300 es

in vec2 coordinates;
out vec2 texCoord;
 
void main() {
	gl_Position = vec4(coordinates, 1.0, 1.0);
}
`;


var fragmentShader = `#version 300 es

precision highp sampler3D;

uniform sampler3D tex;
uniform sampler3D normals;
uniform sampler2D colorMap;
uniform samplerCube skybox;

void main(){
	
}

`;
