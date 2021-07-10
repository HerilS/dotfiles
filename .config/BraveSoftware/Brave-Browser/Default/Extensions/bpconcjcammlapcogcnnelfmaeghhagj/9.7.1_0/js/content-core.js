if (!window.nimbus_core) {

    // let inboundStream = null;

    // const pc = new RTCPeerConnection(null);
    // console.log('RTCPeerConnection', pc)
    // pc.onaddstream = function (e) {
    //     console.log(e);
    // };
    //
    // pc.ontrack = function (e) {
    //     console.log(e);

    // if (ev.streams && ev.streams[0]) {
    //     // videoElem.srcObject = ev.streams[0];
    // } else {
    //     if (!inboundStream) {
    //         inboundStream = new MediaStream();
    //         // videoElem.srcObject = inboundStream;
    //     }
    //     inboundStream.addTrack(ev.track);
    // }
    // };

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    window.nimbus_core = {};

    window.nimbus_core.is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
    window.nimbus_core.is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) && !/OPR/.test(navigator.userAgent);
    window.nimbus_core.is_opera = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) && /OPR/.test(navigator.userAgent);
    window.nimbus_core.is_edge = ['Edge'].indexOf(navigator.platform) !== -1;
    window.nimbus_core.is_chrome_os = /CrOS/.test(navigator.userAgent);
    window.nimbus_core.is_macintosh = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].indexOf(navigator.platform) !== -1;
    window.nimbus_core.is_windows = ['Win32', 'Win64', 'Windows', 'WinCE'].indexOf(navigator.platform) !== -1;
    window.nimbus_core.is_linux = (!window.nimbus_core.is_chrome_os || !window.nimbus_core.is_macintosh) && navigator.platform.indexOf('Linux') !== -1;
    window.nimbus_core.path = 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/persistent/';
    window.nimbus_core.language = navigator.browserLanguage || navigator.language || navigator.userLanguage;
    window.nimbus_core.language = navigator.browserLanguage || navigator.language || navigator.userLanguage;

    window.nimbus_core.is_app = false;

