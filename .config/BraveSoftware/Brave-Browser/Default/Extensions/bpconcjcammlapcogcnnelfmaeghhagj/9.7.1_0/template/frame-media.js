// window.addEventListener('message', function (e) {
//     try {

// const data = JSON.parse(e.data)
const constraints = JSON.parse(decodeURI(location.search).replace(/^\?/, ''));

if (constraints) {
    const video = document.createElement('video');
    video.setAttribute('preload', 'auto');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('loop', 'true');
    video.setAttribute('muted', 'muted');
    document.body.appendChild(video);

    window.navigator.getUserMedia(constraints,
        function (stream) {
            video.onloadedmetadata = function () {
                window.parent.postMessage(JSON.stringify({
                    action: 'nsc_frame_create_video',
                    value: {w: video.videoWidth, h: video.videoHeight}
                }), '*');
            };
            video.srcObject = stream;
        }, console.error
    );
}
//     } catch (e) {
//
//     }
// });
