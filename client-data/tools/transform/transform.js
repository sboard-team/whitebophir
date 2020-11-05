(function () {
	var moveable = null;
	var target = null;
	var selecto = null;
	var targets = [];
	var lastSend = performance.now();
	const panel = document.getElementById('object-panel');
	var sendingInverval = null;

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
		} else if (!checkElementIsDraw(evt.target)) {
			destroySelecto();
		}
	}

	function onQuit() {
		document.removeEventListener('keydown', actionsForEvent);
		document.getElementById('object-delete').removeEventListener('click', deleteSelectedTargets);
		panel.classList.add('hide');
		clearInterval(sendingInverval);
		destroySelecto();
		destroyMoveable();
		targets = [];
	}

	function setTransformOrigin(el) {
		if ((el.style && el.style.transformOrigin === '')) {
			const targetRect = el.getBoundingClientRect();
			const transformX = (targetRect.x + document.documentElement.scrollLeft + targetRect.width / 2 - Math.max(0, Tools.board.getBoundingClientRect().x)) / Tools.scale;
			const transformY = (targetRect.y + document.documentElement.scrollTop + targetRect.height / 2) / Tools.scale;
			el.style.transformOrigin = `${transformX}px ${transformY}px`;
		}
	}

	function onStart() {
		createSelecto();
		document.addEventListener('keydown', actionsForEvent);
		document.getElementById('object-delete').addEventListener('click', deleteSelectedTargets);
		document.getElementById('object-dublicate').addEventListener('click', dublicateObjects);
		sendingInverval = setInterval(sendInInterval, 800);
	}

	function destroySelecto() {
		if (selecto !== null) {
			console.log('destroySelecto')
			selecto.destroy();
			selecto = null;
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
			// The container for keydown and keyup events
			keyContainer: window,
			// The rate at which the target overlaps the drag area to be selected. (default: 100)
			hitRate: 0.001,
		});
		selecto.on("select", e => {
			e.added.forEach(el => {
				setTransformOrigin(el);
				targets.push(el);
				el.classList.add("selectedEl");
			});
			e.removed.forEach(el => {
				console.log('index', targets.findIndex(item => item === el));
				targets.splice(targets.findIndex(item => item === el), 1);
				el.classList.remove("selectedEl");
			});
		});
	}

	function release() {
		createMoveable();
	}

	function createMoveable() {
		targets.forEach(el => {
			el.classList.remove("selectedEl");
		});
		if (targets.length > 0 && moveable === null) {
			console.log(targets);
			console.log('createMoveable');
			panel.classList.remove('hide');
			//destroySelecto();
			var single = targets.length === 1;
			var padding = single ? 10 : 0;
			targets.map(el => {
				setTransformOrigin(el);
			});
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
					var msg = {
						type: "update",
						id: ev.target.id,
						transform: ev.transform,
						transformOrigin: ev.target.transformOrigin
					};
					sendOrDraw(msg);
				}
			}).on("dragGroupEnd", (data) => {
				console.log(data);
			})
				.on("drag", singleTransform)
				.on("pinch", singleTransform)
				.on("scale", singleTransform)
				.on("rotate", singleTransform);
			moveable.updateRect();
		}
	}

	function singleTransform(data) {
		var msg = {
			type: "update",
			id: targets[0].id,
			transform: data.transform,
			transformOrigin: targets[0].style.transformOrigin
		};
		Tools.drawAndSend(msg);
	}

	function sendInInterval() {
		Tools.send({
			type: "update", selectElements: targets.map(function (el) {
				return el.id;
			})
		}, "Cursor");
	}

	function dublicateObjects() {
		targets.map(item => {
			Tools.send({
				"type": "dublicate",
				"id": item.id,
			});
		})
		moveable.request("draggable", {deltaX: 20, deltaY: 20}, true);
	}

	function actionsForEvent(evt) {
		if (evt.keyCode === 46 || evt.keyCode === 8) { // Delete key
			deleteSelectedTargets();
		} else if (evt.keyCode === 68 && evt.ctrlKey) {
			dublicateObjects();
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
		panel.classList.add('hide');
		if (moveable !== null) {
			console.log('destroyMoveable')
			moveable.destroy();
			moveable = null;
		}
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

	function selectElement(el) {
		destroyMoveable();
		destroySelecto();
		destroySelecto();
		destroyMoveable();
		targets = [el];
		createMoveable();
	}

	Tools.add({ //The new tool
		"name": "Transform",
		"shortcut": "v",
		"listeners": {
			"press": press,
			"release": release
		},
		//"selectElement": selectElement,
		//"checkAndDisable": checkAndDisable, // Проверить если элемент удалили, то прекратить выделение и убрать панель
		"onstart": onStart,
		"onquit": onQuit,
		"draw": draw,
		"showMarker": true,
		"updateRect": updateRect,
		"selectElement": selectElement,
	});
})();


