import * as htmlToImage from '../../js/html-to-image.js';

(function () { //Code isolation
  const xlinkNS = "http://www.w3.org/1999/xlink";
  const input = document.createElement("div");
  input.id = "formulaToolInput";
  var mathlive = null;
  var isEdit = false;
  var latexForEdit = '';

  const msg = {
    id: null,
    imageData: null,
    formulaData: null,
    x: null,
    y: null,
    width: null,
    height: null,
  };

  const curInput = {
    x: null,
    y: null,
  };

  var active = false;

  function onStart() {
    //onstart
  }

  async function renderPNG() {
    return htmlToImage.toPng(document.getElementById('formulaToolInput').querySelector('.ML__mathlive'), {
      backgroundColor: '#fff',
    });
  }

  function onQuit() {
    if (!mathlive.$latex()) return;
    if (!isEdit) {
      msg.id = Tools.generateUID();
      msg.x = curInput.x;
      msg.y = curInput.y;
    }
    msg.formulaData = mathlive.$latex();
    msg.width = document.getElementById('formulaToolInput').querySelector('.ML__mathlive').offsetWidth * 2 >> 0;
    msg.height = document.getElementById('formulaToolInput').querySelector('.ML__mathlive').offsetHeight * 2 >> 0;
    stopEdit();
    mathlive.$perform ( "hideVirtualKeyboard" );
    setTimeout(function () {
      renderPNG().then(function (data) {
        console.log(data);
        msg.imageData = data;
        Tools.drawAndSend(msg, Tools.list.Formula);
        mathlive.$perform ("deleteAll");
        latexForEdit = '';
        isEdit = false;
      });
    }, 150);
  }

  function clickHandler(x, y, evt, isTouchEvent) {
    if (evt.target === input) return;
    if (evt.target.hasAttribute('data-formula')) {
      console.log(true);
      isEdit = true;
      msg.id = evt.target.getAttribute('id');
      msg.x = evt.target.getAttribute('x');
      msg.y = evt.target.getAttribute('y');
      latexForEdit = evt.target.getAttribute('data-formula');
    }
    curInput.x = x;
    curInput.y = y;
    stopEdit();
    startEdit();
    evt.preventDefault();
  }

  function startEdit() {
    active = true;
    if (!input.parentNode) board.appendChild(input);
    var clientW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var x = curInput.x * Tools.scale - document.documentElement.scrollLeft;
    if (x + 250 > clientW) {
      x = Math.max(60, clientW - 260)
    }
    input.style.left = x + 'px';
    input.style.top = curInput.y * Tools.scale - document.documentElement.scrollTop + 20 + 'px';
    input.focus();
    if (mathlive === null) {
      mathlive = MathLive.makeMathField('formulaToolInput', {
        smartMode: true,
        virtualKeyboardMode: 'manual',
      });
    }
    mathlive.$latex(latexForEdit)
    mathlive.$perform ( "showVirtualKeyboard" );
  }

  function stopEdit() {
    try { input.blur(); } catch (e) { /* Internet Explorer */ }
    active = false;
    blur();
  }

  function blur() {
    if (active) return;
    input.style.top = '-1000px';
  }

  function draw(data) {
    const img = document.getElementById(data.id) || Tools.createSVGElement("image");
    img.id = data.id;
    img.setAttributeNS(xlinkNS, "href", data.imageData);
    img.x.baseVal.value = data['x'];
    img.y.baseVal.value = data['y'];
    img.setAttribute("width", data.width);
    img.setAttribute("height", data.height);
    img.setAttribute("data-formula", data.formulaData);
    if (msg.properties) {
      for (var i = 0; i < msg.properties.length; i++) {
        img.setAttribute(msg.properties[i][0], msg.properties[i][1]);
      }
    }
    Tools.drawingArea.appendChild(img);
  }

  Tools.add({ //The new tool
    "name": "Formula",
    "shortcut": "t",
    "listeners": {
      "press": clickHandler,
    },
    "onstart": onStart,
    "onquit": onQuit,
    "draw": draw,
    "mouseCursor": "text"
  });

})(); //End of code isolation
