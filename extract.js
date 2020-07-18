// Node
const {
    Readable,
} = require('stream');
const child = require('child_process');
const path = require('path');
const fs = require('fs');

// Env
require('dotenv').config();

// Express
const express = require('express');
const app = express();
const staticPath = path.join(__dirname, '/client');

// Socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Audio/video processing
const ffmpeg = require('fluent-ffmpeg');

// Google
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient();

// Streamlink
const streamlink = child.spawn('streamlink', ['twitch.tv/esl_sc2', 'audio_only', '-O']);

app.use(express.static(staticPath));

let bufferedAudio = [];

streamlink.stdout.on('data', (data) => {
    bufferedAudio.push(data);
});

streamlink.on('exit', (code) => {
    console.log('Stream ended')
    process.exit(code);
});

const runExtractor = setInterval(() => {
    extractAudio();
}, 3000);

function extractAudio() {
    if (bufferedAudio.length >= 15) {
        const joinedAudio = Readable.from(Buffer.concat(bufferedAudio));
        bufferedAudio.length = 0;
        convert(joinedAudio, 'audio.mp3', async (err) => {
            if (!err) {
                const [rawTranscriptionData] = await getSpeechAnalysis();
                // Find the translation with the highest confidence
                const {
                    transcript,
                    confidence
                } = rawTranscriptionData.results.reduce((prev, current) => {
                    if (current.alternatives[0].confidence > prev.alternatives[0].confidence) {
                        return current;
                    } else {
                        return prev;
                    }
                }).alternatives[0];

                // update client
                io.emit('translation', {
                    transcript,
                    confidence
                });

                // stopExtracting();
            }
        });
    }
}

async function getSpeechAnalysis() {
    const audioBytes = fs.readFileSync('./audio.mp3').toString('base64');
    const request = {
        config: {
            encoding: "mp3",
            sampleRateHertz: 44100,
            languageCode: "en-US"
        },
        audio: {
            content: audioBytes
        }
    };
    return speechClient.recognize(request);
}

function convert(input, output, callback) {
    const command = ffmpeg(input)
        .on('error', (err) => {
            callback(err);
        })
        .on('end', () => {
            callback(null)
        }).output(output)

    command.run();
    // const ffstream = command.pipe(); // this has results in-memory?
    // when switching to in-memory, wait for stream to finish (https://stackoverflow.com/questions/37837132/how-to-wait-for-a-stream-to-finish-piping-nodejs)
}

function stopExtracting() {
    clearInterval(runExtractor);
}

server.listen(3000, () => {
    console.log('listening on:', 3000)
});