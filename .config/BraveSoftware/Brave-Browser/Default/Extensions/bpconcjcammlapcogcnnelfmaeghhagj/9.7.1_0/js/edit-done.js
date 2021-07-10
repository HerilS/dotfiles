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
$(document).ready(async function () {
    $('#nsc_enable_watermark').on('change', function () {
        if (localStorage.watermarkEnable === 'false') {
            $(this).prop("checked", false);
            chrome.runtime.sendMessage({operation: 'open_page', 'url': 'options.html?watermark'});
        } else {
            $('#nsc_preview_img').addClass('nsc-hide');
            nimbus_screen.dom.$nsc_indicator.addClass('nsc-hide');
            nimbus_screen.dom.$preview_loading.removeClass('nsc-hide');

            localStorage.watermarkEnable = $(this).prop("checked");
            window.nimbus_core.setOption('watermarkEnable', localStorage.watermarkEnable);

            nimbus_screen.changeWaterMark();
        }
    }).prop('checked', localStorage.watermarkEnable !== 'false');

    $('#nsc_open_watermark_option').on('click', function () {
        chrome.runtime.sendMessage({operation: 'open_page', 'url': 'options.html?watermark'});
    });

    $('#nsc_button_back').click(function () {
        nimbus_screen.dom.$nsc_redactor_page.removeClass('nsc-hide');
        nimbus_screen.dom.$nsc_done_page.addClass('nsc-hide');

        if (!nimbus_screen.canvasManager) {
            nimbus_screen.dom.$nsc_pre_load.removeClass('nsc-hide');
            nimbus_screen.initScreenPage(nimbus_screen.info.file.image.origin_patch);
        } else {
            $(window).trigger('resize');
        }
    });

    $('#nsc_button_pdf').on('click', async function () {
        if (!window.nimbus_core.is_chrome) return;

        $(this).attr('disabled', true);

        window.onbeforeunload = function () {
        };

        nimbus_screen.pdf = new jsPDF({
            orientation: nimbus_screen.canvasDone.width > nimbus_screen.canvasDone.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [Math.ceil(nimbus_screen.canvasDone.width), Math.ceil(nimbus_screen.canvasDone.height)],
            compress: true
        });

        const {width, height} = nimbus_screen.pdf.internal.pageSize;
        const pages = Math.ceil(nimbus_screen.canvasDone.height / height);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext('2d');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        ctx.fillStyle = "white";

        for (let page = 0; page < pages; page++) {
            const sX = 0;
            const sY = height * page;

            $(this).find('span').text(`Creating PDF ${page + 1} / ${pages}`);

            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(nimbus_screen.canvasDone, sX, sY, width, height, 0, 0, width, height);
            let dataURL = canvas.toDataURL("image/png", 1.0);
            await nscCore.setTimeout();
            if (page > 0) nimbus_screen.pdf.addPage();
            nimbus_screen.pdf.addImage(dataURL, 'PNG', 0, 0, width, height, '', 'FAST');
            await nscCore.setTimeout();
        }
        nimbus_screen.pdf.save(nimbus_screen.getFileName() + ".pdf");

        $(this).attr('disabled', false).find('span').text(chrome.i18n.getMessage('editBtnSavePDF'));
        $(this).closest('.nsc-trigger-panel-container').removeClass('active')
    });

    $('#nsc_button_save_image, #nsc_button_save_video, #nsc_main_title').on('click', function () {
        window.onbeforeunload = function () {
        };

        if (nimbus_screen.getLocationParam() === 'video') {
            chrome.downloads.download({
                // url: window.URL.createObjectURL(nimbus_screen.info.file.video.blob),
                url: nimbus_screen.info.file.video.patch,
                filename: window.nimbus_core.getVideoFileName(nimbus_screen.info.page, nimbus_screen.info.file.video.format),
                saveAs: localStorage.enableSaveAs !== 'false'
            })
        } else {
            chrome.downloads.download({
                url: window.URL.createObjectURL(nimbus_screen.info.file.image.blob),
                filename: window.nimbus_core.getImageFileName(nimbus_screen.info.page, nimbus_screen.info.file.image.format),
                saveAs: localStorage.enableSaveAs !== 'false'
            })
        }
    });

    if (nimbus_screen.getLocationParam() === 'video') {
        $('#nsc_button_quick, #nsc_button_nimbus_screenshot').addClass('nsc-hide');
    } else {
        $('#nsc_button_nimbus_video').addClass('nsc-hide');

        $('#nsc_button_quick').on('click', function () {
            window.onbeforeunload = function () {
            };

            let blob = nimbus_screen.info.file.image.blob;
            let title = window.nimbus_core.getImageFileName(JSON.parse(localStorage.pageinfo), nimbus_screen.info.file.image.format);

            $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');
            $('#nsc_loading_upload_file').addClass('visible');

            nimbusShare.server.send.quick({data: blob, title: title}, function (err, res) {
                if (!err && res) {
                    $('#nsc_loading_upload_file').removeClass('visible');
                    nimbusShare.shortUrl(res.url, function (url) {
                        $('#nsc_linked').addClass('visible').find('input').val(url);
                        nimbus_screen.view.classRoomButton(url);
                        nimbus_screen.copyTextToClipboard(url);
                    });
                } else {
                    $.ambiance({message: chrome.i18n.getMessage("notificationWrong"), type: "error", timeout: 5});
                }
            });
        });
    }

    $('#nsc_button_copy_to_clipboard').click(function () {
        window.onbeforeunload = function () {
        };

        window.nimbus_core.dataUrlToArrayBuffer(window.URL.createObjectURL(nimbus_screen.info.file.image.blob), function (buffer) {
            chrome.clipboard.setImageData(buffer, (localStorage.format === 'jpg' ? 'jpeg' : 'png'));

            chrome.notifications.create(null, {
                    type: 'basic',
                    iconUrl: 'images/icons/48x48.png',
                    title: chrome.i18n.getMessage("appName"),
                    message: chrome.i18n.getMessage("notificationCopy")
                },
                function (notificationId) {
                    window.setTimeout(function (id) {
                        chrome.notifications.clear(id)
                    }.bind(this, notificationId), 3000);
                });
        });
    });

    $('#nsc_button_print').click(function () {
        window.onbeforeunload = function () {
        };
        let f = $("iframe#print")[0],
            c = f.contentDocument,
            d = f.contentWindow,
            i = c.getElementById("image"),
            t = c.getElementById("link");
        i.onload = function () {
            this.style.width = 718 < this.width ? "100%" : "auto";

            const date = new Date().getDate() < 10 ? '0' + new Date().getDate() : new Date().getDate();
            const month = new Date().getMonth() < 9 ? '0' + (new Date().getMonth() + 1) : (new Date().getMonth() + 1);
            const year = new Date().getFullYear();
            const pageinfo = JSON.parse(localStorage.pageinfo);

            if (localStorage.showInfoPrint === 'true') t.innerHTML = nimbus_screen.getFileName() + '<br>' + pageinfo.url + '<br>' + date + '.' + month + '.' + year;

            d.focus();
            d.print();
            i.setAttribute("src", '');
        };
        i.setAttribute("src", nimbus_screen.info.file.image.patch);
    });

    if (window.nimbus_core.is_chrome) {
        let $nsc_video_convert = $('#nsc_video_convert');
        let $nsc_video_convert_frame_rate = $('#nsc_video_convert_frame_rate');
        $nsc_video_convert.find('button').on('click', async function (e) {

            if (e.currentTarget.name === 'editor') {
                if (nimbus_screen.info.file.video.format === 'gif') {
                    alert('The editor works only with video files.');
                    return;
                }
                $('#nsc_stream_video').addClass('nsc-hide')[0].pause();
                $('#nsc_preview_img').addClass('nsc-hide');
                nimbus_screen.dom.$nsc_done_page.addClass('nsc-hide');
                nimbus_screen.dom.$nsc_video_page.removeClass('nsc-hide');
                nimbus_screen.dom.$nsc_pre_load.removeClass('nsc-hide');

                $('#nsc_video_player').attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now());
                nimbus_screen.info.file.video.last_video_name = nimbus_screen.info.file.video.patch.match('(vid[^.]+)')[1];
                nimbus_screen.info.file.video.last_video_format = nimbus_screen.info.file.video.format;

                if (!localStorage.videoEditor) {
                    $('#nsc_popup_video_editor').removeClass('nsc-hide').find('.nsc-button-primary').on('click', function () {
                        localStorage.videoEditor = true;
                    });
                    return;
                }
            }
            if (e.currentTarget.name === 'menu') {
                $nsc_video_convert.find('.nsc-convert-menu').show()
            }

            if (e.currentTarget.name === 'convert') {
                const premium = await nscNimbus.checkPremium(true, 'premium_banner_convert_video');

                if (!premium) {
                    return;
                }

                const format = $nsc_video_convert.find('input[name=format]:checked').val();
                const size = nacl_module.video_resolution[$nsc_video_convert.find('input[name=size]').val()];
                const frame_rate = nacl_module.frame_rate[$nsc_video_convert.find('input[name=frame-rate]').val()];

                window.onbeforeunload = function () {
                };

                $('#nsc_stream_video').addClass('nsc-hide')[0].pause();
                $('#nsc_preview_img').addClass('nsc-hide');
                nimbus_screen.dom.$nsc_indicator.addClass('nsc-hide');
                nimbus_screen.dom.$preview_loading.removeClass('nsc-hide').find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));

                if (format === 'gif') {
                    nacl_module.convertGif({
                        format: format,
                        size: size,
                        frame_rate: frame_rate
                    }, nimbus_screen.view.video.preview);
                } else {
                    nacl_module.convert({format: format, size: size, frame_rate: frame_rate}, nimbus_screen.view.video.preview);
                }

                $nsc_video_convert.find('.nsc-convert-menu').hide()

            }
        }).end().find('input').on('change', function (e) {
            if (e.currentTarget.name === 'size') {
                localStorage.videoConvertResolution = e.currentTarget.value - 1;
                const size = nacl_module.video_resolution[+localStorage.videoConvertResolution];
                $('#nsc_video_convert_size').text(size.width + 'x' + size.height + 'px')
            }

            if (e.currentTarget.name === 'format' && e.currentTarget.value === 'gif') {
                $nsc_video_convert_frame_rate.closest('.nsc-convert-menu-size').removeClass('nsc-hide');

                let search_key = null;
                for (let key in nacl_module.video_resolution) {
                    let video_resolution = nacl_module.video_resolution[key];

                    if (video_resolution.width > nimbus_screen.info.file.video.width * 0.80) {
                        search_key = key - 1 > 0 ? key - 1 : 1;
                        break;
                    }
                }
                if (search_key) {
                    $('#nsc_video_convert input[name=size]').attr('max', search_key).trigger('change');
                }
            } else if (e.currentTarget.name === 'format' && e.currentTarget.value !== 'gif') {
                $nsc_video_convert_frame_rate.closest('.nsc-convert-menu-size').addClass('nsc-hide');

                $('#nsc_video_convert input[name=size]').attr('max', Object.keys(nacl_module.video_resolution).length).trigger('change');
            }

            if (e.currentTarget.name === 'frame-rate') {
                const frame_rate = nacl_module.frame_rate[e.currentTarget.value];
                localStorage.videoConvertFrameRate = e.currentTarget.value;
                $nsc_video_convert_frame_rate.text(frame_rate)
            }
        }).filter('[name=size]').val(localStorage.videoConvertResolution || 1).trigger('change')
            .end().filter('[name=frame-rate]').val(localStorage.videoConvertFrameRate || 3).trigger('change');

        $('body').on('click', function (e) {
            if (!$(e.target).closest('.nsc-indicator-convert-action').length) $nsc_video_convert.find('.nsc-convert-menu').hide()
        });
    }

    $('.nsc-popup-close button, .nsc-popup a').on('click', function (e) {
        $(this).closest('.nsc-popup').addClass('nsc-hide');
    });

    $('.nsc-rate-us-close button').on('click', function () {
        $(this).closest('.nsc-rate-us').addClass('nsc-hide');
    });

    $('#nsc_nimbus_rate button[name=feedback]').on('click', nimbus_screen.rate_popup.feedback);
    $('#nsc_nimbus_rate button[name=not-show-more]').on('click', nimbus_screen.rate_popup.not_show_more);

    $('#nsc_nimbus_private_share').change(function () {
        localStorage.setItem('nimbusShare', this.checked);
    });

    $('#nsc_form_login_nimbus').on("submit", function () {
        let wrong = false;
        const $form = $(this);
        const email = this.elements['email'];
        const password = this.elements['password'];

        if (password.value.length < 8) {
            $(password).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipPassInfo"), type: "error", timeout: 5});
            wrong = true;
        }
        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipWrongEmail"), type: "error", timeout: 5});
            wrong = true;
        }

        if (!wrong) {
            nimbusShare.server.user.auth(email.value, password.value, async function (res) {
                if (res.errorCode === 0) {
                    $form.find('input').val('');
                    $('.nsc-popup').addClass('nsc-hide');
                    await nscNimbus.init();
                } else if (res.errorCode === -26) {
                    $form.find('input').val('');
                    $('.nsc-popup').addClass('nsc-hide');
                    $('#nsc_popup_connect_nimbus_challenge').removeClass('nsc-hide').find('input[name=state]').val(res.body.challenge.state);
                    if (res.body.challenge.type === 'otp') {
                        $('#nsc_popup_connect_nimbus_challenge').find('img').attr('src', '')
                    } else {
                        $('#nsc_popup_connect_nimbus_challenge').find('img').attr('src', 'data:image/png;base64,' + res.body.challenge.image)
                    }
                } else {
                    $.ambiance({message: chrome.i18n.getMessage("notificationLoginFail"), type: "error", timeout: 5});
                }
            });
        }
        return false;
    }).find('input').on('keyup', function () {
        $(this).removeClass('wrong');

        if ($(this).val().length < 8 ||
            ($(this).attr('name') === 'email' && !/\S+@\S+\.\S+/.test($(this).val()))) {
            $(this).addClass('wrong');
        }
    });

    $('#nsc_form_login_nimbus_challenge').on("submit", function () {
        let wrong = false;
        const $form = $(this);
        const {state, code} = this.elements;

        if (code.value.length < 0) {
            $(code).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipPassInfo"), type: "error", timeout: 5});
            wrong = true;
        }

        if (!wrong) {
            nimbusShare.server.user.challenge(state.value, code.value, async function (res) {
                if (res.errorCode === 0) {
                    $form.find('input').val('');
                    $('.nsc-popup').addClass('nsc-hide');
                    await nscNimbus.init();
                } else {
                    $.ambiance({message: chrome.i18n.getMessage("notificationLoginFail"), type: "error", timeout: 5});
                }
            });
        }
        return false;
    });

    $('#nsc_form_register_nimbus').on("submit", function () {
        let wrong = false;
        const $form = $(this);
        const {password, passrepeat, email} = this.elements;

        if (password.value.length < 8) {
            $(password).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipPassInfo"), type: "error", timeout: 5});
            wrong = true;
        }

        if (password.value !== passrepeat.value) {
            $(password).addClass('wrong');
            $(passrepeat).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipPassMatch"), type: "error", timeout: 5});
            wrong = true;
        }

        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipWrongEmail"), type: "error", timeout: 5});
            wrong = true;
        }

        if (!wrong) {
            nimbusShare.server.user.register(email.value, password.value, async function (res) {
                if (res.errorCode === 0) {
                    $form.find('input').val('');
                    $('.nsc-popup').addClass('nsc-hide');
                    await nscNimbus.init();
                } else if (res.errorCode === -4) {
                    $.ambiance({message: chrome.i18n.getMessage("notificationEmailFail"), type: "error", timeout: 5});
                } else {
                    $.ambiance({
                        message: chrome.i18n.getMessage("notificationRegisterFail"),
                        type: "error",
                        timeout: 5
                    });
                }
            });
        }
        return false;
    }).find('input').on('keyup', function () {
        $(this).removeClass('wrong');

        if ($(this).val().length < 8 ||
            ($(this).attr('name') === 'passrepeat' && $(this).val() !== $(this).closest('form').find("[name='pass']").val()) ||
            $(this).attr('name') === 'email' && !/\S+@\S+\.\S+/.test($(this).val())) {
            $(this).addClass('wrong');

        }
    });

    $('#nsc_form_remind_password_nimbus').on("submit", function () {
        let wrong = false;
        let email = this.elements['email'];

        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus();
            $.ambiance({message: chrome.i18n.getMessage("tooltipWrongEmail"), type: "error", timeout: 5});
            wrong = true;
        }

        if (!wrong) {
            nimbusShare.server.user.remindPassword(email.value, function (res) {
                if (res.errorCode === 0) {
                    $.ambiance({message: chrome.i18n.getMessage("notificationRestoreSent"), timeout: 5});
                    $('.nsc-popup').addClass('nsc-hide');
                    $('#nsc_popup_login_nimbus').removeClass('nsc-hide')
                        .find('input[name="email"]').val(email.value).end()
                        .find('input[name="password"]').val('').focus();
                } else {
                    $.ambiance({
                        message: chrome.i18n.getMessage("notificationEmailIncorrect"),
                        type: "error",
                        timeout: 5
                    });
                }
            });
        }
        return false;
    }).find('input').bind('keyup', function () {
        $(this).removeClass('wrong');

        if ($(this).val().length < 1 || !/\S+@\S+\.\S+/.test($(this).val())) {
            $(this).addClass('wrong');
        }
    });

    $('#nsc_button_nimbus').on('click', async function () {
        if (nimbus_screen.getPanel('nimbus')) {
            $('#nsc_send').trigger('click');
        } else {
            const authState = await nscNimbus.init();
            if (!authState) {
                $('.nsc-popup').addClass('nsc-hide');
                $('#nsc_popup_connect_nimbus').removeClass('nsc-hide');
            }
        }
    });

    $('#nsc_nimbus_logout, #nsc_nimbus_logout_link').on('click', function (e) {
        e.preventDefault();
        nimbusShare.server.user.logout(nimbus_screen.togglePanel);
    });

    $('#nsc_upgrade_to_nimbus_pro a').on('click', function (e) {
        e.preventDefault()
        nscPopup.addToQueue('#nsc_popup_premium');
    });

    let nsc_select_organization = $('#nsc_select_organization');
    nsc_select_organization.find('.nsc-aside-select-button').on('click', function () {
        if (nsc_select_organization.find('.nsc-aside-select-dropdown-item').length) nsc_select_organization.find('.nsc-aside-select-dropdown').toggleClass('active')
    });

    let nsc_select_workspaces = $('#nsc_select_workspaces');
    nsc_select_workspaces.find('.nsc-aside-select-button').on('click', function () {
        if (nsc_select_workspaces.find('.nsc-aside-select-dropdown-item').length) nsc_select_workspaces.find('.nsc-aside-select-dropdown').toggleClass('active')
    });

    $(document).on('click', function (e) {
        let $nsc_aside_select = $(e.target).closest('.nsc-aside-select');
        $('.nsc-aside-select').not($nsc_aside_select).find('.nsc-aside-select-dropdown').removeClass('active');
    });

    $('.nsc-open-popup-login-nimbus').on('click', function () {
        $('.nsc-popup').addClass('nsc-hide');
        $('#nsc_popup_connect_nimbus').removeClass('nsc-hide');
        return false;
    });

    $('.nsc-open-popup-register-nimbus').on('click', function () {
        $('.nsc-popup').addClass('nsc-hide');
        // $('#nsc_popup_register_nimbus').removeClass('nsc-hide');

        window.open(`https://nimbusweb.me/auth/?f=register&b=capture&hpts=1&success=/auth/t/s.html?capture-login-success=1&sr=${nimbus_core.is_firefox ? 'screens_firefox' : 'screens_chrome'}&sc=1`, '_blank');

        return false;
    });

    $('.nsc-open-popup-remind-pass-nimbus').on('click', function () {
        $('.nsc-popup').addClass('nsc-hide');
        $('#nsc_popup_remind_password_nimbus').removeClass('nsc-hide');
        return false;
    });

    $('#nsc_connect_to_google').on('click', function (e) {
        $('#nsc_popup_connect_nimbus').addClass('nsc-hide');
        window.open('https://nimbusweb.me/auth/openidconnect.php?env=app&provider=google', '_blank');
        return false;
    });

    $('#nsc_connect_to_facebook').on('click', function (e) {
        $('#nsc_popup_connect_nimbus').addClass('nsc-hide');
        window.open('https://nimbusweb.me/auth/openidconnect.php?env=app&provider=facebook', '_blank');
        return false;
    });

    $("#nsc_copy_url").click(function () {
        if (nimbus_core.is_app) {
            const clipboard = nw.Clipboard.get();
            clipboard.set($('#nsc_linked input').val(), 'text');
        } else {
            nimbus_screen.copyTextToClipboard($('#nsc_linked input').val());
        }
    });

    /* slack */

    $('#nsc_button_slack').click(function () {
        window.slackShare.init(function (auth) {
            if (!auth) {
                let $nsc_slack_connect = $('#nsc_slack_connect');
                let $nsc_preview_img = $('#nsc_preview_img');
                $nsc_slack_connect.removeClass('nsc-hide').find('.nsc-popup-box').css({
                    transform: 'translate(-50%,0)',
                    top: ($nsc_preview_img.outerHeight() - $nsc_slack_connect.find('.nsc-popup-box').outerHeight()) / 2 + $nsc_preview_img.offset().top + 'px'
                });
            } else nimbus_screen.togglePanel('slack');
        });
    });
    $('#nsc_button_connect_slack').click(function () {
        $('#nsc_slack_connect').addClass('nsc-hide');
        window.slackShare.login();
    });
    $('.nsc-slack-connect-close').click(function () {
        $('#nsc_slack_connect').addClass('nsc-hide');
    });
    $('#nsc_slack_logout').click(window.slackShare.logout);

    $('#nsc_slack_toggle').click(function (e) {
        chrome.runtime.sendMessage({operation: 'set_option', key: 'slackPanel', value: false});
        $('#nsc_done_slack').css('display', 'none');
        return false;
    });

    $('#nsc_slack_channel_search').on('keyup', function (e) {
        let $nsc_slack_list_group = $('#nsc_slack_list_group');
        let $list = $nsc_slack_list_group.find('li:visible');
        let index = $list.index($('.nsc-slack-list-selected'));
        $list.eq(index).removeClass('nsc-slack-list-selected');

        if (index === $list.length - 1) {
            index = -1
        }

        if (e.keyCode === 40 /*ArrowDown*/) {
            $list.eq(index + 1).addClass('nsc-slack-list-selected');
        } else if (e.keyCode === 38 /*ArrowUp*/) {
            $list.eq(index - 1).addClass('nsc-slack-list-selected');
        } else {
            let search_text = $(this).val();
            let is_first_item = false;
            $('#nsc_slack_channel, #nsc_slack_user').find('li').each(function () {
                let text = $(this).find('a').text();
                $(this).removeClass('nsc-slack-list-selected');
                if (search_text !== '' && !new RegExp('^' + search_text, 'i').test(text)) {
                    $(this).addClass('nsc-hide');
                } else {
                    $(this).removeClass('nsc-hide');
                    if (!is_first_item) {
                        is_first_item = !is_first_item;
                        $(this).addClass('nsc-slack-list-selected');
                    }
                }
            });
        }
        let $item_active = $('#nsc_slack_list_group .nsc-slack-list-selected');
        if ($item_active.length) {
            let top_active_elem = $item_active.position().top;
            $nsc_slack_list_group.scrollTop(top_active_elem + $nsc_slack_list_group.scrollTop());
        }
    });

    /* end slack */

    /* youtube */

    if (window.nimbus_core.is_chrome) {
        $('#nsc_button_youtube').on('click', async function () {
            const premium = await nscNimbus.checkPremium(true, 'premium_banner_youtube');

            if (!premium) {
                return;
            }

            if (youtubeShare.getAccessToken()) {
                if ($('#nsc_done_youtube').css('display') === 'flex') {
                    $('#nsc_send').trigger('click');
                } else {
                    nimbus_screen.togglePanel('youtube');
                    youtubeShare.loadPlaylist();
                }
            } else {
                youtubeShare.refreshToken('panel');
            }
        });

        $('#nsc_youtube_logout').on('click', youtubeShare.clearData);

        $('#nsc_youtube_playlist_add').find('button[name=cleared]').on('click', function () {
            $('#nsc_youtube_playlist_add').addClass('nsc-hide');
            $('#nsc_youtube_playlist_show_add').removeClass('nsc-hide');
        });

        $('#nsc_youtube_playlist_add').find('button[name=add]').on('click', function (e) {
            let name = $('#nsc_youtube_playlist_add').find('input[name=name]').val();
            if (name === '') return;

            youtubeShare.httpRequest('POST', 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', JSON.stringify({
                "snippet": {
                    "title": name
                }
            }), function (err, playlist) {
                youtubeShare.playlist.push(playlist);
                youtubeShare.viewPlaylist();
                $('#nsc_youtube_playlist_add').removeClass('nsc-hide').find('input[name=name]').val('');
            });
        });

        $('#nsc_youtube_playlist_add').find('input[name=name]').on('keypress', function (e) {
            if (e.keyCode === 13) $('#nsc_youtube_playlist_add').find('button[name=add]').trigger('click')
        });

        $('#nsc_youtube_playlist_show_add').on('click', function () {
            $('#nsc_youtube_playlist_add').removeClass('nsc-hide').find('input[name=name]').focus();
            $('#nsc_youtube_playlist_show_add').addClass('nsc-hide');
        });

        $('input[name=shareOnYoutube]').on('change', function () {
            localStorage.shareOnYoutube = this.value;
        }).filter('[value=' + (localStorage.shareOnYoutube || 'public') + ']').prop('checked', true);

        $('#nsc_popup_youtube_no_channel_learn_more').on('click', function () {
            if (window.navigator.language === 'ru') {
                window.open('https://support.google.com/youtube/answer/1646861?hl=ru', '_blank');
            } else {
                window.open('https://support.google.com/youtube/answer/1646861?hl=en', '_blank');
            }
            youtubeShare.clearData()
        })

        $('#nsc_popup_youtube_no_channel_cancel').on('click', function () {
            youtubeShare.clearData()
        })

        $('#nsc_done_youtube_name').on('change', function () {
            if (this.value === '') this.value = nimbus_screen.get.fileName(true);
            if (nimbus_screen.info.file.format !== this.value.match(/\.[0-9a-z]+$/i)[0]) {
                this.value = this.value + '.' + nimbus_screen.info.file.video.format;
            }
        });
    }

    /* end youtube */

    /* dropbox */

    $('#nsc_button_dropbox').on('click', async function () {
        const premium = await nscNimbus.checkPremium(true, 'premium_banner_dropbox');

        if (!premium) {
            return;
        }

        if (dropboxShare.getAccessToken()) {
            $('#nsc_loading_upload_file').addClass('visible');
            $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');

            let blob = nimbus_screen.info.file.image.blob;
            if (nimbus_screen.getLocationParam() === 'video') blob = nimbus_screen.info.file.video.blob;

            dropboxShare.save(blob, nimbus_screen.get.fileName(true), function (err, res) {
                if (err) {
                    $('#nsc_loading_upload_file').removeClass('visible');
                } else {
                    $('#nsc_loading_upload_file').removeClass('visible');
                    $('#nsc_message_view_uploads_dropbox').addClass('visible').attr('href', 'https://www.dropbox.com/home' + res.path_lower);
                    nimbus_screen.copyTextToClipboard(res.path_lower);
                }
            })
        } else {
            dropboxShare.login();
        }
    });

    $('#nsc_dropbox_open_folders').click(function () {
        dropboxShare.getFolders();
    });

    $('#nsc_dropbox_logout').click(function () {
        if ($(this).closest('.nsc-trigger-panel-container').hasClass('active')) {
            $(this).closest('.nsc-trigger-panel-container').removeClass('active')
        }
        dropboxShare.logout();
    });

    /* end dropbox */

    /**/

    // localStorage.appType = 'google';

    $('#nsc_button_google').on('click', async function () {
        const token = googleShare.story.get.accessToken();

        if ((localStorage.appType === 'google' || nimbusShare.info.matchesOrgAutoDomain) && !token) {
            return googleShare.refreshToken();
        } else if(!(await nscNimbus.checkPremium(true, 'premium_banner_google_drive'))) {
            return;
        }
        googleShare.refreshToken(token ? 'send' : '');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.nsc-trigger-panel-container').length) {
            $('.nsc-trigger-panel-container').removeClass('active')
        }
        if ($(e.target).hasClass('nsc-choose-trigger-panel')) {
            $(e.target).closest('.nsc-trigger-panel-container').toggleClass('active')
        }
    });

    $('#nsc_google_drive_logout').click(function () {
        if ($(this).closest('.nsc-trigger-panel-container').hasClass('active')) {
            $(this).closest('.nsc-trigger-panel-container').removeClass('active')
        }
        googleShare.server.logout();
        googleShare.story.set.uploadFolder({"id": "root", "title": "Main folder"});
        if (localStorage.appType === 'google' || nimbusShare.info.matchesOrgAutoDomain) nimbusShare.server.user.logout();
    });

    $('#nsc_google_drive_share').on('change', function () {
        localStorage.shareOnGoogle = !$(this).prop('checked');
    });

    $('#nsc_google_drive_open_folders').click(googleShare.view.folders.bind(this, false));

    $('#nsc_file_manager button[name=done]').on('click', function () {
        if ($('#nsc_file_manager').hasClass('is_dropbox')) {
            let info = {path: $('.current').find('div').data('path'), name: $('.current').find('div').data('name')};
            dropboxShare.setUploadFolder(info);
            dropboxShare.setUploadFolderTooltip();
        } else {
            let info = {id: $('.current').find('div').data('id'), title: $('.current').find('span').text()};
            googleShare.story.set.uploadFolder(info);
            googleShare.view.tooltip();
        }
        $('#nsc_file_manager').fadeOut("fast");
    });

    /**/

    $('#nsc_environment_info').on('change', function () {
        window.scrollTo(0, 10000);
        const checked = $(this).prop('checked');
        const pageinfo = JSON.parse(localStorage.pageinfo);
        const userAgent = navigator.userAgent;
        let browserName = navigator.appName;
        let platform = navigator.platform;
        let fullVersion = '' + parseFloat(navigator.appVersion);
        let verOffset;
        let $comment = $('#nsc_comment');
        if ((verOffset = userAgent.indexOf("Opera")) !== -1) {
            browserName = "Opera";
            fullVersion = userAgent.substring(verOffset + 6);
            if ((verOffset = userAgent.indexOf("Version")) !== -1) fullVersion = userAgent.substring(verOffset + 8);
        } else if ((verOffset = userAgent.indexOf("Chrome")) !== -1) {
            browserName = "Chrome";
            fullVersion = userAgent.substring(verOffset + 7);
        }
        let info = '\n\n-----------------\n' +
            chrome.i18n.getMessage("nimbusInfoPage") + ': ' + pageinfo.url + '\n' +
            chrome.i18n.getMessage("nimbusInfoScreen") + ': ' + screen.width + 'x' + screen.height + '\n' +
            chrome.i18n.getMessage("nimbusInfoBrowser") + ': ' + browserName + ' ' + fullVersion + '\n' +
            chrome.i18n.getMessage("nimbusInfoAgent") + ': ' + userAgent + '\n' +
            chrome.i18n.getMessage("nimbusInfoPlatform") + ': ' + platform;

        localStorage.setItem('environmentInfo', checked);
        if (checked) {
            $comment.val($comment.val() + info).outerHeight(220);
        } else {
            $comment.val($comment.val().match(/([\s|\S]+)?\n\n-----------------[\s|\S]+/)[1]).height(22);
        }

    });

    $('#nsc_send').on('change-type', function () {
        let self = this;
        switch ($(self).data('type')) {
            case 'youtube':
                $(self).find('span').text(chrome.i18n.getMessage("nimbusYoutubeSend"));
                break;
            case 'slack':
                $(self).find('span').text(chrome.i18n.getMessage("nimbusSlackSend"));
                break;
            default :
                $(self).find('span').text(chrome.i18n.getMessage("nimbusSend"));
                break;
        }
    })
        .trigger('change-type')
        .on('click', async function () {
            window.onbeforeunload = function () {
            };
            $("html, body").stop().animate({scrollTop: 0}, 500);

            let channel = $(this).data('channel');
            $(this).data('channel', false);

            if ($(this).data('type') === 'youtube') {
                if (nimbus_screen.info.file.format === 'gif') {
                    alert('Youtube doesn\'t support GIF');
                } else {
                    if (channel) localStorage.youtubePlaylist = channel;
                    youtubeShare.refreshToken('send');
                }
            } else if ($(this).data('type') === 'slack' && nimbus_screen.getLocationParam() !== 'video') {
                window.slackShare.sendScreenshot(nimbus_screen.info.file.image.blob, channel);
            } else {
                if (nscNimbus.pending) return;

                const is_auth = await nscNimbus.authState();
                if (!is_auth) {
                    $('#nsc_popup_connect_nimbus').removeClass('nsc-hide');
                } else {
                    $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');

                    let is_video = nimbus_screen.getLocationParam() === 'video';
                    let organization = null;
                    let workspace = null;
                    let blob = nimbus_screen.info.file[is_video ? 'video' : 'image'].blob;
                    let comment = $('#nsc_comment').val();

                    if (is_video) blob = nimbus_screen.info.file[is_video ? 'video' : 'image'].blob;

                    for (let work of nscNimbus.workspaces) if (work.globalId === localStorage.nimbusWorkspaceSelect) workspace = work;
                    for (let org of nscNimbus.organizations) if (org.id === localStorage.nimbusOrganizationSelect) organization = org;

                    if (blob.size > workspace.org.limits.attachmentSize) {
                        let user = workspace.user || workspace.org.user;
                        if (workspace.userId === nscNimbus.user.id) {
                            if (user.premium && user.premium.status === 'active') $('#nsc_popup_limit').removeClass('nsc-hide');
                            else $('#nsc_popup_limit_free').removeClass('nsc-hide');
                            return;
                        }

                        if (user.premium && user.premium.status === 'active') $('#nsc_popup_limit_org_premium').removeClass('nsc-hide');
                        else $('#nsc_popup_limit_org_free').removeClass('nsc-hide');
                        return;
                    }

                    if (blob.size + workspace.org.usage.traffic.current > workspace.org.usage.traffic.max) {
                        $('#nsc_popup_limit_org_limit').removeClass('nsc-hide');
                        return;
                    }

                    $('#nsc_loading_upload_file').addClass('visible');

                    const {format} = nimbus_screen.info.file[is_video ? 'video' : 'image'];

                    const data = {
                        data: blob,
                        title: $('#nsc_screen_name').val(),
                        name: $('#nsc_screen_name').val() + '.' + format,
                        type: `${is_video && format !== 'gif' ? 'video' : 'image'}/${format}`,
                        comment: comment,
                        folder_id: channel,
                    }

                    nimbusShare.server.send[is_video ? 'screencast' : 'screenshot'](data, async function (err, res) {
                        if (!err && res) {
                            let link = (organization.type === 'business' ? (organization.domain ? 'https://' + organization.domain : 'https://' + organization.sub + '.nimbusweb.me') : 'https://nimbusweb.me') + '/ws/' + workspace.globalId + '/recent/note/' + res.body.global_id;

                            if (res.body.location) link = res.body.location;

                            nimbusShare.shortUrl(link, async function (link) {
                                $('#nsc_linked').addClass('visible').find('input').val(link);
                                nimbus_screen.view.classRoomButton(link);
                                nimbus_screen.copyTextToClipboard(link);
                                await nscNimbus.getInfo();
                            });
                        } else {
                            $.ambiance({message: err.message, type: "error", timeout: 5});
                        }
                        $('#nsc_loading_upload_file').removeClass('visible');
                    }, function (percent) {
                        $('#nsc_loading_upload_file').text(percent + '%');
                    })
                }
            }
        });
});

