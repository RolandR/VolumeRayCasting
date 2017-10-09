
var minLevel = 0;
var maxLevel = 0.36;
var lowNode = 0.42;
var highNode = 0.76;


var controlsContainer = document.getElementById("controls");

initialiseOpacityControls();

function initialiseOpacityControls(){
	
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






















