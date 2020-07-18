const socket = io();

window.onload = () => {
    const embed = new Twitch.Embed("twitch-embed", {
        width: 700,
        height: 400,
        channel: "esl_sc2",
        layout: "video",
        autoplay: false,
    });

    embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
        const player = embed.getPlayer();
        player.play();
    });
};
socket.on('translation', ({
    transcript,
    confidence
}) => {
    const translatedTextElement = document.querySelector(".text-area");
    translatedTextElement.innerText += ` ${transcript}`;
});