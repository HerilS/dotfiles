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
    if (window.__nscContentScriptScrollCrop) return;
    window.__nscContentScriptScrollCrop = true;

    window.thisScrollCrop = true;
    window.captureScrollCrop = {
        data: {
            appType: null
        }
    };
    let cropper;

    function autoScroll(event) {
        let clientY = event.clientY,
            clientX = event.clientX,
            restY = window.innerHeight - clientY,
            restX = window.innerWidth - clientX,
            scrollTop = window.pageYOffset,
            scrollLeft = window.pageXOffset;
        if (clientY < 100) scrollTop -= 100;
        if (clientX < 100) scrollLeft -= 100;
        if (restY < 100) scrollTop += 100 - restY;
        if (restX < 100) scrollLeft += 100 - restX;

        window.scrollTo(scrollLeft, scrollTop);
    }

    function shadowScroll(data) {
        $('.cropper-modal').css('background-color', 'transparent');
        let page = getSize();

        if (!$('.cropper-shadow').length) {
            $('.cropper-modal')
                .append($('<div/>').addClass('cropper-shadow cropper-shadow-top'))
                .append($('<div/>').addClass('cropper-shadow cropper-shadow-left'))
                .append($('<div/>').addClass('cropper-shadow cropper-shadow-right'))
                .append($('<div/>').addClass('cropper-shadow cropper-shadow-bottom'))
        }

        $('.cropper-shadow-top').css({
            left: data.x,
            width: data.width,
            height: data.y
        });
        $('.cropper-shadow-bottom').css({
            top: data.y + data.height,
            left: data.x,
            width: data.width,
            height: page.h - data.height - data.y
        });
        $('.cropper-shadow-right').css({
            left: data.x + data.width,
            width: page.w - data.width - data.x
        });
        $('.cropper-shadow-left').css({
            width: data.x
        });
    }

    function getSize() {
        let body = document.body,
            html = document.documentElement,
            width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth),
            height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

        let maxSize = 32767;
        let maxArea = 268435456;
        width = Math.ceil(Math.min(width, maxSize));
        height = Math.ceil(Math.min(height, maxSize));

        if (width * height > maxArea) {
            height = Math.floor(maxArea / width);
        }

        return {w: width, h: height};
    }

    function scrollCrop() {
        afterClearCapture(true);

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

        let page = getSize();
        let pole = $('<div id="nsc_crop">').css({
            width: page.w,
            height: page.h,
            position: 'absolute',
            // left: '0',
            // top: '0',
            // zIndex: 999999999,
        }).append('<div class="cropNotification">' + chrome.i18n.getMessage("notificationCrop") + '</div>');

        let canvas = document.createElement('canvas');
        canvas.id = 'nsc_crop_image';
        canvas.width = page.w;
        canvas.height = page.h;
        $(canvas).appendTo(pole);

        pole.appendTo('body');

        const image = document.getElementById('nsc_crop_image');
        cropper = new Cropper(image, {
            autoCrop: false,
            zoomable: false,
            viewMode: 1,
            toggleDragModeOnDblclick: false,
            ready: function () {
                // console.log('ready')
                $('.cropper-bg').css('background-image', 'inherit');

                chrome.runtime.sendMessage({operation: 'get_crop_scroll_position'}, function (response) {
                    if (response.x && response.y && response.x && response.width && response.height && response.x + response.width <= page.w && response.y + response.height <= page.h) {
                        cropper.crop().setCropBoxData({left: response.x, top: response.y, width: response.width, height: response.height});
                        let data = cropper.getData(true);
                        createCoords(data);
                        showCoords(data);
                        $("html, body").animate({scrollTop: response.y}, "slow");
                    }
                });
            },
            cropstart: function (e) {
                // console.log('cropstart')
                let data = cropper.getData(true);
                createCoords(data);

                $('#ns_crop_button').addClass('nsc-hide');
                $('#ns_crop_more').addClass('nsc-hide');
            },
            cropmove: function (e) {
                // console.log('cropmove')
                autoScroll(e.detail.originalEvent);
                let data = cropper.getData(true);

                showCoords(data);
            },
            cropend: function () {
                // console.log('cropend')
                let data = cropper.getData(true);

                createCoords(data);
                saveCropPosition(data);
            },
            crop: function () {
                // console.log('crop')
                let data = cropper.getData(true);
                shadowScroll(data)
            }
        });
    }

    function createCoords() {
        if ($("#ns_crop_button").length || $("#ns_crop_more").length) {
            $('#ns_crop_button').removeClass('nsc-hide');
            $('#ns_crop_more').removeClass('nsc-hide');
            return;
        }

        let ns_crop_buttons = $('<div/>', {
            'id': 'ns_crop_button',
            'class': 'ns-crop-buttons bottom'
        });


        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnEdit") + '</span>',
            'class': 'ns-btn edit'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'redactor_scroll'});
            destroyCrop();
        }).appendTo(ns_crop_buttons);

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
            'class': 'ns-btn save'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'download_scroll'});
            destroyCrop();
        }).appendTo(ns_crop_buttons);
        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
            'class': 'ns-btn cancel'
        }).on('click', function () {
            destroyCrop();
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

        if (window.captureScrollCrop.data.appType === 'nimbus') {
            $('<button/>', {
                html: '<span>Nimbus</span>',
                'class': 'ns-btn nimbus'
            }).on('click', function () {
                chrome.runtime.sendMessage({operation: 'send_to', path: 'nimbus_scroll'});
                destroyCrop();
            }).appendTo(ns_more_container);

            $('<button/>', {
                html: '<span>Slack</span>',
                'class': 'ns-btn slack'
            }).on('click', function () {
                chrome.runtime.sendMessage({operation: 'send_to', path: 'slack_scroll'});
                destroyCrop();
            }).appendTo(ns_more_container);
        }

        $('<button/>', {
            html: '<span>Google Drive</span>',
            'class': 'ns-btn google'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'google_scroll'});
            destroyCrop();
        }).appendTo(ns_more_container);

        if (window.captureScrollCrop.data.appType === 'nimbus') {
            $('<button/>', {
                html: '<span>' + chrome.i18n.getMessage("editBtnQuickUpload") + '</span>',
                'class': 'ns-btn quick'
            }).on('click', function () {
                chrome.runtime.sendMessage({operation: 'send_to', path: 'quick_scroll'});
                destroyCrop();
            }).appendTo(ns_more_container);
        }

        $('<button/>', {
            html: '<span>Print</span>',
            'class': 'ns-btn print'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'print_scroll'});
            destroyCrop();
        }).appendTo(ns_more_container);

        $('<button/>', {
            html: '<span>' + chrome.i18n.getMessage("cropBtnSavePdf") + '</span>',
            'class': 'ns-btn pdf'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'pdf_scroll'});
            destroyCrop();
        }).appendTo(ns_more_container);

        if (window.nimbus_core.is_firefox) {
            $('<button/>', {
                html: '<span>' + chrome.i18n.getMessage("cropBtnCopy") + '</span>',
                'class': 'ns-btn copy'
            }).on('click', function () {
                chrome.runtime.sendMessage({operation: 'send_to', path: 'copy_to_clipboard_scroll'});
                destroyCrop();
            }).appendTo(ns_more_container);
        }

        ns_crop_more.append(ns_more_container);
        $('.cropper-crop-box').append('<div id="ns_crop_screenshot_size" class="ns-crop-size"></div>').append(ns_crop_buttons).append(ns_crop_more);
    }

    function saveCropPosition(data) {
        chrome.runtime.sendMessage({operation: 'save_crop_scroll_position', value: data});
    }

    function destroyCrop() {
        // enableFixedPosition(true);
        beforeClearCapture(true);
        $('#nsc_crop').remove();
        $('.nsc-popup-action-message').remove();
        cropper.destroy();
        window.thisScrollCrop = false;
    }

    function showCoords(data) {
        let z = window.nimbus_core.is_chrome ? window.devicePixelRatio : 1;

        $('#ns_crop_screenshot_size').text(Math.ceil(data.width * z) + ' x ' + Math.ceil(data.height * z));

        if ((data.height * z + data.y * z + 100) > window.innerHeight * z) {
            $('#ns_crop_button').css({'bottom': '0', 'top': 'auto'});
            $('#ns_crop_more').css({'bottom': '0', 'top': 'auto'});
        } else {
            $('#ns_crop_button').css({'bottom': 'auto', 'top': '100%'});
            $('#ns_crop_more').css({'bottom': 'auto', 'top': '100%'});
        }

        if (data.width * z < 500) $('#ns_crop_more').css({'bottom': '0', 'top': 'auto'});

        if (data.y * z < 50) $('#ns_crop_screenshot_size').css({'bottom': 'auto', 'top': '0'});
        else $('#ns_crop_screenshot_size').css({'bottom': '100%', 'top': 'auto'});

        if ((data.y + data.height) * z < 400) $('#ns_more_container').css({'bottom': 'auto', 'margin-top': '5px'});
        else $('#ns_more_container').css({'bottom': '100%', 'margin-top': '0'});
    }

    window.addEventListener('keydown', function (evt) {
        evt = evt || window.event;
        if (evt.keyCode === 27) {
            destroyCrop();
        }
    }, false);

    $(window).on('contextmenu', destroyCrop);

    // pole.bind({
    //     'mousemove': function (e) {
    //         // console.log('mousemove')
    //         if (e.which === 3) {
    //             destroyCrop();
    //             return false;
    //         }
    //         // autoScroll(e)
    //     },
    //     'contextmenu': function (e) {
    //         // console.log('contextmenu')
    //         destroyCrop();
    //         return false;
    //     }
    // });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.operation) {
            case 'scroll_crop_data_screen' :
                scrollCrop();

                window.captureScrollCrop.data.appType = request.appType;
                break;
        }
    });

}(jQuery));
