window.FFMPEG_CONVERT = function () {

    const DEBUG = false;
    const FFMPEG_TIMEOUT = 60 * 60 * 1000;

    let output = '';
    let msg = '';
    let last_active = Date.now();

    function set_active() {
        last_active = Date.now();
    }

    // -----------------------------------------------------------
    function run_ffmpeg(params, options, finish, message) {
        if (DEBUG) console.log('--video_ffmpeg.run--', '\n', params.join(' '));

        let timer = null;
        output = '';

        let pnacl = document.createElement("embed");
        pnacl.setAttribute("id", "pnacl");
        pnacl.setAttribute("height", "0");
        pnacl.setAttribute("width", "0");
        pnacl.setAttribute("src", "/manifest_ffmpeg.nmf");
        pnacl.setAttribute("type", "application/x-nacl");

        pnacl.setAttribute("ps_stdout", "dev/tty");
        pnacl.setAttribute("ps_stderr", "dev/tty");
        pnacl.setAttribute("ps_tty_prefix", "''");

        let i = 0;
        pnacl.setAttribute("arg" + (i++).toString(), "ffmpeg");
        pnacl.setAttribute("arg" + (i++).toString(), "-y");

        for (let j = 0; j < params.length; j++) {
            pnacl.setAttribute("arg" + (i++).toString(), params[j]);
        }

        document.body.appendChild(pnacl);

        pnacl.addEventListener('loadstart', eventStatus("Load Start"));
        pnacl.addEventListener('progress', eventProgress);
        pnacl.addEventListener('load', eventStatus("load"));
        pnacl.addEventListener('error', eventStatus("error: " + pnacl.lastError));
        pnacl.addEventListener('abort', eventStatus("abort: " + pnacl.lastError));
        pnacl.addEventListener('loadend', eventRunning);

        pnacl.addEventListener('message', function (ev) {
            msg = ev.data.replace(/^''/gm, '');
            message && message(msg);
            output += msg;
        });

        pnacl.addEventListener('crash', function () {
            if (DEBUG) console.log('Exit:', pnacl.exitStatus);
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            document.body.removeChild(pnacl);
            setTimeout(function () {
                finish && finish((pnacl.exitStatus !== 0), output);
            }, 0);
        });

        function eventStatus(status) {
            if (DEBUG) console.log('Status:', status);
        }

        function eventProgress(event) {
            if (DEBUG) console.log('Progress:', event);
        }

        function eventRunning() {
            if (DEBUG) console.log("Running");
        }

        timer = setInterval(function () {
            if (last_active + FFMPEG_TIMEOUT < Date.now()) {
                clearTimeout(timer);
                finish && finish(false);
                message('timeout');
                document.body.removeChild(pnacl);
            }
        }, FFMPEG_TIMEOUT / 2); // частота ???
    }

    function abort() {
        let pnacl = document.getElementById("pnacl");
        if (pnacl) document.body.removeChild(pnacl);

    }

    function getInfo(file) {
        return new Promise((resolve) => {
            const args = [
                "-i",
                "/fs/" + file.match(/[^\/]+$/)[0],
                "-strict",
                "-2"
            ];

            let info = {};

            run_ffmpeg(args, {},
                (f, msg) => {
                    if (DEBUG) console.log(f, msg);

                    let m = msg.match(/Video:\s(.+?)\s(.+?)\s([0-9]+)x([0-9]+)[\s|,]/i);
                    if (m) {
                        info.codec = m[1];
                        info.quality = {width: m[3], height: m[4]};
                    }

                    m = msg.match(/([0-9]*):([0-9]*):([0-9]*)\.([0-9]*)/i);
                    if (m) {
                        let hour = parseInt(m[1]);
                        let minute = parseInt(m[2]);
                        let second = parseInt(m[3]);
                        info.duration = hour * 3600 + minute * 60 + second;
                    }
                    resolve(info);
                });
        });
    }

    function command(str, message, finish) {

        let params = [];

        let mm = str.split(' ');
        for (let i = 0; i < mm.length; i++) {
            let m = mm[i].trim();
            if (m) params.push(m);
        }

        run_ffmpeg(params, {},
            function (f, msg) {

                if (DEBUG) console.log(f, msg)

                finish(f, msg);

            },
            function (msg) {

                message(msg);
            });
    }

    // =============================================================
    let queryRun = [];
    let isRun = false;

    function start(params, opt, finish, message) {

        opt = opt ? opt : {priority: false};

        // ставим в очередь
        if (opt.priority) {
            queryRun.unshift({
                params: params,
                options: opt,
                trial: 0,
                state: 0,
                finish: finish,
                message: message
            });
        } else {
            queryRun.push({
                params: params,
                options: opt,
                trial: 0,
                state: 0,
                finish: finish,
                message: message
            });
        }

        run_query();

    }

    // -------------------------------------------------------------------
    function run_query() {
        if (DEBUG) console.log("run_query", queryRun);

        if (isRun) return;

        for (let i = 0; i < queryRun.length; i++) {
            if (queryRun[i].state === 0) {
                queryRun[i].state = 1;
                queryRun[i].trial++;
                _run(queryRun[i]);
                isRun = true;
            }
        }

        function _run(qq) {
            run_ffmpeg(qq.params, qq.options, function (f) {
                    if (DEBUG) console.log(f);
                    qq.state = 2;
                    isRun = false;
                    qq.finish(f);
                    setTimeout(function () {
                        run_query();
                    }, 0);
                },
                function (msg) {
                    qq.message(msg.replace("''", ""));
                });
        }
    }

    // =============================================================
    function thumbnail(videoFileName, imageFileName, callback) {

        if (DEBUG) console.log("getThumbnail", videoFileName, imageFileName);

        const args = [
            "-ss",
            "00:00:01",
            "-i",
            "/fs/" + videoFileName,
            "-frames:v",
            "1",
            "/fs/" + imageFileName,
            "-y",
            "-strict",
            "-2",
            "-hide_banner"
        ];

        start(args, {priority: false, timeout: 5000}, _success, _message);

        let info = {};

        // -----------------
        function _success(f) {
            if (f) {
                fvdDownloader.FileSystem.isFile(imageFileName,
                    function (rez) {
                        if (rez.error) {
                            console.log(output);
                            callback(null);
                        } else {
                            callback(info);
                        }
                    });
            } else {
                console.log(output);
                callback(null);
            }
        }

        // -----------------
        function _message(msg) {
            readInfo(msg);
        }

        // -----------------------------
        function readInfo(text) {
            const m = text.match(/Video\:\s(.+?)\s(.+?)\s([0-9]+)x([0-9]+)[\s|,]/i);
            if (m) {
                if (m[1] === 'mjpeg,') return;
                info.codec = m[1];
                info.quality = {
                    width: m[3],
                    height: m[4]
                };
            }
        }

        // -----------------------------------------------------------
    }


    return {
        run: run_ffmpeg,
        info: getInfo,
        command: command,
        abort: abort,
        start: start,
        thumbnail: thumbnail,
        set_active: set_active
    }
};
