const express = require('express')
const htmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const instagram = require('instagram-private-api');
const pngToJpeg = require('png-to-jpeg');
const dotenv = require('dotenv');
const morgan = require('morgan');
const nodeFetch = require('node-fetch');
const ytdl = require('ytdl-core');
const createFFmpeg = require('@ffmpeg/ffmpeg').createFFmpeg;
const fetchFile = require('@ffmpeg/ffmpeg').fetchFile;

const app = express();
app.use(express.static('public'));
app.use(morgan('combined'))
// Temporary
app.use(express.static('templates'));

dotenv.config();


const ffmpeg = createFFmpeg({ log: true });

const PORT = process.env.PORT;
const igUsername = process.env.IG_USERNAME;
const igPassword = process.env.IG_PASSWORD;

const igClient = new instagram.IgApiClient();

async function initializeApp() {
    try {
        igClient.state.generateDevice(new Date().toString());
        await igClient.simulate.preLoginFlow();
        await igClient.account.login(igUsername, igPassword);
    }
    catch(error) {
        console.log(error);
    }
}

async function initializeFFmpeg() {
    await ffmpeg.load();
}

app.get('/health', async (req, res)=>{
    return res.status(200).json({ success: true, message: 'App is healthy 💚'})
});

app.get('/search', async (req, res) => {
    const searchResult = await igClient.user.search("jav_eke");
    const [ firstResult ] = searchResult.users;

    if (firstResult) {
        const userPk = firstResult.pk;

        const response  = await igClient.direct.createGroupThread([ userPk.toString() ], 'Y Pree now');
        // const response = await igClient.directThread.addUser('340282366841710300949128293951547695925', [ userPk ]);
        console.log(response);
    }
    res.status(200).json({success: true});
});

app.get('/convert', async (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, '/templates/center.html'), { encoding: 'utf-8'});
        const result = await htmlToImage({ html, content: { date: new Date().toDateString() } });
        const jpgPhoto = await pngToJpeg({ quality: 95 })(result);
        if (jpgPhoto) {
            await igClient.publish.story({
                file: jpgPhoto,
                caption:"Posted from Express"
            })

            return res.status(200).json({ success : true, message : "Posted to IG" });
        }
        throw new Error('Failed to generate image');
    } catch (error) {
        console.log(error);
        return res.send("Failed! Please try again");
    }
});

app.delete('/api/ig/story', async (req, res) => {
    const madaraImage = fs.readFileSync(path.join(__dirname, '/templates/madara-bg.jpg'));
    await igClient.publish.story({
        file: madaraImage,
        caption:"Posted from Express"
    })
    
    res.send("Test");
});

app.get('/download', async (req, res) => {
    const { vId } = req.query;
    const videoInfo = await ytdl.getInfo(vId);

    const fileName = 'boondocks';
    const MP4_FORMAT = 'mp4';
    const tempFileName = 'temp';
    const startTimeInS = '0.0';
    const durationInS = '60.0';

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
    
    const response = ytdl(`https://www.youtube.com/watch?v=${vId}`, {
        filter: format => format.container === MP4_FORMAT && format.hasAudio && format.hasVideo,
        quality: 'highest',
    })
    .pipe(fs.createWriteStream(`${fileName}.${MP4_FORMAT}`));

    response.addListener('close', async () => {
        try {
            ffmpeg.FS('writeFile', `${fileName}.${MP4_FORMAT}`, await fetchFile(path.join(__dirname, `/${fileName}.${MP4_FORMAT}`)));
            await ffmpeg.run('-i', `${fileName}.${MP4_FORMAT}`, '-t', durationInS, '-ss', startTimeInS, `${tempFileName}.${MP4_FORMAT}`);
            fs.writeFileSync(path.join(__dirname, `/${fileName}-cut.${MP4_FORMAT}`), ffmpeg.FS('readFile', `${tempFileName}.${MP4_FORMAT}`));
            ffmpeg.FS('unlink', `${fileName}.${MP4_FORMAT}`);
            ffmpeg.FS('unlink', `${tempFileName}.${MP4_FORMAT}`);
            fs.unlinkSync(path.join(__dirname, `${fileName}.${MP4_FORMAT}`));
            
            res.json({
                success: true,
                message: 'File Converted'
            });
        }
        catch(error){
            console.error(error);
            res.json({
                success: false,
                message: `Internal Server Error: ${error}`
            });
        }
    }); 
})

app.listen(PORT, async () => {
    // await initializeApp();
    await initializeFFmpeg();
    console.log("App started on port: "+PORT);
});