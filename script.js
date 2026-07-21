// =========================================================
// CREATE VISUALIZER BARS
// =========================================================

const barsContainer = document.getElementById("bars");
const BAR_COUNT = 64;

for (let i = 0; i < BAR_COUNT; i++) {

    const bar = document.createElement("div");

    bar.className = "bar";
    bar.style.height = "8px";

    barsContainer.appendChild(bar);

}

const bars = document.querySelectorAll(".bar");

const songTitle = document.getElementById("song-title");

const artistName = document.getElementById("artist-name");

const albumArt = document.getElementById("album-art");

// =========================================================
// SETTINGS MENU
// =========================================================

const settingsButton = document.getElementById("settings-button");
const settingsMenu = document.getElementById("settings-menu");

settingsButton.addEventListener("click", () => {

    settingsMenu.classList.toggle("hidden");

});


// =========================================================
// THEMES
// =========================================================

const themeButtons = document.querySelectorAll(".theme-button");

themeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const theme = button.dataset.theme;

        if (theme === "crimson") {

            document.documentElement.style.setProperty(
                "--bar-gradient",
                "linear-gradient(to top, #700000, #ff3b3b)"
            );

        } else if (theme === "amethyst") {

            document.documentElement.style.setProperty(
                "--bar-gradient",
                "linear-gradient(to top, #4b0082, #d38cff)"
            );

        }

    });

});


// =========================================================
// AUDIO
// =========================================================

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

const dataArray = new Uint8Array(analyser.frequencyBinCount);


// =========================================================
// LOAD SONG
// =========================================================

audioFile.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) return;

    audio.src = URL.createObjectURL(file);

      await audioContext.resume();

      await audio.play();

    jsmediatags.read(file, {

    onSuccess: function(tag) {

        const tags = tag.tags;

        songTitle.textContent =
            tags.title || "Unknown Title";

        artistName.textContent =
            tags.artist || "Unknown Artist";

        if (tags.picture) {

            const picture = tags.picture;

            let base64 = "";

            for (let i = 0; i < picture.data.length; i++) {

                base64 += String.fromCharCode(picture.data[i]);

            }

            const image =
                `data:${picture.format};base64,${btoa(base64)}`;

            albumArt.style.backgroundImage = `url(${image})`;

            albumArt.style.backgroundSize = "cover";

            albumArt.style.backgroundPosition = "center";

        }

    },

    onError: function(error) {

        console.log(error);

    }

});

    await audioContext.resume();

    audio.play();

    animateBars();

});


// =========================================================
// VISUALIZER
// =========================================================

function animateBars() {

    requestAnimationFrame(animateBars);

    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, index) => {

        let value = dataArray[index];

        // Calm the bass a little
        if (index < 8) {
            value *= 0.45;
        }

        // Compress loud sounds
        const compressed = Math.sqrt(value);

        // Scale height
        const targetHeight = Math.max(8, compressed * 8);

        // Smooth movement
        const currentHeight = parseFloat(bar.style.height) || 8;

        const smoothHeight =
            currentHeight + (targetHeight - currentHeight) * 0.2;

        bar.style.height = `${smoothHeight}px`;

    });

}
