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

window.slackShare = {
    data: {
        channels: [],
        users: []
    },
    login: function () {
        if (!localStorage.slackToken) {
            chrome.runtime.sendMessage({
                operation: 'open_page',
                url: 'https://slack.com/oauth/authorize?client_id=17258488439.50405596566&scope=files:write:user,channels:read,users:read'
            });
        }
    },
    logout: async function () {
        localStorage.removeItem('slackTeamName');
        localStorage.removeItem('slackToken');
        window.nimbus_core.setOption('slackToken', localStorage.slackToken);
        slackShare.data = {
            oauth: {},
            channels: [],
            users: []
        };
        localStorage.slackPanel = false;
        await nscNimbus.init();
    },
    setView: function (data) {
        let $channel = $('#nsc_slack_channel');
        let $user = $('#nsc_slack_user');
        $channel.find('li').remove();
        window.slackShare.data.channels.sort(function (a, b) {
            if (a.name < b.name) return 1;
            if (a.name > b.name) return -1;

            return 0;
        });
        for (let chanlen = window.slackShare.data.channels.length; chanlen--;) {
            $channel.append(
                $('<li>').append(
                    $('<a>').attr({
                        'href': '#',
                        'data-id': window.slackShare.data.channels[chanlen].id
                    }).on('click', function (e) {
                        chrome.runtime.sendMessage({
                            operation: 'set_option',
                            key: 'slackChannel',
                            value: $(this).data('id')
                        });
                        $('#nsc_slack_list_group').find('li').removeClass('nsc-aside-list-selected');
                        $(this).closest('li').addClass('nsc-aside-list-selected');
                        return false;
                    }).text(window.slackShare.data.channels[chanlen].name)
                ).append(
                    $('<span>').attr({
                        'class': 'nsc-icon nsc-fast-send',
                        'title': chrome.i18n.getMessage("tooltipUploadTo") + ' ' + window.slackShare.data.channels[chanlen].name,
                        'data-id': window.slackShare.data.channels[chanlen].id
                    }).on('click', function (e) {
                        $('#nsc_send').data('channel', $(this).data('id')).trigger('click');
                    })
                )
            );
        }

        $user.find('li').remove();
        window.slackShare.data.users.sort(function (a, b) {
            if (a.name < b.name) return 1;
            if (a.name > b.name) return -1;
            return 0;
        });
        for (let uselen = window.slackShare.data.users.length; uselen--;) {
            $user.append(
                $('<li>').append(
                    $('<a>').attr({
                        'href': '#',
                        'title': window.slackShare.data.users[uselen].name,
                        'data-id': window.slackShare.data.users[uselen].id
                    }).on('click', function (e) {
                        chrome.runtime.sendMessage({
                            operation: 'set_option',
                            key: 'slackChannel',
                            value: $(this).data('id')
                        });
                        $('#nsc_slack_list_group').find('li').removeClass('nsc-aside-list-selected');
                        $(this).closest('li').addClass('nsc-aside-list-selected');
                        return false;
                    }).text(window.slackShare.data.users[uselen].name)
                ).append(
                    $('<span>').attr({
                        'class': 'nsc-icon nsc-fast-send',
                        'title': chrome.i18n.getMessage("tooltipUploadTo") + ' ' + window.slackShare.data.users[uselen].name,
                        'data-id': window.slackShare.data.users[uselen].id
                    }).on('click', function (e) {
                        $('#nsc_send').data('channel', $(this).data('id')).trigger('click');
                    })
                )
            );
        }
        if (localStorage.slackChannel !== undefined) {
            $('#nsc_slack_list_group').find('[data-id=' + localStorage.slackChannel + ']').closest('li').addClass('nsc-aside-list-selected');
        } else {
            $('#nsc_slack_list_group').find('li:eq(0)').addClass('nsc-aside-list-selected');
        }

        $('#nsc_slack_team_name').text(localStorage.slackTeamName);
    },
    sendScreenshot: function (file, channel) {
        let comment = $('#nsc_comment').val();
        const fd = new FormData();
        const file_name = nimbus_core.getVideoFileName(nimbus_screen.info.page, nimbus_screen.info.file.image.format)
        if (channel) comment = comment.match(/([\s|\S]+)?\n\n-----------------([\s|\S]+)/) ? comment.match(/([\s|\S]+)?\n\n-----------------([\s|\S]+)/)[2] : '';

        fd.append("token", localStorage.slackToken);
        fd.append("file", file, file_name);
        fd.append("filename", 'Directly uploaded via Nimbus Capture for Chrome ' + file_name);
        fd.append("initial_comment", comment);
        fd.append("channels", channel || $('#nsc_slack_list_group .nsc-aside-list-selected a').data('id'));

        $('#nsc_loading_upload_file').addClass('visible');
        $('#nsc_message_view_uploads, #nsc_message_view_uploads_dropbox, #nsc_linked').removeClass('visible');
        $.ajax({
            type: 'POST',
            url: 'https://slack.com/api/files.upload',
            data: fd,
            processData: false,
            contentType: false,
            success: function (data) {
                $('#nsc_loading_upload_file').removeClass('visible');
                if (!data.ok) {
                    $.ambiance({message: 'error upload to slack', type: 'error', timeout: 5});
                } else {
                    if (!window.nimbus_core.is_app) {
                        nimbus_screen.tracker.send(nimbus_screen.SLACK_UPLOAD);
                    }
                    $.ambiance({message: 'Upload has completed', timeout: 5});
                }
            }
        });
    },
    requestToApi: function (action, param, cb) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status === 200) {
                let res = JSON.parse(xhr.responseText);
                cb && cb(null, res)
            } else {
                cb && cb(true, null)
            }
        };
        xhr.onerror = function (err) {
            console.error(err, null);
        };
        xhr.open('GET', 'https://slack.com/api/' + action + '?' + param, true);
        xhr.send();
    },
    init: function (cb) {
        if (localStorage.slackCode) {
            let client_id = '17258488439.50405596566';
            let client_secret = '55775ecb78fe5cfc10250bd0119e0fc5';

            window.slackShare.requestToApi('oauth.access', 'client_id=' + client_id + '&client_secret=' + client_secret + '&code=' + localStorage.slackCode, function (err, oauth) {
                localStorage.removeItem('slackCode');
                localStorage.slackToken = oauth.access_token;
                localStorage.slackTeamName = oauth.team_name;
                window.slackShare.init(cb)
            });
        } else if (localStorage.slackToken) {
            window.slackShare.requestToApi('conversations.list', 'token=' + localStorage.slackToken, function (err, res) {
                window.slackShare.data.channels = res.channels;
                window.slackShare.requestToApi('users.list', 'token=' + localStorage.slackToken, function (err, res) {
                    window.slackShare.data.users = res.members;
                    window.slackShare.setView();
                    cb && cb(true)
                })
            })
        } else cb && cb(false);
    }
};