// https://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality
    window.nimbus_core.downScaleCanvas = function (cv, scale) {
        if (!(scale < 1) || !(scale > 0)) return cv;
        let sqScale = scale * scale; // square scale = area of source pixel within target
        let sw = cv.width; // source image width
        let sh = cv.height; // source image height
        let tw = Math.floor(sw * scale); // target image width
        let th = Math.floor(sh * scale); // target image height
        let sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
        let tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
        let tX = 0, tY = 0; // rounded tx, ty
        let w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
        // weight is weight of current source point within target.
        // next weight is weight of current source point within next target's point.
        let crossX = false; // does scaled px cross its current px right border ?
        let crossY = false; // does scaled px cross its current px bottom border ?
        let sBuffer = cv.getContext('2d').getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
        let tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
        let sR = 0, sG = 0, sB = 0; // source's current point r,g,b

        for (sy = 0; sy < sh; sy++) {
            ty = sy * scale; // y src position within target
            tY = 0 | ty;     // rounded : target pixel's y
            yIndex = 3 * tY * tw;  // line index within target array
            crossY = (tY !== (0 | (ty + scale)));
            if (crossY) { // if pixel is crossing botton target pixel
                wy = (tY + 1 - ty); // weight of point within target pixel
                nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
            }
            for (sx = 0; sx < sw; sx++, sIndex += 4) {
                tx = sx * scale; // x src position within target
                tX = 0 | tx;    // rounded : target pixel's x
                tIndex = yIndex + tX * 3; // target pixel index within target array
                crossX = (tX !== (0 | (tx + scale)));
                if (crossX) { // if pixel is crossing target pixel's right
                    wx = (tX + 1 - tx); // weight of point within target pixel
                    nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
                }
                sR = sBuffer[sIndex];   // retrieving r,g,b for curr src px.
                sG = sBuffer[sIndex + 1];
                sB = sBuffer[sIndex + 2];
                if (!crossX && !crossY) { // pixel does not cross
                    // just add components weighted by squared scale.
                    tBuffer[tIndex] += sR * sqScale;
                    tBuffer[tIndex + 1] += sG * sqScale;
                    tBuffer[tIndex + 2] += sB * sqScale;
                } else if (crossX && !crossY) { // cross on X only
                    w = wx * scale;
                    // add weighted component for current px
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tX+1) px
                    nw = nwx * scale
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                } else if (!crossX && crossY) { // cross on Y only
                    w = wy * scale;
                    // add weighted component for current px
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tY+1) px
                    nw = nwy * scale
                    tBuffer[tIndex + 3 * tw] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                } else { // crosses both x and y : four target points involved
                    // add weighted component for current px
                    w = wx * wy;
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // for tX + 1; tY px
                    nw = nwx * wy;
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                    // for tX ; tY + 1 px
                    nw = wx * nwy;
                    tBuffer[tIndex + 3 * tw] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                    // for tX + 1 ; tY +1 px
                    nw = nwx * nwy;
                    tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 5] += sB * nw;
                }
            } // end for sx
        } // end for sy

        // create result canvas
        let resCV = document.createElement('canvas');
        resCV.width = tw;
        resCV.height = th;
        let resCtx = resCV.getContext('2d');
        let imgRes = resCtx.getImageData(0, 0, tw, th);
        let tByteBuffer = imgRes.data;
        // convert float32 array into a UInt8Clamped Array
        let pxIndex = 0; //
        for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
            tByteBuffer[tIndex] = 0 | (tBuffer[sIndex]);
            tByteBuffer[tIndex + 1] = 0 | (tBuffer[sIndex + 1]);
            tByteBuffer[tIndex + 2] = 0 | (tBuffer[sIndex + 2]);
            tByteBuffer[tIndex + 3] = 255;
        }
        // writing result to canvas.
        resCtx.putImageData(imgRes, 0, 0);
        return resCV;
    };
    window.nimbus_core.scaleCanvas = function (canvas) { // nimbus_screenshot
        if (localStorage.imageOriginalResolution === 'true') {
            if (window.is_chrome) canvas = window.nimbus_core.downScaleCanvas(canvas, 1 / window.devicePixelRatio);
        } else {
            if (window.is_firefox) canvas = window.nimbus_core.downScaleCanvas(canvas, window.devicePixelRatio);
        }
        return canvas;
    };
    window.nimbus_core.getLocationParam = function () {
        const p = window.location.href.match(/\?(\w+)$/);
        return (p && p[1]) || '';
    };
    window.nimbus_core.fileToBlob = function (url, cb) {
        function errorHandler(e) {
            console.error(e);
        }

        window.requestFileSystem(window.PERSISTENT, 10 * 1024 * 1024 * 1024, function (fs) {
            fs.root.getFile(url.replace(window.nimbus_core.path, ''), {}, function (fileEntry) {
                fileEntry.file(function (file) {
                    let reader = new FileReader();
                    reader.onloadend = function (e) {
                        cb(new Blob([new Uint8Array(reader.result)]));
                    };
                    reader.readAsArrayBuffer(file);
                }, errorHandler);
            });
        }, errorHandler);
    };
    window.nimbus_core.urlToBlob = function (url, cb) {
        function errorHandler(e) {
            console.error(e);
        }

        window.requestFileSystem(window.PERSISTENT, 10 * 1024 * 1024 * 1024, function (fs) {
            fs.root.getFile(url, {}, function (fileEntry) {
                fileEntry.file(function (file) {
                    let reader = new FileReader();
                    reader.onloadend = function (e) {
                        cb && cb(new Blob([new Uint8Array(reader.result)]));
                    };
                    reader.readAsArrayBuffer(file);
                }, errorHandler);
            });
        }, errorHandler);
    };
    window.nimbus_core.saveFile = function (name, blob, cb) {
        window.requestFileSystem(window.PERSISTENT, 10 * 1024 * 1024 * 1024, function (fs) {
                let truncated = false;
                fs.root.getFile(name, {create: true}, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        writer.onwriteend = function () {
                            if (!truncated) {
                                truncated = true;
                                this.truncate(this.position);
                                return;
                            }
                            cb && cb();
                        };

                        writer.onerror = console.error;
                        writer.write(blob);
                    }, console.error);
                }, console.error);
            }, console.error
        );
    };
    window.nimbus_core.dataUrlToBlob = function (dataURL) {
        let arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], {type: mime});
    };
    window.nimbus_core.blobToDataURL = function (blob, cb) {
        let a = new FileReader();
        a.onload = function (e) {
            cb && cb(e.target.result);
        };
        a.readAsDataURL(blob);
    };
    window.nimbus_core.checkDifferent = function (arr) {
        for (let i = 0, l = arr.length; i < l - 1; i++) {
            for (let j = i + 1; j < l; j++) {
                if (arr[i] === arr[j] && +arr[i] !== 0) {
                    return false;
                }
            }
        }
        return true;
    };
    window.nimbus_core.dataUrlToArrayBuffer = function (dataURL, cb) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", dataURL, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
            cb && cb(this.response)
        };
        xhr.send();
    };
    window.nimbus_core.blobUrlToBlob = function (dataURL, cb) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", dataURL, true);
        xhr.responseType = "arraybuffer";
        // xhr.responseType = "blob";
        xhr.onload = function () {
            if (this.status === 200) {
                // cb && cb(this.response);
                cb && cb(new Blob([new Uint8Array(this.response)]));
            }
        };
        xhr.onerror = function (err) {
            console.error("Error", err);

            window.nimbus_core.blobUrlToBlob(dataURL, cb)
        };
        xhr.send();
    };
    window.nimbus_core.dataURLtoBlob = function (dataURL) {
        // console.log(dataURL)
        let arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type: mime});
    };
    window.nimbus_core.sendMessage = function (data, cb) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, data, {}, cb);
        });
    };
    window.nimbus_core.sendAllMessage = function (data, cb, notId) {
        chrome.tabs.query({}, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].id !== notId) chrome.tabs.sendMessage(tabs[i].id, data, {}, cb);
            }
        });
    };
    window.nimbus_core.executeFile = function (files, cb) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            let tab_id = tabs[0].id;

            files.reverse();
            let load = function (file, cb) {
                if (/\.css$/.test(file)) {
                    chrome.tabs.insertCSS(tab_id, {file: file});
                    cb && cb();
                } else if (/\.js/.test(file)) {
                    chrome.tabs.executeScript(tab_id, {file: file}, cb);
                } else {
                    chrome.tabs.executeScript(tab_id, {code: file}, cb);
                }
            };

            (function check() {
                if (!files.length) return cb && cb();
                load(files[files.length - 1], function () {
                    files.splice(files.length - 1, 1);
                    check();
                })
            })();
        });
    };
    window.nimbus_core.imageToCanvas = function (dataUrl, cb) {
        let image = new Image();
        image.onload = function () {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);

            cb && cb(canvas)
        };
        image.src = dataUrl;
    };
    // window.nimbus_core.checkWaterMark = function (cb) {
    //     if (localStorage.watermarkEnable !== 'false') {
    //         if (localStorage.watermarkType === 'image') {
    //             let watermark = new Image();
    //             watermark.onload = function () {
    //                 cb && cb(true);
    //             };
    //
    //             watermark.onerror = function () {
    //                 cb && cb(false);
    //             };
    //             watermark.src = localStorage.watermarkFile;
    //         } else {
    //             cb && cb(true);
    //         }
    //     } else {
    //         cb && cb(false);
    //     }
    // };
    // window.nimbus_core.getWaterMark = function (cb) {
    //     const c = document.createElement('canvas');
    //     const ctx = c.getContext("2d");
    //     const percent = localStorage.watermarkPercent;
    //
    //     if (localStorage.watermarkType === 'image') {
    //         let watermark = new Image();
    //         watermark.onload = function () {
    //             const width = watermark.width * percent;
    //             const height = watermark.height * percent;
    //             c.width = width;
    //             c.height = height;
    //
    //             ctx.globalAlpha = +localStorage.watermarkAlpha;
    //             ctx.drawImage(watermark, 0, 0, width, height);
    //             cb && cb(c);
    //         };
    //         watermark.src = localStorage.watermarkFile;
    //     } else {
    //         const font = nscExt.sizeFont({
    //             text: localStorage.watermarkText,
    //             size: localStorage.watermarkSize,
    //             family: localStorage.watermarkFont
    //         });
    //
    //         document.body.appendChild(c);
    //
    //         c.width = font.w;
    //         c.height = font.h;
    //         ctx.textBaseline = "top";
    //         ctx.textAlign = "left";
    //         ctx.globalAlpha = +localStorage.watermarkAlpha;
    //         ctx.fillStyle = localStorage.watermarkColor;
    //         ctx.font = 'bold ' + localStorage.watermarkSize + 'px ' + localStorage.watermarkFont;
    //         ctx.fillText(localStorage.watermarkText, -10000, -10000);
    //
    //         window.setTimeout(function (canvas, context) {
    //             context.fillText(localStorage.watermarkText, 0, 0, font.w);
    //             document.body.removeChild(canvas);
    //             cb && cb(canvas);
    //         }.bind(this, c, ctx), 100);
    //     }
    // };
    window.nimbus_core.setOption = function (key, value) {
        localStorage[key] = value;
        if (window.nimbus_core.is_chrome) return;
        window.nimbus_core.sendMessage({operation: 'set_option', key: key, value: value});
    };
    window.nimbus_core.setEvent = function (key, value) {
        chrome.runtime.sendMessage({operation: 'event', type: key, value: value});
    };
    window.nimbus_core.customError = function (name, message) {
        let e = new Error(message);
        e.name = name;
        return e;
    };
    // window.nimbus_core.formatBytes = function (bytes, decimals = 2) {
    //     if (bytes === 0) return '0 Bytes';
    //
    //     const k = 1024;
    //     const dm = decimals < 0 ? 0 : decimals;
    //     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    //
    //     const i = Math.floor(Math.log(bytes) / Math.log(k));
    //
    //     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    // };
    window.nimbus_core.getVideoFileName = function (info, format) {
        let s = localStorage.fileNamePatternScreencast;
        let url = document.createElement('a');
        url.href = info.url || '';
        s = s.replace(/\{url}/, info.url || '')
            .replace(/\{title}/, info.title || '')
            .replace(/\{domain}/, url.host || '')
            .replace(/\{date}/, info.time.split(' ')[0] || '')
            .replace(/\{time}/, info.time.split(' ')[1] || '')
            .replace(/\{ms}/, info.time.split(' ')[2] || '')
            .replace(/\{timestamp}/, info.time.split(' ')[3] || '');

        return s.replace(/[\*\|\\\:\"\<\>\?\/#]+/ig, '_') + (format ? '.' + format : '');
    };
    window.nimbus_core.getImageFileName = function (info, format) {
        let s = localStorage.fileNamePatternScreenshot;
        let url = document.createElement('a');
        url.href = info.url || '';
        s = s.replace(/\{url}/, info.url || '')
            .replace(/\{title}/, info.title || '')
            .replace(/\{domain}/, url.host || '')
            .replace(/\{date}/, info.time.split(' ')[0] || '')
            .replace(/\{time}/, info.time.split(' ')[1] || '')
            .replace(/\{ms}/, info.time.split(' ')[2] || '')
            .replace(/\{timestamp}/, info.time.split(' ')[3] || '');

        return s.replace(/[\*\|\\\:\"\<\>\?\/#]+/ig, '_') + (format ? '.' + format : '');
    };
    window.nimbus_core.copyTextToClipboard = function (text, cb) {
        let doc = document;
        let el = doc.createElement("textarea");
        doc.body.appendChild(el);
        el.value = text;
        el.select();
        let copied = doc.execCommand("copy");
        el.remove();
        if (copied) cb && cb(null, chrome.i18n.getMessage("notificationUrlCopied"));
        else cb && cb(true)
    };

    window.nimbus_core.createCanvasParts = function (info, parts, cb) {
        // console.log('createCanvasParts', info, parts);
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = info.w * info.z;
        canvas.height = info.h * info.z;

        for (let index = 0; index < info.parts.length; index++) {
            let part = info.parts[index];
            let image = new Image();
            image.onload = function (p, i) {
                if (p.x2 !== undefined && p.y2 !== undefined && p.w2 !== undefined && p.h2 !== undefined) {
                    if (i === info.parts.length - 1 && p.y2 + p.h2 > info.h) {
                        p.y2 = info.h - p.h2;
                    }
                    ctx.drawImage(this, p.x, p.y, p.w, p.h, p.x2, p.y2, p.w2, p.h2);
                } else {
                    // if (image.width > p.w) p.x -= (image.width - p.w) / 2;
                    // if (image.height > p.h) p.y -= (image.height - p.w) / 2;
                    // canvas.width = info.w * z;
                    // canvas.height = info.h * z;
                    ctx.drawImage(this, -p.x, -p.y, image.width, image.height);

                }
                if (i === info.parts.length - 1) {
                    canvas.toBlob(function (blob) {
                        cb && cb(canvas, blob)
                    }, 'image/' + (localStorage.imageFormat === 'jpg' ? 'jpeg' : 'png'));
                }
            }.bind(image, part, index);
            image.src = parts[index];
        }
    };

    window.nimbus_core.addStyleSheet = function (id, css) {
        if (!document.getElementById(id)) {
            let head = document.head || document.getElementsByTagName('head')[0];
            let style = document.createElement('style');
            style.type = 'text/css';
            style.id = id;
            head.appendChild(style);
            style.appendChild(document.createTextNode(css));
        }
    };
    window.nimbus_core.getSizePage = function () {
        const body = document.body;
        const html = document.documentElement;
        let totalWidth = [], totalHeight = [];

        if (html && html.clientWidth) totalWidth.push(html.clientWidth);
        if (html && html.scrollWidth) totalWidth.push(html.scrollWidth);
        if (html && html.offsetWidth) totalWidth.push(html.offsetWidth);
        if (body && body.scrollWidth) totalWidth.push(body.scrollWidth);
        if (body && body.offsetWidth) totalWidth.push(body.offsetWidth);

        if (html && html.clientHeight) totalHeight.push(html.clientHeight);
        if (html && html.scrollHeight) totalHeight.push(html.scrollHeight);
        if (html && html.offsetHeight) totalHeight.push(html.offsetHeight);
        if (body && body.scrollHeight) totalHeight.push(body.scrollHeight);
        if (body && body.offsetHeight) totalHeight.push(body.offsetHeight);

        return {
            w: Math.max.apply(null, totalWidth),
            h: Math.max.apply(null, totalHeight)
        }
    };

    window.nimbus_core.async = function (operations, callback) {
        if (Array.isArray(operations) && operations.length < 1) {
            return callback([]);
        }

        Promise.all(operations).then(function (results) {
            callback(results);
        }).catch(function (error) {
            return callback(error);
        })
    };

    window.nimbus_core.arrayToObject = function (array, keyField) {
        array.reduce(function (obj, item) {
            return obj[item[keyField]] = item;
        }, 0);
        return array;
    };

    window.nimbus_core.createUid = function () {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }

        return S4() + S4() + S4() + S4();
    };

    window.nimbus_core.storageUsageAndQuota = function () {
        return new Promise(function (resolve, reject) {

            navigator.webkitPersistentStorage.queryUsageAndQuota(
                function (usedBytes, quotaBytes) {
                    // console.log('Storage are using ', usedBytes, ' of ', quotaBytes, 'bytes');
                    // localStorage.storageUsedBytes = usedBytes;
                    // localStorage.storageQuotaBytes = quotaBytes;

                    resolve({used: usedBytes, quota: quotaBytes});
                }, function (e) {
                    console.error(e);
                    reject(e)
                }
            );
        });
    };

    window.nimbus_core.pageScroll = async function (offsetX, offsetY, elem) {
        const scrollElem = elem || (document.scrollingElement || document.body);
        scrollElem.scrollLeft = offsetX;
        scrollElem.scrollTop = offsetY;
        await window.nimbus_core.timeout(100);
    };

    window.nimbus_core.timeout = function (timeout) {
        return new Promise(function (resolve, reject) {
            window.setTimeout(resolve, timeout)
        });
    };

    window.nimbus_core.executeScript = function (files) { // TODO: подправить ассинхронность
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                let tab_id = tabs[0].id;

                if (!/^chrome/.test(tabs[0].url) && !/chrome.google.com\/webstore/.test(tabs[0].url)) {
                    files.reverse();
                    let load = function (file, cb) {
                        if (/\.css$/.test(file)) {
                            chrome.tabs.insertCSS(tab_id, {file: file});
                            cb();
                        } else if (/\.js/.test(file)) {
                            chrome.tabs.executeScript(tab_id, {file: file}, cb);
                        } else {
                            chrome.tabs.executeScript(tab_id, {code: file}, cb);
                        }
                    };

                    (function check() {
                        if (!files.length) return resolve(tabs[0]);
                        load(files[files.length - 1], function () {
                            files.splice(files.length - 1, 1);
                            check();
                        })
                    })();
                } else {
                    resolve(tabs[0])
                    // reject()
                }
            });
        });
    };

    window.nimbus_core.getUserMedia = function (constraints) {
        return new Promise(function (resolve, reject) {
            window.navigator.getUserMedia(constraints, resolve, reject)
        });
    };

    window.nimbus_core.getPageInfo = function (type) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({active: true}, function (tabs) {
                let info = {id: tabs[0].id, windowId: tabs[0].windowId, url: tabs[0].url, title: tabs[0].title, time: nscExt.getTimeStamp()};
                if (type === 'desktop' || type === 'capture-window') {
                    info.title = 'nimbus-capture';
                    info.url = 'http://nimbus-capture';
                }
                resolve(JSON.stringify(info));
            });
        });
    };

    window.nimbus_core.setExtensionBadge = function (countdown) {
        return new Promise(function (resolve, reject) {
            (function setBadge() {
                if (countdown > 0) {
                    chrome.browserAction.setBadgeText({text: countdown.toString()});
                    chrome.browserAction.setBadgeBackgroundColor({color: '#000'});
                    countdown--;
                    setTimeout(setBadge, 1000);
                } else {
                    chrome.browserAction.setBadgeText({text: ''});
                    resolve();
                }
            })();
        });
    };

    window.nimbus_core.getActiveTab = function () {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                if (tabs.length && !/^chrome/.test(tabs[0].url) && !/chrome.google.com\/webstore/.test(tabs[0].url)) resolve(tabs[0]);
                else reject()
            })
        });
    };

    window.nimbus_core.setActiveTab = function (tab) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.highlight({tabs: tab.index}, resolve);
        });
    };

    window.nimbus_core.setTimerContent = function (tab, countdown) {
        return new Promise(async function (resolve, reject) {

            chrome.browserAction.setPopup({popup: ''});
            await window.nimbus_core.setActiveTab(tab);
            chrome.tabs.sendMessage(tab.id, {operation: 'content_start_timer', countdown: countdown});

            let timeout = setTimeout(function () {
                chrome.browserAction.setPopup({popup: 'popup.html'});
                resolve(false);
            }, countdown * 1000 + 500);

            chrome.runtime.onMessage.addListener(function onMessage(request) {
                switch (request.operation) {
                    case 'content_end_timer':
                        chrome.runtime.onMessage.removeListener(onMessage);
                        chrome.browserAction.setPopup({popup: 'popup.html'});
                        clearInterval(timeout);
                        resolve(request.type);
                        break;
                    case 'content_stop_timer':
                        chrome.runtime.onMessage.removeListener(onMessage);
                        chrome.browserAction.setPopup({popup: 'popup.html'});
                        clearInterval(timeout);
                        reject(request.type);
                        break;
                }
            });
        });
    };

    window.nimbus_core.setIframeMediaCamera = function (constraints) {
        return new Promise(function (resolve, reject) {
            let iframe = document.createElement('iframe')
            iframe.setAttribute('allow', 'camera; microphone;')
            iframe.setAttribute('style', 'display: none')
            iframe.setAttribute('src', chrome.runtime.getURL('template/frame-media.html?' + JSON.stringify(constraints)))

            // iframe.addEventListener('load', function () {
            //     let data = {
            //         action: 'nsc_frame_create_video',
            //         value: constraints
            //     }
            //     iframe.contentWindow.postMessage(JSON.stringify(data), '*');
            // });

            window.addEventListener('message', function (e) {
                try {
                    let data = JSON.parse(e.data)
                    if (data && data.action === 'nsc_frame_create_video') resolve({iframe: iframe, value: data.value})
                } catch (e) {

                }
            }, false);

            document.body.appendChild(iframe);
        });
    };

    if (window.is_firefox) window.nimbus_core.path = 'filesystem:moz-extension://' + chrome.i18n.getMessage("@@extension_id") + '/persistent/';

    document.addEventListener('DOMContentLoaded', function () {
        let show_chrome_only = document.getElementsByClassName("show-chrome-only");
        let show_firefox_only = document.getElementsByClassName("show-firefox-only");
        let hide_chrome_only = document.getElementsByClassName("hide-chrome-only");
        let hide_firefox_only = document.getElementsByClassName("hide-firefox-only");
        let hide_linux_only = document.getElementsByClassName("hide-linux-only");

        for (let sco of show_chrome_only) {
            let display = sco.style.display;
            sco.style.display = 'none';
            if (window.nimbus_core.is_chrome) sco.style.display = display;
        }

        for (let sfo of show_firefox_only) {
            let display = sfo.style.display;
            sfo.style.display = 'none';
            if (window.nimbus_core.is_firefox) sfo.style.display = display;
        }

        for (let hco of hide_chrome_only) {
            if (window.nimbus_core.is_chrome) hco.style.display = 'none';
        }

        for (let hfo of hide_firefox_only) {
            if (window.nimbus_core.is_firefox) hfo.style.display = 'none';
        }

        for (let hfo of hide_linux_only) {
            if (window.nimbus_core.is_linux) hfo.style.display = 'none';
        }

    });
}
