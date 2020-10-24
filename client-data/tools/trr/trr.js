(function () {
  var moveable = null;
  var target = null;

  function checkElementIsDraw(element) {
    return (element.id !== 'gridContainer' && element !== Tools.svg && element !== Tools.drawingArea && Tools.drawingArea.contains(element));
  }

  function press(x, y, evt) {
    console.log(evt.target)
    if (evt.target.getAttribute('class') && evt.target.classList.contains('moveable-control') || evt.target.classList.contains('moveable-area')) return;
    if (checkElementIsDraw(evt.target)) {
      if (evt.target === target) {
        return;
      } else if ((evt.ctrlKey || evt.metaKey) && moveable !== null) {
        moveable.target = [...moveable.target, evt.target];
        moveable.padding = {"left": 0, "top": 0, "right": 0, "bottom": 0};
        moveable.pinchable = false;
        moveable.scalable = false;
        moveable.rotatable = false;
        target = evt.target;
        setTransformOrigin(target);
        return;
      } else {
        destroy();
      }
      target = evt.target;
      setTransformOrigin(target);
      moveable = new Moveable(Tools.board, {
        // If you want to use a group, set multiple targets(type: Array<HTMLElement | SVGElement>).
        target: [evt.target],
        defaultGroupOrigin: "50% 50%",
        container: Tools.board,
        dragArea: true,
        draggable: true,
        pinchable: false,
        scalable: true,
        rotatable: true,
        origin: true,
        keepRatio: true,
        pinchThreshold: 20,
        throttleRotate: 1,
        throttleDrag: 0,
        startDragRotate: 0,
        throttleDragRotate: 0,
        padding: {"left": 10, "top": 10, "right": 10, "bottom": 10},
      });
      console.log(evt.target.style.transform);
      moveable.on("drag", (data) => {
        target.style.transform = data.transform;
      }).on("dragGroup", ({events}) => {
        for (var ev of events) {
          ev.target.style.transform = ev.transform;
        }
      }).on("rotateGroupStart", data => {
        console.log(data)
      }).on("rotateGroup", ({ events }) => {
        events.forEach((ev, i) => {
          console.log(ev);
          ev.target.style.transform
            = `translate(${ev.drag.beforeTranslate[0]}px, ${ev.drag.beforeTranslate[1]}px)`
            + ` rotate(${ev.rotate}deg)`;
        });
      }).on("scaleGroup", (data) => {
        console.log(data);
        for (var ev of data.events) {
          ev.target.style.transform = ev.transform;
        }
      }).on("pinch", (data) => {
        target.style.transform = data.transform;
      }).on("scale", (data) => {
        target.style.transform = data.transform;
      }).on("rotate", (data) => {
        target.style.transform = data.transform;
      });
    } else {
      destroy();
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
    console.log('start');
  }

  function onQuit() {
    console.log('quit');
    destroy();
  }

  function draw(data) {
    console.log('draw ', data);
  }

  function updateRect() {
    if (moveable !== null) {
      moveable.updateRect();
    }
  }

  function destroy() {
    if (moveable !== null) {
      console.log('desctroy');
      moveable.destroy();
      moveable = null;
      target = null;
    }
  }

  function release() {
    console.log('release');
  }

  function move() {
    //console.log('move');
  }

  Tools.add({ //The new tool
    "name": "trr",
    "shortcut": "v",
    "listeners": {
      "press": press,
      "move": move,
      "release": release
    },
    "onstart": onStart,
    "onquit": onQuit,
    "draw": draw,
    "showMarker": true,
    "updateRect": updateRect,
  });
})();
