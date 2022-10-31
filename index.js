const express = require('express')
const htmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5500;
app.use(express.static('public'));

// Temporary
app.use(express.static('templates'));

app.get('/convert', async (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, '/templates/center.html'), { encoding: 'utf-8'});
        const result = await htmlToImage({ html, content: { date: new Date().toDateString() } });
        
        if (result) {
            res.writeHead(200, { 'Content-Type': 'image/png'});
            return res.end(result, 'binary');
        }
        throw new Error('Failed to generate image');
    } catch (error) {
        return res.send("Failed! Please try again");
    }
});

app.listen(PORT, () => console.log("App started on port: "+PORT))