import * as htmlToImage from '../../js/html-to-image.js';

(function () { //Code isolation
  const xlinkNS = "http://www.w3.org/1999/xlink";
  const input = document.createElement("div");
  input.id = "formulaToolInput";
  var mathlive = null;
  var isEdit = false;
  var latexForEdit = '';
  var indexForIntervalScrolling = 0;
  var scrollInterval = null;

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
      backgroundColor: 'transparent',
    });
  }

  function onQuit() {
    if (mathlive === null) return;
    if (!isEdit) {
      msg.id = Tools.generateUID();
      msg.x = curInput.x;
      msg.y = curInput.y - 15;
    }
    msg.formulaData = mathlive.$latex();
    msg.width = Math.ceil(document.getElementById('formulaToolInput').querySelector('.ML__mathlive').scrollWidth) * 2;
    msg.height = Math.ceil(document.getElementById('formulaToolInput').querySelector('.ML__mathlive').scrollHeight) * 2;
    stopEdit();
    mathlive.$perform ( "hideVirtualKeyboard" );
    mathlive.$blur();
    if (!mathlive.$latex()) {
      mathlive.$perform ("deleteAll");
      latexForEdit = '';
      isEdit = false;
      return;
    };
    setTimeout(function () {
      renderPNG().then(function (data) {
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
    var x = curInput.x * Tools.scale - Tools.board.scrollLeft;
    input.style.left = x + 'px';
    input.style.top = curInput.y * Tools.scale - 41 < 0 ? 0 : curInput.y * Tools.scale - 41 + 'px';
    input.focus();
    if (mathlive === null) {
      mathlive = MathLive.makeMathField('formulaToolInput', {
        smartMode: true,
        virtualKeyboardMode: 'manual',
        onKeystroke: function (field, key, evt) {
          if (evt.key === 'Enter') createFormula();
          return true;
        }
      });
      setTimeout(function () {
        document.querySelector('.ML__keyboard .rows ul:last-child li:last-child').addEventListener('pointerdown', createFormula);
      }, 200);
    }
    mathlive.$latex(latexForEdit);
    mathlive.$focus();
    mathlive.$perform ( "showVirtualKeyboard" );
    mathlive.$perform("moveToMathFieldEnd");
    scrollInterval = setInterval(function () {
      const diffYKeyboardAndInput = document.querySelector('.ML__keyboard').getBoundingClientRect().y - document.getElementById('formulaToolInput').getBoundingClientRect().y;
      if (diffYKeyboardAndInput < 85) {
        window.scrollTo(window.pageXOffset, window.pageYOffset + (85 - diffYKeyboardAndInput));
      }
      if (indexForIntervalScrolling++ === 15) {
        clearInterval(scrollInterval);
        indexForIntervalScrolling = 0;
      }
    }, 30);
  }

  function stopEdit() {
    try { input.blur(); } catch (e) { /* Internet Explorer */ }
    active = false;
    blur();
  }

  function createFormula() {
    Tools.change('Hand');
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
    // if (msg.properties) {
    //   for (var i = 0; i < msg.properties.length; i++) {
    //     img.setAttribute(msg.properties[i][0], msg.properties[i][1]);
    //   }
    // }
    if (data.transform) {
	    img.style.transform = data.transform;
	    img.style.transformOrigin = data.transformOrigin;
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
