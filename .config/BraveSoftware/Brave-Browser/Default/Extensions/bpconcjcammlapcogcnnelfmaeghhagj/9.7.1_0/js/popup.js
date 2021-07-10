let t = null;
let actions;

/** @const url_share url nimbus web share page.
 */
const url_share = 'https://s.nimbusweb.me/share/';

const {is_chrome, is_macintosh} = nimbus_core;

const {language} = window.navigator;

const openPage = async (page, not_share) => {
    await nscCore.sendMessage({operation: 'open_page', 'url': `${!not_share ? url_share : ''}${page}`});
}

function setOption(key, value) {
    if (is_chrome) return;
    chrome.runtime.sendMessage({operation: 'set_option', key: key, value: value});
}

async function checkRecord() {
    const {status, state, time, streamLoading} = await nscCore.sendMessage({operation: 'get_info_record'});

    if (status) {
        const textState = chrome.i18n.getMessage(state === 'recording' ? "popupBtnStopPause" : "popupBtnStopResume");
        $('button[name=record-pause] .nsc-button-layout').text(textState);

        showTime(time);
        showRecordStatus();
    } else if (streamLoading) {
        window.close();
    } else {
        showCaptureOptions();
        clearTimeout(t)
    }
    t = setTimeout(checkRecord, 500);
}

async function getUserMedia() {
    if (localStorage.videoRecordType === 'desktop') return;

    let constraints = {
        audio: localStorage.videoMicSoundEnable !== 'false',
        video: localStorage.videoCameraEnable !== 'false'
    };
    if (!constraints.video && !constraints.audio) $('.nsc-capture-button-media-access').addClass('nsc-hide');
    else await nscVideo.getUserMedia(constraints).catch(function () {
        $('.nsc-capture-button-media-access').removeClass('nsc-hide').find('span span')
            .text(`Allow ${constraints.video ? 'Webcam' : ''} ${constraints.video && constraints.audio ? '&' : ''} ${constraints.audio ? 'Audio' : ''} Permissions`);
    })
}

function showCaptureOptions() {
    $('#capture_options').removeClass('nsc-hide');
    $('#record_options').addClass('nsc-hide');
    $('#record_status').addClass('nsc-hide');
    $('#record_setting').addClass('nsc-hide');
    $('#workspaces_setting').addClass('nsc-hide');
    $('#progress_capture_option').addClass('nsc-hide');
}

function showRecordOptions() {
    $('#capture_options').addClass('nsc-hide');
    $('#record_options').removeClass('nsc-hide');
    $('#record_status').addClass('nsc-hide');
    $('#record_setting').addClass('nsc-hide');
    $('#workspaces_setting').addClass('nsc-hide');
    $('#progress_capture_option').addClass('nsc-hide');

    $('input[name=record-type][value=' + localStorage.videoRecordType + ']').trigger('change');
}

function showRecordSetting() {
    $('#capture_options').addClass('nsc-hide');
    $('#record_options').addClass('nsc-hide');
    $('#record_status').addClass('nsc-hide');
    $('#record_setting').removeClass('nsc-hide');
    $('#workspaces_setting').addClass('nsc-hide');
    $('#progress_capture_option').addClass('nsc-hide');
}

function showSelectWorkspace() {
    $('#capture_options').addClass('nsc-hide');
    $('#record_options').addClass('nsc-hide');
    $('#record_status').addClass('nsc-hide');
    $('#record_setting').addClass('nsc-hide');
    $('#workspaces_setting').removeClass('nsc-hide');
    $('#progress_capture_option').addClass('nsc-hide');
}

function showRecordStatus() {
    $('#capture_options').addClass('nsc-hide');
    $('#record_options').addClass('nsc-hide');
    $('#record_status').removeClass('nsc-hide');
    $('#record_setting').addClass('nsc-hide');
    $('#workspaces_setting').addClass('nsc-hide');
    $('#progress_capture_option').addClass('nsc-hide');
}

