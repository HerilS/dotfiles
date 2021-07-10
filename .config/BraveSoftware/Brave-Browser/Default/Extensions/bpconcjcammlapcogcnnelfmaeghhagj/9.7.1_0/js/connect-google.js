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

window.googleShare = {
    xhr: null,
    folder: {
        current: 'root',
        parent: {},
        list: {},
    },
    story: {
        get: {
            uploadFolder: function () {
                return JSON.parse(localStorage.getItem("googleUploadFolder") || '{"id": "root", "title": "Main folder"}');
            },
            accessToken: function () {
                return localStorage.getItem("accessTokenGoogle");
            },
        },
        set: {
            uploadFolder: function (folder) {
                localStorage.setItem('googleUploadFolder', JSON.stringify(folder));
            },
            accessToken: function (token) {
                localStorage.setItem('accessTokenGoogle', token);
            },
        },
        remove: {
            accessToken: function () {
                localStorage.removeItem('accessTokenGoogle');
            },
        }
    },
    server: {
        xhr: null,
        abort: function () {
            if (window.googleShare.server.xhr) window.googleShare.server.xhr.abort();
        },
        request: function (url, cb) {
            let delay = Math.random() * 500 + 500;
            let ajax = function (index) {
                window.googleShare.server.xhr = $.ajax({
                    headers: {
                        'Authorization': 'Bearer ' + googleShare.story.get.accessToken(),
                        'Content-Type': 'application/json',
                    },
                    type: 'GET',
                    url: url,
                    success: function (res) {
                        cb && cb(null, res);
                    },
                    error: function (err) {
                        switch (err.status) {
                            case 403: // limit error
                                if (index * 2 > 16) {
                                    cb && cb(nimbus_core.customError(err.status, chrome.i18n.getMessage("notificationWrong")));
                                } else {
                                    setTimeout(ajax(index ? index * 2 : 1), delay * index);
                                }
                                break;

                            case 401: // login fail
                                googleShare.server.logout();
                                cb && cb(nimbus_core.customError(err.status, chrome.i18n.getMessage("notificationLoginFail")));
                                break;

                            case 503: // Service Unavailable
                                cb && cb(nimbus_core.customError(err.status, chrome.i18n.getMessage("notificationServiceUnavailable")));
                                break;

                            default: // network error
                                cb && cb(nimbus_core.customError(err.status, chrome.i18n.getMessage("notificationWrong")));
                        }
                    }
                });
            };

            ajax()
        },
        logout: function () {
            if (googleShare.story.get.accessToken()) {
                googleShare.server.request('https://accounts.google.com/o/oauth2/revoke?token=' + googleShare.story.get.accessToken());
                googleShare.story.remove.accessToken();
                googleShare.view.tooltip();
                $('#nsc_loading_upload_file').removeClass('visible').text('');
                $('#nsc_file_manager').addClass('nsc-hide');
                $('.nsc-trigger-panel-container').removeClass('active')
            }
        },
        get: {
            folder: {
                info: function (id, cb) {
                    googleShare.server.request("https://www.googleapis.com/drive/v2/files/" + id, cb);
                },
                parent: function (folder, cb) {
                    googleShare.server.request("https://www.googleapis.com/drive/v2/files/" + folder + "/parents", function (err, res) {
                        if (err) return cb(err);
                        if (res.items.length === 0) return cb(null, null);

                        googleShare.server.get.folder.info(res.items[0].id, cb);
                    });
                },
                list: function (current, cb) {
                    googleShare.server.request("https://www.googleapis.com/drive/v2/files/" + current + "/children?q=mimeType = 'application/vnd.google-apps.folder'", function (err, res) {
                        if (err) return cb(err);
                        if (res.items.length === 0) return cb(null, []);
                        for (let l = res.items.length, i = 0, folders = []; i < l; i++) {
                            googleShare.server.get.folder.info(res.items[i].id, function (err, folder) {
                                if (err) return;
                                folders.push(folder);
                                if (folders.length === l) return cb(null, folders);
                            })
                        }
                    });
                }
            },
        },
        set: {}
    },
    view: {
        tooltip: function () {
            if (window.googleShare.story.get.accessToken()) {
                $('.nsc-trigger-panel-container.nsc-button-google-drive').addClass('is_trigger');
                // $('#nsc_button_google').attr('title', chrome.i18n.getMessage("gDriveSendTo") + ':&nbsp;' + window.googleShare.story.get.uploadFolder().title);
                $('#nsc_google_drive_share').prop('checked', localStorage.shareOnGoogle !== 'true');
                $('#nsc_google_drive_open_folders').html('<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">&nbsp;' + googleShare.story.get.uploadFolder().title);

                $('#nsc_google_drive_logout').attr('title', chrome.i18n.getMessage('gDriveLogoutFrom') + ' ' + localStorage.googleEmail)
            } else {
                $('.nsc-trigger-panel-container.nsc-button-google-drive').removeClass('is_trigger');
                // $('#nsc_button_google').attr('title', '');
            }
        },
        folders: function (folder) {
            console.log('view folder', folder)
            $('#nsc_loading_upload_file').removeClass('visible');
            $('#nsc_file_manager_folders_list').empty().addClass('loading');
            $('#nsc_file_manager').removeClass('nsc-hide');

            googleShare.folder.current = folder || 'root';

            googleShare.server.get.folder.parent(googleShare.folder.current, function (err, parent) {
                $('#nsc_file_manager_folders_parent').empty().append(function () {
                    if (parent) return $('<div>', {
                        'html': '<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">&nbsp;' + parent.title,
                        'data-id': parent.id
                    }).on('click', function (f) {
                        googleShare.view.folders(f.id);
                    }.bind(this, parent));

                    return $('<div>', {
                        'html': chrome.i18n.getMessage("gDriveMainFolder"),
                        'data-id': 'root'
                    }).on('click', function () {
                        googleShare.getFolders('root');
                    });
                });

                googleShare.server.get.folder.info(googleShare.folder.current, function (err, current) {
                    $('#nsc_file_manager_folders_current').empty().append(
                        $('<div>', {
                            'html': '<img src="images/icon_folder.png "><span>' + current.title + '</span>',
                            'data-id': current.id
                        }));
                    $('#nsc_file_manager_future').html(chrome.i18n.getMessage("gDriveLabelFolders") + '&nbsp;<b>' + current.title + '</b>');

                    googleShare.server.get.folder.list(googleShare.folder.current, function (err, folders) {
                        $('#nsc_file_manager_folders_list').removeClass('loading');
                        if (err) return $('#nsc_file_manager').addClass('nsc-hide');

                        if (folders.length === 0) $('#nsc_file_manager_folders_list').append('<span>' + chrome.i18n.getMessage("gDriveNoItems") + '</span>');

                        for (let folder of folders) {
                            $('#nsc_file_manager_folders_list').append(
                                $('<li>', {
                                    'html': '<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">&nbsp;' + folder.title,
                                    'data-id': folder.id
                                }).on('click', function (f) {
                                    googleShare.view.folders(f.id);
                                }.bind(this, folder))
                            );
                        }
                    });
                });
            });
        }
    },
    abort: function () {
        if (googleShare.xhr) googleShare.xhr.abort();
    },
    setPublicGdrive: function (fileId, cb) {
        let data = JSON.stringify({
            "role": "reader",
            "type": "anyone"
        });
        googleShare.httpRequest('POST', 'https://www.googleapis.com/drive/v2/files/' + fileId + '/permissions', data, cb);
    },
    refreshToken: function (type) {
        googleShare.type = type;
        if (!googleShare.story.get.accessToken()) {
            chrome.runtime.sendMessage({operation: 'oauth_google'});
        } else {
            chrome.runtime.sendMessage({operation: 'oauth_google_refresh'});
        }
    },
    httpRequest: function (method, url, data, headers, cb) {
        if (typeof headers === 'function') {
            cb = headers;
            headers = null;
        }

        if (typeof data === 'function') {
            cb = data;
            data = null;
            headers = null;
        }

        googleShare.xhr = new XMLHttpRequest();
        googleShare.xhr.open(method, url);
        googleShare.xhr.setRequestHeader('Authorization', 'Bearer ' + googleShare.story.get.accessToken());

        if (!headers || (headers && !headers.hasOwnProperty('Content-Type'))) {
            googleShare.xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        }
        if (headers) {
            for (let key in headers) {
                if (!headers.hasOwnProperty(key)) {
                    return;
                }
                googleShare.xhr.setRequestHeader(key, headers[key]);
            }
        }

        googleShare.xhr.onload = function () {
            if (googleShare.xhr.readyState !== 4) return;
            let res = JSON.parse(googleShare.xhr.response || '{}');
            switch (googleShare.xhr.status) {
                case 200:	// success
                case 308:
                    cb && cb(null, res, googleShare.xhr);
                    break;
                case 401: // login fails
                    googleShare.server.logout();
                    cb && cb(nimbus_core.customError(googleShare.xhr.status, chrome.i18n.getMessage("notificationLoginFail")));
                    break;
                default:
                    cb && cb(nimbus_core.customError(googleShare.xhr.status, chrome.i18n.getMessage("notificationWrong")));
            }
        };

        googleShare.xhr.onerror = function () {
            cb && cb(nimbus_core.customError(googleShare.xhr.status, chrome.i18n.getMessage("notificationWrong")));
        };

        googleShare.xhr.send(data);
    },
    save: function (blob, name, cb, progress) {
        console.log('google save', blob, name)
        let location;
        let length = 1024 * 1024;
        let file = blob;
        let format = name.match(/\.([0-9a-z]+)$/i)[1];
        let size = blob.size;
        let mime_type = ((format === 'mp4' || format === 'webm') ? 'video' : 'image') + '/' + format;

        let data = JSON.stringify({
            "name": name,
            "description": "Video uploaded using " + chrome.i18n.getMessage('appName'),
            "parents": [googleShare.story.get.uploadFolder().id]
        });

        let headers = {
            'x-upload-content-length': size,
            'X-Upload-Content-Type': mime_type
        };

        let send = function (location, file, headers, cb) {
            googleShare.httpRequest('PUT', location, file, headers, function (err, res, xhr) {
                console.log(err, res, xhr)
                if (!err && xhr.status === 308) {
                    let range = +xhr.getResponseHeader('range').match(/\d+$/);
                    let next_range = range + length;

                    if (next_range > size) next_range = size;

                    headers = {'Content-Range': 'bytes ' + range + '-' + (next_range - 1) + '/' + size};
                    progress && progress(Math.ceil(next_range / size * 100));
                    file = blob.slice(range, next_range);
                    send(location, file, headers, cb)
                } else {
                    cb && cb(err, res);
                }
            });
        };

        googleShare.httpRequest('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', data, headers, function (err, res, xhr) {
            if (err) return cb(err, res);
            location = xhr.getResponseHeader('Location');

            if (size > length) {
                progress && progress(0);

                if (size / length > 100) {
                    length = Math.ceil(size / 100);
                    if (length > 1024 * 1024 * 256) length = 1024 * 1024 * 256;
                }

                headers = {'Content-Range': 'bytes 0-' + (length - 1) + '/' + size};
                file = blob.slice(0, length);
            } else {
                headers = {};
            }

            send(location, file, headers, cb)
        });
    }
};
