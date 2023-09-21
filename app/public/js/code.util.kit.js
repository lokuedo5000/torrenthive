class CodeUtilKit {
    constructor() {
        this.intervals = {}
    }



    qsSelector(type = false, elmOrSelector, callback) {
        if (!type) {
            const element = elmOrSelector instanceof Element ? elmOrSelector : document.querySelector(elmOrSelector);
            if (element !== null && typeof callback === 'function') {
                callback(element);
            }
            return element === null ? null : element;
        }

        if (type === "all") {
            const elements = elmOrSelector instanceof NodeList ? elmOrSelector : document.querySelectorAll(elmOrSelector);
            if (elements.length > 0 && typeof callback === 'function') {
                callback(elements);
            }
            return elements;
        }
    }

    // Atajo para ejecutar una acción cuando se presiona una tecla en un campo de texto
    onKeyPress(elm, key, callback) {
        const element = document.querySelector(elm);
        if (element) {
            element.addEventListener('keydown', (event) => {
                if (event.key === key) {
                    callback(event);
                }
            });
        }
    }

    // Atajo para detectar cambios en elementos de un formulario con un selector específico
    onElementChange(selector, callback) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
            element.addEventListener('input', (event) => {
                callback(element);
            });
        });
    }

    // Método para verificar si una clase existe en un elemento
    hasClass(elm, className) {
        const element = document.querySelector(elm);
        if (element) {
            return element.classList.contains(className);
        }
        return false;
    }

    // Atajo para agregar una clase a un elemento
    addClass(elm, className) {
        const element = document.querySelector(elm);
        if (element) {
            element.classList.add(className);
        }
    }

    // Atajo para eliminar una clase de un elemento
    removeClass(elm, className) {
        const element = document.querySelector(elm);
        if (element) {
            element.classList.remove(className);
        }
    }

    // Atajo para alternar una clase en un elemento
    toggleClass(elm, className) {
        const element = document.querySelector(elm);
        if (element) {
            element.classList.toggle(className);
        }
    }

    // Atajo para agregar un evento a un elemento
    addEvent(elm, eventName, callback) {
        const element = document.querySelector(elm);
        if (element) {
            element.addEventListener(eventName, callback);
        }
    }

    // Atajo para escuchar eventos de clic en elementos con una clase específica
    onClick(className, callback) {
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains(className)) {
                callback(event);
            }
        });
    }

    // Atajo para eliminar un evento de un elemento
    removeEvent(elm, eventName, callback) {
        const element = document.querySelector(elm);
        if (element) {
            element.removeEventListener(eventName, callback);
        }
    }

    // Atajo para obtener o establecer el contenido de un elemento
    textContent(elm, content) {
        const element = document.querySelector(elm);
        if (element) {
            if (content !== undefined) {
                element.textContent = content;
            } else {
                return element.textContent;
            }
        }
    }

    // Atajo para ocultar un elemento
    hide(elmOrElement, duration) {
        const element = elmOrElement instanceof Element ? elmOrElement : document.querySelector(elmOrElement);
        if (element) {
            element.style.opacity = 1;
            let opacity = 1;

            function animate() {
                opacity -= 1 / (duration / 16); // Ajusta la velocidad de la transición
                element.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = "none";
                }
            }

            animate();
        }
    }

    // Atajo para mostrar un elemento
    show(elmOrElement, duration, type = null) {
        const element = elmOrElement instanceof Element ? elmOrElement : document.querySelector(elmOrElement);
        if (element) {
            element.style.display = type === null ? "block" : type;
            element.style.opacity = 0;
            let opacity = 0;

            function animate() {
                opacity += 1 / (duration / 16); // Ajusta la velocidad de la transición
                element.style.opacity = opacity;

                if (opacity < 1) {
                    requestAnimationFrame(animate);
                }
            }

            animate();
        }
    }

    // Función para verificar y opcionalmente eliminar clases en un elemento con opción de callback
    checkAndRemoveClasses(selector, classesToRemove, callback) {
        const element = document.querySelector(selector);
        if (!element) {
            return false; // El elemento no se encontró
        }

        const elementClasses = element.classList;
        let classRemoved = false;

        for (const classToRemove of classesToRemove) {
            if (elementClasses.contains(classToRemove)) {
                elementClasses.remove(classToRemove);
                classRemoved = true;
            }
        }

        if (typeof callback === 'function') {
            callback(element, classRemoved);
        }

        return classRemoved;
    }

    log(...ms) {
        console.log(...ms);
    }

    send({
        url,
        method = 'GET',
        data = null,
        headers = {},
        success = () => { },
        error = () => { },
        complete = () => { },
    }) {
        const xhr = new XMLHttpRequest();

        xhr.open(method, url, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                complete(xhr.status, xhr.responseText);

                if (xhr.status >= 200 && xhr.status < 300) {
                    let parsedResponse = null;
                    try {
                        // Verificar si la respuesta es un JSON válido
                        if (/^[\],:{}\s]*$/.test(xhr.responseText.replace(/\\["\\\/bfnrtu]/g, '@').
                            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                            parsedResponse = JSON.parse(xhr.responseText);
                        } else if (xhr.responseText === 'true') {
                            parsedResponse = true;
                        } else if (xhr.responseText === 'false') {
                            parsedResponse = false;
                        } else {
                            parsedResponse = xhr.responseText;
                        }
                    } catch (e) {
                        // Si no se puede analizar como JSON, intenta convertirla en booleano
                        if (xhr.responseText === 'true') {
                            parsedResponse = true;
                        } else if (xhr.responseText === 'false') {
                            parsedResponse = false;
                        } else {
                            // Si no es ni JSON válido ni booleano, deja la respuesta como texto
                            parsedResponse = xhr.responseText;
                        }
                    }
                    success(parsedResponse, xhr.status);
                } else {
                    error(xhr.status, xhr.responseText);
                }
            }
        };

        xhr.onerror = function () {
            error(xhr.status, xhr.responseText);
        };

        // Configura encabezados personalizados
        for (const [header, value] of Object.entries(headers)) {
            xhr.setRequestHeader(header, value);
        }

        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            // Configura el encabezado Content-Type para las solicitudes con datos
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    }

    getSizeBytes(bytes, tofixed = null) {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let size = bytes;
        let unit = "B";

        for (let i = 0; i < units.length; i++) {
            if (size < 1024) {
                unit = units[i];
                break;
            }
            size /= 1024;
            size = Number(size).toFixed(tofixed === null ? 0 : tofixed);
        }
        return size + " " + unit;
    }

    async copyToClipboard(selector) {
        const element = document.querySelector(selector);
        if (element) {
            const textToCopy = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.value : element.textContent;

            try {
                await navigator.clipboard.writeText(textToCopy);
                if (M.toast) {
                    M.toast({ html: 'Texto copiado al portapapeles' });
                }

            } catch (error) {
                if (M.toast) {
                    M.toast({ html: 'Error al copiar el texto' });
                } else {
                    console.log(error);
                }
            }
        }

    }

    modal(type, selector, action = "open") {
        const modal = document.querySelector(selector);
        if (!modal) {
            console.error('El selector del modal no se encontró en el documento.');
            return;
        }

        if (type === 'bootstrap') {
            // Para Bootstrap: Utiliza jQuery para abrir el modal
            if (typeof $ !== 'undefined') {
                $(modal).modal('show');
            } else {
                console.error('Bootstrap modal requiere jQuery. Asegúrate de cargar jQuery.');
            }
        } else if (type === 'materialize') {
            // Para MaterializeCSS: Utiliza JavaScript para abrir el modal
            if (typeof M !== 'undefined' && M.Modal) {
                const instance = M.Modal.getInstance(modal);
                if (instance) {
                    if (action == "open") {
                        instance.open();
                    } else if (action == "close") {
                        instance.close();
                    }

                } else {
                    M.Modal.init(modal).open();
                }
            } else {
                console.error('MaterializeCSS modal requiere la biblioteca Materialize. Asegúrate de cargar Materialize.');
            }
        } else {
            console.error('Tipo de modal no válido. Debes especificar "bootstrap" o "materialize".');
        }
    }

    fileDropZone(selector, onFilesDropped) {
        const dropZoneElement = document.querySelector(selector);

        if (!dropZoneElement) {
            return;
        }

        dropZoneElement.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropZoneElement.classList.add('drag-over');
        });

        dropZoneElement.addEventListener('dragleave', () => {
            dropZoneElement.classList.remove('drag-over');
        });

        dropZoneElement.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZoneElement.classList.remove('drag-over');

            const files = event.dataTransfer.files;
            if (typeof onFilesDropped === 'function') {
                onFilesDropped(files);
            }
        });
    }

    dirname(pathOrUrl) {
        pathOrUrl = pathOrUrl.trim();

        // Verificar si es una ruta de archivo de Windows
        const isWindowsPath = /^[A-Za-z]:\\[^*|"<>?\n]*$/;
        if (isWindowsPath.test(pathOrUrl)) {
            const createArray = pathOrUrl.split("\\");
            return createArray[createArray.length - 1];
        }

        // Verificar si es una URL
        const isUrl = /^(ftp|http|https):\/\/[^ "]+$/;
        if (isUrl.test(pathOrUrl)) {
            const url = new URL(pathOrUrl);
            return url.pathname.split('/').pop();
        }

        // Verificar si es una ruta personalizada
        const isCustomPath = /^\/[^*|"<>?\n]*$/;
        if (isCustomPath.test(pathOrUrl)) {
            const segments = pathOrUrl.split('/');
            return segments[segments.length - 1];
        }

        return '';
    }

    extname(fileName) {
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex !== -1 && dotIndex < fileName.length - 1) {
            return '.' + fileName.substring(dotIndex + 1);
        }
        return '';
    }

    existsElm(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            if (typeof callback === 'function') {
                callback(element);
            }
        }
    }

    createInterval(name, callback, intervalTime) {
        if (this.intervals[name] == undefined) {
            const interval = setInterval(callback, intervalTime);
            this.intervals[name] = interval;
            return interval;
        }
    }

    pauseInterval(name) {
        const interval = this.intervals[name];
        if (interval) {
            clearInterval(interval);
        }
    }

    removeInterval(name) {
        const interval = this.intervals[name];
        if (interval) {
            this.pauseInterval(name);
            delete this.intervals[name];
        }
    }

    // Atajo para ejecutar código cuando el DOM esté completamente cargado
    onDOMReady(callback) {
        document.addEventListener('DOMContentLoaded', () => {
            callback();
        });
    }
}

const kit = new CodeUtilKit();