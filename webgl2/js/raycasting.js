


var volumes = {
	sagittal: {
		 src: "./images/sagittal.png"
		,columns: 2
		,slices: 176
		,zScale: 0.7
	}
	,vessels: {
		 src: "./images/vessels.png"
		,columns: 1
		,slices: 160
		,zScale: 0.7
	}
	,sphereAntialiased: {
		 src: "./images/sphere_antialiased.png"
		,columns: 16
		,slices: 256
		,zScale: 1
	}
};


var Renderer = function(){

	var img = document.getElementById("slice");
	var colorMap = document.createElement("img");
	
	/*colorMap.onload = updateLoadedImages;
	colorMap.src = "./colorMappings/skyline.png";*/

	var canvas = document.getElementById("canvas");
	var container = document.getElementById("container");
	canvas.width = container.clientWidth;
	canvas.height = container.clientHeight;
	var aspect = canvas.width / canvas.height;
	
	var gl = canvas.getContext("webgl2");
	var shaderProgram;
	var size;

	var colorTexture;
	var depthSampleCountRef
	var opacitySettingsRef;
	var lightPositionRef;
	var transformRef;
	var zScaleRef;

	var opacities = new Uint8Array(256);
	var colorTransfer = new Uint8Array(3*256);

	initGl();

	changeColorTexture("./colorMappings/skyline.png");
	updateOpacity();
	changeVolume(volumes.sagittal);

	/*img.onload = processVolume;
	img.src = "./images/sagittal.png";*/

	/*var imagesLoaded = 0;
	var imagesToLoad = 2;

	function updateLoadedImages(){
		imagesLoaded++;
		if(imagesLoaded == imagesToLoad){
			render();
		}
	}*/

	function updateOpacity(){

		//var opacities = new Uint8Array(256);

		for(var i = 0; i < opacities.length; i++){
			var px = i/opacities.length;
			px = px*px;
			
			if(px <= lowNode){
				opacities[i] = minLevel*256;
			} else if(px > highNode){
				opacities[i] = maxLevel*256;
			} else {
				var ratio = (px-lowNode)/(highNode-lowNode);
				opacities[i] = (minLevel*(1-ratio) + maxLevel*ratio)*256;
			}
		}

		updateTransferTexture();
	}

	function updateTransferTexture(){
		
		var transferData = new Uint8Array(4*256);
		
		for(var i = 0; i < 256; i++){

			var r = colorTransfer[i*3+0]/256;
			var g = colorTransfer[i*3+1]/256;
			var b = colorTransfer[i*3+2]/256;
			var a = opacities[i]/256;

			r = r*r*a;
			g = g*g*a;
			b = b*b*a;
			
			transferData[i*4+0] = r*256;
			transferData[i*4+1] = g*256;
			transferData[i*4+2] = b*256;
			
			transferData[i*4+3] = a*256;
		}
		
		gl.activeTexture(gl.TEXTURE1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, transferData, 0);
		
		draw();
	}

	function changeColorTexture(src){
		colorMap.onload = function(){
			var colorCanvas = document.createElement("canvas");
			colorCanvas.height = colorMap.height;
			colorCanvas.width = colorMap.width;
			var colorContext = colorCanvas.getContext("2d");
			colorContext.drawImage(colorMap, 0, 0);
			var colorData = colorContext.getImageData(0, 0, colorMap.width, colorMap.height).data;
			
			for(var i = 0; i < 256; i++){
				colorTransfer[i*3  ] = colorData[i*4  ];
				colorTransfer[i*3+1] = colorData[i*4+1];
				colorTransfer[i*3+2] = colorData[i*4+2];
			}
			
			updateTransferTexture();
		};
		colorMap.src = src;
	}

	function initGl(){
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
		//var u_image3Location = gl.getUniformLocation(shaderProgram, "opacities");

		gl.uniform1i(u_image0Location, 0);  // texture unit 0
		gl.uniform1i(u_image1Location, 1);  // texture unit 1
		gl.uniform1i(u_image2Location, 2);  // texture unit 2
		//gl.uniform1i(u_image3Location, 3);  // texture unit 3

		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_3D, texture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.LUMINANCE,        // internalformat
			1,           // width
			1,           // height
			1,           // depth
			0,              // border
			gl.LUMINANCE,         // format
			gl.UNSIGNED_BYTE,       // type
			Uint8Array.from([0])            // pixel
		);

		colorTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);

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
			1,           // width
			1,           // height
			1,           // depth
			0,              // border
			gl.RGB,         // format
			gl.UNSIGNED_BYTE,       // type
			Uint8Array.from([0, 0, 0])            // pixel
		);

		/*opacityTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, opacityTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 1, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0]), 0);*/

		zScaleRef = gl.getUniformLocation(shaderProgram, "zScale");
		aspectRef = gl.getUniformLocation(shaderProgram, "aspect");
		gl.uniform1f(aspectRef, aspect);
		
		depthSampleCountRef = gl.getUniformLocation(shaderProgram, "depthSampleCount");
		gl.uniform1i(depthSampleCountRef, 512);
		
		opacitySettingsRef = gl.getUniformLocation(shaderProgram, "opacitySettings");
		lightPositionRef = gl.getUniformLocation(shaderProgram, "lightPosition");
		
		transformRef = gl.getUniformLocation(shaderProgram, "transform");
	}

	function changeVolume(volume){
		var img = document.createElement("img");
		img.onload = function(e){
			var imageColumns = volume.columns;
			var imageWidth = img.width/imageColumns;
			var slices = volume.slices;
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

			updateVolumeTexture(textureData, imageWidth, imageHeight, slices);
			updateNormalsTexture(normals, imageWidth, imageHeight, slices);
			updateZScale(volume.zScale);

			draw();
		}
		img.src = volume.src;
	}

	function updateZScale(zScale){
		gl.uniform1f(zScaleRef, zScale);
	}

	function updateVolumeTexture(textureData, width, height, slices){
		// Volumetric data
		gl.activeTexture(gl.TEXTURE0);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.LUMINANCE,        // internalformat
			width,           // width
			height,           // height
			slices,           // depth
			0,              // border
			gl.LUMINANCE,         // format
			gl.UNSIGNED_BYTE,       // type
			textureData            // pixel
		);
		//gl.generateMipmap(gl.TEXTURE_3D);
	}

	function updateNormalsTexture(normals, width, height, slices){
		// Normals
		gl.activeTexture(gl.TEXTURE2);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.RGB,        // internalformat
			width,           // width
			height,           // height
			slices,           // depth
			0,              // border
			gl.RGB,         // format
			gl.UNSIGNED_BYTE,       // type
			normals            // pixel
		);
	}

	function draw(){

		if(shaderProgram){
			
			gl.uniformMatrix4fv(transformRef, false, transform);
			//gl.uniform4f(opacitySettingsRef, Math.pow(minLevel, 2), Math.pow(maxLevel, 2), lowNode, highNode);

			//var now = Date.now()/1000;
			//gl.uniform3f(lightPositionRef, Math.sin(now), Math.cos(now), Math.sin(now*0.783));

			gl.drawArrays(gl.TRIANGLES, 0, size);
		}
	}

	function changeSampleCount(count){
		gl.uniform1i(depthSampleCountRef, count);
	}

	window.addEventListener("resize", function(event){
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		aspect = canvas.width / canvas.height;
		gl.uniform1f(aspectRef, aspect);
		gl.viewport(0, 0, canvas.width, canvas.height);
		draw();
	});

	return {
		 changeColorTexture: changeColorTexture
		,changeSampleCount: changeSampleCount
		,changeVolume: changeVolume
		,updateOpacity: updateOpacity
		,draw: draw
	};

}