chrome.runtime.onMessage.addListener(function (req) {
    if (req.operation === 'page_extension_activated') {
        (async function () {
            if (nimbus_screen.getPanel('nimbus')) await nscNimbus.init();
        })()
    }
    if (req.operation === 'access_nimbus') {
        (async function () {
            await nscNimbus.init();
        })()
    }
    if (req.action === 'access_slack') {
        window.slackShare.init(function (auth) {
            nimbus_screen.togglePanel('slack');
            if (nimbus_screen.getLocationParam() === 'slack') $('#nsc_button_slack').click();
        });
    }
    if (req.action === 'access_dropbox') {
        dropboxShare.setUploadFolderTooltip();
    }

    if (req.operation === 'access_youtube') {
        if (youtubeShare.type === 'panel') {
            youtubeShare.loadPlaylist();
            nimbus_screen.togglePanel('youtube');
        } else if ($('#nsc_done_youtube').css('display') === 'flex') {
            $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');
            $('#nsc_loading_upload_file').addClass('visible').text('');

            youtubeShare.save(nimbus_screen.info.file.video.blob, nimbus_screen.get.fileName(true), function (err, res) {
                $('#nsc_loading_upload_file').removeClass('visible').text('');

                $.ambiance({message: 'Upload has completed', timeout: 5});

                // if (localStorage.shareOnYoutube !== 'private') {
                nimbusShare.shortUrl('https://youtu.be/' + res.id, function (url) {
                    $('#nsc_linked').addClass('visible').find('input').val(url);
                    nimbus_screen.view.classRoomButton(url);
                    nimbus_screen.copyTextToClipboard(url);
                });
                // }

                if (nimbus_screen.getLocationParam() === 'video') {
                    if (!window.nimbus_core.is_app) {
                        nimbus_screen.tracker.send(nimbus_screen.VIDEO_UPLOAD);
                    }
                }
            }, function (percent) {
                $('#nsc_loading_upload_file').text(percent + '%');
            });
        }
        youtubeShare.type = undefined;
    }
    if (req.operation === 'access_google') {
        googleShare.view.tooltip();
        if (googleShare.type === 'send') {
            window.onbeforeunload = function () {
            };

            $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');
            $('#nsc_loading_upload_file').addClass('visible').text('');

            let blob = nimbus_screen.info.file.image.blob;
            if (nimbus_screen.getLocationParam() === 'video') blob = nimbus_screen.info.file.video.blob;

            googleShare.save(blob, nimbus_screen.get.fileName(true), function (err, res) {
                $('#nsc_loading_upload_file').removeClass('visible').text('');

                $.ambiance({message: 'Upload has completed', timeout: 5});

                if (localStorage.shareOnGoogle === 'true') {
                    googleShare.setPublicGdrive(res.id);
                }

                nimbusShare.shortUrl('https://drive.google.com/file/d/' + res.id, function (url) {
                    $('#nsc_linked').addClass('visible').find('input').val(url);
                    nimbus_screen.view.classRoomButton(url);
                    nimbus_screen.copyTextToClipboard(url);
                });


                if (nimbus_screen.getLocationParam() === 'video' && !window.nimbus_core.is_app) nimbus_screen.tracker.send(nimbus_screen.VIDEO_UPLOAD);
            }, function (percent) {
                $('#nsc_loading_upload_file').text(percent + '%');
            })
        }
        googleShare.type = undefined;
    }
});
