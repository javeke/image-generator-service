const urlInput = document.getElementById('url-input');
const startTimeInput = document.getElementById('start-input');
const endTimeInput = document.getElementById('end-input');
const downloadForm = document.getElementById('download-form');
const messageContainer = document.querySelector('.message');
const downloadLink = document.getElementById('download-link');
const bodyContainer = document.querySelector('body');
const ytPlayerContainer = document.getElementById('yt-player');
const downloadBtn = document.getElementById('download-btn');
const downloadText = document.getElementById('download-text');
const downloadLoading = document.getElementById('download-loading');


const ASPECT_RATIO = 0.6;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_MINUTES = 60;
const ONE_EM = 12;
const PLAYER_WIDTH = 480;
const PLAYER_HEIGHT = 290;

let youtubePlayer = null;
let messageTimerId = null;
const currentVideoId = '';
const startSeconds = 0;
const endSeconds = 0;

function onYouTubeIframeAPIReady(){

    const one_em = 12;
    const player_width = 480;
    const player_height = 290; 
    const aspect_ratio = 0.6;   

    youtubePlayer = new YT.Player(ytPlayerContainer, {
        videoId: 'VDcEJE633rM',
        width: bodyContainer.clientWidth <= player_width ? bodyContainer.clientWidth - one_em * 4 : player_width,
        height: bodyContainer.clientWidth <= player_width ? (bodyContainer.clientWidth - one_em * 4) * aspect_ratio : player_height,
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': handleReady
        }
    });
}

window.addEventListener('resize', () => {
    if(bodyContainer.clientWidth <= PLAYER_WIDTH) {
        youtubePlayer.setSize(bodyContainer.clientWidth - 4 * ONE_EM, (bodyContainer.clientWidth - 4 * ONE_EM)* ASPECT_RATIO);
    }
    else {
        youtubePlayer.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    }
});

function validateURL(url) {
    const urlRegex0 = /https:\/\/www.youtube.com\/watch\?v=[A-z0-9]*/;
    const urlRegex1 = /https:\/\/youtu.be\/[A-z0-9]*/;
    return urlRegex0.test(url) || urlRegex1.test(url);
}

function validateTime(time) {
    const timeRegex = /[0-9]{2}:[0-5][0-9]:[0-5][0-9]/;
    return timeRegex.test(time);
}

function convertTimeToSeconds(timeString = '00:00:00') {
    const [ hours, minutes, seconds ] = timeString.split(':').map(Number);

    return SECONDS_IN_HOUR*hours + SECONDS_IN_MINUTES*minutes + seconds;
}

function convertSecondsToTime(timeSeconds = 0) {
    const hours = parseInt(timeSeconds / SECONDS_IN_HOUR);
    let remainder = timeSeconds % SECONDS_IN_HOUR;

    const minutes = parseInt(remainder / SECONDS_IN_MINUTES);
    remainder = remainder % SECONDS_IN_MINUTES;

    const paddedValue = value => `${value}`.padStart(2, '0');

    return `${paddedValue(hours)}:${paddedValue(minutes)}:${paddedValue(remainder)}`
}


function displayMessage(message, messageType){
    if(!messageContainer.hidden) {
        clearTimeout(messageTimerId);
    };

    messageContainer.textContent = message;

    messageContainer.classList.remove('success', 'error');

    messageContainer.classList.add(messageType);
    messageContainer.hidden = false;

    messageTimerId = setTimeout(() => messageContainer.hidden = true, 3000);
}

function setDownloadLoading(isInProgres = false){
    downloadText.classList.remove('hide');
    downloadLoading.classList.remove('hide');
    if (isInProgres) {
        downloadText.classList.add('hide');
        return;
    }
    
    downloadLoading.classList.add('hide');
}

function handleReady(){
    endTimeInput.setAttribute('placeholder', convertSecondsToTime(youtubePlayer.getDuration()));
    urlInput.placeholder = youtubePlayer.getVideoUrl();
}

urlInput.addEventListener('input', async (event) => {
    const { value: url } = event.target;

    urlInput.classList.remove('success-input', 'error-input');

    if (url === '') return;   
    
    if(!validateURL(url)) {
        urlInput.classList.add('error-input');
        return;
    }
    
    urlInput.classList.add('success-input');

    let videoId = '';

    if(url.includes('youtu.be')) {
        videoId = new URL(url).pathname.split('/')[1];
    }
    else {
        videoId = new URL(url).searchParams.get('v');
    }

    youtubePlayer.cueVideoById({
        videoId
    })
});

startTimeInput.addEventListener('input', (event) => {
    const { value } = event.target;

    startTimeInput.classList.remove('success-input', 'error-input');

    if (value === '') return;

    if(!validateTime(value)){
        startTimeInput.classList.add('error-input');
        return;
    }

    startTimeInput.classList.add('success-input');

    const timeInSeconds = convertTimeToSeconds(value);
    if(timeInSeconds > youtubePlayer.getDuration()){
        displayMessage("Video not long enough", 'error');
        return;
    }

    youtubePlayer.seekTo(timeInSeconds);
});

endTimeInput.addEventListener('input', (event) => {

    const { value } = event.target;

    endTimeInput.classList.remove('success-input', 'error-input');

    if (value === '') return;

    if(!validateTime(value)){
        endTimeInput.classList.add('error-input');
        return;
    }

    endTimeInput.classList.add('success-input');

    const timeInSeconds = convertTimeToSeconds(value);
    if(timeInSeconds > youtubePlayer.getDuration()){
        displayMessage("Video not long enough", 'error');
        return;
    }

    youtubePlayer.seekTo(timeInSeconds);
});


downloadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const start = startTimeInput.value;
    const end = endTimeInput.value;


    if(!validateTime(start) || !validateTime(end)){
        displayMessage("Invalid time", 'error');
        return;
    }
    
    const startTimeInS = convertTimeToSeconds(start);
    const endTimeInS = convertTimeToSeconds(end);

    if(startTimeInS > youtubePlayer.getDuration() || endTimeInS > youtubePlayer.getDuration()){
        displayMessage("Video not long enough", 'error');
        return;
    }

    const duration = endTimeInS - startTimeInS;

    const url = urlInput.value;

    if(url === "" || url === undefined || url === null) {
        displayMessage( "Provide video link!", 'error');
        return;
    }

    if(!validateURL(url)) {
        displayMessage("Invalid video link!", 'error');
        return;
    }


    let videoId = '';

    if(url.includes('youtu.be')) {
        videoId = new URL(url).pathname.split('/')[1];
    }
    else {
        videoId = new URL(url).searchParams.get('v');
    }

    const HTTP_OK = 200;
    
    downloadBtn.disabled = true;
    setDownloadLoading(true);

    const response = await fetch(`/download?vId=${videoId}&start=${startTimeInS}&duration=${duration}`);
    if (response.status !== HTTP_OK) {
        displayMessage("Video cropping failed!", 'error');
        downloadBtn.disabled = false;
        setDownloadLoading(false);
        return;
    }

    const videoData = await response.blob();

    const downloadUrl =  URL.createObjectURL(videoData);
    
    downloadLink.href = downloadUrl;
    downloadLink.download = "video-cut.mp4";
    downloadLink.click();

    displayMessage('Job Completed 🎉', 'success');
    downloadBtn.disabled = false;
    setDownloadLoading(false);
});