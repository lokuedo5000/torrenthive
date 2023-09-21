// Verificar si es magnet
function isMagnet(url) {
    if (url.startsWith('magnet:?')) {
        const prefix = 'magnet:?xt=urn:btih:';
        const parts = url.split('&');

        for (const part of parts) {
            if (part.startsWith(prefix)) {
                const infoHash = part.slice(prefix.length);
                if (/^[0-9a-fA-F]{40}$/.test(infoHash)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Verificar ruta de archivo
function isFile(cadena) {
    // Utiliza una expresión regular para verificar si la cadena es una ruta de archivo
    const expresionRegular = /^[A-Za-z]:\\[^*|"<>?\n]*$/;

    return expresionRegular.test(cadena);
}

function _ajax(url, method, data) {
    return new Promise((resolve, reject) => {
        kit.send({
            url: url,
            method: method,
            data,
            success: (respuesta) => {
                resolve(respuesta);
            },
            error: (codigo, respuesta) => {
                reject({ codigo, respuesta });
            }
        });
    });
}

function actionInput(e, action) {
    const uri = isMagnet(e.value);
    if (uri) {
        kit.checkAndRemoveClasses('.action-send', ["icon-send_and_archive", "icon-dots-three-vertical", "download-x-file", "search-file"], (evn, classRemoved) => {
            if (classRemoved) {
                evn.classList.add("icon-download4", "download-x-magnet");
            }
        });
        if (action == "click") {
            const btn = kit.qsSelector(false, ".action-send");
            btn.click();
        }
        return
    }

    const file = isFile(e.value);
    if (file) {
        kit.checkAndRemoveClasses('.action-send', ["icon-dots-three-vertical", "icon-download4", "download-x-magnet", "search-file"], (evn, classRemoved) => {
            if (classRemoved) {
                evn.classList.add("icon-send_and_archive", "download-x-file");
            }
        });
        if (action == "click") {
            const btn = kit.qsSelector(false, ".action-send");
            btn.click();
        }
        return
    }

    kit.checkAndRemoveClasses('.action-send', ["icon-send_and_archive", "icon-download4", "download-x-magnet", "download-x-file"], (evn, classRemoved) => {
        if (classRemoved) {
            evn.classList.add("icon-dots-three-vertical", "search-file");
        }
    });


}

async function newDownload() {
    kit.show(".loading-magnet", 300, "flex");

    const hash = kit.qsSelector(false, ".text-infohash-torrent");
    const peso = kit.qsSelector(false, ".text-peso-torrent");
    const input = kit.qsSelector(false, ".magnet-uri");
    const resp = await _ajax("/new-download", "POST", {
        hash: hash.innerText,
        magnet: input.value,
        peso: peso.getAttribute("data-peso")
    });

    console.log(resp);

    if (resp == false) {
        kit.hide(".loading-magnet", 300);
        kit.show(".badge-alert", 300, "inline-block");
    } else {
        kit.hide(".loading-magnet", 300);
        kit.modal('materialize', "#modal1", "close");
    }

}

async function getInfoTorrent(type) {
    const value = kit.qsSelector(false, "#file-or-magnet");

    if (type == "magnet") {
        kit.show(".loading-magnet", 300, "flex");
    }

    const resp = await _ajax("/torrent-info", "POST", {
        torrent: value.value,
        type
    });


    let resultado = resp;


    if (resultado) {
        // Name
        kit.qsSelector(false, ".text-name-torrent").innerHTML = resultado.name;

        // infoHash
        kit.qsSelector(false, ".text-infohash-torrent").innerHTML = resultado.infoHash;

        // Peso
        const pesoTorrent = kit.qsSelector(false, ".text-peso-torrent");
        pesoTorrent.innerHTML = kit.getSizeBytes(resultado.length);
        pesoTorrent.setAttribute("data-peso", resultado.length)
        // Magnet
        kit.qsSelector(false, ".magnet-uri").value = decodeURIComponent(resultado.magnet);


        const itemsPerPage = 5;


        const customTemplate = item => {
            const listItem = document.createElement("div");
            listItem.classList.add("row", "m0", "py-1", "row-bg", "blue-grey", "lighten-5");

            listItem.innerHTML += `<div class="col s4 p0">
                                      <div class="view-art">
                                       ${item.name}
                                      </div>
                                  </div>
                                  <div class="col s4 p0">
                                      <div class="view-art">
                                      ${item.path}
                                      </div>
                                  </div>
                                  <div class="col s4 p0">
                                      <div class="view-art view-size">
                                      ${kit.getSizeBytes(item.length)}
                                      </div>
                                  </div>`;


            return listItem;
        };

        const pagination = new Pagination(resultado.files, itemsPerPage, "pagination", "art-files-torrent", customTemplate);
        pagination.update();

        kit.modal('materialize', "#modal1");
        // value.value = "";
        actionInput(value);

        if (type == "magnet") {
            kit.hide(".loading-magnet", 300);
        }
    } else {
        if (type == "magnet") {
            kit.hide(".loading-magnet", 300);
        }
        kit.show(".badge-alert", 300, "inline-block");
    }
}

function handleDrop(evn) {
    evn.preventDefault();
    const files = Array.from(evn.dataTransfer.files);
    console.log(files);
}
function handleDragOver(event) {
    event.preventDefault();

}

function handleDragLeave(event) {

}
kit.onDOMReady(async () => {

    // obtener datos del sistema
    const resp = await _ajax("/system/disks", "GET", {});

    if (resp) {
        let dataResp = resp;
        for (let a = 0; a < dataResp.length; a++) {
            const elm = dataResp[a];

            kit.qsSelector(false, ".disk-row", (evn) => {
                evn.innerHTML += `<div class="disk-sy">
                                    <div class="disk-body z-depth-1">
                                    <div class="icono-disk z-depth-1 icon-drive1"></div>
                                    <div class="info-disk">
                                        <div class="info-disk-all">
                                        <div class="title-disk">Unidad (${elm.fs})</div>
                                        <div class="progress blue-grey lighten-5">
                                            <div class="determinate ${(elm.use > 80 ? "red" : "purple ")}" style="width: ${elm.use}%"></div>
                                        </div>
                                        <div class="title-disp-disk">
                                        ${kit.getSizeBytes(elm.available)} available / ${kit.getSizeBytes(elm.size)}
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>`
            });

        }
    }
    if (!resp || resp) {
        setTimeout(() => {
            kit.qsSelector(false, ".loading-page", (evn) => {
                kit.hide(evn, 300);
                evn.querySelector(".active-loading").classList.remove("active");
            });
        }, 1000);
    }
    // const resp = await _ajax("/prueba", "GET", {file: "files"});

    // Menu Left
    kit.addEvent('.open-menu-left', 'click', (e) => {

        kit.qsSelector(false, e.target.dataset.menu, (e) => {
            const veryClass = kit.hasClass(".menu-left", "menu-left-active");

            if (!veryClass) {
                e.style.left = 0;
                e.classList.add("menu-left-active");
            } else {
                e.style.left = -e.offsetWidth + "px";
                e.classList.remove("menu-left-active");
            }

        });

    });

    kit.addEvent('.menu-left', 'click', (e) => {
        const menu = e.currentTarget;

        // Obtén las dimensiones del menú, incluyendo márgenes y relleno
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;

        // Obtén la posición del menú en la página
        const menuRect = menu.getBoundingClientRect();

        // Coordenadas del clic relativas al menú
        const clickX = e.clientX - menuRect.left;
        const clickY = e.clientY - menuRect.top;

        // Verifica si el clic está dentro del menú
        if (clickX >= 0 && clickX <= menuWidth && clickY >= 0 && clickY <= menuHeight) {
        } else {
            menu.classList.remove('menu-left-active');
            menu.style.left = -menuWidth + "px";
        }
    });

    kit.onElementChange('#file-or-magnet', (e) => {

        actionInput(e);

    });

    kit.onClick('download-x-magnet', async (e) => {
        await getInfoTorrent("magnet");
    });

    kit.onClick('download-x-file', async (e) => {

        await getInfoTorrent("file");

    });

    kit.onClick('search-file', async (e) => {
        const resp = await _ajax("/open-file", "POST", {});

        kit.qsSelector(false, "#file-or-magnet", (e) => {
            e.value = resp;
            actionInput(e);
        });

    });

    kit.onKeyPress('#file-or-magnet', 'Enter', (e) => {
        e.preventDefault();
        if (e.target.value.length < 1 && !/\S/.test(e.target.value)) {
            return;
        }
        const uri = isMagnet(e.target.value);
        if (uri) {
            return
        }

        const file = isFile(e.target.value);
        if (file) {

        }
    });



    kit.fileDropZone("#dropzone", (files) => {
        const filesArray = Array.from(files);
        if (filesArray.length == 1) {
            let { path } = filesArray[0];

            if (kit.extname(path) == ".torrent") {
                kit.qsSelector(false, "#file-or-magnet", (event) => {
                    event.value = path;
                    actionInput(event, "click");

                });
            } else {
                M.toast({ html: 'Extension not allowed' });
            }

        }
    });


    kit.existsElm(".downloads-list", async (elementDownload) => {
        let resp = await _ajax("/get-info-downloads", "POST", {
            action: "hashs"
        });


        if (resp.length > 0) {
            for (const elm of resp) {
                kit.createInterval(`id_${elm}`, async () => {
                    let resp = await _ajax("/get-info-downloads", "POST", {
                        action: "downloads",
                        hash: elm
                    });
                    if (resp) {

                        const temple = `<div class="torrent-download-container z-depth-1" id="id_${elm}">
                                            <div class="name-download-torrent">${resp.name}</div>
                                            <div class="magnet-download-torrent magnet_${elm}">${resp.magnet}</div>
                            
                                            <div class="progress-download">
                                            <div class="progress m0 blue-grey lighten-5">
                                                <div class="determinate purple progress_${elm}" style="width: ${resp.progress}%"></div>
                                            </div>
                                            </div>
                                            <div class="info-download-torrent">
                                                <span class="icon-arrow-down-thick"></span>
                                                <span class="downloadSpeed_${elm}">0 B/s</span>
                                                <span class="sprt-gui">|</span>
                                                <span class="downloaded_length_${elm}">Descargado: 0 B / 0 B</span>
                                            </div>
                            
                                            <div class="btn-download-torrent">
                                                <button class="waves-effect waves-light btn-small purple btn-action-download" data-action="stop" data-hash="${elm}">Cancelar</button>
                                                <button class="waves-effect waves-light btn-small purple btn-action-download action-pause-continue_${elm}" data-action="${resp.paused === false ? "pause" : "continue"}" data-hash="${elm}">
                                                    ${resp.paused === false ? "Pausar" : "Reanudar"}
                                                </button>
                                            </div>
                                        </div>`

                        const veryElement = elementDownload.querySelector(`#id_${elm}`);
                        if (!veryElement) {
                            elementDownload.innerHTML += temple;
                        } else {

                            const prss = veryElement.querySelector(`.progress_${elm}`);
                            prss.style.width = `${resp.progress}%`;

                            const downloadSpeed = veryElement.querySelector(`.downloadSpeed_${elm}`);
                            downloadSpeed.textContent = `${kit.getSizeBytes(resp.downloadSpeed)}/s`;

                            const downloaded_length = veryElement.querySelector(`.downloaded_length_${elm}`);
                            downloaded_length.textContent = `Descargado: ${kit.getSizeBytes(resp.downloaded)} / ${kit.getSizeBytes(resp.length)}`;

                            const action_download = veryElement.querySelector(`.action-pause-continue_${elm}`);
                            const textData = resp.paused ? "continue" : "pause";

                            if (action_download.getAttribute("data-action") !== textData) {
                                action_download.setAttribute("data-action", textData);
                                action_download.textContent = resp.paused ? "Reanudar" : "Pausar";
                            }

                        }

                    }
                }, (resp.length === 1 ? 1000 : 1000 * resp.length));
            }

        }

        kit.onClick('btn-action-download', async (e) => {

            await _ajax("/action-download", "POST", {
                action: e.target.getAttribute("data-action"),
                hash: e.target.getAttribute("data-hash"),
                magnet: kit.qsSelector(false, `.magnet_${e.target.getAttribute("data-hash")}`).innerText,
            });

            if (e.target.getAttribute("data-action") == "stop") {
                kit.hide(`#id_${e.target.getAttribute("data-hash")}`, 300);
                kit.removeInterval(`id_${e.target.getAttribute("data-hash")}`);
            }

        });

    });

});




