class nscExtensionCore {
    constructor(options) {
        const default_options = {log: false}
        options = Object.assign({}, default_options, options)

        this.trialVideoDuration = 60 * 1000 * 5;
        this.trialTime = 7 * 24 * 3600 * 1000;
        this.log = options.log;
    }

    initI18n() {
        $('*[data-i18n]').each(function () {
            let text = chrome.i18n.getMessage($(this).data('i18n'));
            let attr = $(this).data('i18nAttr');
            if (attr && text) {
                $(this).attr(attr, text);
            } else if (text) {
                $(this).html(text);
            }
        });

        $('[data-i18n-attr="title"]').tooltip({
            position: {my: "center top+10", at: "center bottom"},
        }).on('click', function () {
            $(this).blur();
            $('.ui-tooltip').fadeOut('fast', function () {
                $('.ui-tooltip').remove();
            });
        });
    };

    formatBytes = function (bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    /** @description Onload file and convert to blob.
     * @param {string} url to file.
     * @return {Blob} Blob
     */

    async urlToBlob(url) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function () {
                if (this.status === 200) {
                    resolve(new Blob([new Uint8Array(this.response)]));
                }
            };
            xhr.onerror = reject;
            xhr.send();
        });
    };

    /** @description onLoad image.
     * @param {string} url image.
     * @return {HTMLImageElement} image element
     */

    async imageLoad(url) {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            image.onload = function () {
                resolve(image)
            }
            image.onerror = reject;
            image.src = url;
        });
    };

    async checkWaterMark() {
        return new Promise(function (resolve, reject) {
            if (localStorage.watermarkEnable !== 'false') {
                if (localStorage.watermarkType === 'image') {
                    if (localStorage.watermarkFile === '') return reject('Watermark file empty');
                    let watermark = new Image();
                    watermark.onload = resolve;
                    watermark.onerror = reject;
                    watermark.src = localStorage.watermarkFile;
                } else {
                    resolve()
                }
            } else reject('Watermark not activate')
        });
    };

    /** @description get watermark image.
     * @return {HTMLCanvasElement} canvas element
     */

    async getWaterMark(video) {
        const _self = this;
        return new Promise(async function (resolve, reject) {
            const c = document.createElement('canvas');
            const ctx = c.getContext("2d");

            if (localStorage.watermarkType === 'image') {
                let watermark = new Image();
                watermark.onload = function () {
                    const percent = localStorage.watermarkPercent;
                    const width = watermark.width * percent;
                    const height = watermark.height * percent;
                    c.width = width;
                    c.height = height;

                    ctx.globalAlpha = +localStorage.watermarkAlpha;
                    ctx.drawImage(watermark, 0, 0, width, height);
                    resolve(c);
                };
                watermark.onerror = reject;
                watermark.src = localStorage.watermarkFile;
            } else {
                const font = _self.sizeFont({
                    text: localStorage.watermarkText,
                    size: localStorage.watermarkSize,
                    family: localStorage.watermarkFont
                });
                c.width = font.w;
                c.height = font.h;
                ctx.textBaseline = "top";
                ctx.textAlign = "left";
                ctx.globalAlpha = +localStorage.watermarkAlpha;
                if (video) {
                    ctx.fillStyle = inversion(localStorage.watermarkColor);
                } else {
                    ctx.fillStyle = localStorage.watermarkColor;
                }
                ctx.fillStyle = localStorage.watermarkColor;
                ctx.font = 'bold ' + localStorage.watermarkSize + 'px ' + localStorage.watermarkFont;
                ctx.fillText(localStorage.watermarkText, 0, 0, font.w);
                resolve(c);
            }
        });
    };

    getWaterMarkPosition(watermark, canvas) {
        let x, y, shift = 10;
        switch (localStorage.watermarkPosition) {
            case 'lt':
                x = shift;
                y = shift;
                break;
            case 'rt':
                x = canvas.width - watermark.width - shift;
                y = shift;
                break;
            case 'lb':
                x = shift;
                y = canvas.height - watermark.height - shift;
                break;
            case 'rb':
                x = canvas.width - watermark.width - shift;
                y = canvas.height - watermark.height - shift;
                break;
            case 'c':
                x = Math.floor((canvas.width - watermark.width) / 2);
                y = Math.floor((canvas.height - watermark.height) / 2);
                break;
        }
        return {x, y};
    };

    async createCanvasParts({info, format}, parts) {
        const _self = this;
        return new Promise(async function (resolve, reject) {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = info.w * info.z;
            canvas.height = info.h * info.z;
            for (let index = 0; index < info.parts.length; index++) {
                const part = info.parts[index];
                const image = await _self.imageLoad(parts[index])

                if (part.x2 !== undefined && part.y2 !== undefined && part.w2 !== undefined && part.h2 !== undefined) {
                    if (index === info.parts.length - 1 && part.y2 + part.h2 > info.h) part.y2 = info.h - part.h2;
                    ctx.drawImage(image, part.x, part.y, part.w, part.h, part.x2, part.y2, part.w2, part.h2);
                } else {
                    ctx.drawImage(image, -part.x, -part.y, image.width, image.height);
                }
                if (index === info.parts.length - 1) {
                    const dataURL = canvas.toDataURL('image/' + (format === 'jpg' ? 'jpeg' : 'png'))
                    canvas.toBlob(function (blob) {
                        resolve({canvas, dataURL, blob})
                    }, 'image/' + (format === 'jpg' ? 'jpeg' : 'png'));
                }
            }
        });
    };

    sizeFont(data) {
        let body = document.getElementsByTagName("body")[0];
        let dummy = document.createElement("div");
        dummy.appendChild(document.createTextNode(data.text));
        dummy.setAttribute("style", "font-family: " + data.family + "; font-size: " + data.size + "px; float: left; white-space: nowrap; overflow: hidden;");
        body.appendChild(dummy);
        const result = {w: dummy.offsetWidth + (data.size * 0.4), h: dummy.offsetHeight};
        body.removeChild(dummy);
        return result;
    };

    getTimeStamp() {
        const time = new Date();
        let y, m, d, h, M, s, mm, timestamp;
        y = time.getFullYear();
        m = time.getMonth() + 1;
        d = time.getDate();
        h = time.getHours();
        M = time.getMinutes();
        s = time.getSeconds();
        mm = time.getMilliseconds();
        timestamp = Date.now();
        if (m < 10) m = '0' + m;
        if (d < 10) d = '0' + d;
        if (h < 10) h = '0' + h;
        if (M < 10) M = '0' + M;
        if (s < 10) s = '0' + s;
        if (mm < 10) mm = '00' + mm;
        else if (mm < 100) mm = '0' + mm;
        return y + '.' + m + '.' + d + ' ' + h + ':' + M + ':' + s + ' ' + mm + ' ' + timestamp;
    };

    async pageInfo(type) {
        try {
            const tab = (await nscCore.tabActive());
            let info = {
                id: tab.id,
                windowId: tab.windowId,
                url: tab.url,
                title: tab.title,
                time: this.getTimeStamp()
            };
            if (type === 'desktop' || type === 'capture-window') {
                info.title = 'nimbus-capture';
                info.url = 'http://nimbus-capture';
            }

            localStorage.pageinfo = JSON.stringify(info);
            return info;
        } catch (e) {
            console.error(e)
            return false;
        }
    }

    getOption(key) {
        try {
            return JSON.parse(localStorage[key]);
        } catch (e) {
            return localStorage[key];
        }
    }

    setOption(key, value) {
        localStorage[key] = value;
    }

    getTrial() {
        const now = moment(nscExt.getOption('firstTime') + nscExt.trialTime);
        const end = moment();
        const duration = moment.duration(now.diff(end));
        return nscExt.getOption('isTrial') && duration.asMilliseconds() <= 0;
    }
}

const nscExt = new nscExtensionCore();

