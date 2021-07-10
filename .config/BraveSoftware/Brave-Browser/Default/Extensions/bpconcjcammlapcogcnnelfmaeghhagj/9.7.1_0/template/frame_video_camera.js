var p = window.location.href.match(/\?([^&]+)&?(\w+)?/);
var pageUrl = p[1];
var videoCamera = p[2];

// console.log(window.location.href, pageUrl, videoCamera);
// console.log(window.navigator.getUserMedia);
window.navigator.getUserMedia({
        video: {
            width: 1280,
            height: 720,
            deviceId: videoCamera ? {exact: videoCamera} : undefined
        }
    }, function (stream) {
        // console.log('stream', stream);
        // var videoTracks = stream.getVideoTracks();
        // console.log('Using video device: ' + videoTracks[0].label);

        var video = document.getElementsByTagName('video')[0];

        // console.log(video.srcObject);

        // window.setTimeout(function (s, url) {
        //     document.getElementsByTagName('video')[0].remove();
        //     var video2 = document.createElement('video');
        //     document.body.appendChild(video2);
        //
        //     try {
        //         video2.srcObject = s;
        //     } catch (error) {
        //         console.log(error)
        //         video2.src = URL.createObjectURL(s);
        //     }
        //
        //     video2.onloadedmetadata = function (e) {
        //         console.log('video', video2, video2.videoWidth, video2.videoHeight);
        //         video2.play();
        //         window.parent.postMessage({message: {w: video2.videoWidth, h: video2.videoHeight}}, url);
        //     };
        //
        // }.bind(this, stream, pageUrl), 5000);

        try {
            video.srcObject = stream;
        } catch (error) {
            console.log(error);
            video.src = URL.createObjectURL(stream);
        }
        video.onloadedmetadata = function (e) {
            // console.log('video', video, video.videoWidth, video.videoHeight);
            video.play();
            window.parent.postMessage({message: {w: video.videoWidth, h: video.videoHeight}}, pageUrl);
        };
    }, function (err) {
        console.error('not access camera', err)
    }
);