const urlInput = document.getElementById('url-input');
const videoContainer = document.getElementById('video');
const startTimeInput = document.getElementById('start-input');
const endTimeInput = document.getElementById('end-input');
const downloadForm = document.getElementById('download-form');
const errorContainer = document.querySelector('error-message');

function validateURL(url) {
    const urlRegex = /https:\/\/www.youtube.com\/watch\?v=[A-z0-9]*/;
    return urlRegex.test(url);
}

urlInput.addEventListener('change', (event) => {
    const { value: url } = event.target;

    if(!validateURL(url)) {
        errorContainer.textContent = "Invalid video link!";
        return;
    }

    const videoId = new URL(url).searchParams.get('v');

    const embedLink = `https://www.youtube.com/embed/${videoId}`;

    videoContainer.src = embedLink;
});


videoContainer.addEventListener('seeked', (event) => {
    console.log(event);

    // TODO:
    
    // Check if any time input is in focus

    // get the video time from the event and set the input field in focus
});

startTimeInput.addEventListener('change', (event) => {

    // TODO:
    // validate the user input as a good timestamp

    // figure out how to put and pause the video at that time

    // set start time value
});

endTimeInput.addEventListener('change', (event) => {

    // TODO:
    // validate the user input as a good timestamp

    // figure out how to put and pause the video at that time

    // set end time value
});


downloadForm.addEventListener('submit', () => {

    // TODO:
    // Validate information

    // post data to /download?vId=${videoId}&start=${startTime}&end=${endTime}

    // present cropped video in a video element and opt to download
});