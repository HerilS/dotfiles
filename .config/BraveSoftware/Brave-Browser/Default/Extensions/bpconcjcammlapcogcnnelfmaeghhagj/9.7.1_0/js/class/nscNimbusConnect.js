axios.defaults.withCredentials = true;

class nscNimbusConnect {
    constructor() {
        this.dev = false;
        this.log = true;
        this.pending = false;
        this.matchesOrgAutoDomain = false;
        this.client_software = 'screens_chrome';
        this.site = {
            helper: 'https://everhelper.me',
            sync: 'https://sync.nimbusweb.me',
            nimbus: 'https://nimbusweb.me',
            // helper: 'http://develop.nimbustest.com',
            // sync: 'http://sync.develop.nimbustest.com',
            // nimbus: 'http://develop.nimbustest.com'
        }
        this.user = {
            authorized: false,
            id: null,
            login: null,
            premium: false,
            usage: {
                current: 0,
                max: 0,
            },
            limits: {
                NOTES_MAX_ATTACHMENT_SIZE: 0,
                NOTES_MAX_SIZE: 0,
                NOTES_MONTH_USAGE_QUOTA: 0,
            }
        }
        this.organizations = [];
        this.workspaces = [];
        this.notes = [];
    }

    /** @description check is organization private.
     * @return {boolean} is private
     */

    get isOrgPrivate() {
        return this.user.id !== null && localStorage.nimbusOrganizationSelect === 'u' + this.user.id.toString(36);
    }

    /** @description organization select.
     * @return {string}
     */

    get orgSelect() {
        return localStorage.nimbusOrganizationSelect !== 'false' || '';
    }

    /** @description workspace select.
     * @return {string}
     */

    get workSelect() {
        return localStorage.nimbusWorkspaceSelect || '';
    }


    async req(method = 'get', url = '', obj = {}, headers = {}) {
        this.pending = true;

        localStorage.nimbusSessionId && (headers = {'EverHelper-Session-ID': localStorage.nimbusSessionId, ...headers});

        try {
            const {data} = await axios({
                method: method,
                url: url || this.site.sync,
                data: obj,
                headers: headers
            });

            this.pending = false;
            return data;

        } catch (error) {
            console.log('Connect', error);

            if ($ && $.ambiance) $.ambiance({message: chrome.i18n.getMessage("notificationNetworkError"), timeout: 5});
            this.pending = false;
            return null;
        }
    }

    /** @description createMultipartUpload the nimbus server.
     * @return {object} body
     */

    async createMultipartUpload(size = 0, type = 'video/webm', name = 'video.webm') {
        const {body} = await this.req('post', '', {
            action: "files:createMultipartUpload",
            body: {size, type, name,},
        });
        return body;
    }

    /** @description completeMultipartUpload the nimbus server.
     * @return {object} body
     */

    async completeMultipartUpload(id, parts, tempFileName) {
        const {body} = await this.req('post', '', {
            action: "files:completeMultipartUpload",
            body: {id, parts, tempFileName},
        });
        return body;
    }

    /** @description createMultipartUpload the nimbus server.
     * @return {object} body
     */

