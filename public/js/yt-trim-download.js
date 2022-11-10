const urlInput = document.getElementById('url-input');
const videoContainer = document.getElementById('video');

urlInput.addEventListener('change', (event) => {
    const { value: url } = event.target;

    const videoId = new URLSearchParams(url).get('v');

    const embedLink = `https://www.youtube.com/embed/${videoId}`;

    videoContainer.src = embedLink;
});