
/*var minLevel = 0;
var maxLevel = 1;
var lowNode = 1/256;
var highNode = 3/256;*/

var minLevel = 0;
var maxLevel = 1;
var lowNode = 0.7;
var highNode = 0.95;

var colorRangeMin = 0.4;
var colorRangeMax = 0.9;

var autorotate = true;

var transform = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
];

var inverseTransform = matrix4Inverse(transform);

var renderer;

window.addEventListener("load", function(){
	
	renderer = new Renderer();
	initControls();
	
});

function initControls(){

	var container = document.getElementById("container");
	var canvas = document.getElementById("canvas");

	var controlsContainer = document.getElementById("controls");

	var downloadButton = document.getElementById("download");

	var zoom = 0.8;

	var startAngle = 0;
	var startTime = Date.now();
	var turnsPerSecond = 0.05;

	var angleX = 0.9;
	var angleY = -0.25;

	var translateX = 0;
	var translateY = 0;
	var translateZ = 0;

	var running = true;

	var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
	var panX = 0;
	var panY = 0;

	updateTransformation();

	function updateTransformation(){
		var rotationMatrix;

		//if(autorotate){
			//angleX = ((Date.now()-startTime)/1000)*(2*Math.PI*turnsPerSecond);
		//}
		
		angleX -= panX*0.0025;
		panX = 0;
		var c = Math.cos(angleX);
		var s = Math.sin(angleX);
		
		rotationMatrix = [
			c, 0, s, 0,
			0, 1, 0, 0,
			-s, 0, c, 0,
			0,  0, 0, 1
		];

		angleY -= panY*0.0025;
		panY = 0;
		var c = Math.cos(angleY);
		var s = Math.sin(angleY);
		
		var yRotationMatrix = [
			1, 0,  0, 0,
			0, c, -s, 0,
			0, s,  c, 0,
			0, 0,  0, 1,
		];

		rotationMatrix = matrix4Multiply(yRotationMatrix, rotationMatrix);

		
		var translationMatrix = makeTranslationMatrix([-translateX, translateY, translateZ]);
		var scaleMatrix = makeScaleMatrix([zoom, zoom, zoom]);
		

		var transformMatrix =  matrix4Multiply(translationMatrix, rotationMatrix);
		transformMatrix =  matrix4Multiply(transformMatrix, scaleMatrix);
		transform = transformMatrix;

		inverseTransform = matrix4Inverse(transform);

		renderer.draw();
		//requestAnimationFrame(updateTransformation);
	}

	document.addEventListener('mousemove', function(e) {
		if(panning || moving){
			var deltaX = e.screenX - moveStartX;
			var deltaY = e.screenY - moveStartY;
			if(panning){
				panX += deltaX - lastX;
				panY += deltaY - lastY;
			} else if(moving){
				translateX -= (deltaX - lastX)*0.003;
				translateY -= (deltaY - lastY)*0.003;
			}
			lastX = deltaX;
			lastY = deltaY;

			updateTransformation();
		}
	});

	canvas.addEventListener('contextmenu', function(e) {
		e.preventDefault();
		return false;
	});

	container.addEventListener('mousedown', function(e) {
		if(e.buttons == 1){
			moving = true;
		} else if(e.buttons == 2){
			panning = true;
			e.preventDefault();
		}
		moveStartX = e.screenX;
		moveStartY = e.screenY;
	});

	document.addEventListener('mouseup', function(e) {
		moving = false;
		panning = false;
		moveStartX = 0;
		moveStartY = 0;		
		lastX = 0;
		lastY = 0;
		panX = 0;
		panY = 0;
	});

	container.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		/*if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			translateZ += e.deltaY * 0.001;
		}*/
		zoom += zoom * 0.001 * e.deltaY;
		
		updateTransformation();
		return false;
	});

	document.getElementById("sampleCount").addEventListener("change", function(e){
		renderer.changeSampleCount(this.value);
		renderer.draw();
	});
	

	initVolumeSelect();
	initShaderSelect();
	initShaderControls();
	initColorRangeControls();
	initOpacityControls();
	initColorSelect();

	function initVolumeSelect(){
		var volumeSelect = document.getElementById("volumeSelect");

		for(var i in volumes){
			var option = document.createElement("option");
			option.value = i;
			option.innerHTML = volumes[i].name;
			volumeSelect.appendChild(option);
		}

		
		volumeSelect.addEventListener("change", function(e){
			var selectedValue = this.options[this.options.selectedIndex].value;
			renderer.changeVolume(volumes[selectedValue]);
		});
	}
	
	function initShaderSelect(){
		var shaderSelect = document.getElementById("shaderSelect");

		for(var i in shaders){
			var option = document.createElement("option");
			option.value = i;
			option.innerHTML = shaders[i].name;
			shaderSelect.appendChild(option);
		}

		
		shaderSelect.addEventListener("change", function(e){
			var selectedValue = this.options[this.options.selectedIndex].value;
			renderer.changeShader(shaders[selectedValue]);
		});
	}

	function initShaderControls(){
		var brightnessSlider = document.getElementById("brightness");
		var brightnessOutput = document.getElementById("brightnessOutput");
		
		brightnessSlider.addEventListener("input", function(e){
			var value = Math.pow(this.value, 2);
			renderer.changeBrightness(value);
			brightnessOutput.innerHTML = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		});
	}
	
	function initColorRangeControls(){
		var rangeContainer = document.getElementById("colorRangeContainer");
		var rangeElement = document.getElementById("colorRange");
		var minRange = document.getElementById("colorRangeMin");
		var maxRange = document.getElementById("colorRangeMax");
		var colorRangeLeftFill = document.getElementById("colorRangeLeftFill");
		var colorRangeRightFill = document.getElementById("colorRangeRightFill");
		
		minRange.value = colorRangeMin;
		maxRange.value = colorRangeMax;
		
		update();
		
		minRange.addEventListener("input", function(e){
			colorRangeMin = 1*minRange.value;
			if(colorRangeMin > colorRangeMax){
				colorRangeMax = colorRangeMin;
				maxRange.value = colorRangeMax;
			}
			update();
		});
		
		maxRange.addEventListener("input", function(e){
			colorRangeMax = 1*maxRange.value;
			if(colorRangeMin > colorRangeMax){
				colorRangeMin = colorRangeMax;
				minRange.value = colorRangeMin;
			}
			update();
		});
		
		function update(){
			rangeElement.style.left = (colorRangeMin*100)+"%";
			rangeElement.style.right = ((1-colorRangeMax)*100)+"%";
			var center = (colorRangeMin+colorRangeMax)/2;
			console.log(colorRangeMin, colorRangeMax, center);
			colorRangeRightFill.style.left = (center*100)+"%";
			colorRangeLeftFill.style.right = ((1-center)*100)+"%";
			
			renderer.updateColorRange();
		}
		
	}

	function initOpacityControls(){
		
		var opCanvas = document.getElementById("opacityControls");
		var opContext = opCanvas.getContext("2d");

		var height = 70;
		var padding = 10;
		opCanvas.width = controlsContainer.clientWidth - 2*padding -2; // 2 for border, i guess
		opCanvas.height = height+padding*2;

		var width = opCanvas.width-2*padding;

		var lowNodeX = ~~(width*lowNode)+padding;
		var highNodeX = ~~(width*highNode)+padding;
		var minLevelY = ~~(height-(minLevel*height))+padding;
		var maxLevelY = ~~(height-(maxLevel*height))+padding;
		
		window.addEventListener("resize", function(){
			opCanvas.width = controlsContainer.clientWidth - 2*padding -2; // 2 for border, i guess
			opCanvas.height = height+padding*2;

			width = opCanvas.width-2*padding;

			lowNodeX = ~~(width*lowNode)+padding;
			highNodeX = ~~(width*highNode)+padding;
			minLevelY = ~~(height-(minLevel*height))+padding;
			maxLevelY = ~~(height-(maxLevel*height))+padding;
			
			render();
		});

		render();

		function render(){
			
			renderer.updateOpacity();

			lowNodeX = ~~(width*lowNode)+padding;
			highNodeX = ~~(width*highNode)+padding;
			minLevelY = ~~(height-(minLevel*height))+padding;
			maxLevelY = ~~(height-(maxLevel*height))+padding;
			
			opContext.clearRect(0, 0, opCanvas.width, opCanvas.height);

			// draw guide lines
			var linesCount = 10;
			
			opContext.strokeStyle = "rgba(255, 255, 255, 0.2)";
			opContext.lineWidth = 0.5;
			opContext.beginPath();
			
			for(var i = 0; i < linesCount; i++){
				var y = 1-Math.pow(i/(linesCount-1), 2);
				var y = padding + (height)*y;
				y = ~~y+0.5;
				opContext.moveTo(padding, y);
				opContext.lineTo(width+padding, y);
			}

			opContext.stroke();
			
			opContext.strokeStyle = "#AAAAAA";
			opContext.lineWidth = 2;
			opContext.beginPath();
			opContext.moveTo(padding, minLevelY);
			opContext.lineTo(lowNodeX, minLevelY);
			opContext.lineTo(highNodeX, maxLevelY);
			opContext.lineTo(width+padding, maxLevelY);
			opContext.stroke();

			if(hovering && nodeHovered == 0 || dragging && nodeDragged == 0){
				opContext.fillStyle = "#FFFF55";
			} else {
				opContext.fillStyle = "#FFAA00";
			}

			opContext.beginPath();
			opContext.arc(lowNodeX, minLevelY, 5, 0, 2*Math.PI);
			opContext.fill();

			if(hovering && nodeHovered == 1 || dragging && nodeDragged == 1){
				opContext.fillStyle = "#FFFF55";
			} else {
				opContext.fillStyle = "#FFAA00";
			}

			opContext.beginPath();
			opContext.arc(highNodeX, maxLevelY, 5, 0, 2*Math.PI);
			opContext.fill();
			
		}

		var dragging = false;
		var hovering = false;
		var nodeDragged = 0;
		var nodeHovered = 0;
		var dragStart = [0, 0];
		var startPos = [0, 0];

		// distance where clicks and hovering near control nodes are registered
		var hoverRadius = 15;

		opCanvas.addEventListener("mousedown", function(e){
			//console.log(e);
			if(Math.sqrt(Math.pow(e.offsetX-lowNodeX, 2)+Math.pow(e.offsetY-minLevelY, 2)) <= hoverRadius){
				dragging = true;
				nodeDragged = 0;
				dragStart = [e.screenX, e.screenY];
				startPos = [lowNodeX, minLevelY];
			} else if(Math.sqrt(Math.pow(e.offsetX-highNodeX, 2)+Math.pow(e.offsetY-maxLevelY, 2)) <= hoverRadius){
				dragging = true;
				nodeDragged = 1;
				dragStart = [e.screenX, e.screenY];
				startPos = [highNodeX, maxLevelY];
			}
		});

		// figure out if cursor is near opacity control node, for highlighting
		opCanvas.addEventListener("mousemove", function(e){
			if(Math.sqrt(Math.pow(e.offsetX-lowNodeX, 2)+Math.pow(e.offsetY-minLevelY, 2)) <= hoverRadius){
				if(!hovering){
					opCanvas.className = "pointer";
					nodeHovered = 0;
					hovering = true;
					render();
				}
			} else if(Math.sqrt(Math.pow(e.offsetX-highNodeX, 2)+Math.pow(e.offsetY-maxLevelY, 2)) <= hoverRadius){
				if(!hovering){
					opCanvas.className = "pointer";
					nodeHovered = 1;
					hovering = true;
					render();
				}
			} else {
				if(hovering){
					opCanvas.className = "";
					hovering = false;
					render();
				}
			}
		});

		document.addEventListener("mousemove", function(e){
			if(dragging){
				e.preventDefault();
				var diffX = dragStart[0]-e.screenX;
				var diffY = dragStart[1]-e.screenY;
				
				if(nodeDragged == 0){
					lowNodeX = Math.max(padding, Math.min(width+padding, startPos[0]-diffX));
					minLevelY = Math.max(padding, Math.min(height+padding, startPos[1]-diffY));

					lowNode = (lowNodeX-padding)/width;
					lowNode = Math.min(lowNode, highNode);
					minLevel = 1-(minLevelY-padding)/height;
				} else {
					highNodeX = Math.max(padding, Math.min(width+padding, startPos[0]-diffX));
					maxLevelY = Math.max(padding, Math.min(height+padding, startPos[1]-diffY));

					highNode = (highNodeX-padding)/width;
					highNode = Math.max(highNode, lowNode);
					maxLevel = 1-(maxLevelY-padding)/height;
				}
				
				render();
			}

			// turn off hovering if cursor left opacity canvas
			if(hovering && e.target != opCanvas){
				opCanvas.className = "";
				hovering = false;
				render();
			}
		});

		document.addEventListener("mouseup", function(e){
			dragging = false;
			render();
		});
		

	}

	function initColorSelect(){
		var opened = false;
		var selectContainer = document.getElementById("colorSelect");

		selectContainer.addEventListener("click", function(e){
			opened = !opened;
			if(opened){
				selectContainer.className += " opened";
			} else {
				selectContainer.className = "homebrewSelect";
				for(var i in selectContainer.children){
					selectContainer.children[i].className = "";
				}
				e.target.className = "active";
				renderer.changeColorTexture("./colorMappings/"+e.target.id+".png");
			}
			requestAnimationFrame(renderer.draw);
		});
		
		selectContainer.addEventListener("mousemove", function(e){
			if(opened){
				renderer.changeColorTexture("./colorMappings/"+e.target.id+".png");
			}
			requestAnimationFrame(renderer.draw);
		});
		
	}

	downloadButton.addEventListener("click", function(e){
		canvas.toBlob(
			function(blob){
				var a = document.createElement("a");
				a.download = "volume.png";
				a.href = URL.createObjectURL(blob);
				a.dispatchEvent(new MouseEvent(`click`, {bubbles: true, cancelable: true, view: window}));
			},
			"image/png"
		);
	});

}



















