$(document).ready(function () {
    let $nsc_video_player = $('#nsc_video_player');
    let $nsc_video_loading = $('#nsc_video_loading');
    let $nsc_video_container = $('#nsc_video_container');

    let $nsc_video_time_line_box = $('#nsc_video_time_line_box');
    let $nsc_video_time_line = $('#nsc_video_time_line');
    let $nsc_video_time_line_segments = $('#nsc_video_time_line_segments');
    let $nsc_video_timeline_choose = $('#nsc_video_timeline_choose');
    let $nsc_video_time = $('#nsc_video_time');
    let $nsc_video_pause = $('#nsc_video_pause');
    let $nsc_video_play = $('#nsc_video_play');
    let $nsc_video_zoom_range = $('#nsc_video_zoom_range');
    let $nsc_video_button_trim = $('#nsc_video_button_trim');
    let $nsc_video_button_cup = $('#nsc_video_button_cup');
    let $nsc_video_button_open_trim = $('#nsc_video_button_open_trim');
    let $nsc_video_button_cancel_trim = $('#nsc_video_button_cancel_trim');
    let $nsc_video_button_trim_window = $('#nsc_video_button_trim_window');

    let $nsc_video_zoom_time = $('#nsc_video_zoom_time');
    let $nsc_video_crop = $('#nsc_video_crop');
    let $nsc_video_blur = $('#nsc_video_blur');
    let $nsc_discard = $('#nsc_discard');
    let $nsc_done_video = $('#nsc_done_video');

    let player = $nsc_video_player[0];
    let duration = 0;
    let select_crop_start = false;
    let select_crop_finish = false;
    let start_crop = 0;
    let finish_crop = 0;
    let position_crop = false;
    let position_blur = false;
    let cropper = null;
    let ratio = 1;
    let step = 60;

    function blur() {
        let start = Math.ceil(start_crop / step * ratio);
        let finish = Math.floor(finish_crop / step * ratio);

        $nsc_video_container.addClass('loading');
        $nsc_video_button_cancel_trim.trigger('click');
        $nsc_video_pause.trigger('click');
        $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));

        nacl_module.blur(start, finish, duration, position_blur,
            function () {
                $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
                    $nsc_video_container.removeClass('loading');
                    // $nsc_video_play.trigger('click');
                });
            },
            function (text) {
                $nsc_video_loading.find('[data-i18n]').text(text);
            });
    }

    function crop() {
        console.log('crop', position_crop);

        $nsc_video_container.addClass('loading');
        $nsc_video_pause.trigger('click');
        $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));

        nacl_module.convert({format: 'crop', crop: position_crop},
            function () {
                $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
                    $nsc_video_container.removeClass('loading');
                    // $nsc_video_play.trigger('click');
                });
            },
            function (text) {
                $nsc_video_loading.find('[data-i18n]').text(text);
            });
    }

    function trim() {
        let start = Math.ceil(start_crop / step * ratio);
        let finish = Math.floor(finish_crop / step * ratio);

        if (start === 0 && finish === 0) {
            alert('Nothing selected to trim/cut!');
            return;
        }

        console.log('trim', start, 'finish', finish, 'duration', duration);

        $nsc_video_container.addClass('loading');
        $nsc_video_button_cancel_trim.trigger('click');
        $nsc_video_pause.trigger('click');
        $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));

        if (localStorage.appType === 'google') {
            let name = nimbus_screen.info.file.video.last_video_name !== 'video-convert' ? 'video-convert' : 'video-convert2';
            let format = nimbus_screen.info.file.video.format;
            const {createWorker} = FFmpeg;
            const worker = createWorker({
                workerPath: 'js/lib/worker.min.js',
                corePath: 'js/lib/ffmpeg-core.js',
                logger: ({message}) => console.log(message),
                progress: p => console.log(p),
            });
            (async () => {
                await worker.load();
                console.log('Worked loaded');
                await worker.write(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, nimbus_screen.info.file.video.blob);
                console.log("Write file");
                let s = 0;
                let f = 0;

                if (start === 0 || finish === 0) {
                    if (finish === 0) {
                        f = start;
                    } else {
                        s = finish;
                        f = duration;
                    }
                    console.log("Start Trim 1", nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, name + '.' + format, s, f, '-c:a copy -c:v copy');
                    await worker.trim(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, name + '.' + format, s, f, '-c:a copy -c:v copy');
                    console.log("Trim 1 completed");
                } else {
                    f = start;
                    console.log("Start Trim 1", nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, "video_trim1.webm", s, f, '-c:a copy -c:v copy');
                    await worker.trim(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, "video_trim1.webm", s, f, '-c:a copy -c:v copy');
                    console.log("Trim 1 completed");
                    s = finish;
                    f = duration;
                    console.log("Start Trim 2", nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, "video_trim2.webm", s, f, '-c:a copy -c:v copy');
                    await worker.trim(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, "video_trim2.webm", s, f, '-c:a copy -c:v copy');
                    console.log("Trim 2 completed");
                    await worker.concatDemuxer(["video_trim1.webm", "video_trim2.webm"], name + '.' + format, "-c:a copy -c:v copy");
                    console.log("Concat 2 completed");
                }

                const {data} = await worker.read(name + '.' + format);
                await worker.terminate();
                let blobtimeline = new Blob([data.buffer], {type: 'video/webm'});

                nimbus_screen.info.file.video.blob = blobtimeline;
                nimbus_screen.info.file.video.size = Math.floor(blobtimeline.size);
                if (!window.nimbus_core.is_app) {
                    nimbus_screen.tracker.send(nimbus_screen.VIDEO_USING);
                }

                nimbus_screen.saveFile(blobtimeline, name + '.' + format, function () {
                    nimbus_screen.info.file.video.format = format;
                    nimbus_screen.info.file.video.last_video_name = name;
                    nimbus_screen.info.file.video.last_video_format = format;

                    nimbus_screen.info.file.video.patch = nimbus_screen.path + name + '.' + format;

                    $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
                        $nsc_video_container.removeClass('loading');
                        $nsc_video_play.trigger('click');
                    });
                    start_crop = 0;
                    finish_crop = 0;

                });
            })();
        } else {
            nacl_module.trim(start, finish, duration,
                function () {
                    $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
                        $nsc_video_container.removeClass('loading');
                        // $nsc_video_play.trigger('click');
                    });
                    start_crop = 0;
                    finish_crop = 0;
                },
                function (text) {
                    // $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));
                    $nsc_video_loading.find('[data-i18n]').text(text);
                });
        }
    }

    function cup() {
        let start = Math.ceil(start_crop / step * ratio);
        let finish = Math.floor(finish_crop / step * ratio);

        if (start === 0 && finish === 0) {
            alert('Nothing selected to trim/cut!');
            return;
        }

        console.log('cup', start, 'finish', finish, 'duration', duration);

        $nsc_video_container.addClass('loading');
        $nsc_video_button_cancel_trim.trigger('click');
        $nsc_video_pause.trigger('click');
        $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));

        if (localStorage.appType === 'google') {
            let name = nimbus_screen.info.file.video.last_video_name !== 'video-convert' ? 'video-convert' : 'video-convert2';
            let format = nimbus_screen.info.file.video.format;
            const {createWorker} = FFmpeg;
            const worker = createWorker({
                workerPath: 'js/lib/worker.min.js',
                corePath: 'js/lib/ffmpeg-core.js',
                logger: ({message}) => console.log(message),
                progress: p => console.log(p),
            });
            (async () => {
                await worker.load();
                console.log('Worked loaded');
                console.log('Write file', nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, nimbus_screen.info.file.video.blob);
                await worker.write(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, nimbus_screen.info.file.video.blob);
                console.log("Write file");
                let s = start;
                let f = finish;

                if (start === 0 || finish === 0) {
                    if (finish === 0) {
                        s = start;
                        f = duration;
                    } else {
                        s = 0;
                        f = finish;
                    }
                }
                console.log("Start Cup 1", nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, name + '.' + format, s, f, '-c:a copy -c:v copy');
                await worker.trim(nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format, name + '.' + format, s, f, '-c:a copy -c:v copy');
                console.log("Cup 1 completed");

                const {data} = await worker.read(name + '.' + format);
                await worker.terminate();
                let blobtimeline = new Blob([data.buffer], {type: 'video/webm'});

                nimbus_screen.info.file.video.blob = blobtimeline;
                nimbus_screen.info.file.video.size = Math.floor(blobtimeline.size);
                if (!window.nimbus_core.is_app) {
                    nimbus_screen.tracker.send(nimbus_screen.VIDEO_USING);
                }

                nimbus_screen.saveFile(blobtimeline, name + '.' + format, function () {
                    nimbus_screen.info.file.video.format = format;
                    nimbus_screen.info.file.video.last_video_name = name;
                    nimbus_screen.info.file.video.last_video_format = format;

                    nimbus_screen.info.file.video.patch = nimbus_screen.path + name + '.' + format;

                    $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
                        $nsc_video_container.removeClass('loading');
                        $nsc_video_play.trigger('click');
                    });
                    start_crop = 0;
                    finish_crop = 0;

                });
            })();
        } else {
            // nacl_module.trim(start, finish, duration,
            //     function () {
            //         $nsc_video_player.attr('src', nimbus_screen.info.file.video.patch + '?' + Date.now()).on('loadedmetadata', function () {
            //             $nsc_video_container.removeClass('loading');
            //             $nsc_video_play.trigger('click');
            //         });
            //         start_crop = 0;
            //         finish_crop = 0;
            //     },
            //     function (text) {
            //         // $nsc_video_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo'));
            //         $nsc_video_loading.find('[data-i18n]').text(text);
            //     });
        }
    }


    function createCoords() {
        if ($("#ns_crop_button").length) {
            $('#ns_crop_button').removeClass('nsc-hide');
            return;
        }

        let $ns_crop_buttons = $('<div/>', {
            'id': 'ns_crop_button',
            'class': 'ns-crop-buttons bottom'
        });

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
            'class': 'ns-btn save'
        }).on('click', async function () {
            const premium = await nscNimbus.checkPremium(true, 'premium_banner_video_editor');
            if (!premium) return;

            if (cropper) {
                $('#nsc_crop').remove();
                $nsc_video_crop.removeClass('active');
                $nsc_video_blur.removeClass('active');
                cropper && cropper.destroy();
                cropper = null;
            }
            player.pause();
            if (position_crop) crop();
            if (position_blur) blur();
        }).appendTo($ns_crop_buttons);

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
            'class': 'ns-btn cancel'
        }).on('click', function () {
            $('#nsc_crop').remove();
            $nsc_video_crop.removeClass('active');
            cropper && cropper.destroy();
            cropper = null;
        }).appendTo($ns_crop_buttons);

        $('.cropper-crop-box').append($ns_crop_buttons);
    }

    function shadowScroll(data) {
        $('.cropper-modal').css('background-color', 'transparent');
        let page = {
            w: document.getElementById('nsc_crop_image').width,
            h: document.getElementById('nsc_crop_image').height,
        };

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

    let getTimeLineSegment = function (left, text, start, end) {
        if (text) {
            // return $('<div>').addClass('nsc-ve-time-segment nsc-ve-time-segment' + (start ? '-start' : '') + (end ? '-end' : '')).css('left', left).append(
            return $('<div>').addClass('nsc-ve-time-segment').css('left', left).append(
                $('<span>').addClass('nsc-ve-time-segment-text').text(text)
            )
        } else {
            return $('<div>').addClass('nsc-ve-time-segment').css('left', left)
        }
    };

    let getTimeString = function (duration) {
        let house = Math.floor(duration / 3600);
        let minute = Math.floor(duration / 60) - house * 60;
        let second = Math.floor(duration - house * 3600 - minute * 60);

        return {
            text: (house < 10 ? '0' + house : house) + ':' + (minute < 10 ? '0' + minute : minute) + ':' + (second < 10 ? '0' + second : second),
            house: house,
            minute: minute,
            second: second
        }
    };

    let searchRatio = function (width, cb) {
        step = width / duration * ratio;
        if (step < 70) {
            ratio = ratio + 1;
            searchRatio(width, cb);
            return;
        }
        cb && cb();
    };

    let getZoom = function () {
        return 1;
        // return +$nsc_video_zoom_range.val() / 20 + 1;
    };

    $nsc_video_zoom_time.text(getZoom() + ' / 100');
    $nsc_video_time_line_box.css('overflow', 'hidden');

    player.onloadedmetadata = function () {
        duration = Math.floor(player.duration);
        nimbus_screen.dom.$nsc_pre_load.addClass('nsc-hide');
        nimbus_screen.dom.$nsc_video_page.removeClass('nsc-hide');
        $nsc_video_pause.addClass('nsc-hide');

        $nsc_video_time.text(getTimeString(player.currentTime).text + ' - ' + getTimeString(duration).text);

        const width_time_line = $nsc_video_time_line.width();

        $nsc_video_time_line_segments.empty();
        searchRatio(width_time_line, function () {
            for (let current = 0; current < width_time_line; current += step) {
                if (current + step >= width_time_line && current + 70 <= width_time_line) {
                    $nsc_video_time_line_segments.append(getTimeLineSegment(width_time_line - 1, getTimeString(width_time_line / step * ratio).text, false, true));
                }
                $nsc_video_time_line_segments.append(getTimeLineSegment(current, getTimeString(current / step * ratio).text, current === 0, false))
            }
        })
    };

    player.ontimeupdate = function (e) {
        // let start = start_crop / step * ratio;
        // let finish = finish_crop / step * ratio;

        // if (player.currentTime > start && finish !== 0 && player.currentTime < Math.floor(finish)) {
        //     let time = (player.currentTime - start) * 100;
        //     player.currentTime = finish;
        //     $('#nsc_video_time_line_cursor').animate({'left': start / ratio * step - 0.5}, time, 'linear', function () {
        //         window.setTimeout(function () {
        //             $(this).stop().css({'left': finish / ratio * step - 0.5});
        //         }.bind(this), 250 - time)
        //     });
        // } else {
        //     if (player.currentTime > start && start !== 0 && finish === 0) {
        //         player.currentTime = start;
        //         player.pause();
        //     }
        if (player.currentTime > duration) {
            player.currentTime = 0;
            player.pause();
            $('#nsc_video_time_line_cursor').stop().css({'left': player.currentTime / ratio * step - 0.5});
        } else {
            $('#nsc_video_time_line_cursor').stop().animate({'left': player.currentTime / ratio * step - 0.5}, 250, 'linear');
        }
        // }

        $nsc_video_time.text(getTimeString(player.currentTime).text + ' - ' + getTimeString(duration).text);
    };
    player.onplay = function () {
        $nsc_video_play.addClass('nsc-hide');
        $nsc_video_pause.removeClass('nsc-hide');
    };
    player.onpause = function () {
        $nsc_video_play.removeClass('nsc-hide');
        $nsc_video_pause.addClass('nsc-hide');
    };

    $nsc_video_play.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        player.play()
    });

    $nsc_video_pause.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        player.pause()
    });

    $nsc_video_button_open_trim.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        if (!localStorage.videoEditorTrim) {
            $('#nsc_popup_video_trim').removeClass('nsc-hide').find('img').attr('src', chrome.runtime.getURL('images/help/trim.gif')).end().find('.nsc-button-primary').on('click', function () {
                localStorage.videoEditorTrim = true;
                $nsc_video_button_open_trim.trigger('click');
            });
            return;
        }

        if (cropper) {
            $('#nsc_crop').remove();
            $nsc_video_crop.removeClass('active');
            cropper && cropper.destroy();
            cropper = null;
        }

        if ($nsc_video_button_trim_window.is(":visible")) {
            $nsc_video_button_cancel_trim.trigger('click');
        } else {
            player.pause();
            $nsc_video_button_trim_window.removeClass('nsc-hide');
            $nsc_video_timeline_choose.css({
                left: 0,
                right: 0
            }).removeClass('nsc-hide');
        }
    });
    $nsc_video_button_cancel_trim.on('click', function () {
        $nsc_video_button_trim_window.addClass('nsc-hide');
        $nsc_video_timeline_choose.addClass('nsc-hide');
        select_crop_start = false;
        select_crop_finish = false;
        start_crop = 0;
        finish_crop = 0;
    });

    $nsc_video_button_trim.on('click', async function () {
        if ($nsc_video_container.hasClass('loading')) return;

        const premium = await nscNimbus.checkPremium(true, 'premium_banner_video_editor');
        if (!premium) return;

        player.pause();
        trim();
    });

    $nsc_video_button_cup.on('click', async function () {
        if ($nsc_video_container.hasClass('loading')) return;

        const premium = await nscNimbus.checkPremium(true, 'premium_banner_video_editor');
        if (!premium) return;

        player.pause();
        cup();
    });

    $nsc_video_zoom_range.on('input', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        let zoom = getZoom();

        if (zoom === 1) $nsc_video_time_line_box.css('overflow', 'hidden');
        else $nsc_video_time_line_box.css('overflow', 'auto');

        $nsc_video_button_cancel_trim.trigger('click');
        $nsc_video_zoom_time.text(zoom + ' / 100');

        player.onloadedmetadata();
    });

    // let auto_start = null;

    $nsc_video_time_line
        .on('mousemove', function (e) {
            let currentTime = player.currentTime;
            let offset = $nsc_video_time_line.offset();

            if (select_crop_start) {
                $nsc_video_timeline_choose.css({left: (e.pageX - offset.left) + 'px'});
                start_crop = e.pageX - offset.left;
                // currentTime = start_crop / step * ratio;
                // window.clearTimeout(auto_start);
                // auto_start = true;
                player.pause();
            }

            if (select_crop_finish) {
                $nsc_video_timeline_choose.css({right: offset.left + $nsc_video_time_line.width() - e.pageX + 'px'});
                finish_crop = e.pageX - offset.left;
                // currentTime = finish_crop / step * ratio;
                // window.clearTimeout(auto_start);
                // auto_start = true;
                player.pause();
            }

            if (select_crop_start || select_crop_finish) {
                if (window.innerWidth - e.pageX < 200) {
                    $nsc_video_time_line_box.stop().animate({scrollLeft: $nsc_video_time_line_box.scrollLeft() + (200 - (window.innerWidth - e.pageX))}, 200);
                }

                if (e.pageX < 200) {
                    $nsc_video_time_line_box.stop().animate({scrollLeft: $nsc_video_time_line_box.scrollLeft() + (e.pageX - 200)}, 200);
                }

                // player.currentTime = currentTime;
                // $('#nsc_video_time_line_cursor').stop().css({'left': currentTime / ratio * step - 0.5});
                $nsc_video_time.text(getTimeString(currentTime).text + ' - ' + getTimeString(duration).text);
            }

            // auto_start && (auto_start = window.setTimeout(function () {
            //     console.log('play');
            //
            //     if (select_crop_start) {
            //         player.currentTime = currentTime - 3 > 0 ? currentTime - 3 : 0;
            //         $('#nsc_video_time_line_cursor').stop().css({'left': player.currentTime / ratio * step - 0.5});
            //     }
            //
            //     player.play();
            // }, 250));
        })
        .on('mousedown', function (e) {
            if ($nsc_video_container.hasClass('loading')) return;

            // player.pause();
            let offset = $nsc_video_time_line.offset();

            if ($(e.target).hasClass('nsc-ve-timeline-choose-handler-left') || $(e.target).closest('.nsc-ve-timeline-choose-handler-left').length) {
                start_crop = e.pageX - offset.left;
                select_crop_start = true;
            }
            if ($(e.target).hasClass('nsc-ve-timeline-choose-handler-right') || $(e.target).closest('.nsc-ve-timeline-choose-handler-right').length) {
                finish_crop = e.pageX - offset.left;
                select_crop_finish = true;
            }
        })
        .on('mouseup', function (e) {
            // window.clearTimeout(auto_start);
            // auto_start = null;

            let currentTime = player.currentTime;

            if (!select_crop_start && !select_crop_finish) {
                let offset = $nsc_video_time_line.offset();
                let offsetX = e.pageX - offset.left;
                currentTime = offsetX / step * ratio;
                if (currentTime > duration) currentTime = duration;
                player.currentTime = currentTime;
                $('#nsc_video_time_line_cursor').stop().css({'left': currentTime / ratio * step - 0.5});
            }

            if (select_crop_start || select_crop_finish) {
                let start = start_crop / step * ratio;
                let finish = finish_crop / step * ratio;
                let time = (player.currentTime - start) * 100;

                if (select_crop_start) {
                    player.currentTime = start;
                    $('#nsc_video_time_line_cursor').animate({'left': start / ratio * step - 0.5}, time, 'linear');
                } else {
                    player.currentTime = finish;
                    $('#nsc_video_time_line_cursor').animate({'left': finish / ratio * step - 0.5}, time, 'linear');
                }
            }

            // if (select_crop_start) {
            //     player.currentTime = currentTime - 3 > 0 ? currentTime - 3 : 0;
            //     $('#nsc_video_time_line_cursor').stop().css({'left': player.currentTime / ratio * step - 0.5});
            // }

            select_crop_start = false;
            select_crop_finish = false;

            // if(!player.paused) player.play();
        })
        .on('mouseleave', function () {
            if (select_crop_start || select_crop_finish) {
                // window.clearTimeout(auto_start);
                // auto_start = null;

                let start = start_crop / step * ratio;
                let finish = finish_crop / step * ratio;
                let time = (player.currentTime - start) * 100;

                if (select_crop_start) {
                    player.currentTime = start;
                    $('#nsc_video_time_line_cursor').animate({'left': start / ratio * step - 0.5}, time, 'linear');
                } else {
                    player.currentTime = finish;
                    $('#nsc_video_time_line_cursor').animate({'left': finish / ratio * step - 0.5}, time, 'linear');
                }

                select_crop_start = false;
                select_crop_finish = false;

                // player.play();
            }
        });

    $nsc_video_crop.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        if ($nsc_video_timeline_choose.is(":visible") || $nsc_video_button_trim_window.is(":visible")) {
            $nsc_video_button_cancel_trim.trigger('click');
        }

        if (!localStorage.videoEditorCrop) {
            $('#nsc_popup_video_crop').removeClass('nsc-hide').find('img').attr('src', chrome.runtime.getURL('images/help/crop.gif')).end().find('.nsc-button-primary').on('click', function () {
                localStorage.videoEditorCrop = true;
                $nsc_video_crop.trigger('click');
            });
            return;
        }

        if (cropper) {
            $('#nsc_crop').remove();
            $nsc_video_crop.removeClass('active');
            $nsc_video_blur.removeClass('active');
            cropper && cropper.destroy();
            cropper = null;
            return;
        }

        $nsc_video_crop.addClass('active');
        const w = $nsc_video_player.width();
        const h = $nsc_video_player.height();
        let zoom = 0;

        if (w / player.videoWidth < h / player.videoHeight) {
            zoom = w / player.videoWidth;
        } else {
            zoom = h / player.videoHeight;
        }

        let canvas = document.createElement('canvas');
        canvas.id = 'nsc_crop_image';
        canvas.width = player.videoWidth * zoom;
        canvas.height = player.videoHeight * zoom;

        let $bg = $('<div/>', {id: 'nsc_crop'});
        $bg.css('z-index', 1);
        $bg.css('position', 'absolute');
        $bg.css('left', '50%');
        $bg.css('top', 0);
        $bg.css('margin-left', -canvas.width / 2);
        $bg.css('width', canvas.width);
        $bg.css('height', canvas.height);

        $bg.append(canvas);
        $nsc_video_player.before($bg);

        const image = document.getElementById('nsc_crop_image');
        cropper = new Cropper(image, {
            autoCrop: false,
            zoomable: false,
            viewMode: 1,
            toggleDragModeOnDblclick: false,
            ready() {
                $('.cropper-bg').css('background-image', 'inherit')
            },
            cropstart: function (event) {
                let data = cropper.getData(true);

                createCoords(data);

                $('#ns_crop_button').addClass('nsc-hide');
            },
            cropmove: function (event) {
            },
            cropend: function (e) {
                let data = cropper.getData(true);

                position_crop = {x: data.x / zoom, y: data.y / zoom, w: data.width / zoom, h: data.height / zoom};
                position_blur = false;
                createCoords(data);
            },
            crop: function (event) {
                let data = cropper.getData(true);
                shadowScroll(data)
            }
        });
    });

    $nsc_video_blur.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        if ($nsc_video_timeline_choose.is(":visible") || $nsc_video_button_trim_window.is(":visible")) {
            $nsc_video_button_cancel_trim.trigger('click');
        }

        if (cropper) {
            $('#nsc_crop').remove();
            $nsc_video_crop.removeClass('active');
            $nsc_video_blur.removeClass('active');
            cropper && cropper.destroy();
            cropper = null;
            return;
        }

        player.pause();
        $nsc_video_timeline_choose.css({
            left: 0,
            right: 0
        }).removeClass('nsc-hide');

        $nsc_video_blur.addClass('active');
        const w = $nsc_video_player.width();
        const h = $nsc_video_player.height();
        let zoom = 0;

        if (w / player.videoWidth < h / player.videoHeight) {
            zoom = w / player.videoWidth;
        } else {
            zoom = h / player.videoHeight;
        }

        let canvas = document.createElement('canvas');
        canvas.id = 'nsc_crop_image';
        canvas.width = player.videoWidth * zoom;
        canvas.height = player.videoHeight * zoom;

        let $bg = $('<div/>', {id: 'nsc_crop'});
        $bg.css('z-index', 1);
        $bg.css('position', 'absolute');
        $bg.css('left', '50%');
        $bg.css('top', 0);
        $bg.css('margin-left', -canvas.width / 2);
        $bg.css('width', canvas.width);
        $bg.css('height', canvas.height);

        $bg.append(canvas);
        $nsc_video_player.before($bg);

        const image = document.getElementById('nsc_crop_image');
        cropper = new Cropper(image, {
            autoCrop: false,
            zoomable: false,
            viewMode: 1,
            toggleDragModeOnDblclick: false,
            ready() {
                $('.cropper-bg').css('background-image', 'inherit')
            },
            cropstart: function (event) {
                let data = cropper.getData(true);

                createCoords(data);

                $('#ns_crop_button').addClass('nsc-hide');
            },
            cropmove: function (event) {
            },
            cropend: function (e) {
                let data = cropper.getData(true);
                position_crop = false;
                position_blur = {x: data.x / zoom, y: data.y / zoom, w: data.width / zoom, h: data.height / zoom}
                createCoords(data);
            },
            crop: function (event) {
                let data = cropper.getData(true);
                shadowScroll(data)
            }
        });
    });

    $nsc_discard.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        let result = confirm('Return the original file?');
        if (result) {
            $('#nsc_crop').remove();
            $nsc_video_crop.removeClass('active');
            cropper && cropper.destroy();
            cropper = null;

            nimbus_screen.info.file.video.format = nimbus_screen.info.file.video.last_convert_format;
            nimbus_screen.info.file.video.last_video_name = nimbus_screen.info.file.video.last_convert_name;
            nimbus_screen.info.file.video.last_video_format = nimbus_screen.info.file.video.last_convert_format;

            nimbus_screen.info.file.video.patch = nimbus_screen.info.file.video.last_convert_patch;

            window.nimbus_core.blobUrlToBlob(nimbus_screen.info.file.video.patch, function (blob) {
                nimbus_screen.info.file.video.blob = blob;
                nimbus_screen.info.file.video.size = Math.floor(blob.size);
                $nsc_done_video.trigger('click')
            });
        }
    });

    $nsc_done_video.on('click', function () {
        if ($nsc_video_container.hasClass('loading')) return;

        player.pause();
        nimbus_screen.dom.$nsc_video_page.addClass('nsc-hide');
        nimbus_screen.dom.$button_done.click();
    });
});
