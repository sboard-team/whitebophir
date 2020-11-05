(function documents() { //Code isolation
    var xlinkNS = "http://www.w3.org/1999/xlink";
    const fileTypes = ['jpeg', 'jpg', 'webp', 'png', 'ico', 'svg'];
    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    Tools.svg.addEventListener('dragenter', preventDefault, false);
    Tools.svg.addEventListener('dragleave', preventDefault, false);
    Tools.svg.addEventListener('dragover', preventDefault, false);
    Tools.svg.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        if (Tools.params.permissions.image) {
            const data = e.dataTransfer;
            const file = data.files[0];
            const fileType = file.name.split('.')[file.name.split('.').length - 1].toLowerCase();
            if (fileTypes.includes(fileType)) {
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = workWithImage;
            } else {
              createModal(Tools.modalWindows.wrongImageFormat);
            }
        } else {
          if (Tools.params.permissions.edit) {
            createModal(Tools.modalWindows.premiumFunctionForOwner);
          } else {
            createModal(Tools.modalWindows.premiumFunctionForDefaultUser);
          }
        }
        preventDefault(e);
    }

    function onstart() {
        if (Tools.params.permissions.image) {
            var fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.multiple = false;
            fileInput.click();
            fileInput.addEventListener("change", function () {
                var reader = new FileReader();
                reader.readAsDataURL(fileInput.files[0]);
                reader.onload = workWithImage;
            });
        } else {
          if (Tools.params.permissions.edit) {
            setTimeout(function () {
              createModal(Tools.modalWindows.premiumFunctionForOwner);
            }, 100);
          } else {
            setTimeout(function () {
              createModal(Tools.modalWindows.premiumFunctionForDefaultUser);
            }, 100);
          }
        }
    }

    function workWithImage(e) {
        // use canvas to compress image
        var image = new Image();
        image.src = e.target.result;
        image.onload = function () {
            var uid = Tools.generateUID("doc"); // doc for document

            var ctx, size;
            var scale = 1;

            do {
                // Todo give feedback of processing effort

                ctx = document.createElement("canvas").getContext("2d");
                ctx.canvas.width = image.width * scale;
                ctx.canvas.height = image.height * scale;
                ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
                var dataURL = ctx.canvas.toDataURL("image/png", 0.8);

                // Compressed file size as data url, approximately 1/3 larger than as bytestream
                size = dataURL.length;

                // attempt again with an image that is at least 10% smaller
                scale = scale * Math.sqrt(Math.min(
                    0.9,
                    Tools.server_config.MAX_DOCUMENT_SIZE / size
                ));
            } while (size > Tools.server_config.MAX_DOCUMENT_SIZE);

            var width = this.width * scale;
            var height = this.height * scale;
            const aspect = width / height;
            if (height > document.documentElement.clientHeight / 2 / Tools.scale) {
              height = document.documentElement.clientHeight / 2 / Tools.scale;
              width = height * aspect;
            }
            if (width > document.documentElement.clientWidth / 2 / Tools.scale) {
              width = document.documentElement.clientWidth / 2 / Tools.scale;
              height = width / aspect;
            }
            const offsetHeight = document.documentElement.scrollLeft === 0 ? -Tools.svg.getBoundingClientRect().left : document.documentElement.scrollLeft;
            var msg = {
                id: uid,
                type: "doc",
                data: dataURL,
                size: size,
                w: width,
                h: height,
                x: ((offsetHeight + document.documentElement.clientWidth / 2) / Tools.scale) - width / 2,
                y: ((document.documentElement.scrollTop + document.documentElement.clientHeight / 2) / Tools.scale) - height / 2,
                select: true,
                //fileType: fileInput.files[0].type
            };

            draw(msg);
            msg.select = false;
            Tools.send(msg,"Document");
        };
    };

    function draw(msg) {
        var img = Tools.createSVGElement("image");
        img.id=msg.id;
        img.setAttributeNS(xlinkNS, "href", msg.data);
        img.x.baseVal.value = msg['x'];
        img.y.baseVal.value = msg['y'];
        img.setAttribute("width", msg.w);
        img.setAttribute("height", msg.h);
        // if (msg.properties) {
        //     for (var i = 0; i < msg.properties.length; i++) {
        //         img.setAttribute(msg.properties[i][0], msg.properties[i][1]);
        //     }
        // }
        if (img.transform) {
	        img.style.transform = msg.transform;
	        img.style.transformOrigin = msg.transformOrigin;
        }
        Tools.drawingArea.appendChild(img);
        if (msg.select) {
            Tools.change("Transform", 1);
            Tools.list.Transform.selectElement(img);
        }
    }

    Tools.add({
        "name": "Document",
        "draw": draw,
        "onstart": onstart,
        "oneTouch":true,
        "workWithImage": workWithImage,
    });

})(); //End of code isolation
