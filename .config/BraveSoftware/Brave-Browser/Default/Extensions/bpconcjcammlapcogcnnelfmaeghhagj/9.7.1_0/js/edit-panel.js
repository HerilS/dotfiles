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

var cropper = null;
window.cropper_data = {};

$(document).on('ready_redactor', function () {
    if (localStorage.redactorEnableNumbers === 'true') {
        $('#nsc_redactor_numbers option').attr('selected', false).prop("selected", false).filter('[value="numbers"]').attr('selected', 'selected').prop("selected", true)
    }
    let tooltipSetting = {
        hide: false,
        position: {my: "left bottom", at: "left top"}
    };
    let $panel_button = $('.nsc-panel-button');
    $panel_button
        .tooltip(tooltipSetting)
        .on('click', function (e) {
            $('#nsc_crop').remove();
            cropper && cropper.destroy();

            if ($(this).hasClass('not_change_active')) {
                $panel_button.filter(this).toggleClass('active');
            } else if (!$(this).find('select').length) {
                $panel_button.not('.change').removeClass('active').filter(this).addClass('active');
                if (localStorage.redactorEnableNumbers === 'true') {
                    $('#nsc_redactor_numbers').closest('.nsc-panel-button').addClass('active')
                }
            } else {
                if ($(e.target).hasClass('.nsc-panel-text') || $(e.target).closest('.nsc-panel-text').length) {
                    let $targetButton = ($(e.target).closest('.nsc-panel-select').length ? $(e.target).closest('.nsc-panel-select') : $(e.target)).closest('.nsc-panel-button');
                    let $option = $targetButton.find('select option:selected');

                    $panel_button.not('.change').removeClass('active').filter($targetButton).addClass('active');
                    $targetButton.find('li').removeClass('active').filter('[data-value=\'' + $option.val() + '\']').addClass('active').trigger('click');
                }
            }
        })
        .contextmenu(function (e) {
            if ($(e.currentTarget).hasClass('tools') && confirm('Set this tool as your default instrument?')) {
                let id = $(e.currentTarget).find('option:selected').data('toolId');
                if ($(e.target).closest('.nsc-panel-dropdown-icon').length) {
                    id = $(e.target).closest('.nsc-panel-dropdown-icon').data('toolId');
                }
                localStorage.redactorDefaultTool = id;
                window.nimbus_core.setOption('defaultTool', localStorage.redactorDefaultTool);
                $(document).trigger('redactor_set_tools', localStorage.redactorDefaultTool);
            }
            return false;
        })
        .find('select')
        .each(function () {
            let select = this;
            let select_id = $(select).data('id');
            $(select)
                .on('change_js', function (e) {
                    if (select_id !== undefined && localStorage['redactorSelect' + select_id]) {
                        $(this).find('option').attr('selected', false).prop("selected", false).filter('[value="' + localStorage['redactorSelect' + select_id] + '"]').attr('selected', 'selected').prop("selected", true);
                    }

                    let $option_selected = $(this).find('option:selected');
                    let $panel_text = $(this).closest('.nsc-panel-button').find('.nsc-panel-text');
                    $panel_text.attr('title', $option_selected.attr('title')).tooltip(tooltipSetting);

                    if ($panel_text.find('.nsc-panel-text-font').length) {
                        $panel_text.find('.nsc-panel-text-font').text($option_selected.text());
                    } else if ($panel_text.find('.nsc-panel-text-value').length) {
                        if ($option_selected.data('icon')) {
                            $panel_text.find('.nsc-panel-text-value').prev('span').remove().end().before($('<span>').addClass($option_selected.data('icon')))
                        }
                        $panel_text.find('.nsc-panel-text-value').text($option_selected.text());
                    } else {
                        $panel_text.find('span').attr('class', $option_selected.attr('class'));
                    }
                })
                .trigger('change_js')
                .hide()
                .after($('<ul>'))
                .find('option')
                .each(function (index, option) {
                    $(select)
                        .next('ul')
                        .append(
                            $('<li>')
                                .addClass($(select).attr('class'))
                                .attr('data-tool-id', $(option).data('toolId'))
                                .attr('title', $(option).data('i18n') ? chrome.i18n.getMessage($(option).data('i18n')) : '')
                                .attr('data-value', $(option).val())
                                .on('click_js', function () {
                                    localStorage['redactorSelect' + select_id] = $(this).data('value');
                                    let $targetButton = $(select).closest('.nsc-panel-button');
                                    if (!$targetButton.hasClass('not_change_active')) {
                                        $panel_button.not('.change').removeClass('active').find('li').removeClass('active').end().filter($targetButton).addClass('active');
                                    }

                                    $(this).addClass('active');

                                    $(select).find('option').attr('selected', false).prop("selected", false).filter('[value="' + $(this).data('value') + '"]').attr('selected', 'selected').prop("selected", true);
                                    $(option).closest('.nsc-panel-dropdown').hide().trigger('hide');
                                    $(select).trigger('change_js');

                                    if (localStorage.redactorEnableNumbers === 'true') {
                                        $('#nsc_redactor_numbers').closest('.nsc-panel-button').addClass('active')
                                    }
                                })
                                .on('click', function () {
                                    $(this).trigger('click_js');
                                    $(select).trigger('change');
                                })
                                .tooltip(tooltipSetting)
                                .append(function () {
                                        let dom = [];
                                        if ($(option).data('icon')) {
                                            dom.push($('<span>').addClass($(option).data('icon')))
                                        }
                                        dom.push($('<span>').addClass($(option).attr('class')).text($(option).text()));
                                        return dom;
                                    }
                                )
                        )
                })
        });

    $(document).on('click', function (e) {
        let $target_dropdown = $(e.target).closest('.nsc-panel-dropdown');
        if (($(e.target).closest('.nsc-panel-trigger').length && $(e.target).closest('.nsc-panel-select').length)
            || ($(e.target).closest('.nsc-panel-text').length && $(e.target).closest('.nsc-panel-button').hasClass('assembled'))) {
            let $target = $(e.target).closest('.nsc-panel-select').length ? $(e.target).closest('.nsc-panel-select') : $(e.target);
            $target_dropdown = $target.next('.nsc-panel-dropdown');
            if ($target_dropdown.is(':visible')) {
                $target_dropdown.hide().trigger('hide');
            } else {
                $target_dropdown.show().trigger('show');
            }
        }
        $('.nsc-panel-dropdown').not($target_dropdown).hide().trigger('hide');
    });

    $(window).keydown(function (e) {
        if (e.keyCode === 27 || e.keyCode === 13) $('.nsc-panel-dropdown:visible').hide();
    });

    $(document).on('redactor_set_tools', function (e, tools) {
        $('[data-tool-id=' + tools + ']').trigger('click_js');
    });

    $('.nsc-panel-dropdown').on('show', function () {
        $(this).closest('.nsc-panel-button').tooltip("disable");
    });

    $('.nsc-panel-dropdown').on('hide', function () {
        $(this).closest('.nsc-panel-button').tooltip("enable");
    });

    $("#zoom_out").click(function () {
        let z = Math.round(nimbus_screen.canvasManager.getZoom() * 100) / 100;
        if (z > 0.25) z -= 0.25;
        // console.log('set zoom -', z);
        $("#nsc_zoom_percent").val(z).trigger('change').trigger('change_js');
    });

    $("#zoom_in").click(function () {
        let z = Math.round(nimbus_screen.canvasManager.getZoom() * 100) / 100;
        if (z < 2) z += 0.25;
        // console.log('set zoom +', z);
        $("#nsc_zoom_percent").val(z).trigger('change').trigger('change_js');
    });

    $('#nsc_zoom_percent').on('change', function () {
        nimbus_screen.canvasManager.zoom(+this.value);
        return false;
    });

    let $resize_form = $("#nsc_redactor_resize_form");
    let $resize_img_width = $("#nsc_redactor_resize_img_width");
    let $resize_img_height = $("#nsc_redactor_resize_img_height");
    let $resize_proportional = $("#nsc_redactor_resize_proportional");

    const size = nimbus_screen.getEditCanvasSize();
    $resize_img_width.val(size.w);
    $resize_img_height.val(size.h);

    $resize_img_width.on('input', function () {
        if ($resize_proportional.prop('checked')) {
            const size = nimbus_screen.getEditCanvasSize();
            $resize_img_height.val(Math.round(this.value * size.h / size.w));
        }
    });

    $resize_img_height.on('input', function () {
        if ($resize_proportional.prop('checked')) {
            const size = nimbus_screen.getEditCanvasSize();
            $resize_img_width.val(Math.round(this.value * size.w / size.h));
        }
    });

    $resize_proportional.on('change', function () {
        if (this.checked) {
            const firstSize = nimbus_screen.getEditCanvasSize();
            $resize_img_width.val(firstSize.fW);
            $resize_img_height.val(firstSize.fH);
        }
    });

    $resize_form.on('submit', function () {
        nimbus_screen.canvasManager.changeSize(this.width.value, this.height.value);
        return false;
    });

    $resize_form.on('change-crop', function () {
        const size = nimbus_screen.getEditCanvasSize();
        $resize_img_width.val(size.w);
        $resize_img_height.val(size.h);
    });

    $resize_form.find('button').on('click', function () {
        $resize_form.closest('.nsc-panel-dropdown').hide();
    });

    $("#nsc_redactor_crop").on('click', function () {
        const size = nimbus_screen.getEditCanvasSize();
        const zoom = nimbus_screen.canvasManager.getZoom();

        let clearCropper = () => {
            $('#nsc_crop').remove();
            cropper && cropper.destroy();
            $(document).trigger('redactor_set_tools', nimbus_screen.canvasManager.getTools());
            $("#nsc_redactor_resize_form").trigger('change-crop');
            return false;
        }

        let createCoords = function () {
            if ($("#ns_crop_button").length) {
                $('#ns_crop_button').removeClass('nsc-hide');
                return;
            }

            let ns_crop_buttons = $('<div/>', {'id': 'ns_crop_button', 'class': 'ns-crop-buttons'});

            $('<button/>', {
                html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
                'class': 'ns-btn save'
            }).on('click', function () {
                clearCropper()
                nimbus_screen.canvasManager.cropImage(window.cropper_data);
            }).appendTo(ns_crop_buttons);

            $('<button/>', {
                html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
                'class': 'ns-btn cancel'
            }).on('click', clearCropper).appendTo(ns_crop_buttons);

            $('.cropper-crop-box').append('<div id="ns_crop_screenshot_size" class="ns-crop-size"></div>').append(ns_crop_buttons);
        };

        let showCoords = function () {
            const data = window.cropper_data;
            const $ns_crop_screenshot_size = $('#ns_crop_screenshot_size');
            const $ns_crop_button = $('#ns_crop_button');
            const width = Math.round(data.width / zoom);
            const height = Math.round(data.height / zoom);

            $ns_crop_screenshot_size.text(width + ' x ' + height);

            if ((data.height + data.y + 60) > (size.h * zoom)) $ns_crop_button.css({'bottom': '0', 'top': 'auto'});
            else $ns_crop_button.css({'bottom': 'auto', 'top': '100%'});

            if (data.y < 25) $ns_crop_screenshot_size.css({'bottom': 'auto', 'top': '0'});
            else $ns_crop_screenshot_size.css({'bottom': '100%', 'top': 'auto'});
        };

        let pole = $('<div id="nsc_crop">').css({
            width: Math.round(size.w * zoom),
            height: Math.round(size.h * zoom),
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 8,
        });

        let fon = nimbus_screen.canvasManager.getCanvas().fon.canvas;
        let bg = nimbus_screen.canvasManager.getCanvas().background.canvas;

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = Math.round(size.w * zoom);
        canvas.height = Math.round(size.h * zoom);
        ctx.drawImage(fon, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        pole.append(canvas);

        pole.bind({
            'mousemove': function (e) {
                if (e.which === 3) clearCropper()
                // nimbus_screen.canvasManager.scrollPage(e)
            },
            'contextmenu': clearCropper
        });

        $('#nsc_canvas_scroll').prepend(pole)

        cropper = new Cropper(canvas, {
            // background: false,
            autoCrop: false,
            zoomOnTouch: false,
            zoomOnWheel: false,
            viewMode: 1,
            toggleDragModeOnDblclick: false,
            ready() {
                // cropper.zoomTo(zoom)
                // $('.cropper-bg').css('background-image', 'inherit')
            },
            cropstart: function () {
                let data = cropper.getData(true);
                window.cropper_data = {
                    height: data.height,
                    width: data.width,
                    x: data.x,
                    y: data.y
                };

                createCoords();

                $('#ns_crop_button').addClass('nsc-hide');
            },
            cropmove: function (e) {
                let data = cropper.getData(true);
                window.cropper_data = {
                    height: data.height,
                    width: data.width,
                    x: data.x,
                    y: data.y
                };

                nimbus_screen.canvasManager.scrollPage(e.detail.originalEvent);

                showCoords();
            },
            cropend: createCoords
        });


    });

    $('#nsc_redactor_pens').on('change', function () {
        switch (this.value) {
            case 'pen':
                nimbus_screen.canvasManager.activatePen();
                break;
            case 'highlight':
                nimbus_screen.canvasManager.activateHighlight();
                break;
        }
    });

    $('#nsc_redactor_square').on('change', function () {
        switch (this.value) {
            case 'rectangle':
                nimbus_screen.canvasManager.activateEmptyRectangle();
                break;
            case 'rounded_rectangle':
                nimbus_screen.canvasManager.activateRoundedRectangle();
                break;
            case 'sphere':
                nimbus_screen.canvasManager.activateEmptyCircle();
                break;
            case 'ellipse':
                nimbus_screen.canvasManager.activateEllipse();
                break;
        }
    });

    $('#nsc_redactor_arrow').on('change', function (e) {
        switch (this.value) {
            case 'arrow_line':
                nimbus_screen.canvasManager.activateArrow();
                break;
            case 'arrow_curve':
                nimbus_screen.canvasManager.activateCurveArrow();
                break;
            case 'arrow_double':
                nimbus_screen.canvasManager.activateDoubleArrow();
                break;
            case 'line':
                nimbus_screen.canvasManager.activateLine();
                break;
            case 'line_curve':
                nimbus_screen.canvasManager.activateCurveLine();
                break;
            case 'line_dotted':
                nimbus_screen.canvasManager.activateDottedLine();
                break;
        }
    });

    $('#nsc_redactor_text_arrow').on('change', function (e) {
        switch (this.value) {
            case 'text_arrow':
                nimbus_screen.canvasManager.textArrow();
                break;
            case 'sticker':
                nimbus_screen.canvasManager.sticker();
                break;
        }
    });

    $('#nsc_redactor_blur').on('change', function (e) {
        switch (this.value) {
            case 'blur':
                nimbus_screen.canvasManager.activateBlur();
                break;
            case 'blur-all':
                nimbus_screen.canvasManager.activateBlurOther();
                break;
        }
    });

    $("#nsc_redactor_text").on('click', function (e) {
        nimbus_screen.canvasManager.text();
    });

    $('#nsc_redactor_font_size').val(localStorage.redactorFontSize).on('change js-change', function (e) {
        $(this).closest('.nsc-panel-button').find('.nsc-panel-text-value').text(this.value + 'px');
        if (e.type !== 'js-change') nimbus_screen.canvasManager.setFontSize(this.value);
    }).trigger('change');

    $('#nsc_redactor_font_family').val(localStorage.redactorFontFamily).on('change js-change', function (e) {
        if (e.type !== 'js-change') nimbus_screen.canvasManager.setFontFamily(this.value);
    }).trigger('change');

    $('#nsc_redactor_line_width').on('change', function (e) {
        nimbus_screen.canvasManager.changeStrokeSize(this.value);
    }).val(localStorage.redactorStrokeSize).trigger('change');

    $("#nsc_redactor_fill_color").spectrum({
        color: localStorage.redactorFillColor,
        flat: true,
        showAlpha: true,
        showButtons: false,
        move: function (color) {
            $("#nsc_redactor_fill_color").closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('background-color', color.toRgbString());
            nimbus_screen.canvasManager.changeFillColor(color.toRgbString());
        }
    }).closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('background-color', localStorage.redactorFillColor);

    $('#nsc_redactor_fill_color').closest('.nsc-panel-dropdown').on('show', function () {
        $("#nsc_redactor_fill_color").spectrum("reflow");
    });

    $("#nsc_redactor_fill_text_color").spectrum({
        color: localStorage.redactorFillTextColor,
        flat: true,
        showAlpha: true,
        showButtons: false,
        move: function (color) {
            $("#nsc_redactor_fill_text_color").closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('background-color', color.toRgbString());
            nimbus_screen.canvasManager.changeFillTextColor(color.toRgbString());
        }
    }).closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('background-color', localStorage.redactorFillTextColor);

    $('#nsc_redactor_fill_text_color').closest('.nsc-panel-dropdown').on('show', function () {
        $("#nsc_redactor_fill_text_color").spectrum("reflow");
    });

    $("#nsc_redactor_stroke_color").spectrum({
        color: localStorage.redactorStrokeColor,
        flat: true,
        showAlpha: true,
        showButtons: false,
        move: function (color) {
            $("#nsc_redactor_stroke_color").closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('border-color', color.toRgbString());
            nimbus_screen.canvasManager.changeStrokeColor(color.toRgbString());
        }
    }).closest('.nsc-panel-button').find('.nsc-panel-icon-fill-inner').css('border-color', localStorage.redactorStrokeColor);

    $('#nsc_redactor_stroke_color').closest('.nsc-panel-dropdown').on('show', function () {
        $("#nsc_redactor_stroke_color").spectrum("reflow");
    });

    $('#nsc_redactor_shadow').closest('.nsc-panel-dropdown').on('show', function () {
        const shadow = nimbus_screen.canvasManager.getShadow();

        $('#nsc_redactor_shadow').prop("checked", shadow.enable);
        $('#nsc_redactor_shadow_width').val(shadow.blur);
        $('#nsc_redactor_shadow_color').spectrum({
            color: shadow.color,
            showAlpha: true,
            showButtons: false,
            move: function (color) {
                $('#nsc_redactor_shadow_color').val(color.toRgbString()).trigger('change');
            }
        });
    });

    $('#nsc_redactor_shadow, #nsc_redactor_shadow_color, #nsc_redactor_shadow_width').on('change', function () {
        let blur = parseInt($('#nsc_redactor_shadow_width').val()) || 0;
        if (blur < 1) blur = 1;
        if (blur > 50) blur = 50;

        nimbus_screen.canvasManager.changeShadow({
            enable: $('#nsc_redactor_shadow').prop("checked"),
            blur: blur,
            color: $('#nsc_redactor_shadow_color').spectrum("get").toRgbString()
        });
    });

    $('#nsc_redactor_lock').on('click', function () {
        nimbus_screen.canvasManager.lockUnlock();
    });

    $("#nsc_redactor_undo").on('click', function () {
        nimbus_screen.canvasManager.undo();
    });

    $("#nsc_redactor_redo").on('click', function () {
        nimbus_screen.canvasManager.redo();
    });

    $("#nsc_redactor_undo_all").on('click', function () {
        nimbus_screen.canvasManager.undoAll();
        nimbus_screen.canvasManager.loadBackgroundImage(nimbus_screen.info.file.image.origin_patch);
    });

    $("#nsc_redactor_numbers").on('change', function (e) {
        switch (this.value) {
            case 'numbers':
                localStorage.redactorEnableNumbers = localStorage.redactorEnableNumbers !== 'true';
                window.nimbus_core.setOption('redactorEnableNumbers', localStorage.redactorEnableNumbers);
                nimbus_screen.canvasManager.setEnableNumbers(localStorage.redactorEnableNumbers === 'true');
                break;
            case 'number':
                nimbus_screen.canvasManager.activeteNumber();
                break;
        }
    });

    $("#nsc_redactor_number").on('click', function (e) {
        nimbus_screen.canvasManager.activeteNumber();
    });

    $('#nsc_redactor_open_image').on('click', function () {
        $('#nsc_redactor_open_image').prev('input').click();
    });

    $('#nsc_redactor_formula').on('click', async function () {
        const premium = await nscNimbus.checkPremium(true, 'premium_banner_formulas');
        if (!premium) return;

        const redactorFormulaBtn = document.querySelector("#nsc_redactor_formula");
        if ("false" === redactorFormulaBtn.dataset.on) {
            redactorFormulaBtn.dataset.on = "true";
            nimbus_screen.showFormulaEditor();
        } else {
            nimbus_screen.hideFormulaEditor();
        }
    });

    $('#nsc_insert_formula_cancel').on('click', function () {
        nimbus_screen.hideFormulaEditor();
    });

    $('#nsc_insert_formula').on('click', async function (event) {
        const value = document.getElementById("nsc_formula_enter").value;

        if (!value) {
            nimbus_screen.hideFormulaEditor();
            return;
        }
        const currentObject = nimbus_screen.canvasManager.getCurrent();
        if (currentObject && currentObject.latex) {
            await nimbus_screen.updateFormulaImage(currentObject, value);
        } else {
            await nimbus_screen.insertFormulaImage(value);
        }
    });

    $('#nsc_redactor_capture_desktop, #nsc_capture_desktop').click(function () {
        chrome.runtime.sendMessage({operation: 'get_capture_desktop'}, function () {
            chrome.runtime.sendMessage({operation: 'get_file_parts'}, function (res) {
                nimbus_screen.info.file.image.info = JSON.parse(localStorage.imageFileInfo || '{}');
                window.nimbus_core.createCanvasParts(nimbus_screen.info.file.image.info, res.parts, function (canvas, blob) {
                    nimbus_screen.setImageToRedactor(canvas);
                    nimbus_screen.setWaterMark(localStorage.watermarkEnable === 'true');
                })
            });
        });
    });

    $('#nsc_redactor_formula_copy').on('click', async function () {
        await nimbus_screen.copyFormula();
        nimbus_screen.hideFormulaEditor();
    });

    $('#nsc_redactor_formula_save').on('click', async function () {
        const link = await nimbus_screen.saveFormula();
        nimbus_screen.hideFormulaEditor();
        link.remove();
    });

    $('#nsc_create_blank').click(function () {
        nimbus_screen.setImageToRedactor(nimbus_screen.info.file.image.patch);
        nimbus_screen.setWaterMark(localStorage.watermarkEnable === 'true');
        nimbus_screen.blankScreenCreated = true;
    });

});
