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
 - author: hasesanches
 - date: 04.07.16
 - http://hase.su
 **/

var youtubeShare = {
    type: null,
    channel: null,
    playlist: [],
    abort: function () {
        if (youtubeShare.xhr) youtubeShare.xhr.abort();
    },
    getAccessToken: function () {
        return localStorage.access_token_youtube || false;
    },
    removeAccessToken: function () {
        localStorage.removeItem('access_token_youtube');
    },
    refreshToken: function (type) {
        youtubeShare.type = type;
        if (!youtubeShare.getAccessToken()) {
            chrome.runtime.sendMessage({operation: 'oauth_youtube'});
        } else {
            chrome.runtime.sendMessage({operation: 'oauth_youtube_refresh'});
        }
    },
    clearData: function () {
        if (youtubeShare.getAccessToken()) {
            googleShare.httpRequest('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + youtubeShare.getAccessToken(), false);
            youtubeShare.removeAccessToken();
            $('#nsc_done_youtube').css('display', 'none');
            localStorage.youtubePanel = 'false';
        }
    },
    httpRequest: function (method, url, data, headers, cb, popup) {
        if (typeof headers === 'function') {
            popup = cb;
            cb = headers;
            headers = null;
        }

        if (typeof data === 'function') {
            popup = headers;
            cb = data;
            data = null;
            headers = null;
        }

        if (popup === undefined) popup = false;

        youtubeShare.xhr = new XMLHttpRequest();
        youtubeShare.xhr.open(method, url);
        youtubeShare.xhr.setRequestHeader('Authorization', 'Bearer ' + youtubeShare.getAccessToken());

        if (!headers || (headers && !headers.hasOwnProperty('Content-Type'))) {
            youtubeShare.xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        }
        if (headers) {
            for (let key in headers) {
                if (!headers.hasOwnProperty(key)) {
                    return;
                }
                youtubeShare.xhr.setRequestHeader(key, headers[key]);
            }
        }

        youtubeShare.xhr.onload = function () {
            if (youtubeShare.xhr.readyState !== 4) return;
            let res = JSON.parse(youtubeShare.xhr.response || '{}');
            // console.log(response);
            switch (youtubeShare.xhr.status) {
                case 200:	// success
                case 308:
                    cb && cb(null, res, youtubeShare.xhr);
                    break;
                case 401: // login fail
                    youtubeShare.clearData();
                    cb && cb(nimbus_core.customError(youtubeShare.xhr.status, chrome.i18n.getMessage("notificationLoginFail")));
                    break;
                default:
                    cb && cb(nimbus_core.customError(youtubeShare.xhr.status, chrome.i18n.getMessage("notificationWrong")));
            }
        };
        youtubeShare.xhr.send(data);
    },
    loadPlaylist: function () {
        youtubeShare.httpRequest('GET', 'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50', function (err, res) {
            if (err) {
                youtubeShare.httpRequest('GET', 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&maxResults=50', function (err, res) {
                   if(!res.pageInfo.totalResults.length) $('#nsc_popup_youtube_no_channel').removeClass('nsc-hide')
                });
            } else {
                youtubeShare.playlist = res.items.reverse();
                youtubeShare.viewPlaylist()
            }
        });
    },
    viewPlaylist: function () {
        console.log('yt, playlist')
        let $playlist = $('#nsc_youtube_playlist');
        $playlist.find('li').remove();

        $playlist.append($('<li>').append(
            $('<a>').attr({
                'href': '#',
                'data-id': 'no-playlist'
            }).on('click', function (e) {
                let channelId = $(this).data('id');
                localStorage.youtubePlaylist = channelId;
                chrome.runtime.sendMessage({operation: 'set_option', key: 'youtubePlaylist', value: channelId});
                $playlist.find('li').removeClass('nsc-aside-list-selected');
                $(this).closest('li').addClass('nsc-aside-list-selected');
                return false;
            }).text(chrome.i18n.getMessage("youtubeNoPlaylist"))
        ).append(
            $('<span>').attr({
                'class': 'nsc-icon nsc-fast-send',
                'title': chrome.i18n.getMessage("tooltipUploadTo") + ' ' + chrome.i18n.getMessage("youtubeNoPlaylist"),
                'data-id': 'no-playlist'
            }).on('click', function (e) {
                $('#nsc_send').data('channel', $(this).data('id')).trigger('click');
            })
        ));
        // for (let len = youtubeShare.playlist.length; len--;) {
        //     $playlist.append(
        //         $('<li>').append(
        //             $('<a>').attr({
        //                 'href': '#',
        //                 'data-id': youtubeShare.playlist[len].id
        //             }).on('click', function (e) {
        //                 let channelId = $(this).data('id');
        //                 localStorage.youtubePlaylist = channelId;
        //                 chrome.runtime.sendMessage({
        //                     operation: 'set_option',
        //                     key: 'youtubePlaylist',
        //                     value: channelId
        //                 });
        //                 $playlist.find('li').removeClass('nsc-aside-list-selected');
        //                 $(this).closest('li').addClass('nsc-aside-list-selected');
        //                 return false;
        //             }).text(youtubeShare.playlist[len].snippet.title)
        //         ).append(
        //             $('<span>').attr({
        //                 'class': 'nsc-icon nsc-fast-send',
        //                 'title': chrome.i18n.getMessage("tooltipUploadTo") + ' ' + youtubeShare.playlist[len].snippet.title,
        //                 'data-id': youtubeShare.playlist[len].id
        //             }).on('click', function (e) {
        //                 $('#nsc_send').data('channel', $(this).data('id')).trigger('click');
        //             })
        //         )
        //     );
        // }

        if (localStorage.youtubePlaylist) {
            $('#nsc_youtube_playlist').find('[data-id=' + localStorage.youtubePlaylist + ']').closest('li').addClass('nsc-aside-list-selected');
        }

    },
    save: function (blob, name, cb, progress) {
        // console.log('youtube save', blob, name)

        let location;
        let length = 1024 * 1024;
        let file = blob;
        let format = name.match(/\.([0-9a-z]+)$/i)[1]
        let size = blob.size;
        let mime_type = ((format === 'mp4' || format === 'webm') ? 'video' : 'image') + '/' + format;

        let send = function (location, file, headers, cb) {
            youtubeShare.httpRequest('PUT', location, file, headers, function (err, res, xhr) {
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

        let data = JSON.stringify({
            "snippet": {
                "title": name,
                "description": "Video uploaded using Nimbus Screenshot & Screen Video Recorder",
                "categoryId": '22'
            },
            "status": {
                "privacyStatus": localStorage.shareOnYoutube
            }
        });

        let headers = {
            'x-upload-content-length': size,
            'X-Upload-Content-Type': mime_type
        };

        youtubeShare.httpRequest('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails', data, headers, function (err, res, xhr) {
            if (err) return;
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

            send(location, file, headers, function (err, res) {
                if (err) return cb(err, res);
                return cb(err, res);
                // if (localStorage.youtubePlaylist === 'no-playlist') return cb(err, res);
                // data = JSON.stringify({
                //     "snippet": {
                //         "playlistId": localStorage.youtubePlaylist,
                //         "resourceId": {
                //             "kind": "youtube#video",
                //             "videoId": res.id
                //         }
                //     }
                // });
                // youtubeShare.httpRequest('POST', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', data, function (err, res) {
                //     console.log(err, res)
                //     cb && cb(err, {id: res.snippet.resourceId.videoId});
                // });
            });
        });
    }
};
