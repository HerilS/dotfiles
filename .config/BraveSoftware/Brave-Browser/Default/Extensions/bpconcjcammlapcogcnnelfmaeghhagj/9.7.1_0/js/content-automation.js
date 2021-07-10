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

if (!window.EXT_AUTOMATION_JS_INSERTED) {
    window.EXT_AUTOMATION_JS_INSERTED = true;

    const sendMessage = function (data, cb) {
        try {
            chrome.runtime.sendMessage(data, cb);
        } catch (e) {
        }
    }

    const deleteElementBuId = function (id) {
        try {
            document.getElementById(id) && document.getElementById(id).remove();
        } catch (e) {
        }
    }

    const copyUrl = function (url) {
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.value = url;
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (copied) return chrome.i18n.getMessage("notificationUrlCopied");
        return false;
    };

    let setUploadBox = function (text, button) {
        if (document.getElementById('nsc_content_automation_upload')) document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
        let upload = document.createElement('div');
        upload.id = 'nsc_content_automation_upload';
        upload.style.backgroundColor = 'rgba(59, 59, 59, 0.9)';
        upload.style.padding = '15px 20px';
        upload.style.borderRadius = '8px';
        upload.style.position = 'fixed';
        upload.style.bottom = '20px';
        upload.style.right = '20px';
        upload.style.zIndex = '999';
        upload.style.textAlign = 'center';
        upload.style.color = '#fff';
        upload.style.fontSize = '14px';
        upload.style.lineHeight = '18px';
        upload.innerHTML = text;
        if (button) {
            let separate = document.createElement('span');
            separate.style.margin = '0 0 0 14px';
            separate.style.border = '1px solid #5a5a5a';

            let hide = document.createElement('button');
            hide.style.backgroundColor = 'transparent';
            hide.style.border = 'none';
            hide.style.color = '#fff';
            hide.style.fontSize = '14px';
            hide.style.lineHeight = '18px';
            hide.style.fontWeight = 'bold';
            hide.style.textTransform = 'uppercase';
            hide.style.margin = '0 0 0 14px';
            hide.style.padding = '0';
            hide.style.cursor = 'pointer';
            hide.textContent = chrome.i18n.getMessage("popupAutomationHideButton");
            hide.addEventListener('click', function () {
                document.body.removeChild(upload);
            });
            hide.addEventListener("focus", function () {
                this.style.outline = '0';
            });

            let cancel = document.createElement('button');
            cancel.style.backgroundColor = 'transparent';
            cancel.style.border = 'none';
            cancel.style.color = '#fff';
            cancel.style.fontSize = '14px';
            cancel.style.lineHeight = '18px';
            cancel.style.fontWeight = 'bold';
            cancel.style.textTransform = 'uppercase';
            cancel.style.margin = '0 0 0 14px';
            cancel.style.padding = '0';
            cancel.style.cursor = 'pointer';
            cancel.textContent = chrome.i18n.getMessage("popupAutomationCancelButton");
            cancel.addEventListener('click', function () {
                document.body.removeChild(upload);
                sendMessage({operation: 'content_automation', action: 'abort'});
            });
            cancel.addEventListener("focus", function () {
                this.style.outline = '0';
            });

            upload.appendChild(separate);
            upload.appendChild(hide);
            upload.appendChild(cancel);
        }
        document.body.appendChild(upload);
    };

    sendMessage({operation: 'get_automation_setting'}, function (res) {
            // console.log(res)
            if (window.nimbus_core.is_chrome && res.quick_capture_github !== 'false' && location.origin === 'https://github.com') {
                let toolbar = document.querySelectorAll('.timeline-comment-wrapper.timeline-new-comment markdown-toolbar');
                if (toolbar.length) {
                    let block = document.createElement('div');
                    block.className = 'd-inline-block mr-3';
                    let button = document.createElement('button');
                    button.className = 'toolbar-item tooltipped tooltipped-n';
                    button.setAttribute('aria-label', 'Add video using Nimbus Screenshot');
                    let svg = document.createElement('img');
                    svg.className = 'octicon octicon-text-size';
                    // svg.id = 'nsc_content_automation_icon';
                    svg.width = 16;
                    svg.height = 16;
                    svg.style.cursor = 'pointer';
                    svg.src = 'chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/images/symbols/ic-github.svg';
                    button.addEventListener('click', function (e) {
                        sendMessage({operation: 'set_option', key: 'videoRecordIsStream', value: 'false'});
                        sendMessage({
                            operation: 'content_automation',
                            action: 'video',
                            type: 'desktop',
                            auth: 'nimbus',
                            site: 'github'
                        });
                        e.preventDefault();
                        return true;
                    });
                    button.appendChild(svg);
                    block.appendChild(button);
                    toolbar[0].insertBefore(block, toolbar[0].children[0])
                }
            }

            if (window.nimbus_core.is_chrome && res.quick_capture_github === 'false' && res.quick_capture_github_welcome === 'true' && location.origin === 'https://github.com') {
                let welcome = document.createElement('div');
                welcome.style.backgroundColor = '#fff';
                welcome.style.padding = '10px 16px';
                welcome.style.border = '1px solid #d3d3d3';
                welcome.style.boxShadow = '0 2px 4px 0 rgba(0,0,0,.2)';
                welcome.style.borderRadius = '8px';
                welcome.style.position = 'fixed';
                welcome.style.top = '20px';
                welcome.style.right = '20px';
                welcome.style.zIndex = '999';
                welcome.style.textAlign = 'center';
                welcome.style.maxWidth = '300px';
                welcome.style.color = '#171717';
                welcome.style.lineHeight = '1.4';

                let header = document.createElement('div');
                header.style.margin = '0 -6px';
                header.style.textAlign = 'right';

                let close = document.createElement('img');
                close.style.cursor = 'pointer';
                close.width = 16;
                close.height = 16;
                close.src = 'chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/images/new/ic-cancel.svg';
                close.addEventListener('click', function () {
                    document.body.removeChild(welcome);
                    sendMessage({operation: 'set_option', key: 'quickVideoCaptureGithubWelcome', value: 'false'});
                });

                let content = document.createElement('div');

                let logo = document.createElement('img');
                logo.style.margin = '0 auto 10px';
                logo.src = 'chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/images/logo/nimbus_capture_colored_dark.svg';

                let text = document.createElement('div');
                text.textContent = chrome.i18n.getMessage("popupAutomationWelcome");

                let connect = document.createElement('button');
                connect.style.backgroundColor = '#189FB5';
                connect.style.border = '1px solid #189FB5';
                connect.style.color = '#fff';
                connect.style.fontSize = '12px';
                connect.style.fontWeight = '700';
                connect.style.textTransform = 'uppercase';
                connect.style.display = 'block';
                connect.style.padding = '8px 16px';
                connect.style.margin = '15px auto 0';
                connect.textContent = chrome.i18n.getMessage("popupAutomationWelcomeButton");
                connect.addEventListener('click', function () {
                    document.body.removeChild(welcome);
                    sendMessage({operation: 'open_page', url: 'options.html?video'});
                    sendMessage({operation: 'set_option', key: 'quickVideoCaptureGithubWelcome', value: 'false'});
                });

                header.appendChild(close);
                content.appendChild(logo);
                content.appendChild(text);
                content.appendChild(connect);

                welcome.appendChild(header);
                welcome.appendChild(content);
                document.body.appendChild(welcome);
            }

            chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
                // console.log(req);
                const {operation} = req;

                if (operation === 'content_automation_status_upload') {
                    setUploadBox(chrome.i18n.getMessage("popupAutomationUpload"), true);
                }
                if (operation === 'content_automation_status_upload_stream') {
                    setUploadBox(chrome.i18n.getMessage("popupAutomationUploadStream"));
                }
                if (operation === 'content_automation_status_storage_limit') {
                    setUploadBox(chrome.i18n.getMessage("popupAutomationStorageLimit"));
                    window.setTimeout(function () {
                        document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                    }, 10000);
                }
                if (operation === 'content_automation_stream_error') {
                    setUploadBox(chrome.i18n.getMessage("popupAutomationStreamError"));
                    window.setTimeout(function () {
                        document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                    }, 10000);
                }
                if (operation === 'content_automation_status_copy') {
                    setUploadBox(chrome.i18n.getMessage("notificationImageCopied"));
                    window.setTimeout(function () {
                        document.getElementById('nsc_content_automation_upload') && document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                    }, 5000);
                }
                if (operation === 'content_automation_status_not_copy') {
                    setUploadBox(chrome.i18n.getMessage("notificationImageNotCopied"));
                    window.setTimeout(function () {
                        document.getElementById('nsc_content_automation_upload') && document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                    }, 5000);
                }
                if (operation === 'content_automation_status_upload_end') {
                    if (document.getElementById('nsc_content_automation_upload')) document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                }
                if (operation === 'content_automation_send_url') {
                    if (req.site && req.site === 'github') {
                        let textarea = document.getElementById('new_comment_field') ? document.getElementById('new_comment_field') : document.getElementById('issue_body');

                        textarea.value = textarea.value + "\n" + req.url;
                    } else {
                        const copy = copyUrl(req.url)

                        if (copy) {
                            setUploadBox(copy);
                        } else {
                            chrome.runtime.sendMessage({operation: 'open_page', 'url': req.url});
                        }

                        window.setTimeout(function () {
                            document.body.removeChild(document.getElementById('nsc_content_automation_upload'));
                        }, 10000);
                    }
                }

                if (operation === 'copy_to_clipboard') {
                    window.nimbus_core.createCanvasParts(req.info, req.parts, function (canvas, blob) {
                        if (navigator.clipboard && navigator.clipboard.write) {
                            const item = new ClipboardItem({"image/png": blob});
                            navigator.clipboard.write([item]).then(function () {
                                sendMessage({
                                    operation: 'content_message',
                                    message: {operation: 'content_automation_status_copy'}
                                });
                            }, function (error) {
                                sendMessage({
                                    operation: 'content_message',
                                    message: {operation: 'content_automation_status_not_copy'}
                                });
                            });
                        } else {
                            console.error('error copy, navigator.clipboard.write undefined')
                        }
                    });
                }

                if (operation === 'content_automation_media_access') {
                    let iframe = document.createElement('iframe');
                    iframe.setAttribute('allow', 'camera; microphone;');
                    iframe.setAttribute('id', 'nsc_frame_media_access');
                    iframe.setAttribute('style', 'display: none');
                    iframe.setAttribute('src', chrome.runtime.getURL('template/frame-media-access.html?' + req.constraints + '?' + req.params));
                    document.body.appendChild(iframe);
                }

                if (operation === 'status_video') {
                    if (!req.status) {
                        deleteElementBuId('nsc_content_pix_video');
                    } else {
                        const div = document.createElement('div');
                        div.setAttribute('id', 'nsc_content_pix_video');
                        div.setAttribute('class', 'nsc-content-pix-video');
                        document.body.appendChild(div);
                    }
                }
                return true;
            })
            ;
        }
    )
    ;

    window.addEventListener('message', function (e) {
        if(e.data.type && e.data.type === "EverHelperExtMessage") {
            sendMessage({operation: 'ever_helper_message', data: e.data.data});
        }
        try {
            let data = JSON.parse(e.data)
            if (data && data.action === 'nsc_frame_remove') document.getElementById(data.value) && document.getElementById(data.value).remove();
        } catch (e) {

        }
    }, false);
}
