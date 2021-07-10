(async function () {
    if (window.__nscContentScriptVideoCamera) return;
    window.__nscContentScriptVideoCamera = true;

    const sendMessage = function (data) {
        try {
            chrome.runtime.sendMessage(data);
        } catch (e) {
        }
    }

    let videoCameraX = 0;
    let videoCameraY = 0;
    let videoCameraXFull = 0;
    let videoCameraYFull = 0;
    let videoCameraMove = false;
    let videoCameraShiftX = 0;
    let videoCameraShiftY = 0;
    let videoCameraW = 0;
    let videoCameraH = 0;
    let videoTypeCapture = null;
    let constraints = false;
    let videoCameraEnable = false;

    let $content_camera, $content_camera_container, $content_camera_buttons, $camera_collapse, $camera_expand,
        $camera_close;

    let nsc_content_camera = {
        option: {
        },
        eventList: [],
        iframe: null,
        isInit: false,
        showCamera: async function (save) {
            if (nsc_content_camera.iframe !== null) return;
            save && sendMessage({operation: "set_option", key: 'videoCameraEnable', value: true});
            let media_camera = await window.nimbus_core.setIframeMediaCamera(constraints);
            nsc_content_camera.iframe = media_camera.iframe;
            videoCameraW = media_camera.value.w;
            videoCameraH = media_camera.value.h;

            $content_camera_container.prepend($(nsc_content_camera.iframe).show())

            $content_camera.removeClass('nsc-hide')
            nsc_content_camera.positionCamera(videoCameraX, videoCameraY);

            if (videoTypeCapture === 'camera') {
                nsc_content_camera.fullCamera();
                $content_camera_buttons.addClass('nsc-hide');
            } else {
                nsc_content_camera.miniCamera();
                $content_camera_buttons.removeClass('nsc-hide');
            }

            $content_camera
                .on('mousedown', nsc_content_camera.startMove)
                .on('mouseup', nsc_content_camera.endMove);

            $(window)
                .on('mousemove', nsc_content_camera.move)
                .on('mouseup', nsc_content_camera.endMove);
        },
        hideCamera: function (save) {
            if (nsc_content_camera.iframe === null) return;
            save && sendMessage({operation: "set_option", key: 'videoCameraEnable', value: false});
            $(nsc_content_camera.iframe).remove();
            nsc_content_camera.iframe = null;
            $content_camera.addClass('nsc-hide');

            $content_camera
                .off('mousedown', nsc_content_camera.startMove)
                .off('mouseup', nsc_content_camera.endMove);

            $(window)
                .off('mousemove', nsc_content_camera.move)
                .off('mouseup', nsc_content_camera.endMove);
        },
        miniCamera: function () {
            $content_camera.removeClass('full');
            $content_camera_container.css({width: 320, height: 320 / (videoCameraW / videoCameraH)});
            nsc_content_camera.positionCamera(videoCameraX, videoCameraY);
            $camera_collapse.addClass('nsc-hide');
            $camera_expand.removeClass('nsc-hide');
        },
        fullCamera: function () {
            $content_camera.addClass('full')

            let width = $(window).width() - 20;
            let height = $(window).height() - 20;

            if (width / (videoCameraW / videoCameraH) > height) $content_camera_container.css({
                width: height * (videoCameraW / videoCameraH),
                height: height
            });
            else $content_camera_container.css({width: width, height: height});

            nsc_content_camera.positionCamera(10, 10);

            $camera_collapse.removeClass('nsc-hide');
            $camera_expand.addClass('nsc-hide');
        },
        positionCamera: function (pageX, pageY) {
            let pageLeft = 10;
            let pageTop = 10;
            let pageRight = $(window).width() - $content_camera.width() - 10;
            let pageBottom = $(window).height() - $content_camera.height() - 10;

            if (pageX < pageLeft) pageX = 10;
            if (pageY < pageTop) pageY = 10;
            if (pageX > pageRight) pageX = pageRight;
            if (pageY > pageBottom) pageY = pageBottom;

            $content_camera.css({top: pageY, left: pageX});
        },
        move: function (e) {
            if (videoCameraMove) {
                let pageX = e.pageX - videoCameraShiftX;
                let pageY = e.pageY - videoCameraShiftY;
                videoCameraShiftX = e.pageX;
                videoCameraShiftY = e.pageY;

                if ($content_camera.hasClass('full')) {
                    pageX = videoCameraXFull = pageX + videoCameraXFull > 0 ? pageX + videoCameraXFull : 0;
                    pageY = videoCameraYFull = pageY + videoCameraYFull > 0 ? pageY + videoCameraYFull : 0;
                } else {
                    pageX = videoCameraX = pageX + videoCameraX > 0 ? pageX + videoCameraX : 0;
                    pageY = videoCameraY = pageY + videoCameraY > 0 ? pageY + videoCameraY : 0;
                }
                nsc_content_camera.positionCamera(pageX, pageY);
            }
        },
        startMove: function (e) {
            e.preventDefault();

            videoCameraMove = true;
            videoCameraShiftX = e.pageX;
            videoCameraShiftY = e.pageY;
            $content_camera.addClass('nsc-move');
        },
        endMove: function () {
            videoCameraMove = false;
            if ($content_camera.hasClass('full')) return;

            sendMessage({operation: "save_position_video_camera", position: {x: videoCameraX, y: videoCameraY}});
            $content_camera.removeClass('nsc-move');
        },
        html: async function () {
            if ($('.nsc-content-camera').length) {
                return;
            }
            let html = await fetch(chrome.runtime.getURL('template/panel-video-camera.html')).then(res => res.text());
            $('body').append(html);

            $content_camera = $('#nsc_content_camera');
            $content_camera_container = $('#nsc_content_camera_container');
            $content_camera_buttons = $('#nsc_content_camera_buttons');

            $camera_collapse = $('#nsc_video_camera_collapse');
            $camera_expand = $('#nsc_video_camera_expand');
            $camera_close = $('#nsc_video_camera_close');

            $camera_collapse.on('click', nsc_content_camera.miniCamera);
            $camera_expand.on('click', nsc_content_camera.fullCamera);
            $camera_close.on('click', function () {
                sendMessage({operation: 'content_camera_toggle'});
            });

            document.addEventListener("fullscreenchange", async function () {
                await nscCore.setTimeout(1000);
                $(!!document.fullscreenElement ? document.fullscreenElement : document.body).append($('.nsc-content-camera'));
            })

            // if (videoTypeCapture !== null) await nsc_content_camera.init();
        },
        setting: async function (option) {
            nsc_content_camera.option.tabId = option.tabId;
            videoCameraX = JSON.parse(option.videoCameraPosition).x;
            videoCameraY = JSON.parse(option.videoCameraPosition).y;
            constraints = option.constraints;
            videoTypeCapture = option.typeCapture;
            videoCameraEnable = option.videoCameraEnable;
            // if ($content_camera) await nsc_content_camera.init();
        },
        init: async function () {
            if (videoCameraEnable || videoTypeCapture === 'camera') await this.showCamera(false);
        },
        event: async function (isAdd, {method, param} = {method: undefined, param: undefined}) {
            if (isAdd) {
                this.eventList.push({status: 'pending', method, param});
            }

            const progress = this.eventList.length && !this.eventList.filter(event => event.status === 'progress').length;
            const pending = this.eventList.length && this.eventList.filter(event => event.status === 'pending').length
            const isInit = this.eventList.filter(event => event.method === 'setting').length;

            if (progress && pending) {
                const [event] = this.eventList.filter(event => event.status === 'pending');
                event.status = 'progress';
                await this[event.method](event.param);
                event.status = 'finish';
                await this.event();
            } else if (isInit) await this.init();
        }
    };

    await nsc_content_camera.event('add', {method: 'html'});

    chrome.runtime.onMessage.addListener(function (req) {
        (async function () {
            const {operation, status, tabId, ...param} = req;
            if (operation === 'nsc_content_camera_setting' && window.nscTabId === tabId) {
                await nsc_content_camera.event(true, {method: 'setting', param});
            }
            if (operation === 'status_video' && !status) {
                await nsc_content_camera.hideCamera(false);
            }

            if (operation === 'content_camera_toggle_tab') {
                if ($content_camera.hasClass('nsc-hide')) await nsc_content_camera.showCamera(true);
                else await nsc_content_camera.hideCamera(true);
            }
        })()
    });

    $(window).resize(function () {
        if (nsc_content_camera.iframe !== null) nsc_content_camera.positionCamera(parseInt($content_camera.css('left')), parseInt($content_camera.css('top')));
    })
})();
