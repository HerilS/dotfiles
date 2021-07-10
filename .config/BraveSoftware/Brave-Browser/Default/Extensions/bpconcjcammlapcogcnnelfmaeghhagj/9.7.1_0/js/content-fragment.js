/*
 * "This work is created by NimbusWeb and is copyrighted by NimbusWeb. (c) 2017 NimbusWeb.
 * You may not replicate, copy, distribute, or otherwise create derivative works of the copyrighted
 * material without prior written permission from NimbusWeb.
 *
 * Certain parts of this work contain code licensed under the MIT License.
 * https://www.webrtc-experiment.com/licence/ THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * */

(function ($) {
    if (!window.captureFragment) {

        function nimbus_capture_fragment_event_off(e) {
            // console.log('!!!!!!!!!!!!!!AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!!!!!!!!!!!!!!!')

            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        window.captureFragment = {
            data: {
                position: {},
                elem: null,
                elems: [],
                appType: null
            },
            savePosition() {
                chrome.runtime.sendMessage({operation: 'save_fragment_scroll_position', value: window.captureFragment.data.position});
            },
            event: {
                stop: function (e) {
                    window.captureFragment.view.button(e);

                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                },
                clear: function () {
                    window.captureFragment.event.elements();

                    $(document).off('contextmenu', window.captureFragment.event.contextmenu);
                },
                elements: function (elem) {
                    // console.log(elem, remove);

                    if (elem) {
                        $(elem).on('click', window.captureFragment.event.stop);
                        window.captureFragment.data.elems.push(elem);

                        const childrens = $(elem).children();
                        for (let i = 0, len = childrens.length; i < len; i++) {
                            window.captureFragment.event.elements(childrens[i]);
                        }
                    } else {
                        for (let i = 0, len = window.captureFragment.data.elems.length; i < len; i++) {
                            $(window.captureFragment.data.elems[i]).off('click', window.captureFragment.event.stop);
                        }

                        window.captureFragment.data.elems = [];
                    }
                },
                enter: function () {
                    $(document.body).on('mousemove touchmove', window.captureFragment.view.border);
                    // $(document.body).on('mouseup touchend', window.captureFragment.view.button);
                },
                leave: function () {
                    $(document.body).off('mousemove touchmove', window.captureFragment.view.border);
                    // $(document.body).off('mouseup touchend', window.captureFragment.view.button);
                },
                contextmenu: function (e) {
                    window.captureFragment.view.clear();
                    window.captureFragment.event.clear();
                    window.captureFragment.event.stop(e);
                }
            },
            view: {
                clear: function () {
                    $('#nsc_capture_fragment_box').remove();
                },
                border: function (e) {
                    let $elem = $(e.target);

                    if ($elem.hasClass('#nsc-capture-fragment-box')) return;

                    window.captureFragment.data.position = {
                        x: Math.round($elem.offset().left),
                        y: Math.round($elem.offset().top),
                        width: Math.round($elem.outerWidth()),
                        height: Math.round($elem.outerHeight())
                    };

                    window.captureFragment.data.elem = e.target;

                    if (!$('.nsc-capture-fragment-box').length) $(document.body).append($('<div>', {class: 'nsc-capture-fragment-box', id: 'nsc_capture_fragment_box'}));

                    $('#nsc_capture_fragment_box').css({
                        top: window.captureFragment.data.position.y - 3,
                        left: window.captureFragment.data.position.x - 3,
                        width: window.captureFragment.data.position.width,
                        height: window.captureFragment.data.position.height
                    });
                },
                button: function () {
                    $(document.body)
                        .off('mouseenter')
                        .off('mouseleave')
                        .off('mousemove touchmove')
                        // .off('mouseup touchend');

                    let ns_crop_buttons = $('<div/>', {
                        'id': 'screenshotbutton',
                        'class': 'ns-crop-buttons bottom'
                    });

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnEdit") + '</span>',
                        'class': 'ns-btn edit'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'redactor_fragment'});
                        // chrome.runtime.sendMessage({operation: 'activate_capture', value: 'capture-selected'});
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_crop_buttons);


                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
                        'class': 'ns-btn save'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'download_fragment'});
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_crop_buttons);

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
                        'class': 'ns-btn cancel'
                    }).on('click', function () {
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_crop_buttons);

                    let ns_crop_more = $('<div/>', {
                        html: '<button></button>',
                        'id': 'ns_crop_more',
                        'class': 'ns-crop-more'
                    });

                    let ns_more_container = $('<div/>', {
                        'id': 'ns_more_container',
                        'class': 'ns-crop-more-container'
                    });

                    if (window.captureFragment.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>Nimbus</span>',
                            'class': 'ns-btn nimbus'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'nimbus_fragment'});
                            window.captureFragment.event.clear();
                            window.captureFragment.view.clear();
                        }).appendTo(ns_more_container);

                        $('<button/>', {
                            html: '<span>Slack</span>',
                            'class': 'ns-btn slack'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'slack_fragment'});
                            window.captureFragment.event.clear();
                            window.captureFragment.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Google Drive</span>',
                        'class': 'ns-btn google'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'google_fragment'});
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_more_container);

                    if (window.captureFragment.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("editBtnQuickUpload") + '</span>',
                            'class': 'ns-btn quick'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'quick_fragment'});
                            window.captureFragment.event.clear();
                            window.captureFragment.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Print</span>',
                        'class': 'ns-btn print'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'print_fragment'});
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_more_container);

                    $('<button/>', {
                        html: '<span>' + chrome.i18n.getMessage("cropBtnSavePdf") + '</span>',
                        'class': 'ns-btn pdf'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'pdf_fragment'});
                        window.captureFragment.event.clear();
                        window.captureFragment.view.clear();
                    }).appendTo(ns_more_container);

                    if (window.is_firefox) {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("cropBtnCopy") + '</span>',
                            'class': 'ns-btn copy'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'copy_to_clipboard_fragment'});
                            window.captureFragment.event.clear();
                            window.captureFragment.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    const {width, height, y} = window.captureFragment.data.position;

                    if ((height + y + 60) > window.innerHeight) {
                        ns_crop_buttons.css({'bottom': '0', 'top': 'auto'});
                        ns_crop_more.css({'bottom': '0', 'top': 'auto'});
                    } else {
                        ns_crop_buttons.css({'bottom': 'auto', 'top': '100%'});
                        ns_crop_more.css({'bottom': 'auto', 'top': '100%'});
                    }

                    if (width < 325) ns_crop_more.css({'bottom': '0', 'top': 'auto'});

                    if ((y + height)  < 400) ns_more_container.css({'bottom': 'auto', 'margin-top': '5px'});
                    else ns_more_container.css({'bottom': '100%', 'margin-top': '0'});

                    ns_crop_more.append(ns_more_container);
                    $('#nsc_capture_fragment_box').append(ns_crop_buttons).append(ns_crop_more).addClass('nsc-select');

                    window.captureFragment.savePosition();

                    $("html, body").animate({scrollTop: y + height - window.innerHeight + 100}, "slow");
                }
            },
            init: function () {
                // window.nimbus_core.addStyleSheet("nsc-disable-scroll-capture", ".nsc-disable-scroll-capture::-webkit-scrollbar{width: 0 !important; height: 0 !important}");

                window.captureFragment.event.elements(document.body);
                $(document.body)
                    .on('mouseenter', window.captureFragment.event.enter)
                    .on('mouseleave', window.captureFragment.event.leave)
                    .trigger('mouseenter');

                $(document).on('contextmenu', window.captureFragment.event.contextmenu);
            }
        };

        window.addEventListener('keydown', function (e) {
            if (e.keyCode === 27) {
                window.captureFragment.view.clear();
                window.captureFragment.event.clear();
                window.captureFragment.event.stop(e);
            }
        }, false);

        chrome.runtime.onMessage.addListener(function (request) {
            switch (request.operation) {
                case 'content_capture_fragment_init' :
                    // console.log(request)
                    window.captureFragment.data.appType = request.appType;
                    window.captureFragment.init();
                    break;
            }
        });
    }
})(jQuery);
