const express = require('express')
const htmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const pngToJpeg = require('png-to-jpeg');
const dotenv = require('dotenv');
const morgan = require('morgan');
const nodeFetch = require('node-fetch');
const ytdl = require('ytdl-core');
const { Worker } = require('worker_threads');
const crypto = require('crypto');

const app = express();

app.use(express.static('public'));
app.use(morgan('combined'))
// Temporary
app.use(express.static('templates'));

dotenv.config();

const PORT = process.env.PORT;


app.get('/health', async (req, res)=>{
    return res.status(200).json({ success: true, message: 'App is healthy 💚'})
});

app.get('/convert', async (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, '/templates/center.html'), { encoding: 'utf-8'});
        const result = await htmlToImage({ html, content: { date: new Date().toDateString() } });
        const jpgPhoto = await pngToJpeg({ quality: 95 })(result);
        if (jpgPhoto) {
            return res.status(200).sendFile(jpgPhoto);
        }
        throw new Error('Failed to generate image');
    } catch (error) {
        console.log(error);
        return res.send("Failed! Please try again");
    }
});

app.get('/video-info', async (req, res) => {
    const { vId } = req.query;
    const videoInfo = await ytdl.getInfo(vId);

    const highestFormats = videoInfo.formats
        .filter( format => format.hasAudio && format.hasVideo )
        .sort( (format1, format2) => format1.bitrate > format2.bitrate );

    const highestFormat = highestFormats.length > 0 ? highestFormats[0] : null; 
    if(!highestFormat) {
        return res.status(200).json({
            success: false,
            message: "Failed to find video",
            data: null
        });
    }

    return res.status(200).json({
        success: true, 
        message: "Successfully retrieved info",
        data: {
            videoUrl: highestFormat.url,
            info: videoInfo
        }
    });
});

app.get('/download', async (req, res) => {
    const { vId, start: startTimeInS, duration: durationInS } = req.query;
    const videoInfo = await ytdl.getInfo(vId);

    const jobId = crypto.randomBytes(8).toString('hex');

    const fileName = `source-${jobId}`;
    const MP4_FORMAT = 'mp4';
    const youtubeUrl = 'https://www.youtube.com/watch';

    const highestFormats = videoInfo.formats
        .filter( format => format.container === MP4_FORMAT && format.hasAudio && format.hasVideo )
        .sort( (format1, format2) => format1.bitrate > format2.bitrate );

    const highestFormat = highestFormats.length > 0 ? highestFormats[0] : null; 
    if(!highestFormat) {
        return res.json({
            success: false,
            message: "Failed to find video"
        });
    }
    
    const response = ytdl(`${youtubeUrl}?v=${vId}`, {
        filter: format => format.container === MP4_FORMAT && format.hasAudio && format.hasVideo,
        quality: 'highest',
    })
    .pipe(fs.createWriteStream(`${fileName}.${MP4_FORMAT}`));

    response.addListener('close', async () => {
        try {
            const worker = new Worker('./media-worker.js', {
                workerData: {
                    fileName,
                    jobId,
                    durationInS, 
                    startTimeInS
                }
            });
            
            res.on('finish', () => {
                fs.unlinkSync(path.join(__dirname, `${fileName}-cut.${MP4_FORMAT}`));
            });

            worker.on('message', (data) => {
                if(data.success)
                    return res.status(200).sendFile(path.join(__dirname, `/${fileName}-cut.${MP4_FORMAT}`));
                return res.status(500).json({
                    success: false,
                    message: `Internal Server Error: Conversion failed`
                });
            });

            worker.on('error', (err) => {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: `Internal Server Error: Worker failed`
                });
            });
        }
        catch(error){
            console.error(error);
            res.status(500).json({
                success: false,
                message: `Internal Server Error: ${error}`
            });
        }
    }); 
});

app.listen(PORT, async () => {
    console.log("App started on port: "+PORT || 5000);
});