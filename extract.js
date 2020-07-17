// Node
const {
    Readable,
} = require('stream');
const child = require('child_process');

// Express
const app = require('express')();

// Socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Audio/video processing
const ffmpeg = require('fluent-ffmpeg');

// Streamlink
const streamlink = child.spawn('streamlink', ['twitch.tv/artosis', 'audio_only', '-O']);

let bufferedAudio = [];

streamlink.stdout.on('data', (data) => {
    bufferedAudio.push(data);
});

streamlink.stdin.on('end', function () {
    process.stdout.write('REPL stream ended.');
});

streamlink.on('exit', function (code) {
    console.log('Stream ended')
    process.exit(code);
});

const runExtractor = setInterval(() => {
    extract();
}, 3000);

function extract() {
    if (bufferedAudio.length >= 30) {
        const joinedAudio = Readable.from(Buffer.concat(bufferedAudio));
        convert(joinedAudio, 'audio.mp3', (err) => {
            if (!err) {
                translate();
                stopExtracting();
            }
        });
    }
}

function translate() {
    console.log('processing file here...')
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