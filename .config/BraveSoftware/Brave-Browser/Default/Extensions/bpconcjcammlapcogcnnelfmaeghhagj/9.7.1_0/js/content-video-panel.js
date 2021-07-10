/**
 * Created by hasesanches on 2017.
 */

(async function () {
    if (window.__nscContentScriptVideoPanel) return;
    window.__nscContentScriptVideoPanel = true;

    // console.log('start video panel');

    const sendMessage = function (data) {
        try {
            chrome.runtime.sendMessage(data);
        } catch (e) {
        }
    }

    let nsc_content_video_panel = {
        editor: null,
        interval: null,
        panel_move: false,
        option: {
            tabId: null,
            videoEditorTools: null,
            videoDrawingToolsEnable: null,
            videoDrawingToolsDelete: null
        },
        event: function () {
            nsc_content_video_panel.editor.on('nimbus-editor-change', function (e, tools, color) {
                console.log('nimbus-editor-change', tools, color)

                if (tools) {
                    const dropdown_icon = $('.nsc-panel-compact-dropdown-icon[data-event-param=' + tools + ']');
                    if (dropdown_icon.length) {
                        dropdown_icon.closest('.nsc-panel-compact-button').removeClass('opened')
                            .find('.nsc-panel-compact-text').data('event', dropdown_icon.data('event')).data('event-param', dropdown_icon.data('event-param')).data('i18n', dropdown_icon.data('i18n'))
                            .attr('data-event', dropdown_icon.data('event')).attr('data-event-param', dropdown_icon.data('event-param')).attr('data-i18n', dropdown_icon.data('i18n'))
                            .empty().append(dropdown_icon.find('.nsc-icon').clone());
                    }
                    const $separated = $('.nsc-panel-compact-text[data-event-param=' + tools + ']').closest('.nsc-panel-compact-button');
                    const $button = $('.nsc-panel-compact-button[data-event-param=' + tools + ']');
                    if ($button.length || $separated.length) {
                        $('.nsc-panel-compact-button').removeClass('active').filter($button.length ? $button : $separated).addClass('active');
                    }
                }
                if (color) {
                    $('#nsc_panel_button_colors').css('background-color', color).closest('.nsc-panel-compact-button').removeClass('opened');
                }
            });

            nsc_content_video_panel.editor.on('nimbus-editor-not-set-color', function () {
                $('#nsc_panel_button_colors').closest('.nsc-panel-compact-button').removeClass('opened');
            });

            $('*[data-event^=nimbus-editor]').on('click touchend', function () {
                // console.log($(this).data('event'), $(this).data('eventParam'));

                nsc_content_video_panel.editor.trigger($(this).data('event'), $(this).data('eventParam'));
                if ($(this).data('event') === 'nimbus-editor-active-tools') {
                    chrome.runtime.sendMessage({
                        operation: 'set_option',
                        key: 'videoEditorTools',
                        value: $(this).data('eventParam')
                    });
                }
            });

            $('*[data-i18n]').each(function () {
                $(this).on('restart-i18n', function () {
                    const text = chrome.i18n.getMessage($(this).data('i18n')) || $(this).data('i18n');
                    const attr = $(this).data('i18nAttr');
                    if (attr && text) {
                        $(this).attr(attr, text);
                    } else if (text) {
                        $(this).html(text);
                    }
                }).trigger('restart-i18n');
            }).on('mouseenter touchenter', function () {
                $('.nsc-panel-compact-tooltip-layout').text($(this).attr('title'));
                $('.nsc-panel-compact').addClass('nsc-tooltip');
            })
                .on('mouseleave touchleave', function () {
                    $('.nsc-panel-compact').removeClass('nsc-tooltip')
                });

            $('.nsc-panel-compact-toggle-button').on('click', function () {
                sendMessage({operation: 'content_panel_toggle'});
                sendMessage({operation: "set_option", key: 'videoDrawingToolsEnable', value: false});
                nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', 'cursorRing');
            });

            $('.nsc-panel-compact-trigger').on('click touchend', function () {
                let $this_button = $(this).closest('.nsc-panel-compact-button');
                $('.nsc-panel-compact-button').not($this_button).removeClass('opened');
                if ($this_button.find('.nsc-panel-compact-dropdown').length) $this_button.toggleClass('opened');
            });

            $('#nsc_panel_button_redactor').on('click touchend', function () {
                chrome.runtime.sendMessage({operation: 'activate_capture', value: 'capture-blank-popup'});
            });

            function panelKeyDown(e) {
                if (nsc_content_video_panel.option.tabId === null) return;

                if (e.altKey) {
                    let tools = 'cursorDefault';
                    switch (e.key) {
                        case 'v': // v
                            if ($('.nsc-panel-compact:visible').length) {
                                sendMessage({operation: 'content_panel_toggle'});
                                nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', 'cursorDefault');
                                sendMessage({operation: "set_option", key: 'videoDrawingToolsEnable', value: false});
                            } else {
                                sendMessage({operation: 'content_panel_toggle'});
                                chrome.runtime.sendMessage({operation: 'get_option', key: 'videoEditorTools'}, function (tools) {
                                    nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', tools);
                                });
                                sendMessage({operation: "set_option", key: 'videoDrawingToolsEnable', value: true});
                            }
                            return;
                        case 's': // s
                            break;
                        case 'g': // g
                            tools = 'cursorDefault';
                            break;
                        case 'l': // l
                            tools = 'cursorRing';
                            break;
                        case 'p': // p
                            tools = 'pen';
                            break;
                        case 'a': // a
                            tools = 'arrow';
                            break;
                        case 'r': // r
                            tools = 'square';
                            break;
                        case 'm': // m
                            tools = 'notifRed';
                            break;
                        case 'q': // q
                            tools = 'notifBlue';
                            break;
                        case 'c': // c
                            tools = 'notifGreen';
                            break;
                        case 'u': // u
                            tools = 'clearAll';
                            break;
                    }

                    nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', tools);
                    chrome.runtime.sendMessage({operation: 'set_option', key: 'videoEditorTools', value: tools});
                }
            }

            $('.nsc-panel-compact .nsc-panel-compact-move')
                .on('mousedown', function () {
                    nsc_content_video_panel.panel_move = true;
                })
                .on('mouseup', function () {
                    nsc_content_video_panel.panel_move = false;
                });

            $(window).on('keydown', panelKeyDown)
                .on('mousemove', function (e) {
                    if (nsc_content_video_panel.panel_move) {
                        let $panel = $('.nsc-panel-compact');
                        let left = e.clientX - 2;
                        let bottom = $(window).height() - e.clientY - 46 / 2;

                        if (left <= 5) return;
                        if (left > $(window).width() - $panel.width() - 5) return;
                        if (bottom <= 5) return;
                        if (bottom > $(window).height() - $panel.height() - 5) return;

                        $('.nsc-panel-compact').css({left: left, bottom: bottom});
                    }
                })
                .on('mouseup', function () {
                    nsc_content_video_panel.panel_move = false;
                });

            let $web_camera = $('#nimbus_web_camera_toggle');
            let $button_play = $('#nsc_panel_button_play').addClass('nsc-hide');
            let $button_pause = $('#nsc_panel_button_pause');
            let $button_stop = $('#nsc_panel_button_stop');

            $web_camera.on('click', function () {
                sendMessage({operation: 'content_camera_toggle'});
            });

            $button_play.on('click touchend', function () {
                sendMessage({operation: 'status_video_change', status: 'play'});
            });
            $button_pause.on('click touchend', function () {
                sendMessage({operation: 'status_video_change', status: 'pause'});
            });
            $button_stop.on('click touchend', function () {
                sendMessage({operation: 'status_video_change', status: 'stop'});
            });
        },
        html: async function () {
            if ($('.nsc-video-editor').length) return;
            const html = await fetch(chrome.runtime.getURL('template/panel-video-compact.html')).then(res => res.text()),
                page_w = window.innerWidth,
                page_h = window.innerHeight;

            $(document.body).append(html).append($('<div>').addClass('nsc-video-editor').addClass('nsc-hide'));
            nsc_content_video_panel.editor = nsc_content_video_editor.init($('.nsc-video-editor'), {
                w: page_w,
                h: page_h
            });
            nsc_content_video_panel.event();

            document.addEventListener("fullscreenchange", async function () {
                await nscCore.setTimeout(1000);
                $(!!document.fullscreenElement ? document.fullscreenElement : document.body).append($('.nsc-panel-compact')).append($('.nsc-video-editor'));
            })

            if (nsc_content_video_panel.option.videoDrawingToolsEnable !== null) nsc_content_video_panel.init();
        },
        setting: function (option) {
            nsc_content_video_panel.option.tabId = option.tabId;
            nsc_content_video_panel.option.videoDrawingToolsEnable = option.videoDrawingToolsEnable;
            nsc_content_video_panel.option.videoDrawingToolsDelete = option.videoDrawingToolsDelete;
            nsc_content_video_panel.option.videoEditorTools = option.videoEditorTools;

            if (nsc_content_video_panel.editor) {
                nsc_content_video_panel.init();
            } else if ($('.nsc-video-editor').length) {
                nsc_content_video_panel.editor = nsc_content_video_editor.init($('.nsc-video-editor'), {
                    w: window.innerWidth,
                    h: window.innerHeight
                });
                nsc_content_video_panel.event();
                nsc_content_video_panel.init();
            }
        },
        init: function () {
            nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', nsc_content_video_panel.option.videoEditorTools);

            if (nsc_content_video_panel.option.videoDrawingToolsEnable) {
                $('.nsc-panel-compact').removeClass('nsc-hide');

                if (nsc_content_video_panel.option.videoDrawingToolsDelete) {
                    nsc_content_video_panel.interval = setInterval(function () {
                        nsc_content_video_panel.editor.trigger('nimbus-editor-delete-drawing', nsc_content_video_panel.option.videoDrawingToolsDelete);
                    }, 500)
                }
            }

            nsc_content_video_panel.editor.removeClass('nsc-hide');
        }
    };

    await nsc_content_video_panel.html();

    chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        if (req.operation === 'status_video') {
            let $button_play = $('#nsc_panel_button_play');
            let $button_pause = $('#nsc_panel_button_pause');

            if (!req.status) {
                nsc_content_video_panel.option.tabId = null;
                if (nsc_content_video_panel.editor) {
                    nsc_content_video_panel.editor.trigger('nimbus-editor-active-tools', 'clearAll').addClass('nsc-hide');
                    $('.nsc-panel-compact').addClass('nsc-hide');
                    $('#nsc_content_pix_video').remove();
                    clearInterval(nsc_content_video_panel.interval);
                }
            }

            if (req.state === 'recording') {
                $button_play.addClass('nsc-hide');
                $button_pause.removeClass('nsc-hide');
            } else if (req.state === 'paused') {
                $button_pause.addClass('nsc-hide');
                $button_play.removeClass('nsc-hide');
            }
        }
        if (req.operation === 'nsc_content_video_panel_setting' && nsc_content_video_panel.option.tabId !== req.tabId && req.typeCapture !== 'camera') {
            if (req.typeCapture === 'desktop') $('#nsc_panel_button_redactor').removeClass('nsc-hide');
            else $('#nsc_panel_button_redactor').addClass('nsc-hide');
            nsc_content_video_panel.setting(req)
        }
        if (req.operation === 'content_panel_toggle_tab') {
            if ($('.nsc-panel-compact').hasClass('nsc-hide')) $('.nsc-panel-compact').removeClass('nsc-hide');
            else $('.nsc-panel-compact').addClass('nsc-hide');
        }
    });

    chrome.runtime.sendMessage({operation: 'get_info_record'}, function (res) {
        let $button_play = $('#nsc_panel_button_play');
        let $button_pause = $('#nsc_panel_button_pause');
        if (res.state === 'recording') {
            $button_play.addClass('nsc-hide');
            $button_pause.removeClass('nsc-hide');
        } else {
            $button_pause.addClass('nsc-hide');
            $button_play.removeClass('nsc-hide');
        }
    });
})();
