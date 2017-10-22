
var Renderer = function(){

	var img = document.getElementById("slice");
	var colorMap = document.createElement("img");
	colorMap.onload = updateLoadedImages;
	colorMap.src = "./colorMappings/natural.png";

	var canvas = document.getElementById("canvas");
	var container = document.getElementById("container");
	canvas.width = container.clientHeight;
	canvas.height = container.clientHeight;
	
	var gl = canvas.getContext("webgl2");

	var colorTexture;
	var depthSampleCountRef

	img.onload = updateLoadedImages;
	img.src = "./sagittal.png";

	var imagesLoaded = 0;
	var imagesToLoad = 2;

	function updateLoadedImages(){
		imagesLoaded++;
		if(imagesLoaded == imagesToLoad){
			render();
		}
	}

	function changeColorTexture(src){
		colorMap.onload = function(){
			var colorCanvas = document.createElement("canvas");
			colorCanvas.height = colorMap.height;
			colorCanvas.width = colorMap.width;
			var colorContext = colorCanvas.getContext("2d");
			colorContext.drawImage(colorMap, 0, 0);
			var colorData = colorContext.getImageData(0, 0, colorMap.width, colorMap.height).data;
			var colorRGB = new Uint8Array(3*colorData.length/4);
			for(var i = 0; i < colorRGB.length/3; i++){
				colorRGB[i*3  ] = colorData[i*4  ];
				colorRGB[i*3+1] = colorData[i*4+1];
				colorRGB[i*3+2] = colorData[i*4+2];
			}
			
			colorTexture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, colorTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, colorMap.width, colorMap.height, 0, gl.RGB, gl.UNSIGNED_BYTE, colorRGB, 0);
		};
		colorMap.src = src;
	}

	function render(){

		var imageColumns = 2;
		var imageWidth = img.width/imageColumns;
		var slices = 176;
		var imageHeight = img.height/(slices/imageColumns);

		var textureCanvas = document.createElement("canvas");
		var textureContext = textureCanvas.getContext("2d");

		var textureData = new Uint8Array(imageWidth * imageHeight * slices);

		for(var c = 0; c < imageColumns; c++){
			textureCanvas.width = imageWidth;
			textureCanvas.height = img.height;
			textureContext.drawImage(img, -c*imageWidth, 0);
			var imageData = textureContext.getImageData(0, 0, textureCanvas.width, textureCanvas.height).data;
			
			for(var i = 0; i < textureData.length/imageColumns; i++){
				textureData[i+c*textureData.length/imageColumns] = imageData[i*4];
			}
		}

		var normals = new Uint8ClampedArray(textureData.length*3);

		for(var i = 0; i < textureData.length; i++){

			normals[i*3  ] = textureData[i-1] - textureData[i+1] + 128;
			normals[i*3+1] = textureData[i-imageWidth] - textureData[i+imageWidth] + 128;
			normals[i*3+2] = textureData[i-(imageWidth*imageHeight)] - textureData[i+(imageWidth*imageHeight)] + 128;
			
		}

		normals = new Uint8Array(normals);

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

			// lookup the sampler locations.
			var u_image0Location = gl.getUniformLocation(shaderProgram, "tex");
			var u_image1Location = gl.getUniformLocation(shaderProgram, "colorMap");
			var u_image2Location = gl.getUniformLocation(shaderProgram, "normals");

			gl.uniform1i(u_image0Location, 0);  // texture unit 0
			gl.uniform1i(u_image1Location, 1);  // texture unit 1
			gl.uniform1i(u_image2Location, 2);  // texture unit 2


			// Volumetric data
			var texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_3D, texture);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
			//gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(texSize));
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
			gl.texImage3D(
				gl.TEXTURE_3D,  // target
				0,              // level
				gl.LUMINANCE,        // internalformat
				imageWidth,           // width
				imageHeight,           // height
				slices,           // depth
				0,              // border
				gl.LUMINANCE,         // format
				gl.UNSIGNED_BYTE,       // type
				textureData            // pixel
				);
			//gl.generateMipmap(gl.TEXTURE_3D);

			// Normals
			var normalsTexture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_3D, normalsTexture);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
			//gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(texSize));
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
			gl.texImage3D(
				gl.TEXTURE_3D,  // target
				0,              // level
				gl.RGB,        // internalformat
				imageWidth,           // width
				imageHeight,           // height
				slices,           // depth
				0,              // border
				gl.RGB,         // format
				gl.UNSIGNED_BYTE,       // type
				normals            // pixel
				);

			var colorCanvas = document.createElement("canvas");
			colorCanvas.height = colorMap.height;
			colorCanvas.width = colorMap.width;
			var colorContext = colorCanvas.getContext("2d");
			colorContext.drawImage(colorMap, 0, 0);
			var colorData = colorContext.getImageData(0, 0, colorMap.width, colorMap.height).data;
			var colorRGB = new Uint8Array(3*colorData.length/4);
			for(var i = 0; i < colorRGB.length/3; i++){
				colorRGB[i*3  ] = colorData[i*4  ];
				colorRGB[i*3+1] = colorData[i*4+1];
				colorRGB[i*3+2] = colorData[i*4+2];
			}

			colorTexture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, colorTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, colorMap.width, colorMap.height, 0, gl.RGB, gl.UNSIGNED_BYTE, colorRGB, 0);
			
			
			/*gl.bindTexture(gl.TEXTURE_3D, texture);
			
			gl.bindTexture(gl.TEXTURE_2D, colorTexture);*/

			depthSampleCountRef = gl.getUniformLocation(shaderProgram, "depthSampleCount");
			gl.uniform1i(depthSampleCountRef, 512);
			
			var opacitySettingsRef = gl.getUniformLocation(shaderProgram, "opacitySettings");
			var lightPositionRef = gl.getUniformLocation(shaderProgram, "lightPosition");
			
			var transformRef = gl.getUniformLocation(shaderProgram, "transform");

			draw();

			function draw(){			
				
				gl.uniformMatrix4fv(transformRef, false, transform);
				gl.uniform4f(opacitySettingsRef, Math.pow(minLevel, 2), Math.pow(maxLevel, 2), lowNode, highNode);

				var now = Date.now()/1000;
				gl.uniform3f(lightPositionRef, Math.sin(now), Math.cos(now), Math.sin(now*0.783));

				gl.drawArrays(gl.TRIANGLES, 0, size);

				requestAnimationFrame(draw);
			}

		}





	}

	function changeSampleCount(count){
		gl.uniform1i(depthSampleCountRef, count);
	}

	return {
		 changeColorTexture: changeColorTexture
		,changeSampleCount: changeSampleCount
	};

}