// (function () {
//   var transformTool = null;
//   var transformEl = null;
//   var messageForUndo = null;
//   var lastSend = performance.now();
//   const panel = document.getElementById('object-panel');
//   const transformToolEl = document.getElementById('transform-tool');
//   var sendingInverval = null;
//   var index = 0;
//   var proportionsEnabled = false;
//   const propertiesForSend = ['x', 'width', 'height', 'y', 'transform', 'x1', 'y1', 'x2', 'y2', 'd', 'rx', 'cx', 'ry', 'cy'];
//
//   function press(x, y, evt) {
//     if (!evt.target || !Tools.drawingArea.contains(evt.target)) {
//       if (transformEl) {
//         transformTool[0].disable();
//         Tools.send({type: "update", unSelectElement: transformEl.id}, "Cursor");
//         transformEl = null;
//         panel.classList.add('hide');
//       }
//       return;
//     }
//     if (transformEl && evt.target.id !== transformEl.id) {
//       transformTool[0].disable();
//       Tools.send({type: "update", unSelectElement: transformEl.id}, "Cursor");
//       transformEl = null;
//       panel.classList.add('hide');
//     }
//     if (transformEl === null && !evt.target.classList.contains('selectedEl')) {
//       selectElement(evt.target);
//     }
//   }
//
//   function actionsForEvent(evt) {
//     if (evt.keyCode === 46 || evt.keyCode === 8) { // Delete key
//       deleteElement();
//     } else if (evt.keyCode === 68 && evt.ctrlKey && transformEl) {
//       dublicateObject();
//     }
//   }
//
//   function deleteElement() {
//     Tools.drawAndSend({
//       "type": "delete",
//       "id": transformEl.id,
//       "sendBack": true,
//     }, Tools.list.Eraser);
//     Tools.change("Hand");
//     Tools.change("Transform");
//   }
//
//   function selectElement(el, offset) {
//     if (transformEl) {
//       transformTool[0].disable();
//     }
//     panel.classList.remove('hide');
//     transformEl = el;
//     proportionsEnabled = transformEl.tagName === 'image';
//     transformTool = subjx(el).drag({
//       container: Tools.svg,
//       snap: {
//         x: 1,
//         y: 1,
//         angle: 1
//       },
//       onInit: function () {
//         messageForUndo = createMessage();
//       },
//       onMove: createAndSendMessage,
//       onRotate: createAndSendMessage,
//       onResize: createAndSendMessage,
//       onDrop: function () {
//         if (transformEl) {
//           var msg = createMessage();
//           if (JSON.stringify(msg) !== JSON.stringify(messageForUndo)) {
//             Tools.addActionToHistory(messageForUndo);
//             setTimeout(function () {
//               messageForUndo = createMessage();
//             }, 100);
//             createAndSendMessage();
//           }
//         }
//       },
//     });
//     transformTool[0].options.proportions = proportionsEnabled;
//     if (offset) {
//       transformTool[0].exeDrag({dx: offset.dx, dy: offset.dy});
//       messageForUndo = createMessage();
//       Tools.drawAndSend(createMessage());
//     }
//     Tools.send({type: "update", selectElement: transformEl.id}, "Cursor");
//   }
//
//   function createAndSendMessage() {
//     if (performance.now() - lastSend > 20) {
//       lastSend = performance.now();
//       Tools.send(createMessage());
//     }
//   }
//
//   function createMessage() {
//     var msg = { type: "update", _children: [], id: transformEl.id, properties: [] };
//     for (var i = 0; i < propertiesForSend.length; i++) {
//       // if (transformEl.hasAttribute(propertiesForSend[i])) {
//       //   msg.properties.push([propertiesForSend[i], transformEl.getAttribute(propertiesForSend[i])]);
//       // }
//     }
//     return msg;
//   }
//
//   function onStart() {
//     document.addEventListener('keydown', enableProportions);
//     document.addEventListener('keyup', enableProportions);
//     document.addEventListener('keydown', actionsForEvent);
//     document.getElementById('object-delete').addEventListener('click', deleteElement);
//     document.getElementById('object-dublicate').addEventListener('click', dublicateObject);
//     sendingInverval = setInterval(sendInInterval, 1000);
//   }
//
//   function sendInInterval () {
//     if (transformEl && transformEl.id) Tools.send({type: "update", selectElement: transformEl.id}, "Cursor");
//   }
//
//   function enableProportions(evt) {
//     if (transformEl) transformTool[0].options.proportions = (evt.shiftKey || proportionsEnabled) && transformEl;
//   }
//
//   function dublicateObject() {
//     Tools.send({
//       "type": "dublicate",
//       "id": transformEl.id,
//     });
//   }
//
//   function onQuit() {
//     if (transformEl) {
//       transformTool[0].disable();
//       Tools.send({type: "update", unSelectElement: transformEl.id}, "Cursor");
//     }
//     document.removeEventListener('keydown', enableProportions);
//     document.removeEventListener('keyup', enableProportions);
//     document.removeEventListener('keydown', actionsForEvent);
//     document.getElementById('object-delete').removeEventListener('click', deleteElement);
//     panel.classList.add('hide');
//     clearInterval(sendingInverval);
//   }
//
//   function draw(data) {
//     switch (data.type) {
//       case "update":
//         const el = document.getElementById(data.id);
//         // for (var i = 0; i < data.properties.length; i++) {
//         //   el.setAttribute(data.properties[i][0] ,data.properties[i][1]);
//         // }
//         if (transformEl) transformTool[0].fitControlsToSize();
//         break;
//       default:
//         throw new Error("Mover: 'mover' instruction with unknown type. ", data);
//     }
//   }
//
//   function checkAndDisable(id) {
//     if (transformEl && transformEl.id === id) transformTool[0].disable();
//   }
//
//   Tools.add({ //The new tool
//     "name": "Transform",
//     "shortcut": "v",
//     "listeners": {
//       "press": press,
//     },
//     "selectElement": selectElement,
//     "checkAndDisable": checkAndDisable, // Проверить если элемент удалили, то прекратить выделение и убрать панель
//     "onstart": onStart,
//     "onquit": onQuit,
//     "draw": draw,
//     "mouseCursor": "move",
//     "showMarker": true,
//   });
// })();