function showCaptureProgress() {
    $('#capture_options').addClass('nsc-hide');
    $('#record_options').addClass('nsc-hide');
    $('#record_status').addClass('nsc-hide');
    $('#record_setting').addClass('nsc-hide');
    $('#workspaces_setting').addClass('nsc-hide');
    $('#progress_capture_option').removeClass('nsc-hide');
}

function showTime(date) {
    let time = new Date(date),
        m = time.getUTCMonth(),
        d = time.getUTCDate() - 1,
        h = time.getUTCHours(),
        M = time.getUTCMinutes(),
        s = time.getUTCSeconds(),
        time_str = '';
    if (m > 0) time_str += ('0' + m).slice(-2) + ':';
    if (d > 0) time_str += ('0' + d).slice(-2) + ':';
    if (h > 0) time_str += ('0' + h).slice(-2) + ':';
    time_str += ('0' + M).slice(-2) + ':';
    time_str += ('0' + s).slice(-2);

    $('#record_time').text(time_str);
}

function setDevices(devices) {
    const $camera = $('select[name=selected-video-camera]');
    const $microphone = $('select[name=selected-microphone]');
    let mic_is = false, cam_is = false;

    for (let i = 0; i !== devices.length; ++i) {
        const device = devices[i];
        const $option = $('<option>').val(device.deviceId);
        if (device.kind === 'audioinput') {
            if (localStorage.selectedMicrophone === device.deviceId) {
                $option.attr('selected', 'selected');
                mic_is = true;
            }
            $microphone.append($option.text(device.label || 'Microphone'));
        } else if (device.kind === 'videoinput') {
            if (localStorage.selectedVideoCamera === device.deviceId) {
                $option.attr('selected', 'selected');
                cam_is = true;
            }
            $camera.append($option.text(device.label || 'Camera'));
        }
    }

    if (!mic_is) localStorage.removeItem('selectedMicrophone');
    if (!cam_is) localStorage.removeItem('selectedVideoCamera');
}

