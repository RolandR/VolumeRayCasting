
updateSize();

function updateSize(){
	var height = document.getElementById("height").value;
	var width = document.getElementById("width").value;
	var depth = document.getElementById("depth").value;
	var columns = document.getElementById("columns").value;
	
	var imageWidth = width*columns;
	var imageHeight = height*Math.ceil((depth)/columns);
	var imageSize = imageWidth * imageHeight;

	document.getElementById("imageWidth").innerHTML = imageWidth;
	document.getElementById("imageHeight").innerHTML = imageHeight;

	var warning = false;
	var warningText = "";

	var maximumSaneDimension = 32767;
	var maximumIEDimension = 16384;

	var maximumFirefoxSize = 472907776;
	var maximumChromeSize = 268435456;
	var maximumMobileSafariSize = 16777216;

	if(Math.max(imageWidth, imageHeight) > maximumSaneDimension){
		warning = true;
		warningText = "Images bigger than "+maximumSaneDimension.toLocaleString()+"px in any direction may cause problems with the canvas implementations of most browsers.<br>";
	} else if(Math.max(imageWidth, imageHeight) > maximumIEDimension){
		warning = true;
		warningText = "Images bigger than "+maximumIEDimension.toLocaleString()+"px in any direction may cause problems with the canvas implementations of some browsers, like Internet Explorer.<br>";
	}

	if(imageSize > maximumFirefoxSize){
		warning = true;
		warningText += "Images with more than "+maximumFirefoxSize.toLocaleString()+" total pixels may cause problems with the canvas implementations of most browsers. ";
	} else if(imageSize > maximumChromeSize){
		warning = true;
		warningText += "Images with more than "+maximumChromeSize.toLocaleString()+" total pixels may cause problems with the canvas implementations of chrome or other browsers. ";
	} else if(imageSize > maximumMobileSafariSize){
		warning = true;
		warningText += "Images with more than "+maximumMobileSafariSize.toLocaleString()+" total pixels may cause problems with the canvas implementations of a few browsers, such as Safari on iOS. ";
	}

	if(warning){
		document.getElementById("warningTooltip").innerHTML = warningText;
		document.getElementById("sizeWarning").style.display = "inline-block";
	} else {
		document.getElementById("sizeWarning").style.display = "none";
	}
	
}

function generate(){
	var text = document.getElementById("codeInput").value;
	text = "var out = 0;\n" + text;
	text = text + "\nreturn out;";

	var height = document.getElementById("height").value;
	var width = document.getElementById("width").value;
	var depth = document.getElementById("depth").value;

	var func = new Function("x", "y", "z", text);

	var canvas = document.getElementById("imageCanvas");

	var columns = document.getElementById("columns").value;

	canvas.width = width*columns;
	canvas.height = height*Math.ceil((depth)/columns);

	var context = canvas.getContext("2d");

	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

	var imageWidth = width*columns;
	var rows = Math.ceil(depth/columns);

	var aa = document.getElementById("oversampling").value;

	var data = imageData.data;
	for(var x = 0; x < width; x++){
		for(var y = 0; y < height; y++){
			for(var z = 0; z < depth; z++){

				var ix = x;
				var iy = y;
				var iz = z;

				var value = 0;

				for(var ax = 0; ax < aa; ax++){
					for(var ay = 0; ay < aa; ay++){
						for(var az = 0; az < aa; az++){
							ix = x + az/aa - 0.5;
							iy = y + ay/aa - 0.5;
							iz = z + az/aa - 0.5;

							value += func(ix/width*2-1, iy/height*2-1, iz/depth*2-1);
						}
					}
				}

				value = value / Math.pow(document.getElementById("oversampling").value, 3);
				value = Math.floor(value*256);

				var column = Math.floor(z/rows);

				var i = ((z%rows)*imageWidth*height + column*width + y*imageWidth + x)*4;
				
				data[i  ] = value;
				data[i+1] = value;
				data[i+2] = value;
				data[i+3] = 255;
				
			}	
		}					
	}
	context.putImageData(imageData, 0, 0);

	var preview = new Preview(canvas, height, width, depth, columns);

	document.getElementById("openImageButton").disabled = false;
	document.getElementById("run").disabled = false;
	document.getElementById("run").innerHTML = "Generate Image";
	
}

function Preview(canvas, height, width, depth, columns){

	var rows = Math.ceil(depth/columns);

	var previewCanvas = document.getElementById("previewCanvas");
	previewCanvas.width = width;
	previewCanvas.height = height;
	var context = previewCanvas.getContext("2d");

	var previewSlider = document.getElementById("previewSliceSlider");
	previewSlider.disabled = false;
	previewSlider.min = 0;
	previewSlider.max = depth-1;
	previewSlider.value = Math.floor(depth/2);
	displaySlice(previewSlider.value);

	function displaySlice(slice){
		document.getElementById("sliceNumber").innerHTML = slice;
		
		var column = Math.floor(slice/rows);

		var sx = column*width;
		var sy = (slice%rows)*height;
		context.drawImage(canvas, sx, sy, width, height, 0, 0, width, height);
	}

	previewSlider.oninput = function(e){
		displaySlice(this.value);
	};
	
}



document.getElementById("run").addEventListener("click", function(e){

	document.getElementById("openImageButton").disabled = true;
	document.getElementById("previewSliceSlider").disabled = false;
	this.disabled = true;
	this.innerHTML = "Generating...";

	setTimeout(generate, 20);

});

document.getElementById("closeOverlayButton").addEventListener("click", function(e){
	document.getElementById("imageOverlay").style.display = "none";
});

document.getElementById("height").addEventListener("input", updateSize);
document.getElementById("width").addEventListener("input", updateSize);
document.getElementById("depth").addEventListener("input", updateSize);
document.getElementById("columns").addEventListener("input", updateSize);


document.getElementById("oversampling").addEventListener("input", function(e){
	document.getElementById("samplesPerPixel").innerHTML = Math.pow(document.getElementById("oversampling").value, 3);
});

document.getElementById("openImageButton").addEventListener("click", function(e){
	document.getElementById("imageOverlay").style.display = "block";
});

document.getElementById("examples").addEventListener("change", function(e){
	var selected = this.options[this.selectedIndex].value;

	document.getElementById("codeInput").value = examples[selected];
	
});




















