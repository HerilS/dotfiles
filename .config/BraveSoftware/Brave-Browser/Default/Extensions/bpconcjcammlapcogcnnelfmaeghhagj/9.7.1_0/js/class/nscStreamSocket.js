class nscStreamSocket {
    constructor() {
        this.ws = null;
        this.active = false;
        this.loading = false;
        this.lastConnectTime = 0;
        this.option = {
            url: 'ws://stream-uploading-prod.nimbusweb.me',
            // url: 'ws://stream-uploading-server.develop.nimbustest.com',
            timeReconnect: 60 * 1000,
            maxTimeReconnect: 60 * 30 * 1000
        };
        this.file = {
            index: 0,
            uid: null,
            queue: [],
        };
        this.log = true;
    }

    init = async () => {
        this.file.index = 0;
        this.file.uid = window.nimbus_core.createUid();

        if (localStorage.nimbusWorkspaceSelect === 'false') {
            await nscNimbus.getWorkspaces();
        }

        let data = {
            uid: this.file.uid,
            videoName: window.nimbus_core.getVideoFileName(JSON.parse(localStorage.pageinfo), 'webm'),
            share: localStorage.videoPrivateUploadEnable !== 'true',
            client_software: nimbusShare.client_software,
            url: JSON.parse(localStorage.pageinfo).url,
            parent_id: 'default', // localStorage.nimbusFolderSelect,
            sessionId: localStorage.nimbusSessionId,
        }

        if (localStorage.nimbusWorkspaceSelect !== 'false') data.workspaceId = localStorage.nimbusWorkspaceSelect;

        localStorage.saveStreamVideoData = JSON.stringify(data);

        this.create();
    }

    create = () => {
        try {
            this.ws = new WebSocket(this.option.url);
            this.ws.onopen = this.onopen;
            this.ws.onmessage = this.onmessage;
            this.ws.onclose = this.onclose;
            this.ws.onerror = async () => {
                if (localStorage.saveStreamVideoData !== undefined) {
                    await nscCore.sendAllTabMessage({operation: 'content_automation_stream_error'});
                }

                if (!this.active && !!this.file.queue.length) {
                    await nscCore.sendAllTabMessage({operation: 'content_automation_stream_error'});
                    await videoRecorder.stopRecord();
                }
            };
        } catch (e) {
            Logger.error(e)
        }
    }

    onopen = () => {
        this.log && Logger.info("socket: open");
        this.active = true;
    }

    onmessage = async (e) => {
        const data = JSON.parse(e.data);

        switch (data.type) {
            case "error":
                this.loading = false;
                this.log && Logger.error(`socket: ${data.message}`);
                localStorage.removeItem('saveStreamVideoData');
                browserAction.setDefault();
                await nscCore.sendAllTabMessage({operation: 'content_automation_stream_error'});
                break;
            case "initiated":
                this.log && Logger.info('socket: initiated');
                await nscCore.setTimeout(1000);
                if (!this.file.queue.length && videoRecorder.getStatus()) this.start();
                else this.reconnect();
                break;
            case "ready":
                this.log && Logger.info('socket: ready');
                await nscCore.setTimeout(1000);
                if (this.file.queue.length > 0) {
                    const [file] = this.file.queue;
                    this.send(file.blob, true, file.index)
                } else {
                    if (videoRecorder.getStatus()) {
                        await videoRecorder.createMediaRecorder();
                    } else {
                        await this.finish();
                    }
                }
                break;
            case "progress":
                let index = this.file.queue.findIndex(e => e.index === data.index);

                // blobs.push(this.file.queue[index].blob);

                index > -1 && this.file.queue.splice(index, 1);

                this.log && Logger.log(`socket: upload index: ${data.index}, stack: ${this.file.queue.length}`);

                if (!!this.file.queue.length) {
                    const [file] = this.file.queue;
                    this.send(file.blob, true, file.index)
                }
                if (!this.file.queue.length && (!this.active || !videoRecorder.getStatus())) {
                    await this.finish();
                }
                break;
            case "response":
                this.log && Logger.log(`socket: onload file, open page ${data.data.location}`);
                this.loading = false;
                browserAction.setDefault();
                await nscCore.sendAllTabMessage({operation: 'content_automation_status_upload_end'});
                await nscCore.tabCreate({url: data.data.location});
                window.nimbus_core.copyTextToClipboard(data.data.location);

                if (localStorage.nimbusPremium === 'false' && localStorage.streamLimitTime === 'true') {
                    localStorage.streamLimitTime = false;
                    await nscCore.setTimeout(1000)
                    await screenshot.insertPopup('nsc_popup_limit_time_stream_open');
                }
        }
    }

    onclose = async () => {
        if (this.active || !!this.file.queue.length) {
            this.lastConnectTime += this.option.timeReconnect;
            if (this.lastConnectTime > this.option.maxTimeReconnect) {
                this.log && Logger.warning('socket: remove file list, no connection stream server');
                this.file.queue = [];
                return;
            }

            window.setTimeout(() => {
                this.log && Logger.info('socket: reconnect');
                this.create();
            }, this.option.timeReconnect);
        } else {
            if (localStorage.saveStreamVideoData !== undefined) {
                browserAction.setDefault();
                this.lastConnectTime += this.option.timeReconnect * 5;

                if (this.lastConnectTime > this.option.maxTimeReconnect) {
                    this.log && Logger.warning('socket: remove video data, no connection stream server');
                    localStorage.removeItem('saveStreamVideoData');
                    return;
                }
                window.setTimeout(() => {
                    this.log && Logger.info('socket: reconnect');
                    this.create();
                }, this.option.timeReconnect * 5);
            } else {
                this.log && Logger.info('socket: close');
                this.loading = false;
                browserAction.setDefault();
                // await videoRecorder.openExtensionPage()
            }
        }
    }

    start = () => {
        const data = JSON.parse(localStorage.saveStreamVideoData);
        this.log && Logger.info("socket: start");

        this.send(JSON.stringify({
            type: 'start',
            ...data,
        }));
    }


    reconnect = () => {
        const data = JSON.parse(localStorage.saveStreamVideoData);
        this.log && Logger.info("socket: reconnect", data);
        this.lastConnectTime = 0;

        this.send(JSON.stringify({
            type: 'reconnect',
            ...data,
        }));
    }


    finish = async () => {
        await nscCore.setTimeout(3000);
        if (localStorage.saveStreamVideoData !== undefined) {
            this.active = false;
            this.log && Logger.info("socket: finish");
            const data = JSON.parse(localStorage.saveStreamVideoData);
            this.send(JSON.stringify({
                type: 'finish',
                ...data,
            }));

            localStorage.removeItem('saveStreamVideoData');
        }
    }


    send = (message, save, index) => {
        // save = save !== undefined ? save : false;

        this.loading = true;

        if (this.file.queue.length === 0 || typeof message === 'string' || save) {
            if (typeof message === 'string') {
                this.log && Logger.log(`socket: send.. message ${message}`);
            } else {
                this.log && Logger.log(`socket: send.. index: ${index} ${nscExt.formatBytes(message.size)}`);
            }
            try {
                this.ws.send(message);
            } catch (e) {

            }
        }

        if (typeof message !== 'string' && !save && this.active) {
            this.file.queue.push({
                index: this.file.index,
                blob: message
            });

            this.log && Logger.log(`socket: save.. index: ${this.file.index} ${nscExt.formatBytes(message.size)}`);

            this.file.index += 1;
        }
    }


    stop = async () => {
        this.active = false;

        this.log && Logger.info('socket: stop');
        if (this.file.queue.length === 0) {
            await this.finish();
        }
    }
}

const nscStream = new nscStreamSocket();


if (localStorage.saveStreamVideoData !== undefined) {
    nscStream.create();
}
