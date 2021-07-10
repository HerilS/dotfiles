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

'use strict';

import MathLive from './lib/mathlive.mjs';
import * as htmlToImage from './lib/mathlive.html.to.image.mjs';

nimbus_screen.htmlToImage = htmlToImage;
nimbus_screen.mathField = MathLive.makeMathField('nsc_math_field', {
    smartMode: true,
    // virtualKeyboardMode: "onfocus",
    onContentDidChange: (mf) => {
        document.getElementById("nsc_formula_enter").value = mf.$text();
    },
});

$(async function () {
    await nscExt.initI18n();

    nimbus_screen.dom.$nsc_redactor_page = $('#nsc_redactor_page');
    nimbus_screen.dom.$nsc_video_page = $('#nsc_video_page');
    nimbus_screen.dom.$nsc_done_page = $('#nsc_done_page');
    nimbus_screen.dom.$nsc_linked = $('#nsc_linked');
    nimbus_screen.dom.$edit_canvas = $("#nsc_canvas");
    nimbus_screen.dom.$button_done = $("#nsc_done");
    nimbus_screen.dom.$app_title = $('#nsc_main_title span span');
    nimbus_screen.dom.$preview_loading = $('#nsc_preview_loading');
    nimbus_screen.dom.$nsc_indicator = $('#nsc_indicator');
    nimbus_screen.dom.$nsc_drop_file = $('#nsc_drop_file');
    nimbus_screen.dom.$nsc_pre_load = $('#nsc_pre_load');
    nimbus_screen.dom.$nsc_capture_desktop = $('#nsc_redactor_capture_desktop, #nsc_capture_desktop');
    nimbus_screen.dom.$nsc_capture_helper = $('#nsc_capture_helper');

    nimbus_screen.dom.$nsc_linked.find('input').on('focus', function () {
        $(this).select();
    });

    nimbus_screen.dom.$button_done.on('click', nimbus_screen.view.done);

    if (nimbus_screen.getLocationParam() === 'video') {
        await nimbus_screen.view.done();
    } else {
        nimbus_screen.dom.$nsc_pre_load.removeClass('nsc-hide');

        if (nimbus_screen.getLocationParam() === 'popup') {
            nimbus_screen.dom.$button_done.remove();
            $('#nsc_redactor_open_image').remove();
            $('#nsc_redactor_arrow option[value=arrow_curve]').remove();
            $('#nsc_redactor_arrow option[value=line_curve]').remove();
            $('#nsc_redactor_arrow option[value=line_dotted]').remove();
            $('#nsc_redactor_pens').closest('.nsc-panel-button ').remove();
            $('#nsc_redactor_blur').closest('.nsc-panel-button ').remove();
        }

        const {parts} = await nscCore.sendMessage({operation: 'get_file_parts'});
        const {canvas, dataURL, blob} = await nscExt.createCanvasParts(nimbus_screen.info.file.image, parts);
        nimbus_screen.info.file.image.patch = dataURL;
        nimbus_screen.info.file.image.origin_patch = dataURL;
        nimbus_screen.info.file.image.blob = blob;

        switch (nimbus_screen.getLocationParam()) {
            case 'done':
            case 'nimbus':
            case 'slack':
            case 'google':
            case 'print':
            case 'pdf':
            case 'quick':
                $(document).one('ready_done', function () {
                    $('#nsc_button_' + nimbus_screen.getLocationParam()).click();
                });
                await nimbus_screen.view.done();
                break;
            default:
                nimbus_screen.initScreenPage(canvas);
                break;
        }
    }

    $('#hotkeys_send_ns').text('(Ctrl+' + JSON.parse(localStorage.hotkeysSendNS).title + ')');

    $('#nsc_capture_helper button').on('click', function () {
        nimbus_screen.dom.$nsc_capture_helper.fadeOut(100);
        localStorage.popupHelperShow = true;
    });

    if (nimbus_screen.getLocationParam() === 'video') {
        const post = `${window.navigator.language}`;
        $('#nimbus_help_link').attr('href', 'https://nimbusweb.me/s/share/' + (window.navigator.language === 'ru' ? '3552315/yqgen0wi63dg5mpi5tqi?utm_source=capture&utm_medium=addon&utm_campaign=edit_page' : '3552243/xxvg33d1kcr7thhgtoua?utm_source=capture&utm_medium=addon&utm_campaign=edit_page'));
    } else {
        $('#nimbus_help_link').attr('href', 'https://nimbusweb.me/s/share/' + (window.navigator.language === 'ru' ? '3552389/f4vdbtq17l1zmkrhs5n1?utm_source=capture&utm_medium=addon&utm_campaign=edit_page' : '3552387/mp8nr3ee75mtgyqfonnc?utm_source=capture&utm_medium=addon&utm_campaign=edit_page'));
    }

    window.onbeforeunload = function () {
        if (nimbus_screen.getLocationParam() === 'popup') {
            (async function () {
                const object = await nimbus_screen.canvasManager.getObjects();
                localStorage.lastRedactorObject = JSON.stringify(object);
            })()
        }
    }

    $('#nsc_canvas_wrap').prepend($('#nsc_redactor_panel').clone().css('position', 'relative').css('z-index', '0'));

    $("#nsc_formula_enter").on("input", (e) => {
        nimbus_screen.mathField.$latex(e.target.value);
    });

    if (window.nimbus_core.is_firefox) $('#nsc_popup_premium').width('320px');

    if (localStorage.appType === 'google') {
        $('#nsc_button_nimbus').addClass('nsc-hide');
        $('#nsc_button_quick').addClass('nsc-hide');
        $('.nsc-trigger-panel-container.dropbox').addClass('nsc-hide');
        $('#nsc_button_slack').addClass('nsc-hide');
        $('.nsc-nimbus-comment').addClass('nsc-hide');
        $('.nsc-indicator-screen-info-enable-watermark').addClass('nsc-hide');
        $('#nsc_button_youtube').addClass('nsc-hide');
        $('#nsc_video_crop').closest('.nsc-ve-actions-button').addClass('nsc-hide');
        $('.nsc-ve-actions-group').css('border', 'none');
        $('#nsc_video_button_cup').removeClass('nsc-hide');
    }

    if (nimbus_core.is_app) {
        $('.nsc-indicator-screen-info-enable-watermark').addClass('nsc-hide');
    }

    chrome.runtime.onMessage.addListener(function (request) {
        if (request.operation === 'shortcut_load_to_ns_change') {
            $('#hotkeys_send_ns').text('(Ctrl+' + JSON.parse(localStorage.hotkeysSendNS).title + ')');
        }

        if (request.operation === 'event' && nimbus_screen.getLocationParam() !== 'video') {
            switch (request.type) {
                case 'enable-watermark':
                case 'type-watermark':
                case 'percent-watermark':
                case 'alpha-watermark':
                case 'font-watermark':
                case 'size-watermark':
                case 'text-watermark':
                case 'file-watermark':
                case 'color-watermark':
                case 'position-watermark':
                    nimbus_screen.changeWaterMark();
                    break;
            }
        }
    });
})


