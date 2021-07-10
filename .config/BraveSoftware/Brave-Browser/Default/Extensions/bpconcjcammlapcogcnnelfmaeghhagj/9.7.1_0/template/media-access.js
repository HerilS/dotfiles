$(async function () {
    let constraints = {};
    if (/\?(.+)$/.test(window.location.href)) constraints = JSON.parse(window.location.href.match(/\?(.+)$/)[1].replace(/%22/g, '"'));

    try {
        (await window.nimbus_core.getUserMedia(constraints)).stop();
        await chrome.extension.getBackgroundPage().videoRecorder.capture({media_access: true});
        window.close();
    } catch (e) {
        console.log('start permission error', e);
        $('.access_error').show();
    }
});
