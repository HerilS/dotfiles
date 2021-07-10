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


// (function ($) {
if (!window.nimbusConnectInjected) {
    window.nimbusConnectInjected = true;

    var nimbusShare = {
        client_software: 'screens_chrome',
        url: {
            helper: 'https://everhelper.me',
            sync: 'https://sync.nimbusweb.me',
            nimbus: 'https://nimbusweb.me'

            // helper: 'http://develop.nimbustest.com',
            // sync: 'http://sync.develop.nimbustest.com',
            // nimbus: 'http://develop.nimbustest.com'
        },
        info: {
            id: null,
            login: '',
            matchesOrgAutoDomain: false,
            premium: false,
            business: false,
            organization: {},
            workspaces: {},
        },
        setUploadFolder: function (folder) {
            localStorage.setItem('nimbusUploadFolder_' + localStorage.login, JSON.stringify(folder));
        },
        shortUrl: function (url, cb) {
            if (localStorage.nimbusAutoShortUrl !== 'false') {
                $.post('https://nimb.ws/dantist_api.php', {url: url}, function (data) {
                    cb && cb(JSON.parse(data).short_url);
                });
            } else cb && cb(url)
        },
        // checkPremium: function (cb, popup) {
        //     popup = (popup === undefined ? true : !!popup);
        //
        //     nimbusShare.server.user.info(function (res) {
        //         if (res.errorCode !== 0) {
        //             popup && nscPopup.addToQueue(document.getElementById(localStorage.appType === 'google' ? 'nsc_popup_google_premium' : 'nsc_popup_premium'));
        //             return cb && cb('server', {});
        //         }
        //
        //         let premium = {
        //             note: !!res.body.premium.active,
        //             business: !!res.body.premium.is_business,
        //             capture: true
        //         };
        //
        //         if (premium.business) {
        //             return cb && cb(null, premium);
        //         }
        //         $.ajax({
        //             type: 'POST',
        //             url: 'https://capture-pro.everhelper.me/v1/premium',
        //             headers: {
        //                 'Accept': 'application/json',
        //                 'Content-Type': 'application/json',
        //                 'x-client-software': 'screens_chrome',
        //                 // 'EverHelper-Session-ID': localStorage.nimbusSessionId
        //             },
        //             data: JSON.stringify({
        //                 "device": {
        //                     "globalId": localStorage.appGlobalId
        //                 }
        //             }),
        //             dataType: 'json',
        //             async: true,
        //             xhrFields: {
        //                 withCredentials: true
        //             },
        //             success: function () {
        //                 cb && cb(null, premium)
        //             },
        //             error: function (jqXHR) {
        //                 const res = JSON.parse(jqXHR.responseText);
        //                 if (jqXHR.status === 403) {
        //                     popup && nscPopup.addToQueue(document.getElementById('nsc_capture_pro_device'));
        //                     if (res.reason === 'banned') {
        //                         cb && cb('banned', premium);
        //                     } else if (res.reason === 'devicequota') {
        //                         cb && cb('devicequota', premium);
        //                     }
        //                 } else if (jqXHR.status === 404) {
        //                     popup && nscPopup.addToQueue(document.getElementById(localStorage.appType === 'google' ? 'nsc_popup_google_premium' : 'nsc_popup_premium'));
        //                     premium.capture = false;
        //                     cb && cb(null, premium);
        //                 } else {
        //                     popup && $.ambiance({
        //                         message: chrome.i18n.getMessage("notificationNetworkError"),
        //                         timeout: 5
        //                     });
        //                     cb && cb('server', {});
        //                 }
        //             }
        //         });
        //     });
        // },
        server: {
            note: {
                share: function (id, cb) {
                    nimbusShare.server.send.request({
                        data: {
                            "action": "notes:share",
                            "body": {
                                "global_id": [id]
                            }
                        }
                    }, function (err, res) {
                        if (err) return cb(err);
                        return cb(null, {url: res.body[id]});
                    });
                },
            },
            send: {
                xhr: null,
                pending: false,
                abort: function () {
                    if (nimbusShare.server.send.xhr) nimbusShare.server.send.xhr.abort();
                },
                toNimbus: function (action, data, cb) {
                    nimbusShare.server.send.request({
                        url: nimbusShare.url.nimbus + '/auth/api/' + action,
                        data: data
                    }, function (err, res) {
                        if (err) return $.ambiance({
                            message: chrome.i18n.getMessage("notificationNetworkError"),
                            timeout: 5
                        });

                        cb && cb(res)
                    })
                },
                request: function (req, cb) {
                    nimbusShare.server.send.xhr = $.ajax({
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'x-client-software': 'screens_chrome',
                            'EverHelper-Session-ID': localStorage.nimbusSessionId
                        },
                        type: 'POST',
                        url: req.url || nimbusShare.url.sync,
                        data: req.data ? JSON.stringify(req.data) : {},
                        dataType: 'json',
                        async: true,
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function (res) {
                            cb && cb(null, res)
                        },
                        error: function () {
                            cb && cb(new Error(chrome.i18n.getMessage("notificationNetworkError")))
                        }
                    });
                },
                file: function (req, cb) {
                    let fd = new FormData();
                    fd.append(req.type, req.data, req.name);

                    nimbusShare.server.send.xhr = $.ajax({
                        headers: {
                            'x-client-software': 'screens_chrome',
                            'EverHelper-Session-ID': localStorage.nimbusSessionId
                        },
                        url: nimbusShare.url.sync + '/files:preupload',
                        type: "POST",
                        data: fd,
                        processData: false,
                        contentType: false,
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function (res) {
                            if (res.errorCode === 0) {
                                cb(null, res.body);
                            } else {
                                cb(new Error(chrome.i18n.getMessage("notificationWrong")));
                            }
                        },
                        error: function () {
                            cb(new Error(chrome.i18n.getMessage("notificationNetworkError")))
                        }
                    });
                },
                quick: function (req, cb) {
                    nimbusShare.server.send.pending = true;
                    let fd = new FormData();
                    fd.append('title', req.title || '');
                    fd.append('commentText', req.comment || '');
                    fd.append('url', JSON.parse(localStorage.pageinfo).url);
                    fd.append("file", req.data, req.title);

                    $.ajax({
                        headers: {
                            'x-client-software': 'screens_chrome',
                            'EverHelper-Session-ID': localStorage.nimbusSessionId
                        },
                        url: nimbusShare.url.nimbus + '/nimbus-screenshots/api/upload',
                        type: "POST",
                        data: fd,
                        processData: false,
                        contentType: false,
                        xhrFields: {
                            withCredentials: true
                        },
                    }).done(function (res) {
                        nimbusShare.server.send.pending = false;
                        if (res.errorCode === 0) {
                            cb(null, {url: res.body.location})
                        } else {
                            cb && cb(nimbus_core.customError(nimbusShare.server.send.xhr.status, chrome.i18n.getMessage("Unknown error")));
                        }
                    });
                },
                screencast: async function (req, cb, progress) {
                    nimbusShare.server.send.pending = true;

                    const {upload} = await nscNimbus.createMultipartUpload(req.data.size, req.type, req.name);
                    const id = upload.id;
                    const tempFileName = upload.tempFileName;
                    const partSize = upload.partSize;
                    const partsUrls = upload.partsUrls;
                    let parts = [];

                    const message = (percent) => {
                        if(progress && partSize < req.data.size) {
                            progress(percent)
                        }
                    }
                    for (let partNumber = 0, nextPartNumber = 1; partNumber < partsUrls.length; partNumber++, nextPartNumber++) {
                        const file = req.data.slice(partSize * partNumber, partSize * nextPartNumber);
                        message(Math.ceil(partNumber / partsUrls.length * 100));
                        const etag = await nscNimbus.multipartUpload(partsUrls[partNumber], file);
                        message(Math.ceil(nextPartNumber / partsUrls.length * 100));
                        parts.push({partNumber: nextPartNumber, etag})
                    }
                    const {file:{name}} = await nscNimbus.completeMultipartUpload(id, parts, tempFileName);

                    nimbusShare.server.send.request({
                        data: {
                            "action": "screencasts:save",
                            "features": {
                                "noteEditor": true
                            },
                            "body": {
                                "workspaceId": localStorage.nimbusWorkspaceSelect,
                                "screen": {
                                    "title": req.title || '',
                                    "commentText": req.comment || '',
                                    "tempname": name,
                                    "parent_id": req.folder_id || localStorage.nimbusFolderSelect,
                                    "url": JSON.parse(localStorage.pageinfo).url,
                                    duration: nimbus_screen.info.file.video.duration,
                                },
                                "share": req.shared !== undefined ? req.shared : !nscExt.getOption('nimbusShare'),
                            },
                            "_client_software": nimbusShare.client_software
                        }
                    }, function (err, res) {
                        nimbusShare.server.send.pending = false;
                        if (res.errorCode === -20) {
                            cb && cb(nimbus_core.customError(nimbusShare.server.send.xhr.status, chrome.i18n.getMessage("notificationReachedLimit")));
                        } else if (res.errorCode === 0) {
                            cb(null, {body: res.body})
                        } else {
                            cb && cb(nimbus_core.customError(nimbusShare.server.send.xhr.status, chrome.i18n.getMessage("notificationWrong")));
                        }
                    });
                },
                screenshot: function (req, cb) {
                    nimbusShare.server.send.pending = true;
                    nimbusShare.server.send.file({
                        data: req.data,
                        name: req.name,
                        type: 'screens'
                    }, function (err, res) {
                        if (err) return cb(err);
                        nimbusShare.server.send.request({
                            data: {
                                "action": "screenshots:save",
                                "features": {
                                    "noteEditor": true
                                },
                                "body": {
                                    "workspaceId": localStorage.nimbusWorkspaceSelect,
                                    "screen": {
                                        "commentText": req.comment || '',
                                        "title": req.title || '',
                                        "tempname": res.files["screens"],
                                        "parent_id": req.folder_id || localStorage.nimbusFolderSelect,
                                        "url": JSON.parse(localStorage.pageinfo).url
                                    },
                                    "share": req.shared !== undefined ? req.shared : !nscExt.getOption('nimbusShare'),
                                },
                                "_client_software": nimbusShare.client_software
                            }
                        }, function (err, res) {
                            nimbusShare.server.send.pending = false;
                            if (res.errorCode === -20) {
                                cb && cb(nimbus_core.customError(nimbusShare.server.send.xhr.status, chrome.i18n.getMessage("notificationReachedLimit")));
                            } else if (res.errorCode === 0) {
                                cb(null, {body: res.body})
                            } else {
                                cb && cb(nimbus_core.customError(nimbusShare.server.send.xhr.status, chrome.i18n.getMessage("notificationWrong")));
                            }
                        });
                    });
                }
            },
            user: {
                auth: function (login, password, cb) {
                    (login && password) && nimbusShare.server.send.toNimbus('auth', {
                        "login": login,
                        "password": password
                    }, async function (res) {
                        localStorage.nimbusSessionId = res.body.sessionId;
                        // nimbusShare.server.send.request({
                        //     url: nimbusShare.url.helper + '/auth/api/applyAuth',
                        //     data: {"sessionId": res.body.sessionId}
                        // })
                        // await nscCore.setTimeout(1500);
                        cb && cb(res)
                    }, cb);
                },
                logout: function (cb) {
                    nimbusShare.server.send.request({
                        data: {
                            "action": "user:logout",
                            "_client_software": nimbusShare.client_software
                        }
                    }, function (err, res) {
                        if (err) return $.ambiance({
                            message: chrome.i18n.getMessage("notificationNetworkError"),
                            timeout: 5
                        });

                        $('#nsc_button_nimbus, #nsc_button_slack, .nsc-trigger-panel-container.dropbox').removeClass('nsc-hide');
                        $('#nsc_nimbus_logout_link').addClass('nsc-hide');
                        if (nimbus_screen.getLocationParam() !== 'video') $('#nsc_button_quick').removeClass('nsc-hide');
                        nimbusShare.info.matchesOrgAutoDomain = false;
                        localStorage.removeItem('nimbusSessionId');
                        cb && cb(res)
                    })
                },
                register: function (login, password, cb) {
                    (login && password) && nimbusShare.server.send.toNimbus('register', {
                        "login": login,
                        "password": password,
                        "service": "nimbus",
                        "languages": [navigator.language]
                    }, async function (res) {
                        localStorage.nimbusSessionId = res.body.sessionId;
                        // nimbusShare.server.send.request({
                        //     url: nimbusShare.url.helper + '/auth/api/applyAuth',
                        //     data: {"sessionId": res.body.sessionId}
                        // })
                        // await nscCore.setTimeout(1500);
                        cb && cb(res)
                    }, cb);
                },
                challenge: function (state, answer, cb) {
                    nimbusShare.server.send.toNimbus('challenge', {
                        "state": state,
                        "answer": answer,
                    }, async function (res) {
                        localStorage.nimbusSessionId = res.body.sessionId;
                        // nimbusShare.server.send.request({
                        //     url: nimbusShare.url.helper + '/auth/api/applyAuth',
                        //     data: {"sessionId": res.body.sessionId}
                        // })
                        // await nscCore.setTimeout(1500);
                        cb && cb(res)
                    }, cb);
                },
                // info: function (cb) {
                //     nimbusShare.server.send.request({
                //         data: {
                //             "action": "user:info",
                //             "_client_software": nimbusShare.client_software
                //         }
                //     }, function (err, res) {
                //         if (err) return $.ambiance({
                //             message: chrome.i18n.getMessage("notificationNetworkError"),
                //             timeout: 5
                //         });
                //
                //         cb && cb(res)
                //     })
                // },
                remindPassword: function (email, cb) {
                    email && nimbusShare.server.send.request({
                        data: {
                            "action": "remind_password",
                            "email": email,
                            "_client_software": nimbusShare.client_software
                        }
                    }, function (err, res) {
                        if (err) return $.ambiance({
                            message: chrome.i18n.getMessage("notificationNetworkError"),
                            timeout: 5
                        });

                        cb && cb(res)
                    })
                }
            }
        },
    };
}
