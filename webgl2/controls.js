
var minLevel = 0;
var maxLevel = 0.36;
var lowNode = 0.42;
var highNode = 0.76;

var autorotate = true;

var transform = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
];

initControls();

function initControls(){

	var container = document.getElementById("container");
	var canvas = document.getElementById("canvas");

	var controlsContainer = document.getElementById("controls");

	var zoom = 1;

	var angleX = 0;
	var angleY = 0;

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

	function updateTransformation(){
		var rotationMatrix;
		
		/*if(autorotate && panX == 0 && panY == 0){
			angleX += 0.008;
		}*/
		angleX += panX*0.0025;
		panX = 0;
		var c = Math.cos(angleX);
		var s = Math.sin(angleX);
		
		rotationMatrix = [
			c, 0, s, 0,
			0, 1, 0, 0,
			-s, 0, c, 0,
			0,  0, 0, 1
		];

		angleY += panY*0.0025;
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
	}

	document.addEventListener('mousemove', function(e) {
		if(panning || moving){
			var deltaX = e.screenX - moveStartX;
			var deltaY = e.screenY - moveStartY;
			if(panning){
				panX += deltaX - lastX;
				panY += deltaY - lastY;
			} else if(moving){
				translateX += (deltaX - lastX)*0.003;
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
			console.log(e);
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

	initOpacityControls();

	function initOpacityControls(){
		
		var opCanvas = document.getElementById("opacityControls");
		var opContext = opCanvas.getContext("2d");

		var height = 50;
		var padding = 5;
		opCanvas.width = controlsContainer.clientWidth - 20;
		opCanvas.height = height+padding*2;

		var width = opCanvas.width-2*padding;

		var lowNodeX = ~~(width*lowNode)+padding;
		var highNodeX = ~~(width*highNode)+padding;
		var minLevelY = ~~(height-(minLevel*height))+padding;
		var maxLevelY = ~~(height-(maxLevel*height))+padding;

		render();

		function render(){
			opContext.clearRect(0, 0, opCanvas.width, opCanvas.height);
			
			opContext.strokeStyle = "#AAAAAA";
			opContext.fillStyle = "#FFAA00";
			opContext.lineWidth = 2;
			opContext.beginPath();
			opContext.moveTo(padding, minLevelY);
			opContext.lineTo(lowNodeX, minLevelY);
			opContext.lineTo(highNodeX, maxLevelY);
			opContext.lineTo(~~(opCanvas.width)+padding, maxLevelY);
			opContext.stroke();

			opContext.beginPath();
			opContext.arc(lowNodeX, minLevelY, 5, 0, 2*Math.PI);
			opContext.fill();

			opContext.beginPath();
			opContext.arc(highNodeX, maxLevelY, 5, 0, 2*Math.PI);
			opContext.fill();
			
		}

		var dragging = false;
		var nodeDragged = 0;
		var dragStart = [0, 0];
		var startPos = [0, 0];

		opCanvas.addEventListener("mousedown", function(e){
			console.log(e);
			if(Math.sqrt(Math.pow(e.offsetX-lowNodeX, 2)+Math.pow(e.offsetY-minLevelY, 2)) <= 5){
				dragging = true;
				nodeDragged = 0;
				dragStart = [e.screenX, e.screenY];
				startPos = [lowNodeX, minLevelY];
			} else if(Math.sqrt(Math.pow(e.offsetX-highNodeX, 2)+Math.pow(e.offsetY-maxLevelY, 2)) <= 5){
				dragging = true;
				nodeDragged = 1;
				dragStart = [e.screenX, e.screenY];
				startPos = [highNodeX, maxLevelY];
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
					minLevel = 1-(minLevelY-padding)/height;
				} else {
					highNodeX = Math.max(padding, Math.min(width+padding, startPos[0]-diffX));
					maxLevelY = Math.max(padding, Math.min(height+padding, startPos[1]-diffY));

					highNode = (highNodeX-padding)/width;
					maxLevel = 1-(maxLevelY-padding)/height;
				}
				
				render();

				console.log(lowNode, highNode, minLevel, maxLevel);
			}
		});

		document.addEventListener("mouseup", function(e){
			dragging = false;
		});
		

	}

	document.getElementById("autorotate").addEventListener("change", function(e){
		autorotate = this.checked;
	});

}



















