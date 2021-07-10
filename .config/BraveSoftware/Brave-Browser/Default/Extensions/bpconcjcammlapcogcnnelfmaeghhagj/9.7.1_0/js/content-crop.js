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
    if (!window.captureCrop) {
        window.captureCrop = {
            cropper: null,
            data: {
                format: null,
                quality: null,
                dataUrl: null,
                position: null,
                appType: null
            },
            savePosition: function () {
                chrome.runtime.sendMessage({operation: 'save_crop_position', value: window.captureCrop.data.position});
            },
            view: {
                clear: function () {
                    $('#nsc_crop').remove();
                    $('.nsc-popup-action-message').remove();
                    $('html').css("overflow", "auto");
                },
                loupe: function (clientX, clientY) {
                    clientX = clientX - 1;
                    clientY = clientY - 1;

                    let $loupe = $("#nsc_crop_loupe").show();

                    let z = window.nimbus_core.is_chrome ? window.devicePixelRatio : 1;
                    let img = document.getElementById('nsc_crop_image');
                    let canvas = document.getElementById('nsc_crop_loupe_canvas');
                    let context = canvas.getContext('2d');
                    let wi = document.documentElement.clientWidth;
                    let hi = document.documentElement.clientHeight;
                    let x = (clientX - 10) * z;
                    let y = (clientY - 10) * z;
                    let h = 30;
                    let w = 30;
                    let x2 = 0;
                    let y2 = 0;
                    let lh = $loupe.height() + 10;
                    let lw = $loupe.width() + 10;
                    let positionLoupe = {x: 10, y: 10};

                    if (clientX < lw + 20 && clientY < lh + 20) positionLoupe = {x: wi - lw, y: hi - lh};

                    $loupe.css({top: positionLoupe.y, left: positionLoupe.x});
                    $loupe.find('div').text('X = ' + Math.ceil(clientX) + ' : Y = ' + Math.ceil(clientY));

                    context.canvas.width = 240;
                    context.canvas.height = 240;

                    if (x < 0) {
                        x2 = (-8) * x;
                        x = 0;
                    }
                    if (y < 0) {
                        y2 = (-8) * y;
                        y = 0;
                    }
                    if ((clientX + 15) > wi) w = wi - clientX + 14;

                    if ((clientY + 15) > hi) h = hi - clientY + 14;

                    let zoom = 8;
                    let offctx = document.createElement('canvas').getContext('2d');
                    offctx.drawImage(img, x, y, w, h, 0, 0, w, h);
                    let imgDt = offctx.getImageData(0, 0, w, h).data;

                    for (let xx = 0; xx < w; ++xx) {
                        for (let yy = 0; yy < h; ++yy) {
                            let i = (yy * w + xx) * 4;
                            let r = imgDt[i];
                            let g = imgDt[i + 1];
                            let b = imgDt[i + 2];
                            let a = imgDt[i + 3];
                            context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
                            context.fillRect(x2 + xx * zoom, y2 + yy * zoom, zoom, zoom);
                        }
                    }
                    context.lineWidth = 1;
                    context.strokeStyle = "#FF6600";
                    context.beginPath();
                    context.moveTo(120, 0);
                    context.lineTo(120, 240);
                    context.moveTo(0, 120);
                    context.lineTo(240, 120);
                    context.stroke();
                },
                button: function () {
                    if ($("#ns_crop_button").length || $("#ns_crop_more").length) {
                        $('#ns_crop_button').removeClass('nsc-hide');
                        $('#ns_crop_more').removeClass('nsc-hide');
                        return;
                    }

                    let ns_crop_buttons = $('<div/>', {
                        'id': 'ns_crop_button',
                        'class': 'ns-crop-buttons'
                    });

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnEdit") + '</span>',
                        'class': 'ns-btn edit'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'redactor'});
                        // chrome.runtime.sendMessage({operation: 'activate_capture', value: 'capture-selected'});
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
                    }).appendTo(ns_crop_buttons);

                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
                        'class': 'ns-btn save'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'download'});
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
                    }).appendTo(ns_crop_buttons);


                    $('<button/>', {
                        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
                        'class': 'ns-btn cancel'
                    }).on('click', function () {
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
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

                    if (window.captureCrop.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>Nimbus</span>',
                            'class': 'ns-btn nimbus'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'nimbus'});
                            window.captureCrop.cropper.destroy();
                            window.captureCrop.view.clear();
                        }).appendTo(ns_more_container);

                        $('<button/>', {
                            html: '<span>Slack</span>',
                            'class': 'ns-btn slack'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'slack'});
                            window.captureCrop.cropper.destroy();
                            window.captureCrop.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Google Drive</span>',
                        'class': 'ns-btn google'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'google'});
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
                    }).appendTo(ns_more_container);

                    if (window.captureCrop.data.appType === 'nimbus') {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("editBtnQuickUpload") + '</span>',
                            'class': 'ns-btn quick'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'quick'});
                            window.captureCrop.cropper.destroy();
                            window.captureCrop.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    $('<button/>', {
                        html: '<span>Print</span>',
                        'class': 'ns-btn print'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'print'});
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
                    }).appendTo(ns_more_container);

                    $('<button/>', {
                        html: '<span>' + chrome.i18n.getMessage("cropBtnSavePdf") + '</span>',
                        'class': 'ns-btn pdf'
                    }).on('click', function () {
                        chrome.runtime.sendMessage({operation: 'send_to', path: 'pdf'});
                        window.captureCrop.cropper.destroy();
                        window.captureCrop.view.clear();
                    }).appendTo(ns_more_container);

                    if (window.nimbus_core.is_firefox) {
                        $('<button/>', {
                            html: '<span>' + chrome.i18n.getMessage("cropBtnCopy") + '</span>',
                            'class': 'ns-btn copy'
                        }).on('click', function () {
                            chrome.runtime.sendMessage({operation: 'send_to', path: 'copy_to_clipboard'});
                            window.captureCrop.cropper.destroy();
                            window.captureCrop.view.clear();
                        }).appendTo(ns_more_container);
                    }

                    ns_crop_more.append(ns_more_container);
                    $('.cropper-crop-box').append('<div id="ns_crop_screenshot_size" class="ns-crop-size"></div>').append(ns_crop_buttons).append(ns_crop_more);
                },
                coords: function () {
                    let position = window.captureCrop.data.position;
                    let z = window.nimbus_core.is_chrome ? window.devicePixelRatio : 1;

                    $('#ns_crop_screenshot_size').text(position.width + ' x ' + position.height);

                    if ((position.height + position.y + 100) > window.innerHeight * z) {
                        $('#ns_crop_button').css({'bottom': '0', 'top': 'auto'});
                        $('#ns_crop_more').css({'bottom': '0', 'top': 'auto', 'left': 'auto', 'right': '0'});
                    } else {
                        $('#ns_crop_button').css({'bottom': 'auto', 'top': '100%'});
                        $('#ns_crop_more').css({'bottom': 'auto', 'top': '100%', 'left': 'auto', 'right': '0'});
                    }

                    if (position.width < 500) {
                        $('#ns_crop_more').css({'bottom': '0', 'top': 'auto'});
                        if ((position.height + position.y + 100) > window.innerHeight * z) $('#ns_crop_more').css({'left': '100%', 'right': 'auto'});
                    }

                    if (position.y < 50) $('#ns_crop_screenshot_size').css({'bottom': 'auto', 'top': '0'});
                    else $('#ns_crop_screenshot_size').css({'bottom': '100%', 'top': 'auto'});

                    if (position.y + position.height < 400) $('#ns_more_container').css({'bottom': 'auto', 'margin-top': '5px'});
                    else $('#ns_more_container').css({'bottom': '100%', 'margin-top': '0'});
                }
            },
            init: function () {
                chrome.runtime.sendMessage({operation: 'get_option', key: 'popupActionMessageCrop'}, function (option) {
                    if (option !== 'true') {
                        $(document.body).append($('<div>').addClass('nsc-popup-action-message').text(chrome.i18n.getMessage("popupActionMessageCrop")));
                        window.setTimeout(function () {
                            $('.nsc-popup-action-message').hide(function () {
                                $(this).remove();
                                chrome.runtime.sendMessage({operation: 'set_option', key: 'popupActionMessageCrop', value: 'true'});
                            })
                        }, 3000);
                    }
                });

                $('html').css("overflow", "hidden");

                let $nsc_crop = $('<div/>', {id: 'nsc_crop'});
                $nsc_crop.append($('<img/>', {id: 'nsc_crop_image', src: window.captureCrop.data.dataUrl}));
                $nsc_crop.append($('<div/>', {id: 'nsc_crop_loupe', class: 'nsc-crop-loupe'}).append($('<canvas/>', {id: 'nsc_crop_loupe_canvas'})).append($('<div/>')));


                $nsc_crop.appendTo('body');

                window.captureCrop.cropper = new Cropper(document.getElementById('nsc_crop_image'), {
                    autoCrop: false,
                    zoomable: false,
                    viewMode: 1,
                    toggleDragModeOnDblclick: false,
                    ready: function () {
                        $('.cropper-bg').css('background-image', 'inherit');

                        chrome.runtime.sendMessage({operation: 'get_crop_position'}, function (response) {
                            if (response.x && response.y && response.width && response.height) {
                                let z = window.nimbus_core.is_chrome ? window.devicePixelRatio : 1;
                                window.captureCrop.cropper.crop().setCropBoxData({left: response.x / z, top: response.y / z, width: response.width / z, height: response.height / z});
                                window.captureCrop.data.position = window.captureCrop.cropper.getData(true);
                                window.captureCrop.view.button();
                                window.captureCrop.view.coords();
                            }
                        });
                    },
                    cropstart: function () {
                        window.captureCrop.data.position = window.captureCrop.cropper.getData(true);
                        window.captureCrop.view.button();

                        $('#ns_crop_button').addClass('nsc-hide');
                        $('#ns_crop_more').addClass('nsc-hide');
                    },
                    cropmove: function (e) {
                        window.captureCrop.view.loupe(e.detail.originalEvent.clientX, e.detail.originalEvent.clientY);

                        window.captureCrop.data.position = window.captureCrop.cropper.getData(true);
                        window.captureCrop.view.coords();
                    },
                    cropend: function () {
                        window.captureCrop.data.position = window.captureCrop.cropper.getData(true);
                        window.captureCrop.view.button();
                        window.captureCrop.savePosition();
                    },
                    crop: function (event) {
                        // console.log(event);


                    }
                });

                $('body').on('mousemove', function (e) {
                    if ($('#nsc_crop').length) window.captureCrop.view.loupe(e.clientX, e.clientY)
                });
            }
        };

        window.addEventListener('keydown', function (evt) {
            if (evt.keyCode === 27) {
                window.captureCrop.cropper && window.captureCrop.cropper.destroy();
                window.captureCrop.view.clear();
            }
        }, false);

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            switch (request.operation) {
                case 'crop_data_screen' :
                    window.captureCrop.data.format = request.format;
                    window.captureCrop.data.quality = request.quality;
                    window.captureCrop.data.dataUrl = request.dataUrl;
                    window.captureCrop.data.appType = request.appType;

                    window.captureCrop.init();
                    break;
            }
        });
    }
}(jQuery));
