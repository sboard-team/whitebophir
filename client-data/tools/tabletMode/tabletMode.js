(function () {
    const mobileWindowEl = document.getElementById('mobileWindowRect');
    var resetTimeoutID = null;
    var lastTimeForScroll = performance.now();
    const message = {
      type: "update",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      userID: null,
    };
    if (Tools.isMobile()) {
        window.addEventListener('scroll', function () {
            if (performance.now() - lastTimeForScroll > 100) {
                createAndSendMessage();
                lastTimeForScroll = performance.now();
            };
        });

        setInterval(function () {
            createAndSendMessage();
        }, 500);
    }

    function resetMobileWindowEl() {
        mobileWindowEl.setAttribute('x', 0);
        mobileWindowEl.setAttribute('y', 0);
        mobileWindowEl.setAttribute('width', 0);
        mobileWindowEl.setAttribute('height', 0);
    }

    function createAndSendMessage() {
        const windowWidth = window.innerWidth / Tools.getScale();
        message.x = Math.max(document.documentElement.scrollLeft / Tools.getScale() >> 0, 5);
        message.y = Math.max(document.documentElement.scrollTop / Tools.getScale() >> 0, 5);
        message.width = (windowWidth > Tools.server_config.MAX_BOARD_SIZE_X ? Tools.server_config.MAX_BOARD_SIZE_X - 10 : windowWidth) >> 0;
        message.height = window.innerHeight / Tools.getScale() >> 0;
        message.userID = Tools.params.user.id;
        Tools.send(message, 'tabletMode');
    }

    function draw(data) {
        if (Tools.params && Tools.params.user && data.userID === Tools.params.user.id) {
            mobileWindowEl.setAttribute('x', data.x);
            mobileWindowEl.setAttribute('y', data.y);
            mobileWindowEl.setAttribute('width', data.width);
            mobileWindowEl.setAttribute('height', data.height);
            clearTimeout(resetTimeoutID);
            resetTimeoutID = setTimeout(resetMobileWindowEl, 3000);
        }
    }

    var cursorTool = {
        "name": "tabletMode",
        "draw": draw,
    };
    Tools.register(cursorTool);
})();
