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

var nacl_module = {
    listener: null,
    path: 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/persistent/',
    video_resolution: [
        {width: 320, height: 180},
        {width: 640, height: 360},
        {width: 960, height: 540},
        {width: 1280, height: 720},
        {width: 1600, height: 900},
        {width: 1920, height: 1080},
        {width: 2048, height: 1152},
        {width: 2560, height: 1440},
        {width: 3200, height: 1800},
        {width: 3840, height: 2160}
    ],
    info: {},
    frame_rate: {
        1: 5,
        2: 10,
        3: 15,
        4: 20,
        5: 25
    },
    init: async function () {
        this.info = await new FFMPEG_CONVERT().info(nimbus_screen.info.file.video.patch);

        if (nimbus_screen.info.file.video.patch === nimbus_screen.info.file.video.origin_patch &&
            (nimbus_screen.info.file.video.format === 'webm' || nimbus_screen.info.file.video.format === 'mp4') &&
            (localStorage.videoRecordType === 'camera' || localStorage.videoRecordType === 'desktop')) {

            try {
                await nacl_module.setWaterMark();
            } catch (e) {
                const blob = await nscExt.urlToBlob(nimbus_screen.info.file.video.patch);
                nimbus_screen.info.file.video.blob = blob;
                nimbus_screen.info.file.video.size = Math.floor(blob.size);
                if (!window.nimbus_core.is_app) {
                    nimbus_screen.tracker.send(nimbus_screen.VIDEO_USING);
                }
            }
        } else {
            const blob = await nscExt.urlToBlob(nimbus_screen.info.file.video.patch);
            nimbus_screen.info.file.video.blob = blob;
            nimbus_screen.info.file.video.size = Math.floor(blob.size);
            if (!window.nimbus_core.is_app) {
                nimbus_screen.tracker.send(nimbus_screen.VIDEO_USING);
            }
        }
    },
    setWaterMark: async function () {
        return new Promise(async (resolve, reject) => {
            try {
                await nscExt.checkWaterMark();

                const watermark = await nscExt.getWaterMark(true);
                const {x, y} = nscExt.getWaterMarkPosition(watermark, this.info.quality);

                nimbus_screen.dataURLToFile(watermark.toDataURL('image/jpeg', 1), 'watermark.jpg', () => {
                    const enableTime = nscExt.getOption('watermarkEnableTime')
                    const flt = "[0:v]scale=" + this.info.quality.width + ":-2[bg];" +
                        "[1:v]scale=" + watermark.width + ":" + watermark.height + "[wm];" +
                        "[bg][wm]overlay=" + x + ":" + y + (enableTime ? ":enable='between(t,0," + localStorage.watermarkTime + ")'" : '');

                    const params = ["-i", "/fs/watermark.jpg", "-filter_complex", flt];

                    nacl_module.convert({format: 'watermark', params: params}, resolve);
                })
            } catch (e) {
                reject(e)
            }
        });
    },
    convertGif: function (req, cb, progress) {
        let params = [];
        params.push("-i");
        params.push("/fs/" + nimbus_screen.info.file.video.last_video_name + '.' + nimbus_screen.info.file.video.last_video_format);
        params.push("-vf");
        params.push("fps=" + req.frame_rate + ",scale=" + req.size.width + ":-1:flags=lanczos,palettegen");
        params.push("/fs/palette.png");
        let ffmpeg_convert = new FFMPEG_CONVERT();

        ffmpeg_convert.start(params, null,
            function (f) {
                if (f) {
                    nacl_module.convert({format: req.format, size: req.size, frame_rate: req.frame_rate}, cb, progress);
                }
            }, function () {

            });
    },
    trim: function (start, finish, duration, cb, progress) {
        let s = 0;
        let f = 0;

        if (start === 0 || finish === 0) {
            if (finish === 0) {
                f = start;
            } else {
                s = finish;
                f = duration - finish;
            }
            nacl_module.convert({format: 'trim', trim: {start: s, finish: f}}, cb);
        } else {
            f = start;
            let blob = new Blob(["file '/fs/video-redactor-segment1." + nimbus_screen.info.file.video.last_video_format + "'\nfile '/fs/video-redactor-segment2." + nimbus_screen.info.file.video.last_video_format + "'"], {type: 'text/plain'});
            window.nimbus_core.saveFile('list.txt', blob, function () {
                progress && progress(chrome.i18n.getMessage('labelPreviewLoadingVideo').replace('-', 20));
                nacl_module.convert({format: 'trim1', trim: {start: s, finish: f}},
                    function () {
                        s = finish;
                        f = duration - finish;
                        progress && progress(chrome.i18n.getMessage('labelPreviewLoadingVideo').replace('-', 50));
                        nacl_module.convert({format: 'trim2', trim: {start: s, finish: f}},
                            function () {
                                progress && progress(chrome.i18n.getMessage('labelPreviewLoadingVideo').replace('-', 75));
                                nacl_module.convert({format: 'concat'}, cb);
                            });
                    });
            });
        }
    },
    blur: function (start, finish, duration, position_blur, cb, progress) {
        console.log(start, finish, duration, position_blur, cb, progress)
        let blob_text = "";
        let blur_file = 2;
        let segments = [];

        if (start === 0 && finish !== 0) {
            blur_file = 1;
            segments = [{s: 0, f: finish}, {s: finish, f: duration}];
        } else if (start !== 0 && finish === 0) {
            segments = [{s: 0, f: start}, {s: start, f: duration}];
        } else if (start === 0 && finish === 0) {
            blur_file = 1;
            segments = [{s: start, f: duration}];
        } else {
            segments = [{s: 0, f: start}, {s: start, f: finish}, {s: finish, f: duration}];
        }

        function check(index) {
            if (index <= segments.length) {
                let segment = segments[index - 1];
                console.log('check', index, segments.length, segments, segment);
                if (index > 1) blob_text = blob_text + "\n";
                if (index === blur_file) blob_text = blob_text + "file '/fs/video-redactor-blur." + nimbus_screen.info.file.video.last_video_format + "'";
                else blob_text = blob_text + "file '/fs/video-redactor-segment" + index + "." + nimbus_screen.info.file.video.last_video_format + "'";

                nacl_module.convert({
                    format: 'trim' + index,
                    trim: {start: segment.s, finish: segment.f}
                }, check.bind(this, ++index));
            } else {
                nacl_module.convert({format: 'blur', blur: position_blur, blur_file: blur_file},
                    function () {
                        console.log('blob_text', blob_text);
                        let blob = new Blob([blob_text], {type: 'text/plain'});
                        window.nimbus_core.saveFile('list.txt', blob, function () {
                            nacl_module.convert({format: 'concat'}, cb);
                        });
                    });
            }
        }

        check(1);
    },
    convert: (req, cb) => {
        console.log('--start convert--', req, {...nimbus_screen.info.file.video});

        let params = [];
        let format = req.format;
        let name = nimbus_screen.info.file.video.last_video_name;

        if (req.trim) {
            params.push('-ss');
            params.push(req.trim.start);
        }

        if (req.format !== 'concat' && req.format !== 'encoding') {
            params.push("-i");
        }

        if (req.format === 'concat') {
            params.push("-f");
            params.push("concat");
            params.push("-safe");
            params.push("0");
            params.push("-i");
            params.push("/fs/list.txt");
        } else if (req.format === 'blur') {
            params.push("/fs/video-redactor-segment" + req.blur_file + '.' + nimbus_screen.info.file.video.last_video_format);
        } else if (req.format !== 'encoding') {
            params.push("/fs/" + name + '.' + nimbus_screen.info.file.video.last_video_format);
        }

        // if (req.split) {
        //     params.push('-ss');
        //     params.push(req.split.start);
        //     params.push('-t');
        //     params.push(req.split.finish);
        // }

        if (req.size && req.format !== 'gif') {
            params.push("-filter:v");
            params.push("scale=" + req.size.width + ":-2");
        }

        if (req.format === 'encoding+') {
            params.push("-c:v");
            params.push("libvpx");
            params.push("-lossless");
            params.push("1");
            params.push("-quality");
            params.push("good");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            params.push("-level");
            params.push("3.0");
            params.push("-qmin");
            params.push("0");
            params.push("-qmax");
            params.push("50");
            params.push("-minrate");
            params.push("1M");
            params.push("-maxrate");
            params.push("1M");
            params.push("-c:a");
            params.push("copy");
            params.push("-b:a");
            params.push("128k");
            format = nimbus_screen.info.file.video.format;
        } else if (req.format === 'encoding') {
            params.push("-fflags");
            params.push("+genpts");
            params.push("-i");
            params.push("/fs/video." + localStorage.videoFormat);
            params.push("-c:a");
            params.push("copy");
            params.push("-c:v");
            params.push("copy");
            // params.push("-strict");
            // params.push("-2");
            // params.push("-preset");
            // params.push("ultrafast");
            // params.push("-c:a");
            // params.push("aac");
        } else if (req.format === 'watermark') {
            params = params.concat(req.params);
            params.push("-c:v");
            params.push("libvpx");
            params.push("-lossless");
            params.push("1");
            params.push("-quality");
            params.push("good");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            params.push("-level");
            params.push("3.0");
            params.push("-qmin");
            params.push("0");
            params.push("-qmax");
            params.push("50");
            params.push("-minrate");
            params.push("1M");
            params.push("-maxrate");
            params.push("1M");
            params.push("-b:v");
            params.push("1M");
            params.push("-c:a");
            params.push("copy");
            params.push("-b:a");
            params.push("128k");
            format = nimbus_screen.info.file.video.format;
        } else if (req.format === 'mp4') {
            params.push("-c:v");
            params.push("libx264");
            params.push("-fflags");
            params.push("+genpts");
            params.push("-r");
            params.push("60");
            params.push("-q:v");
            params.push("10");
            params.push("-crf");
            params.push("20");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("ultrafast");
            params.push("-profile:v");
            params.push("baseline");
            params.push("-tune");
            params.push("zerolatency,fastdecode");
            params.push("-x264opts");
            params.push("no-mbtree:sliced-threads:sync-lookahead=0");
            params.push("-level");
            params.push("3.0");
            params.push("-c:a");
            params.push("aac");
            params.push("-b:a");
            params.push("128k");
        } else if (req.format === 'gif') {
            params.push("-i");
            params.push("/fs/palette.png");
            params.push("-filter_complex");
            params.push("fps=" + req.frame_rate + ",scale=" + req.size.width + ":-1:flags=lanczos[x];[x][1:v]paletteuse");
        } else if (req.format === 'webm') {
            params.push("-c:v");
            params.push("libvpx");
            params.push("-lossless");
            params.push("1");
            params.push("-quality");
            params.push("good");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            params.push("-level");
            params.push("3.0");
            params.push("-qmin");
            params.push("0");
            params.push("-qmax");
            params.push("50");
            params.push("-minrate");
            params.push("1M");
            params.push("-maxrate");
            params.push("1M");
            params.push("-b:v");
            params.push("1M");
            params.push("-c:a");
            params.push("copy");
            params.push("-b:a");
            params.push("128k");
        } else if (req.format === 'concat'/* || req.split*/) {
            params.push("-c:a");
            params.push("copy");
            params.push("-c:v");
            params.push("copy");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            format = nimbus_screen.info.file.video.format;
        } else if (req.blur) {
            let w = Math.round(req.blur.w);
            let h = Math.round(req.blur.h);
            let x = Math.round(req.blur.x);
            let y = Math.round(req.blur.y);
            params.push("-filter_complex");
            params.push('[0:v]crop=' + w + ':' + h + ':' + x + ':' + y + ',format=yuv444p,boxblur=20[b0];[0:v][b0]overlay=' + x + ':' + y);
            params.push("-c:a");
            params.push("copy");

            if (nimbus_screen.info.file.video.last_video_format === 'webm') {
                params.push("-preset");
                params.push("veryfast");
                params.push("-rc_lookahead");
                params.push("0");
                params.push("-quality");
                params.push("realtime");
                params.push("-deadline");
                params.push("realtime");
                params.push("-c:v");
                params.push("libvpx");
                params.push("-lossless");
                params.push("1");
                params.push("-quality");
                params.push("good");
                params.push("-level");
                params.push("3.0");
                params.push("-qmin");
                params.push("0");
                params.push("-qmax");
                params.push("50");
                params.push("-b:v");
                params.push("1M");
                params.push("-c:a");
                params.push("libvorbis");
            } else {
                params.push("-fflags");
                params.push("+genpts");
                params.push("-preset");
                params.push("ultrafast");
                params.push("-c:v");
                params.push("libx264");
                params.push("-r");
                params.push("60");
                params.push("-q:v");
                params.push("10");
                params.push("-crf");
                params.push("20");
                params.push("-level");
                params.push("3.0");
                params.push("-c:a");
                params.push("aac");
                params.push("-b:a");
                params.push("128k");
            }
            format = nimbus_screen.info.file.video.format;
        } else if (req.trim) {
            params.push("-c:a");
            params.push("copy");
            params.push("-c:v");
            params.push("copy");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            params.push('-t');
            params.push(req.trim.finish);
            format = nimbus_screen.info.file.video.format;
        } else if (req.crop) {
            params.push('-filter:v');
            params.push('crop=' + req.crop.w + ':' + req.crop.h + ':' + req.crop.x + ':' + req.crop.y);
            params.push("-c:a");
            params.push("copy");

            if (nimbus_screen.info.file.video.last_video_format === 'webm') {
                params.push("-c:v ");
                params.push("libvpx");
                params.push("-lossless");
                params.push("1");
                params.push("-quality");
                params.push("good");
                params.push("-level");
                params.push("3.0");
                params.push("-qmin");
                params.push("-0");
                params.push("-qmax");
                params.push("50");
                params.push("-b:v");
                params.push("1M");
            } else {
                params.push("-c:v");
                params.push("libx264");
                params.push("-fflags");
                params.push("+genpts");
                params.push("-r");
                params.push("60");
                params.push("-q:v");
                params.push("10");
                params.push("-crf");
                params.push("20");
                params.push("-preset");
                params.push("ultrafast");
                params.push("-profile:v");
                params.push("baseline");
                params.push("-tune");
                params.push("zerolatency,fastdecode");
                params.push("-x264opts");
                params.push("no-mbtree:sliced-threads:sync-lookahead=0");
                params.push("-level");
                params.push("3.0");
            }

            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            format = nimbus_screen.info.file.video.format;
        }

        if (req.format === 'encoding') {
            params.push('/fs/video-encode.' + localStorage.videoFormat);
            name = 'video-encode';
            format = localStorage.videoFormat
        } else {
            if (req.format === 'trim' || req.format === 'concat' || req.format === 'crop') {
                if ('video' === nimbus_screen.info.file.video.last_video_name || 'video-convert' === nimbus_screen.info.file.video.last_video_name || 'video-convert-redactor2' === nimbus_screen.info.file.video.last_video_name) {
                    name = 'video-convert-redactor1';
                } else {
                    name = 'video-convert-redactor2';
                }
            } else if (req.format === 'trim1') {
                name = 'video-redactor-segment1';
            } else if (req.format === 'trim2') {
                name = 'video-redactor-segment2';
            } else if (req.format === 'trim3') {
                name = 'video-redactor-segment3';
            } else if (req.format === 'blur') {
                name = 'video-redactor-blur';
            } else {
                name = 'video-convert';
            }
            params.push('/fs/' + name + '.' + format);
        }
        console.log('convert params', params)
        new FFMPEG_CONVERT().start(params, null,
            (f) => {
                if (f) {
                    // if (req.format === 'encoding') {
                    //     nimbus_screen.info.file.video.patch = nacl_module.path + name + '.' + format;
                    //     nimbus_screen.info.file.video.format = format;
                    //     nimbus_screen.info.file.video.last_video_name = name;
                    //     nimbus_screen.info.file.video.last_video_format = format;
                    //
                    //     nimbus_screen.info.file.video.last_convert_name = name;
                    //     nimbus_screen.info.file.video.last_convert_patch = nimbus_screen.info.file.video.patch;
                    //     nimbus_screen.info.file.video.last_convert_format = format;
                    // } else {
                        nimbus_screen.info.file.video.patch = nacl_module.path + name + '.' + format;
                        nimbus_screen.info.file.video.format = format;

                        if (req.format === 'trim' || req.format === 'concat' ||
                            req.format === 'crop' || req.format === 'watermark' ||
                            req.format === 'encoding' || req.format === 'encoding+') {

                            nimbus_screen.info.file.video.last_video_name = name;
                            nimbus_screen.info.file.video.last_video_format = format;

                        } else if (req.format !== 'trim1' && req.format !== 'trim2' && req.format !== 'trim3') {
                            nimbus_screen.info.file.video.last_convert_name = name;
                            nimbus_screen.info.file.video.last_convert_patch = nacl_module.path + name + '.' + format;
                            nimbus_screen.info.file.video.last_convert_format = format;
                        }
                    // }

                    window.nimbus_core.blobUrlToBlob(nimbus_screen.info.file.video.patch, function (blob) {
                        nimbus_screen.info.file.video.blob = blob;
                        nimbus_screen.info.file.video.size = Math.floor(blob.size);
                        if (!window.nimbus_core.is_app) {
                            nimbus_screen.tracker.send(nimbus_screen.VIDEO_CONVERT);
                        }

                        cb && cb()
                    });
                }
            },
            (msg) => {
                // console.log(msg);
                if (msg === 'timeout') {
                    progress && progress('Error convert. Please refresh page and try again.')
                } else {
                    new FFMPEG_CONVERT().set_active();

                    let duration_convert = msg.match(/time=([0-9]+):([0-9]+):([0-9]+)\.([0-9]+)/i);

                    if (nacl_module.info.duration && duration_convert) {
                        duration_convert = +duration_convert[1] * 3600 + +duration_convert[2] * 60 + +duration_convert[3];
                        const percent = Math.ceil(duration_convert / nacl_module.info.duration * 100);
                        const progress = chrome.i18n.getMessage('labelPreviewLoadingVideo').replace('-', percent + '%');

                        nimbus_screen.dom.$preview_loading.find('[data-i18n]').text(progress);
                    }
                }
            });
    }
};



