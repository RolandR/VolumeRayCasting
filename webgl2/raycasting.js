
var img = document.getElementById("slice");

img.onload = render;
img.src = "./water.png";

function render(){

	var textureCanvas = document.createElement("canvas");
	var textureContext = textureCanvas.getContext("2d");
	textureCanvas.width = img.width;
	textureCanvas.height = img.height;
	textureContext.drawImage(img, 0, 0);
	var imageData = textureContext.getImageData(0, 0, textureCanvas.width, textureCanvas.height).data;

	var texSize = img.width;
	var textureData = new Uint8Array(texSize * texSize * texSize);
	for(var i = 0; i < textureData.length; i++){
		textureData[i] = imageData[i*4];
	}

	var canvas = document.getElementById("canvas");
	canvas.width = img.width*3;
	canvas.height = img.width*3;
	
	var gl = canvas.getContext("webgl2");

	var shaderProgram;
	var size;

	var onePixelAttr;

	init();

	function init(){

		/*=========================Shaders========================*/


		// Create a vertex shader object
		var vertShader = gl.createShader(gl.VERTEX_SHADER);

		// Attach vertex shader source code
		gl.shaderSource(vertShader, vertexShader);

		// Compile the vertex shader
		gl.compileShader(vertShader);

		// Create fragment shader object
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		// Attach fragment shader source code
		gl.shaderSource(fragShader, fragmentShader);

		// Compile the fragmentt shader
		gl.compileShader(fragShader);

		// Create a shader program object to store
		// the combined shader program
		shaderProgram = gl.createProgram();

		// Attach a vertex shader
		gl.attachShader(shaderProgram, vertShader); 

		// Attach a fragment shader
		gl.attachShader(shaderProgram, fragShader);

		// Link both programs
		gl.linkProgram(shaderProgram);

		// Use the combined shader program object
		gl.useProgram(shaderProgram);

		if(gl.getShaderInfoLog(vertShader)){
			console.warn(gl.getShaderInfoLog(vertShader));
		}
		if(gl.getShaderInfoLog(fragShader)){
			console.warn(gl.getShaderInfoLog(fragShader));
		}
		if(gl.getProgramInfoLog(shaderProgram)){
			console.warn(gl.getProgramInfoLog(shaderProgram));
		}


		vertexBuffer = gl.createBuffer();

		/*==========Defining and storing the geometry=======*/

		var vertices = [
			-1.0, -1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			-1.0,  1.0,
			 1.0, -1.0,
			 1.0,  1.0
		];

		size = ~~(vertices.length/2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

		// Get the attribute location
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");

		// Point an attribute to the currently bound VBO
		gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);

		// Enable the attribute
		gl.enableVertexAttribArray(coord);


		// Create a texture.
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_3D, texture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(texSize));
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.LUMINANCE,        // internalformat
			texSize,           // width
			texSize,           // height
			texSize,           // depth
			0,              // border
			gl.LUMINANCE,         // format
			gl.UNSIGNED_BYTE,       // type
			textureData            // pixel
			);
		gl.generateMipmap(gl.TEXTURE_3D);

		var transform = gl.getUniformLocation(shaderProgram, "transform");

		var startAngle = 0;
		var startTime = Date.now();
		var turnsPerSecond = 0.1;

		draw();

		function draw(){

			var angleX = ((Date.now()-startTime)/1000)*(2*Math.PI*turnsPerSecond);
			var angleY = ((Date.now()-startTime)/1000)*(2*Math.PI*turnsPerSecond*0.7);

			var c = Math.cos(angleX);
			var s = Math.sin(angleX);
			
			rotationMatrix = [
				c, 0, s, 0,
				0, 1, 0, 0,
				-s, 0, c, 0,
				0,  0, 0, 1
			];
			
			var c = Math.cos(angleY);
			var s = Math.sin(angleY);
			
			var yRotationMatrix = [
				1, 0,  0, 0,
				0, c, -s, 0,
				0, s,  c, 0,
				0, 0,  0, 1,
			];

			rotationMatrix = matrix4Multiply(rotationMatrix, yRotationMatrix);

			/*var rotationMatrix = [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			];*/
			
			
			gl.uniformMatrix4fv(transform, false, rotationMatrix);
			

			gl.drawArrays(gl.TRIANGLES, 0, size);

			requestAnimationFrame(draw);
		}

	}





}












