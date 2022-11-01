const express = require('express')
const htmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const instagram = require('instagram-private-api');
const pngToJpeg = require('png-to-jpeg');
const dotenv = require('dotenv');
const morgan = require('morgan')

const app = express();
app.use(express.static('public'));
app.use(morgan('combined'))

dotenv.config();

const PORT = process.env.PORT;
const igUsername = process.env.IG_USERNAME;
const igPassword = process.env.IG_PASSWORD;

const igClient = new instagram.IgApiClient();

igClient.state.generateDevice(igUsername);

// Temporary
app.use(express.static('templates'));

app.get('/health', async (req, res)=>{
    return res.status(200).json({ success: true, message: 'App is healthy 💚'})
});

app.get('/convert', async (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, '/templates/center.html'), { encoding: 'utf-8'});
        const result = await htmlToImage({ html, content: { date: new Date().toDateString() } });
        const jpgPhoto = await pngToJpeg({ quality: 80 })(result);
        if (result) {

            await igClient.simulate.preLoginFlow();
            const loggedInUser = await igClient.account.login(igUsername, igPassword);
            process.nextTick(async () => await igClient.simulate.postLoginFlow());
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
    await igClient.simulate.preLoginFlow();
    await igClient.account.login(igUsername, igPassword);
    process.nextTick(async () => await igClient.simulate.postLoginFlow());
    const madaraImage = fs.readFileSync(path.join(__dirname, '/templates/madara-bg.jpg'));
    await igClient.publish.story({
        file: madaraImage,
        caption:"Posted from Express"
    })
    
    res.send("Test");
});

app.listen(PORT, () => console.log("App started on port: "+PORT))