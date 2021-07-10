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
/**
 * Created by hasesanches on 16.12.2016.
 */

function createCoords() {
    if ($("#ns_crop_button").length) {
        $('#ns_crop_button').show();
        return;
    }

    let ns_crop_buttons = $('<div/>', {
        'id': 'ns_crop_button',
        'class': 'ns-crop-buttons'
    });

    $('<button/>', {
        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
        'class': 'ns-btn save'
    }).on('click', function () {
        $('#nsc_crop').remove();
        cropper && cropper.destroy();
        $(document).trigger('redactor_set_tools', nimbus_screen.canvasManager.getTools());
        nimbus_screen.canvasManager.cropImage(window.cropper_data);
    }).appendTo(ns_crop_buttons);

    $('<button/>', {
        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
        'class': 'ns-btn cancel'
    }).on('click', function () {
        $('#nsc_crop').remove();
        cropper && cropper.destroy();
        $("#nsc_redactor_crop").trigger('click');
    }).appendTo(ns_crop_buttons);

    $('.cropper-crop-box').append('<div id="ns_crop_screenshot_size" class="ns-crop-size"></div>').append(ns_crop_buttons);
}

function showCoords() {
    let data = window.cropper_data;
    let zoom = nimbus_screen.canvasManager.getZoom();
    let size = nimbus_screen.getEditCanvasSize();
    $('#ns_crop_screenshot_size').text(Math.round(data.width / zoom) + ' x ' + Math.round(data.height / zoom));

    if ((data.height + data.y + 60) > (size.h * zoom)) {
        $('#ns_crop_button').css({'bottom': '0', 'top': 'auto'});
    } else {
        $('#ns_crop_button').css({'bottom': 'auto', 'top': '100%'});
    }

    if (data.y < 25) {
        $('#ns_crop_screenshot_size').css({'bottom': 'auto', 'top': '0'});
    } else {
        $('#ns_crop_screenshot_size').css({'bottom': '100%', 'top': 'auto'});
    }
}