    async multipartUpload(url = '', file, type = 'video/webm') {
        return new Promise(async function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('put', url);
            xhr.onload = function () {
                const etag = xhr.getResponseHeader('etag').replaceAll('"', '');
                resolve(etag)
            };

            xhr.onerror = function (error) {
                reject(error)
            };

            xhr.send(file);
        });
    }

    /** @description Check premium capture.
     * @param {boolean} popup is open popup.
     * @param {string} utm_campaign key analitick.
     * @return {boolean} is premium
     */

    async checkPremium(popup, utm_campaign = 'premium_banner_savescreen_upgrade') {
        popup = (popup === undefined ? true : !!popup);

        let premium = nscExt.getOption('nimbusPremium');
        Logger.info(`checkPremium after ${premium}`)
        if (premium) {
            $('.is-premium-hide').addClass('nsc-hide');
            $('.is-premium-show').removeClass('nsc-hide');
        } else {
            $('.is-premium-hide').removeClass('nsc-hide');
            $('.is-premium-show').addClass('nsc-hide');
        }

        const popupPremium = document.getElementById(localStorage.appType === 'google' ? 'nsc_popup_google_premium' : 'nsc_popup_premium');
        $(popupPremium).find('.nsc-popup-form-actions a').attr('href', `https://nimbusweb.me/capture-pro?utm_source=capture&utm_medium=addon&utm_campaign=${utm_campaign}`)

        try {
            let headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-client-software': 'screens_chrome',
            }

            localStorage.nimbusSessionId && (headers = {'EverHelper-Session-ID': localStorage.nimbusSessionId, ...headers});

            await axios({
                method: 'post',
                url: 'https://capture-pro.everhelper.me/v1/premium',
                data: {"device": {"globalId": localStorage.appGlobalId}},
                headers,
            });

            premium = true;
        } catch (error) {
            const {data} = error.response;
            if (data.reason === 'devicequota') {
                premium = true;
            } else {
                premium = false;
                popup && nscPopup.addToQueue(popupPremium);
            }
        }

        nscExt.setOption('nimbusPremium', premium);

        if (premium) {
            $('.is-premium-hide').addClass('nsc-hide');
            $('.is-premium-show').removeClass('nsc-hide');
        } else {
            $('.is-premium-hide').removeClass('nsc-hide');
            $('.is-premium-show').addClass('nsc-hide');
        }
        Logger.info(`checkPremium before ${premium}`)
        return premium;
    }

    async authState() {
        let auth = nscExt.getOption('nimbusAuthorized');
        Logger.info(`authState after ${auth}`)
        if (auth) {
            $('.is-auth-hide').addClass('nsc-hide');
            $('.is-auth-show').removeClass('nsc-hide');
        } else {
            $('.is-auth-hide').removeClass('nsc-hide');
            $('.is-auth-show').addClass('nsc-hide');
        }

        const {errorCode, body} = await this.req('post', '', {
            "action": "user:authstate",
            "_client_software": this.client_software
        });

        if (errorCode === 0 && body.authorized) {
            localStorage.nimbusSessionId = body.sessionid;
            this.matchesOrgAutoDomain = body.matchesOrgAutoDomain;

            auth = true;

            if (localStorage.login !== body.login) { // clear data;
                localStorage.login = body.login;
                localStorage.nimbusOrganizationSelect = false;
                localStorage.nimbusWorkspaceSelect = false;
                localStorage.nimbusFolderSelect = 'default';
            }
        } else {
            const {nimbusSessionId} = localStorage;
            localStorage.removeItem('nimbusSessionId');
            if (nimbusSessionId) {
                return this.authState()
            } else {
                auth = false;
            }
        }

        nscExt.setOption('nimbusAuthorized', auth);

        if (auth) {
            $('.is-auth-hide').addClass('nsc-hide');
            $('.is-auth-show').removeClass('nsc-hide');
        } else {
            $('.is-auth-hide').removeClass('nsc-hide');
            $('.is-auth-show').addClass('nsc-hide');
        }
        Logger.info(`authState before ${auth}`)
        return auth;
    }

    /** @description logout user the nimbus.
     * @return {object} info user
     */

    async logout() {
        const {errorCode} = await this.req('post', '', {
            "action": "user:logout",
            "_client_software": this.client_software
        });
        localStorage.removeItem('nimbusSessionId');
        this.matchesOrgAutoDomain = false;
        // this.user.authorized = false;

        return errorCode === 0;
    }

    /** @description Loading info of user from the nimbus server.
     * @return {object} info user
     */

    async getInfo() {
        const {errorCode, body} = await this.req('post', '', {
            "action": "user:info",
            "_client_software": this.client_software
        });

        if (errorCode !== 0) {
            Logger.warning(`getInfo, errorCode: ${errorCode}`)
            return false;
        }

        this.user.id = body.user_id;
        this.user.login = body.login;
        this.user.premium = !!body.premium.active;
        this.user.usage.current = body.usage.notes.current;
        this.user.usage.max = body.usage.notes.max;
        this.user.limits.NOTES_MAX_ATTACHMENT_SIZE = body.limits.NOTES_MAX_ATTACHMENT_SIZE;
        return body;
    }

    /** @description Send to analytics data.
     * @param {boolean} authState is authState.
     * @return {object} response server
     */

    async sendAnalytics(authState) {
        if(authState === undefined) {
            authState = await nscNimbus.authState();
        }

        authState && await this.req('post', 'https://a.nimbusweb.me/e', {
            nonPersonalizedAds: false,
            e: {
                name: "check_auth_addon",
                params: {
                    event_category: "capture",
                    verify: authState,
                    event_label: localStorage.appVersion
                }
            }
        });
    }

    /** @description Set default Select Org/Work/Note.
     * @param {array} data_array data array.
     * @param {string} id_key id in data key.
     * @param {string} store_key localStorage key.
     * @return {object} default item
     */

    async setDefaultSelect(data_array, id_key, store_key) {
        if (!data_array.length) return localStorage[store_key] = false;
        const filter = data_array.filter((item) => localStorage[store_key] === item[id_key]);
        localStorage[store_key] = (filter.length && filter[0][id_key]) || data_array[0][id_key];
        return (filter.length && filter[0]) || data_array[0];
    }

    /** @description Loading organizations from the nimbus server.
     * @return {object} default organization
     */

    async getOrganizations() {
        const {errorCode, body} = await this.req('post', '', {
            "action": "orgs:getAll",
            "_client_software": this.client_software,
        });

        if (errorCode !== 0) {
            console.error('getOrganizations', errorCode, body)
            return []
        }

        const {orgs} = body;
        orgs.unshift({id: 'u' + this.user.id.toString(36), title: 'Personal'});
        this.organizations = orgs;

        return await this.setDefaultSelect(this.organizations, 'id', 'nimbusOrganizationSelect');
    }

    /** @description Loading workspaces from the nimbus server.
     * @return {object} default workspace
     */

    async getWorkspaces() {
        const {errorCode, body} = await this.req('post', '', {
            "action": "notes:getWorkspaces",
            "body": nscNimbus.isOrgPrivate ? {orgType: 'private'} : {orgId: nscNimbus.orgSelect},
            "_client_software": nscNimbus.client_software,
        });

        if (errorCode !== 0) {
            console.error('getWorkspaces', errorCode, body)
            return [];
        }

        const {workspaces} = body;
        this.workspaces = workspaces;

        return await this.setDefaultSelect(this.workspaces, 'globalId', 'nimbusWorkspaceSelect');
    }

    /** @description Loading notes from the nimbus server.
     * @return {object} default note
     */

    async getNotes() {
        const {errorCode, body} = await this.req('post', '', {
            "action": "notes:getFolders",
            "body": {
                "workspaceId": nscNimbus.workSelect,
            },
            "_client_software": nscNimbus.client_software,
        });

        if (errorCode !== 0) {
            console.error('getWorkspaces', errorCode, body)
            return [];
        }

        const {notes} = body;
        this.notes = notes;

        return await this.setDefaultSelect(this.notes, 'global_id', 'nimbusFolderSelect');
    }

    /** @description Rendering info.
     * @return {void}
     */

    async viewInfo() {
        await this.getInfo();

        const $usage_group = $('#nsc_nimbus_usage_group');
        const progress = this.user.usage.current / this.user.usage.max * 100;
        const current = nscExt.formatBytes(this.user.usage.current);
        const max = nscExt.formatBytes(this.user.usage.max);
        const limitUsage = chrome.i18n.getMessage("nimbusLimitUsage");
        const limitOf = chrome.i18n.getMessage("nimbusLimitOf");

        $usage_group.find('.nsc-aside-usage-text').text(`${limitUsage} ${current} ${limitOf} ${max}`);
        $usage_group.find('.nsc-aside-usage-line-colored').width(progress);
        $('#nsc_nimbus_email').text(this.user.login);
        $('#nsc_nimbus_private_share').prop('checked', nscExt.getOption('nimbusShare'));

        if (progress > 90) {
            $('#nsc_nimbus_upgrade_pro').removeClass('nsc-hide');
            $usage_group.find('.nsc-aside-usage-line-colored').css({background: '#ff0000'});
        }
    }

    /** @description Rendering organizations in page done.
     * @return {void}
     */

    async viewOrganizations() {
        const _self = this;
        const $nsc_select_organization = $('#nsc_select_organization');
        let ul = $nsc_select_organization.find('.nsc-aside-select-dropdown ul').empty();

        const defOrganization = await _self.getOrganizations();
        $nsc_select_organization.find('.nsc-aside-select-text').text(defOrganization.title).data('id', defOrganization.id);

        for (const organization of this.organizations) {
            if (organization.suspended) continue;

            ul.append(
                $('<li>', {
                    'class': 'nsc-aside-select-dropdown-item',
                    'flex': '',
                    'layout': '',
                    'layout-align': 'start center'
                })
                    .data('id', organization.id)
                    .data('title', organization.title)
                    .append($('<div>', {
                        'class': 'nsc-aside-select-dropdown-item-title',
                    }).text(organization.title))
                    .on('click', async function (e) {
                        $nsc_select_organization.find('.nsc-aside-select-dropdown').removeClass('active');
                        $nsc_select_organization.find('.nsc-aside-select-text').text($(this).data('title')).data('id', $(this).data('id'));
                        if (localStorage.nimbusOrganizationSelect === $(this).data('id')) return;
                        localStorage.nimbusOrganizationSelect = $(this).data('id');
                        $('#nsc_done_nimbus .nsc-aside-main').addClass('nsc-loading');
                        await _self.viewWorkspaces();
                        await _self.viewNotes();
                        $('#nsc_done_nimbus .nsc-aside-main').removeClass('nsc-loading');
                    })
            );
        }
    }

    /** @description Rendering workspaces in page done.
     * @return {void}
     */

    async viewWorkspaces() {
        const _self = this;
        const $nsc_select_workspaces = $('#nsc_select_workspaces');
        let ul = $nsc_select_workspaces.find('.nsc-aside-select-dropdown ul').empty();

        const defWorkspaces = await _self.getWorkspaces();
        $nsc_select_workspaces.find('.nsc-aside-select-text').html(defWorkspaces.title).data('id', defWorkspaces.globalId);

        for (let workspace of _self.workspaces) {
            // if (workspace.access && workspace.access.role === 'reader') continue;

            let destruction = '';
            if (workspace.user) {
                if (workspace.user.id === _self.user.id) destruction = 'Business workspace'; // персональные шаренные (пищем количество мемберов)
                else destruction = workspace.user.email; // бизнес проекты (пишем емайл овнера).
            } else if (workspace.userId === _self.user.id) {
                if (workspace.countMembers > 0) destruction = workspace.countMembers + ' users'; // персональные шаренные (пищем количество мемберов)
                else destruction = 'Personal workspace'; // персональными (пишем Personal)
            } else {
                destruction = workspace.org.user.email; // шаренные (пишем владельца проекта)
            }

            ul.append(
                $('<li>', {
                    'class': 'nsc-aside-select-dropdown-item',
                    'flex': '',
                    'layout': '',
                    'layout-align': 'start center'
                })
                    .data('id', workspace.globalId)
                    .data('title', workspace.title)
                    .append($('<div>', {
                        'class': 'nsc-aside-select-dropdown-item-title',
                    }).text(workspace.title))
                    .append($('<div>', {
                        'class': 'nsc-aside-select-dropdown-item-destruction',
                    }).text(destruction))
                    .on('click', async function (e) {
                        $nsc_select_workspaces.find('.nsc-aside-select-dropdown').removeClass('active');
                        $nsc_select_workspaces.find('.nsc-aside-select-text').text($(this).data('title')).data('id', $(this).data('id'));
                        if (localStorage.nimbusWorkspaceSelect === $(this).data('id')) return;
                        localStorage.nimbusWorkspaceSelect = $(this).data('id');
                        $('#nsc_done_nimbus .nsc-aside-main').addClass('nsc-loading');
                        await _self.viewNotes();
                        $('#nsc_done_nimbus .nsc-aside-main').removeClass('nsc-loading');
                    })
            );
        }
    }

    /** @description Rendering notes in page done.
     * @return {void}
     */

    async viewNotes() {
        const _self = this;
        let nsc_select_folder = $('#nsc_select_folder');
        let ul = nsc_select_folder.find('ul').empty();

        const defNote = await _self.getNotes();

        for (let note of _self.notes) {
            ul.append(
                $('<li>', {'data-id': note.global_id})
                    .addClass(function () {
                        if (defNote.global_id === note.global_id) return 'nsc-aside-list-selected';
                    })
                    .append(
                        $('<a>', {
                            'href': '#',
                            'text': note.title,
                            'data-id': note.global_id
                        }).on('click', function () {
                            if (localStorage.nimbusFolderSelect === $(this).data('id')) return;
                            nsc_select_folder.find('li').removeClass('nsc-aside-list-selected').filter(this.closest('li')).addClass('nsc-aside-list-selected');
                            localStorage.nimbusFolderSelect = $(this).data('id');
                            return false;
                        })
                    ).append(
                    $('<span>', {
                        'class': 'nsc-icon nsc-fast-send',
                        'title': chrome.i18n.getMessage("tooltipUploadTo") + ' ' + note.title,
                        'data-id': note.global_id
                    }).on('click', function () {
                        $('#nsc_send').data('channel', $(this).data('id')).trigger('click');
                    })
                )
            );
        }
    }

    /** @description Init nimbus panel in done page
     * @return {boolean} is auth nimbus
     */

    async init() {
        const authState = await this.authState();
        if (authState) {
            if (nimbus_screen.getPanel('nimbus')) return;

            if (!this.matchesOrgAutoDomain) {
                $('#nsc_nimbus_email').text('Loading ...');
                $('#nsc_done_nimbus .nsc-aside-main').addClass('nsc-loading');
                nimbus_screen.togglePanel('nimbus');
                await this.viewInfo();
                await this.viewOrganizations();
                await this.viewWorkspaces();
                await this.viewNotes();
                $('#nsc_aside_main_nimbus').removeClass('nsc-loading');
                $('#nsc_send').data('type', 'nimbus').trigger('change-type');
            } else {
                $('#nsc_button_nimbus, #nsc_button_quick, #nsc_button_slack, .nsc-trigger-panel-container.dropbox').addClass('nsc-hide');
                $('#nsc_nimbus_logout_link').removeClass('nsc-hide');
            }
        } else {
            nimbus_screen.togglePanel();
        }

        const premium = await nscNimbus.checkPremium(false);

        if (!premium) {
            $('#nsc_upgrade_to_nimbus_pro').removeClass('nsc-hide')
        } else {
            $('#nsc_upgrade_to_nimbus_pro').addClass('nsc-hide')
        }

        if (!premium && nimbus_screen.getLocationParam() === 'video' && nscExt.getOption('isTrialPopupShow')) {
            await nimbus_screen.popup.trial();
        } else {
            await nimbus_screen.popup.account();
        }

        return authState;
    }
}

const nscNimbus = new nscNimbusConnect();


// $('#nsc_nimbus_email').text('Loading ...');
// $('#nsc_done_nimbus .nsc-aside-main').addClass('nsc-loading');
// nimbus_screen.togglePanel('nimbus');
// nscNimbus.viewInfo();
// nscNimbus.viewOrganizations();
// nscNimbus.viewWorkspaces();
// nscNimbus.viewNotes();
// $('#nsc_aside_main_nimbus').removeClass('nsc-loading');
// $('#nsc_send').data('type', 'nimbus').trigger('change-type');
