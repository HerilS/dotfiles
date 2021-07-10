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
    if (!window.captureFragmentScroll) {
        window.captureFragmentScroll = {
            data: {
                position: {},
                elem: null,
                appType: null
            },
            savePosition() {
                chrome.runtime.sendMessage({operation: 'save_fragment_scroll_position', value: window.captureFragmentScroll.data.position});
            },
            event: {
                stop: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                },
                clear: function () {
                    window.captureFragmentScroll.event.elements(document.body, true);

                    $(document.body)
                        .off('mouseenter')
                        .off('mouseleave')
                        .off('mousemove touchmove')
                        .off('mouseup touchend');

                    $('*').off('contextmenu');
                },
                elements: function (elem, remove) {
                    if (remove) $(elem).off('click', window.captureFragmentScroll.event.stop);
                    else $(elem).on('click', window.captureFragmentScroll.event.stop);

                    const childrens = $(elem).children();
                    for (let i = 0, len = childrens.length; i < len; i++) {
                        window.captureFragmentScroll.event.elements(childrens[i], remove);
                    }
                },
                contextmenu: function (e) {
                    window.captureFragmentScroll.view.clear();
                    window.captureFragmentScroll.event.stop(e);
                }
            },
            view: {
                clear: function () {
                    $('#nsc_capture_fragment_box').remove();
                    $('.nsc-capture-fragment-scroll-box').remove();
                    $('.nsc-popup-action-message').remove();
                },
                border: function (elem) {
                    let $elem = $(elem);

                    window.captureFragmentScroll.data.position = {
                        x: Math.round($elem.offset().left),
                        y: Math.round($elem.offset().top),
                        width: Math.round($elem.outerWidth()),
                        height: Math.round($elem.outerHeight())
                    };

                    window.captureFragmentScroll.data.elem = elem;

                    if (!$('.nsc-capture-fragment-box').length) $(document.body).append($('<div>', {class: 'nsc-capture-fragment-box', id: 'nsc_capture_fragment_box'}));

                    $('#nsc_capture_fragment_box').css({
                        top: window.captureFragmentScroll.data.position.y + 3,
                        left: window.captureFragmentScroll.data.position.x + 3,
                        width: window.captureFragmentScroll.data.position.width - 9,
                        height: window.captureFragmentScroll.data.position.height - 9
                    });
                },
                button: function (elem) {
                    window.captureFragmentScroll.event.clear();

                    let ns_crop_buttons = $('<div/>', {
                        'id': 'screenshotbutton',
                        'class': 'ns-crop-buttons bottom'
                    });
                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnEdit") + '</span>',
                        'class': 'ns-btn edit'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'redactor_fragment'});

                    }).appendTo(ns_crop_buttons);

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
                        'class': 'ns-btn save'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'download_fragment'});
                    }).appendTo(ns_crop_buttons);

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
                        'class': 'ns-btn cancel'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
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

                    if (window.captureFragmentScroll.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>Nimbus</span>',
                            'class': 'ns-btn nimbus'
                        }).on('click', function () {
                            window.captureFragmentScroll.view.clear();
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'nimbus_fragment'});
                        }).appendTo(ns_more_container);

                        $('<button/>', {
                            html: '<span>Slack</span>',
                            'class': 'ns-btn slack'
                        }).on('click', function () {
                            window.captureFragmentScroll.view.clear();
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'slack_fragment'});
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Google Drive</span>',
                        'class': 'ns-btn google'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'google_fragment'});
                    }).appendTo(ns_more_container);

                    if (window.captureFragmentScroll.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("editBtnQuickUpload") + '</span>',
                            'class': 'ns-btn quick'
                        }).on('click', function () {
                            window.captureFragmentScroll.view.clear();
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'quick_fragment'});
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Print</span>',
                        'class': 'ns-btn print'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'print_fragment'});
                    }).appendTo(ns_more_container);

                    $('<button/>', {
                        html: '<span>' + chrome.i18n.getMessage("cropBtnSavePdf") + '</span>',
                        'class': 'ns-btn pdf'
                    }).on('click', function () {
                        window.captureFragmentScroll.view.clear();
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'pdf_fragment'});
                    }).appendTo(ns_more_container);

                    if (window.is_firefox) {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("cropBtnCopy") + '</span>',
                            'class': 'ns-btn copy'
                        }).on('click', function () {
                            window.captureFragmentScroll.view.clear();
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'copy_to_clipboard_fragment'});
                        }).appendTo(ns_more_container);
                    }

                    const {width, height, y} = window.captureFragmentScroll.data.position;

                    if ((height + y + 100) > window.innerHeight) {
                        ns_crop_buttons.css({'bottom': '0', 'top': 'auto'});
                        ns_crop_more.css({'bottom': '0', 'top': 'auto'});
                    } else {
                        ns_crop_buttons.css({'bottom': 'auto', 'top': '100%'});
                        ns_crop_more.css({'bottom': 'auto', 'top': '100%'});
                    }

                    if (width < 500) ns_crop_more.css({'bottom': '0', 'top': 'auto'});

                    if ((y + height) < 400) ns_more_container.css({'bottom': 'auto', 'margin-top': '5px'});
                    else ns_more_container.css({'bottom': '100%', 'margin-top': '0'});

                    ns_crop_more.append(ns_more_container);
                    $('#nsc_capture_fragment_box').append(ns_crop_buttons).append(ns_crop_more).addClass('nsc-select');

                    window.captureFragmentScroll.savePosition();

                    $("html, body").animate({scrollTop: y + height - window.innerHeight + 100}, "slow");
                }
            },
            init: function () {
                let size = window.nimbus_core.getSizePage();
                let box = $('<div>').css({width: size.w, height: size.h}).addClass('nsc-capture-fragment-scroll-box');

                let elems_scroll = [];

                let search_scroll_elem = function (parent) {
                    const currents = parent.children;
                    for (let i = 0, len = currents.length; i < len; i++) {
                        let current = currents[i];
                        let children = current.children;

                        for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
                            if (children[i2].clientHeight > current.clientHeight + 20 && current.clientHeight !== 0) {
                                elems_scroll.push(current)
                            }
                        }

                        search_scroll_elem(current);
                    }
                };

                search_scroll_elem(document.body);

                for (let i = 0, len = elems_scroll.length; i < len; i++) {
                    const style = elems_scroll[i].getBoundingClientRect();
                    box.append(
                        $('<div>').addClass('nsc-capture-fragment-scroll-elem').css({width: style.width - 9, height: style.height - 9, top: style.top + 3, left: style.left + 3}).on('click', function (elem) {
                            $('.nsc-capture-fragment-scroll-box').remove();
                            window.captureFragmentScroll.view.border(elem);
                            window.captureFragmentScroll.view.button(elem);

                        }.bind(this, elems_scroll[i]))
                    )
                }

                window.captureFragmentScroll.event.elements(document.body);
                $(document.body).append(box);

                chrome.runtime.sendMessage({operation: 'get_option', key: 'popupActionMessageFragmentScroll'}, function (option) {
                    if (option !== 'true') {
                        $(document.body).append($('<div>').addClass('nsc-popup-action-message').text(chrome.i18n.getMessage("popupActionMessageFragmentScroll")));
                        window.setTimeout(function () {
                            $('.nsc-popup-action-message').hide(function () {
                                $(this).remove();
                                chrome.runtime.sendMessage({operation: 'set_option', key: 'popupActionMessageFragmentScroll', value: 'true'});
                            })
                        }, 3000);
                    }
                });

                $(document).on('contextmenu', window.captureFragmentScroll.event.contextmenu);
            }
        };

        window.addEventListener('keydown', function (e) {
            if (e.keyCode === 27) {
                window.captureFragmentScroll.view.clear();
                window.captureFragmentScroll.event.clear();
            }
        }, false);

        chrome.runtime.onMessage.addListener(function (request) {
            switch (request.operation) {
                case 'content_capture_scroll_fragment_init' :
                    window.captureFragmentScroll.data.appType = request.appType;
                    window.captureFragmentScroll.init();
                    break;
            }
        });
    }
})(jQuery);