window.dropboxShare = {
    folderList: {},
    nameCurrent: 'Main folder',
    patchCurrent: '',
    getUploadFolder: function () {
        return JSON.parse(localStorage.getItem("dropbox_upload_folder") || '{"path": "", "name": "Main folder"}');
    },
    setUploadFolder: function (folder) {
        localStorage.setItem('dropbox_upload_folder', JSON.stringify(folder));
    },
    getAccessToken: function () {
        return localStorage.getItem("access_token_dropbox");
    },
    removeAccessToken: function () {
        localStorage.removeItem('access_token_dropbox');
    },
    login: function () {
        chrome.runtime.sendMessage({
            operation: 'open_page',
            url: 'https://www.dropbox.com/oauth2/authorize?response_type=token&redirect_uri=https://everhelper.me/nimbus-download-image.html&client_id=os861n2byfevtjy'
        });
    },
    logout: function () {
        if (dropboxShare.getAccessToken()) {
            const dbx = new Dropbox.Dropbox({accessToken: dropboxShare.getAccessToken()});

            dbx.authTokenRevoke();
            dropboxShare.removeAccessToken();
            dropboxShare.setUploadFolderTooltip();
        }
    },
    addFolder: function (folder) {
        $('<li>', {
            'html': '<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">' + folder.name,
            'data-name': folder.name,
            'data-path': folder.path_lower
        }).on('click', function () {
            let name = $(this).data('name');
            let path = $(this).data('path');
            dropboxShare.nameCurrent = name;
            dropboxShare.patchCurrent = path;
            dropboxShare.getFolders(path);
        }).appendTo('.nsc-file-manager-folders-list');
    },
    addParent: function () {
        let path = dropboxShare.patchCurrent.replace(/\/[^\/]+$/, '');
        let name = path === '' ? 'Default folder' : dropboxShare.folderList[path].name;

        $('.nsc-file-manager-folders .parent').empty().append(
            $('<div>', {
                'html': '<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">' + name,
                'data-name': name,
                'data-path': path
            }).on('click', function () {
                let name = $(this).data('name');
                let path = $(this).data('path');
                dropboxShare.nameCurrent = path === '' ? 'Main folder' : name;
                dropboxShare.patchCurrent = path;
                dropboxShare.getFolders(path);
            }))
    },
    addCurrent: function () {
        $('.nsc-file-manager-folders .current').empty().append(
            $('<div>', {
                'html': '<img src="images/icon_folder.png "><span>' + dropboxShare.nameCurrent + '</span>',
                'data-name': dropboxShare.nameCurrent,
                'data-path': dropboxShare.patchCurrent
            }));
        $('.nsc-file-manager-future').html(chrome.i18n.getMessage("gDriveLabelFolders") + '&nbsp;<b>' + dropboxShare.nameCurrent + '</b>');
    },
    getFolders: function (patch) {
        patch = patch || '';

        $('#nsc_file_manager').fadeIn("fast").removeClass('is_google').addClass('is_dropbox');
        $('.nsc-file-manager-folders-list').empty().addClass('loading');

        const dbx = new Dropbox.Dropbox({accessToken: dropboxShare.getAccessToken()});
        dbx.filesListFolder({path: patch})
            .then(function (response) {
                // console.log(response);
                $('.nsc-file-manager-folders-list').removeClass('loading');
                let is_folder = false;
                dropboxShare.addParent();
                dropboxShare.addCurrent();
                for (let entry of response.entries) {
                    if (entry['.tag'] === 'folder') {
                        is_folder = true;
                        dropboxShare.folderList[entry.path_lower] = entry;
                        dropboxShare.addFolder(entry)
                    }
                }

                if (!is_folder) $('.nsc-file-manager-folders-list').append('<span>' + chrome.i18n.getMessage("gDriveNoItems") + '</span>');
            })
            .catch(function (error) {
                // console.log(error);
            });
    },
    save: function (blob, name, cb) {
        new Dropbox.Dropbox({accessToken: dropboxShare.getAccessToken()})
            .filesUpload({
                path: dropboxShare.getUploadFolder().path + '/' + name,
                mode: 'add',
                autorename: true,
                contents: blob
            })
            .then(function (res) {
                cb && cb(null, res)
            })
            .catch(function (err) {
                cb && cb(err)
            });
    },
    setUploadFolderTooltip: function () {
        // const $dropbox = $('.nsc-trigger-panel-container.dropbox');
        if (dropboxShare.getAccessToken()) {
            // $dropbox.addClass('is_trigger').find('.nsc-button').attr('title', chrome.i18n.getMessage("gDriveSendTo") + ': ' + dropboxShare.getUploadFolder().name);
            $('#nsc_dropbox_open_folders').html('<img src="' + chrome.runtime.getURL('images/icon_folder.png') + '">&nbsp;' + dropboxShare.getUploadFolder().name);
        } else {
            // $dropbox.removeClass('is_trigger').find('.nsc-button').attr('title', '');
        }
    }
};


