(function () {
  var moveable = null;
  var target = null;
  var selecto = null;
  var targets = [];
  var lastSend = performance.now();

  function checkElementIsDraw(element) {
    return (element.id !== 'gridContainer' && element !== Tools.svg && element !== Tools.drawingArea && Tools.drawingArea.contains(element));
  }

  function press(x, y, evt) {
	  console.log(evt.target);
	if (evt.target.id === "gridContainer") {
		destroyMoveable();
		targets.map(item => item.classList.remove('selectedEl'))
		targets.splice(0, targets.length);
		if (selecto === null) {
			createSelecto();
			selecto.setSelectedTargets(targets);
		}
	} else if (!checkElementIsDraw(evt.target)){
		destroySelecto();
	}
  }

  function setTransformOrigin(el) {
    if (!(el.style && el.style.transformOrigin)) {
      const targetRect = el.getBoundingClientRect();
      const transformX = (targetRect.x + document.documentElement.scrollLeft + targetRect.width / 2 - Math.max(0, Tools.board.getBoundingClientRect().x)) / Tools.scale;
      const transformY = (targetRect.y + document.documentElement.scrollTop + targetRect.height / 2) / Tools.scale;
      el.style.transformOrigin = `${transformX}px ${transformY}px`;
    }
  }


  function onStart() {
	  createSelecto();
	  document.addEventListener('keydown', actionsForEvent);
    console.log('start');
  }

  function onQuit() {
	  document.removeEventListener('keydown', actionsForEvent);
    destroySelecto();
    destroyMoveable();
	  targets.map(item => item.classList.remove('selectedEl'))
	  targets = [];
  }

  function draw(data) {
	  switch (data.type) {
		  case "update":
			  console.log(data);
			  const el = document.getElementById(data.id);
			  el.style.transform = data.transform;
			  el.style.transformOrigin = data.transformOrigin;
			  break;
		  default:
			  throw new Error("Mover: 'mover' instruction with unknown type. ", data);
	  }
    console.log('draw ', data);
  }

  function updateRect() {
    if (moveable !== null) {
      moveable.updateRect();
    }
  }

  function createSelecto() {
	  console.log('createSelecto');
	  selecto = new Selecto({
		  // The container to add a selection element
		  container: Tools.board,
		  // The area to drag selection element (default: container)
		  // Targets to select. You can register a queryselector or an Element.
		  selectableTargets: [...document.querySelectorAll('#drawingArea>*')],
		  // Whether to select by click (default: true)
		  selectByClick: true,
		  // Whether to select from the target inside (default: true)
		  selectFromInside: false,
		  // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
		  continueSelect: false,
		  // Determines which key to continue selecting the next target via keydown and keyup.
		  toggleContinueSelect: "shift",
		  // The container for keydown and keyup events
		  keyContainer: window,
		  // The rate at which the target overlaps the drag area to be selected. (default: 100)
		  hitRate: 0.001,
	  });
	  selecto.on("select", e => {
		  e.added.forEach(el => {
			  el.classList.add("selectedEl");
			  setTransformOrigin(el);
			  targets.push(el);
		  });
		  e.removed.forEach(el => {
			  targets.splice(targets.findIndex(item => item === el), 1);
			  el.classList.remove("selectedEl");
		  });
	  });
  }

  function destroySelecto() {
		if (selecto !== null) {
			console.log('destroySelecto')
			selecto.destroy();
			selecto = null;
		}
  }

	function actionsForEvent(evt) {
		if (evt.keyCode === 46 || evt.keyCode === 8) { // Delete key
			deleteSelectedTargets();
		} else if (evt.keyCode === 68 && evt.ctrlKey) {
			createModal(Tools.modalWindows.functionInDevelopment);
		}
	}

	function deleteSelectedTargets() {
		destroyMoveable();
		destroySelecto();
		targets.forEach(function (target) {
			Tools.drawAndSend({
				"type": "delete",
				"id": target.id,
				"sendBack": true,
			}, Tools.list.Eraser);
		});
		targets = [];
	}

  function destroyMoveable() {
    if (moveable !== null) {
	    console.log('destroyMoveable')
      moveable.destroy();
      moveable = null;
    }
  }

  function release() {
  	if (targets.length > 0 && moveable === null) {
		  console.log(targets);
  		console.log('createMoveable');
		  //destroySelecto();
  		var single = targets.length === 1;
  		var padding = single ? 10 : 0;
		  moveable = new Moveable(Tools.board, {
			  // If you want to use a group, set multiple targets(type: Array<HTMLElement | SVGElement>).
			  target: targets,
			  defaultGroupOrigin: "50% 50%",
			  container: Tools.board,
			  dragArea: true,
			  draggable: true,
			  pinchable: single,
			  scalable: single,
			  rotatable: single,
			  origin: true,
			  keepRatio: true,
			  pinchThreshold: 20,
			  throttleRotate: 1,
			  throttleDrag: 1,
			  startDragRotate: 0,
			  throttleDragRotate: 0,
			  padding: {"left": padding, "top": padding, "right": padding, "bottom": padding},
		  });
		  moveable.on("dragGroup", ({events}) => {
			  var sendOrDraw = draw;
			  if (performance.now() - lastSend > 50) {
				  lastSend = performance.now();
				  sendOrDraw = Tools.drawAndSend;
			  }
			  for (var ev of events) {
				  var msg = {type: "update", id: ev.target.id, transform: ev.transform, transformOrigin: ev.target.transformOrigin};
				  sendOrDraw(msg);
			  }
		  }).on("dragGroupEnd", (data) => {
			  console.log(data);
		  })
			  .on("drag", singleTransform)
			  .on("pinch", singleTransform)
			  .on("scale", singleTransform)
			  .on("rotate", singleTransform);
    }
  }

  function move() {
    //console.log('move');
  }

  function singleTransform (data) {
	  var msg = {type: "update", id: targets[0].id, transform: data.transform, transformOrigin: targets[0].style.transformOrigin};
	  Tools.drawAndSend(msg);
  }

  Tools.add({ //The new tool
    "name": "trr",
    "shortcut": "v",
    "listeners": {
      "press": press,
      "move": move,
      "release": release
    },
	  "test": targets,
    "onstart": onStart,
    "onquit": onQuit,
    "draw": draw,
    "showMarker": true,
    "updateRect": updateRect,
  });
})();
