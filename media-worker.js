const { parentPort, workerData } = require('worker_threads');
const createFFmpeg = require('@ffmpeg/ffmpeg').createFFmpeg;
const fetchFile = require('@ffmpeg/ffmpeg').fetchFile;
const fs = require('fs');
const path = require('path');

const { fileName, durationInS, startTimeInS } = workerData;
const MP4_FORMAT = 'mp4';
const tempFileName = `temp-${workerData.jobId}`;

const ffmpeg = createFFmpeg({ log: true });

async function initializeFFmpeg() {
    await ffmpeg.load();
}

async function main(){
     try {
        await initializeFFmpeg();
        ffmpeg.FS('writeFile', `${fileName}.${MP4_FORMAT}`, await fetchFile(path.join(__dirname, `/${fileName}.${MP4_FORMAT}`)));
        await ffmpeg.run('-i', `${fileName}.${MP4_FORMAT}`, '-t', durationInS, '-ss', startTimeInS, `${tempFileName}.${MP4_FORMAT}`);
        fs.writeFileSync(path.join(__dirname, `/${fileName}-cut.${MP4_FORMAT}`), ffmpeg.FS('readFile', `${tempFileName}.${MP4_FORMAT}`));
        ffmpeg.FS('unlink', `${fileName}.${MP4_FORMAT}`);
        ffmpeg.FS('unlink', `${tempFileName}.${MP4_FORMAT}`);
        fs.unlinkSync(path.join(__dirname, `${fileName}.${MP4_FORMAT}`));

        parentPort.postMessage({
            success: false
        });
    }
    catch(error) {
        parentPort.postMessage({
            success: false
        });
    }
}

main();