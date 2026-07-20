const barsContainer = document.getElementById("bars");

const BAR_COUNT = 64;

for (let i = 0; i < BAR_COUNT; i++) {

    const bar = document.createElement("div");

    bar.className = "bar";

    // Give every bar a slightly different starting height
    bar.style.height = `${20 + Math.random() * 80}px`;

    barsContainer.appendChild(bar);

}

const settingsButton = document.getElementById("settings-button");

const settingsMenu = document.getElementById("settings-menu");

settingsButton.addEventListener("click", () => {

    settingsMenu.classList.toggle("hidden");

});

const themeButtons = document.querySelectorAll(".theme-button");

themeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const theme = button.dataset.theme;

        if (theme === "crimson") {

            document.documentElement.style.setProperty("--bar-gradient",
                "linear-gradient(to top, #700000, #ff3b3b)");

        }

        if (theme === "amethyst") {

            document.documentElement.style.setProperty("--bar-gradient",
                "linear-gradient(to top, #4b0082, #d38cff)");

        }

    });

});

const uploadButton = document.getElementById("upload-button");
const audioFile = document.getElementById("audio-file");

let audio = new Audio();

uploadButton.addEventListener("click", () => {

    audioFile.click();

});

const audioContext = new AudioContext();

const analyser = audioContext.createAnalyser();

analyser.fftSize = 128;

const source = audioContext.createMediaElementSource(audio);

source.connect(analyser);

analyser.connect(audioContext.destination);

const bufferLength = analyser.frequencyBinCount;

const dataArray = new Uint8Array(bufferLength);

audioFile.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    audio.src = url;

    await audioContext.resume();

    audio.play();

    animateBars();

});


function animateBars() {

    requestAnimationFrame(animateBars);

    analyser.getByteFrequencyData(dataArray);

    const bars = document.querySelectorAll(".bar");

    function animateBars() {

    requestAnimationFrame(animateBars);

    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, index) => {

        const value = dataArray[index];

        const height = Math.max(8, value * 2);

        bar.style.height = `${height}px`;

    });

}

    bars.forEach((bar, index) => {

        const value = dataArray[index];

        const height = Math.max(8, value * 2);

        bar.style.height = `${height}px`;

    });

}
