const ffmpeg = require('fluent-ffmpeg');
const child = require('child_process');
const myREPL = child.spawn('streamlink', ['twitch.tv/mew2king', 'audio_only', '-O']);
const {
    Readable
} = require('stream');

let bufferedAudio = [];

myREPL.stdout.on('data', (data) => {
    bufferedAudio.push(data);
});

myREPL.stdin.on('end', function () {
    process.stdout.write('REPL stream ended.');
});

myREPL.on('exit', function (code) {
    console.log('Stream ended')
    process.exit(code);
});

const runExtractor = setInterval(() => {
    extract();
}, 3000);

function extract() {
    if (bufferedAudio.length >= 30) {
        const joinedAudio = Readable.from(Buffer.concat(bufferedAudio));
        convert(joinedAudio, 'output.mp3', (err) => {
            if (!err) {
                console.log('done!')
                stopExtracting();
            }
        });
    }
}

function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function () {
            console.log('donezo');
            callback(null)
        }).on('error', function (err) {
            console.log('error: ', err);
            callback(err);
        }).run();
}

function stopExtracting() {
    clearInterval(runExtractor);
}