$(async function () {
    if (language === 'ru') {
        $('.is-ru-hide').addClass('nsc-hide');
        $('.is-ru-show').removeClass('nsc-hide');
    } else {
        $('.is-ru-hide').removeClass('nsc-hide');
        $('.is-ru-show').addClass('nsc-hide');
    }

    $("button").on('click', async function () {
        switch (this.name) {
            case 'capture-visible':
            case 'capture-fragment':
            case 'capture-fragment-scroll':
            case 'capture-selected':
            case 'capture-delayed':
            case 'capture-scroll':
            case 'capture-entire':
            case 'capture-window':
            case 'capture-blank':
                if (this.name === 'capture-fragment-scroll' && localStorage.captureFragmentScrollWelcome !== "true") {
                    nscCore.sendMessage({ operation: 'content_popup', action: 'nsc_popup_fragment_scroll_welcome_open'});
                    localStorage.captureFragmentScrollWelcome = true;
                    window.close();
                    return false;
                }

                nscCore.sendMessage({operation: 'activate_capture', value: this.name});
                if (this.name === 'capture-entire') {
                    showCaptureProgress();
                }

                break;
            case 'nimbus-capture-desktop':
                if (is_chrome) {
                    if (language === 'ru') {
                        await openPage('https://nimbusweb.me/aredirect.php?url=https://chrome.google.com/webstore/detail/web-clipper-nimbus/' +
                            'kiokdhlcmjagacmcgoikapbjmmhfchbi?hl=ru&utm_source=nimbus&utm_medium=extension_menu&utm_campaign=capture_chrome_en', true);
                    } else {
                        await openPage('https://nimbusweb.me/aredirect.php?url=https://chrome.google.com/webstore/detail/web-clipper-nimbus/' +
                            'kiokdhlcmjagacmcgoikapbjmmhfchbi?hl=en&utm_source=nimbus&utm_medium=extension_menu&utm_campaign=capture_chrome_ru', true);
                    }
                } else {
                    await openPage(`https://nimbusweb.me/${language ? 'ru/' : ''}clipper.php`, true);
                }

                localStorage.captureButtonAdvertising = true;
                $(this).addClass('nsc-hide');
                break;
            case 'logout':
                await nscNimbus.logout();
                break;
            case 'open-option':
                await openPage('options.html', true);
                break;
            // case 'open-nimbus-premium':
            //     await openPage('https://nimbusweb.me/capture-pro?utm_source=capture&utm_medium=addon&utm_campaign=main_menu_upgrade', true);
            //     break;
            case 'open-sing-up':
                await openPage(`https://nimbusweb.me/auth/?f=register&b=capture&hpts=1&success=/auth/t/s.html?capture-login-success=1&sr=${nimbus_core.is_firefox ? 'screens_firefox' : 'screens_chrome'}&sc=1`, true);
                break;
            case 'capture-video':
                showRecordOptions();
                break;
            case 'back-to-capture':
                showCaptureOptions();
                break;
            case 'back-to-capture-setting':
                showRecordOptions();
                break;
            case 'record-start':
                localStorage.videoRecordIsStream = false;
                localStorage.videoCountdown = $('#video_countdown').val();
                setOption('videoCountdown', localStorage.videoCountdown);
                setOption('videoStream', localStorage.videoStream);

                nscCore.sendMessage({operation: 'activate_record', 'key': 'start'});
                break;
            case 'record-stream-start':
                localStorage.videoRecordIsStream = true;
                localStorage.videoCountdown = $('#video_countdown').val();
                setOption('videoCountdown', localStorage.videoCountdown);
                setOption('videoStream', localStorage.videoStream);
                nscCore.sendMessage({operation: 'activate_record', 'key': 'start'});
                break;
            case 'record-stop':
                nscCore.sendMessage({operation: 'activate_record', 'key': 'stop'});
                break;
            case 'record-pause':
                nscCore.sendMessage({operation: 'activate_record', 'key': 'pause'});
                const {state} = await nscCore.sendMessage({operation: 'get_info_record'});
                const stateText = chrome.i18n.getMessage(state === 'recording' ? 'popupBtnStopPause' : 'popupBtnStopResume');
                $('button[name=record-pause] .nsc-button-layout').text(stateText);
                break;
            case 'video-setting':
                showRecordSetting();
                break;
            case 'open-help-video-setting':
                await openPage(language === 'ru' ? '3552315/yqgen0wi63dg5mpi5tqi' : '3552243/xxvg33d1kcr7thhgtoua')
                break;
            case 'open-help-capture':
                await openPage(language === 'ru' ? '3552389/f4vdbtq17l1zmkrhs5n1?utm_source=capture&utm_medium=addon&utm_campaign=main_menu' : '3552387/mp8nr3ee75mtgyqfonnc?utm_source=capture&utm_medium=addon&utm_campaign=main_menu')
                break;
            case 'open-private-upload-help':
                await openPage('3267939/40p7p3pmtp7q4yhz63vd');
                break;
            case 'open-extensions':
                await openPage('chrome://extensions/?id=bpconcjcammlapcogcnnelfmaeghhagj', true);
                break;
            case 'open-nimbus-client':
                await openPage('https://nimbusweb.me/auth/?b=capture&su=0&utm_source=capture&utm_medium=addon&utm_campaign=my_uploads&success=/client/' +
                    '?utm_source=capture&utm_medium=addon&utm_campaign=my_uploads&sr=screens_chrome&hpts=1&sc=1', true);
                break;
            case 'open-media-access':
                nscCore.sendMessage({operation: 'content_media_access', access: false});
                break;
            case 'reset-video-setting':
                localStorage.videoResolution = 'hd';
                localStorage.videoBitrate = '4000000';
                localStorage.videoAudioBitrate = '96000';
                localStorage.videoFps = '24';
                localStorage.videoDrawingToolsDelete = '6';

                setOption('videoResolution', localStorage.videoResolution);
                setOption('videoBitrate', localStorage.videoBitrate);
                setOption('videoAudioBitrate', localStorage.videoAudioBitrate);
                setOption('videoFps', localStorage.videoFps);
                setOption('videoDrawingToolsDelete', localStorage.videoDrawingToolsDelete);

                $("input[name=video-size]").prop('checked', false).filter('[value=' + localStorage.videoResolution + ']').prop('checked', true);
                $("select[name=audio-bitrate]").val(localStorage.videoAudioBitrate);
                $("select[name=video-bitrate]").val(localStorage.videoBitrate);
                $("select[name=video-fps]").val(localStorage.videoFps);
                $("select[name=delete-drawing]").val(localStorage.videoDrawingToolsDelete);
                break;
            case 'stop-capture':
                alert('stop-capture')
                nscCore.sendMessage({operation: 'content_message', message: {operation: 'content_stop_capture'} });
                break;
        }

        if ($(this).data('closeWindow')) {
            window.close();
        }
    });

    $("input").on('change', async function () {
        switch (this.name) {
            case 'record-type':
                localStorage.videoRecordType = $(this).val();
                setOption('videoRecordType', localStorage.videoRecordType);
                await getUserMedia();

                if ($(this).val() === 'desktop' || $(this).val() === 'camera') {
                    $('input[name=record-tab-sound]').prop("checked", false).prop("disabled", true).closest('.nsc-capture-switcher').attr('title', chrome.i18n.getMessage("notificationDesktopTabSound")).addClass('disabled');
                    if (localStorage.videoRecordType === 'desktop') {
                        $('input[name=record-camera]').prop("checked", localStorage.videoCameraEnable !== 'false').prop("disabled", false).closest('.nsc-capture-switcher').attr('title', '').removeClass('disabled');
                        $('input[name=show-drawing-tools]').prop("checked", localStorage.videoDrawingToolsEnable !== 'false').prop("disabled", false).closest('.nsc-capture-switcher').attr('title', '').removeClass('disabled');
                    } else {
                        $('input[name=show-drawing-tools]').prop("checked", false).prop("disabled", true).closest('.nsc-capture-switcher').attr('title', chrome.i18n.getMessage("notificationDesktopCursorAnimation")).addClass('disabled');
                        $('input[name=record-camera]').prop("checked", false).prop("disabled", true).closest('.nsc-capture-switcher').attr('title', chrome.i18n.getMessage("notificationDesktopCursorAnimation")).addClass('disabled');
                    }
                } else {
                    $('input[name=record-tab-sound]').prop("checked", localStorage.videoTabSoundEnable !== 'false').prop("disabled", false).closest('.nsc-capture-switcher').attr('title', '').removeClass('disabled');
                    $('input[name=show-drawing-tools]').prop("checked", localStorage.videoDrawingToolsEnable !== 'false').prop("disabled", false).closest('.nsc-capture-switcher').attr('title', '').removeClass('disabled');
                    $('input[name=record-camera]').prop("checked", localStorage.videoCameraEnable !== 'false').prop("disabled", false).closest('.nsc-capture-switcher').attr('title', '').removeClass('disabled');
                }
                break;
            case 'record-mic':
                localStorage.videoMicSoundEnable = $(this).prop("checked");
                setOption('videoMicSoundEnable', localStorage.videoMicSoundEnable);
                await getUserMedia();
                break;
            case 'video-animation-cursor':
                localStorage.videoAnimationCursor = $(this).prop("checked");
                setOption('videoAnimationCursor', localStorage.videoAnimationCursor);
                break;
            case 'record-camera':
                localStorage.videoCameraEnable = $(this).prop("checked");
                setOption('videoCamera', localStorage.videoCameraEnable);
                await getUserMedia();
                break;
            case 'record-tab-sound':
                localStorage.videoTabSoundEnable = $(this).prop("checked");
                setOption('videoTabSoundEnable', localStorage.videoTabSoundEnable);
                break;
            case 'show-drawing-tools':
                localStorage.videoDrawingToolsEnable = $(this).prop("checked");
                setOption('videoDrawingToolsEnable', localStorage.videoDrawingToolsEnable);
                break;
            case 'enable-watermark':
                if (localStorage.watermarkEnable === 'false' || (localStorage.watermarkFile === '' && localStorage.watermarkType === 'image')) {
                    $(this).prop("checked", false);
                    await nscCore.sendMessage({operation: 'open_page', 'url': 'options.html?watermark'});
                } else {
                    localStorage.watermarkEnable = $(this).prop("checked");
                    window.nimbus_core.setOption('watermarkEnable', localStorage.watermarkEnable);
                }
                break;
            case 'record-to-gif':
                localStorage.recordToGif = $(this).prop("checked");
                setOption('recordToGif', localStorage.recordToGif);
                break;
            case 'video-size':
                localStorage.videoResolution = $(this).val();
                setOption('videoResolution', localStorage.videoResolution);
                break;
            case 'video-re-encoding':
                localStorage.videoReEncoding = $(this).prop("checked");
                setOption('videoReEncoding', localStorage.videoReEncoding);
                break;
            case 'private-upload-video':
                localStorage.videoPrivateUploadEnable = $(this).prop("checked");
                setOption('videoPrivateUploadEnable', localStorage.videoPrivateUploadEnable);
                break;
            default:
                break;

        }
    }).filter('[name=record-mic]').prop('checked', localStorage.videoMicSoundEnable !== 'false').end()
        .filter('[name=record-camera]').prop('checked', localStorage.videoCameraEnable !== 'false').end()
        .filter('[name=record-tab-sound]').prop('checked', localStorage.videoTabSoundEnable !== 'false').end()
        .filter('[name=show-drawing-tools]').prop('checked', localStorage.videoDrawingToolsEnable !== 'false').end()
        .filter('[name=enable-watermark]').prop('checked', localStorage.watermarkEnable !== 'false').end()
        .filter('[name=record-to-gif]').prop('checked', localStorage.recordToGif !== 'false').end()
        .filter('[name=video-re-encoding]').prop('checked', localStorage.videoReEncoding !== 'false').end()
        .filter('[name=private-upload-video]').prop('checked', localStorage.videoPrivateUploadEnable !== 'false').end()
        .filter('[name=record-type][value=' + localStorage.videoRecordType + ']').prop('checked', true).end()
        .filter('[name=video-size][value=' + localStorage.videoResolution + ']').prop('checked', true).end()
        .filter('[name=video-animation-cursor]').prop('checked', localStorage.videoAnimationCursor !== 'false').end();

    $("select[name=record-video-core]").val(localStorage.recordVideoCore).on("change", function (e) {
        localStorage.recordVideoCore = e.target.value;
        setOption('recordVideoCore', localStorage.recordVideoCore);
    });

    $("select[name=record-audio-core]").val(localStorage.recordAudioCore).on("change", function (e) {
        localStorage.recordAudioCore = e.target.value;
        setOption('recordAudioCore', localStorage.recordAudioCore);
    });

    $("select[name=audio-bitrate]").val(localStorage.videoAudioBitrate).on("change", function (e) {
        localStorage.videoAudioBitrate = e.target.value;
        setOption('videoAudioBitrate', localStorage.videoAudioBitrate);
    });

    $("select[name=video-bitrate]").val(localStorage.videoBitrate).on("change", function (e) {
        localStorage.videoBitrate = e.target.value;
        setOption('videoBitrate', localStorage.videoBitrate);
    });

    $("select[name=video-fps]").val(localStorage.videoFps).on("change", function (e) {
        localStorage.videoFps = e.target.value;
        setOption('videoFps', localStorage.videoFps);
    });

    $("select[name=edit-before]").val(localStorage.enableEdit).on("change", function (e) {
        localStorage.enableEdit = e.target.value;
        setOption('enableEdit', localStorage.enableEdit);
    });

    $("select[name=delete-drawing]").val(localStorage.videoDrawingToolsDelete).on("change", function (e) {
        localStorage.videoDrawingToolsDelete = e.target.value;
        setOption('videoDrawingToolsDelete', localStorage.videoDrawingToolsDelete);
    });

    $("select[name=selected-video-camera]").on("change", function (e) {
        localStorage.selectedVideoCamera = e.target.value;
        setOption('selectedVideoCamera', localStorage.selectedVideoCamera);
    });

    $("select[name=selected-microphone]").on("change", function (e) {
        localStorage.selectedMicrophone = e.target.value;
        setOption('selectedMicrophone', localStorage.selectedMicrophone);
    });

    $('#video_countdown').val(localStorage.videoCountdown).on('input', function () {
        if (this.value < 0) this.value = 0;
        if (this.value > 9999) this.value = 9999;
        localStorage.videoCountdown = this.value;
        setOption('videoCountdown', localStorage.videoCountdown);
    });

    $('#video_animation_cursor').val(localStorage.videoCountdown).on('input', function () {
        if (this.value < 0) this.value = 0;
        if (this.value > 9999) this.value = 9999;
        localStorage.videoCountdown = this.value;
        setOption('videoCountdown', localStorage.videoCountdown);
    });

    $('#nsc_open_option_watermark').on('click', async () => {
        await nscCore.sendMessage({operation: 'open_page', 'url': 'options.html?watermark'});
    });

    // chrome.runtime.sendMessage({operation: 'content_popup', action: 'nsc_popup_limit_time_stream_open'});

    const {quickCapture, quickCaptureType, quickVideoCapture} = localStorage;

    const {
        recordStatus,
        streamLoading,
        entireStatus
    } = await nscCore.sendMessage({operation: 'get_extension_data'});

    const $body = $('body');

    if (quickCapture !== 'false' && !recordStatus && !entireStatus) {
        $('button[name=\'capture-' + quickCaptureType + '\']').click();
    } else {
        if (quickVideoCapture !== 'false') {
            if (recordStatus) {
                await checkRecord();
            } else {
                showRecordOptions();
            }
        } else if (recordStatus) {
            await checkRecord();
        } else {
            $body.addClass('loading');

            if (streamLoading) {
                window.close();
            } else if (entireStatus) {
                $('#progress_capture_option').addClass('nsc-hide');
            } else {
                const premium = nscExt.getOption('nimbusPremium');

                if (!premium && nscExt.getTrial()) {
                    $('#nsc_trial_message').removeClass('nsc-hide');
                }
                nscCore.sendMessage({operation: 'check_tab_action', 'action': 'insert_page'});
                nscCore.sendAllTabMessage({operation: 'content_capture_fragment_scroll_search'});
                nscNimbus.sendAnalytics();
                nscNimbus.checkPremium(false);

                $('#capture_options').removeClass('nsc-hide');
            }
        }
        $body.removeClass('loading');
    }

    await nscExt.initI18n();

    await nscCore.onMessage(await function (request) {
        switch (request.operation) {
            case 'check_tab_action' :
            case 'back_is_page' :
                const {url, chrome, fragment, crop, scroll_crop} = request.value;

                try {
                    chrome.extension.isAllowedFileSchemeAccess(function (access) {
                        if (/^file/.test(url) && !access) {
                            $('#capture_options').addClass('nsc-hide');
                            $('#capture_message').removeClass('nsc-hide');
                            return true;
                        }
                    });
                } catch (e) {
                    console.error(e);
                }

                let $nsc_button_main = $('.nsc-button-main');

                if (chrome) {
                    $nsc_button_main.not('[name=capture-window], [name=capture-blank], [name=capture-video], [name=nimbus-capture-desktop]').attr('disabled', 'disabled').css({opacity: 0.5});
                    $('input[name=record-type][value=desktop]').prop('checked', true);
                    localStorage.videoRecordType = 'desktop';

                    $('input[name=record-type][value=tab]').attr('disabled', 'disabled').closest('.nsc-capture-flag').css({opacity: 0.5});
                    $('input[name=record-type][value=camera]').attr('disabled', 'disabled').closest('.nsc-capture-flag').css({opacity: 0.5});
                    $('input[name=record-tab-sound]').attr('disabled', 'disabled').closest('.nsc-capture-switcher').css({opacity: 0.5});
                    $('input[name=show-drawing-tools]').attr('disabled', 'disabled').closest('.nsc-capture-switcher').css({opacity: 0.5});
                    $('input[name=enable-watermark]').attr('disabled', 'disabled').closest('.nsc-capture-switcher').css({opacity: 0.5});
                }
                if (fragment) $nsc_button_main.attr('disabled', 'disabled').not('[name=capture-fragment]').css({opacity: 0.5});
                if (crop) $nsc_button_main.attr('disabled', 'disabled').not('[name=capture-area]').css({opacity: 0.5});
                if (scroll_crop) $nsc_button_main.attr('disabled', 'disabled').not('[name=capture-scroll]').css({opacity: 0.5});
                break;
            case 'content_capture_fragment_scroll_detected' :
                $('button[name=capture-fragment-scroll]').removeClass('nsc-hide')
                break;
            case 'content_capture_area' :
                showCaptureProgress();
                let percent = Math.floor((request.x2 / request.pageWidth + request.y2 / request.pageHeight) * 100);
                $('#progress_capture_line').width(percent + '%');
                $('#progress_capture_text').text(percent + '%');

                if (request.x2 !== 0 || request.y2 !== 0) $('button[name=stop-capture]').removeClass('nsc-hide');
                if (request.status === 'finish' || request.status === 'cancel') window.close();
                break;
        }
    });

    if (localStorage.quickVideoStreamMenuEnable === 'true' && localStorage.appType !== 'google') {
        $('.nsc-video-stream-menu-enable').removeClass('nsc-hide')
    }

    const hotkeys_assoc = {
        49: '1', 50: '2', 51: '3', 52: '4',
        53: '5', 54: '6', 55: '7', 56: '8',
        57: '9', 65: 'A', 66: 'B', 67: 'C',
        68: 'D', 69: 'E', 70: 'F', 71: 'G',
        72: 'H', 73: 'I', 74: 'J', 75: 'K',
        76: 'L', 77: 'M', 78: 'N', 79: 'O',
        80: 'P', 81: 'Q', 82: 'R', 83: 'S',
        84: 'T', 85: 'U', 86: 'V', 87: 'W',
        88: 'X', 89: 'Y', 90: 'Z', 0: false,
    };

    for (const [key, code] of Object.entries(JSON.parse(localStorage.appHotkeys) || {})) {
        let hk = is_macintosh ? '⌘+Shift+' : 'Ctrl+Shift+';
        if (code) $('[name=capture-' + key + ']').attr({
            'data-i18n': hk + hotkeys_assoc[code],
            'data-i18n-attr': 'title'
        })
    }

    if (is_chrome) {
        (await nscCore.commandsGetAll()).forEach(({name, shortcut}) => {
            $('[data-command-name="' + name + '"]').text(shortcut)
        })
    }

    for (const [key, value] of Object.entries(JSON.parse(localStorage.appMenuItem) || {})) {
        !value && $('button[name=\'capture-' + key + '\']').addClass('nsc-hide');
    }

    if (localStorage.appType === 'google') {
        $('.nsc-capture-my .nsc-button').addClass('nsc-hide');
        $('select[name=edit-before] option[value=nimbus]').addClass('nsc-hide');
        $('select[name=edit-before] option[value=dropbox]').addClass('nsc-hide');
        $('select[name=edit-before] option[value=quick]').addClass('nsc-hide');
        $('input[name=video-re-encoding]').closest('.nsc-capture-flag').addClass('nsc-hide');
    }

    navigator.mediaDevices.enumerateDevices().then(setDevices).catch(console.error);
});
