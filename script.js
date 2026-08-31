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

const songTitle =
    document.getElementById("song-title");

const artistName =
    document.getElementById("artist-name");

const albumArt =
    document.getElementById("album-art");


// =========================================================
// SETTINGS MENU
// =========================================================

const settingsButton =
    document.getElementById("settings-button");

const settingsMenu =
    document.getElementById("settings-menu");

settingsButton.addEventListener("click", () => {

    settingsMenu.classList.toggle("hidden");

});


// =========================================================
// THEMES
// =========================================================

const themeButtons =
    document.querySelectorAll(".theme-button");

themeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const theme =
            button.dataset.theme;

        if (theme === "crimson") {

            document.documentElement.style.setProperty(
                "--bar-gradient",
                "linear-gradient(to top, #700000, #ff3b3b)"
            );

        }

        else if (theme === "amethyst") {

            document.documentElement.style.setProperty(
                "--bar-gradient",
                "linear-gradient(to top, #4b0082, #d38cff)"
            );

        }

        settingsMenu.classList.add("hidden");

    });

});


// =========================================================
// AUDIO
// =========================================================

const audioFile =
    document.getElementById("audio-file");

let audio =
    new Audio();

audio.preload = "auto";
audio.volume = 1;

const audioContext =
    new AudioContext();

const analyser =
    audioContext.createAnalyser();

analyser.fftSize = 128;

const source =
    audioContext.createMediaElementSource(audio);

source.connect(analyser);

analyser.connect(
    audioContext.destination
);

const dataArray =
    new Uint8Array(
        analyser.frequencyBinCount
    );


// =========================================================
// VISUALIZER SETTINGS
// =========================================================

// Sensitivity is fixed for now.
// We removed the old sensitivity slider
// because it no longer exists in the HTML.

const sensitivity = 1;


// =========================================================
// LOAD SONG
// =========================================================

audioFile.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }


        // -----------------------------------------
        // LOAD AUDIO
        // -----------------------------------------

        const songURL =
            URL.createObjectURL(file);

        audio.pause();

        audio.src = songURL;

        audio.load();


        try {

            if (
                audioContext.state ===
                "suspended"
            ) {

                await audioContext.resume();

            }

            await audio.play();

        }

        catch (error) {

            console.error(
                "Audio playback failed:",
                error
            );

            return;

        }


        // -----------------------------------------
        // SONG METADATA
        // -----------------------------------------

        jsmediatags.read(file, {

            onSuccess: function(tag) {

                const tags =
                    tag.tags;


                songTitle.textContent =
                    tags.title ||
                    file.name;


                artistName.textContent =
                    tags.artist ||
                    "Unknown Artist";


                // ---------------------------------
                // ALBUM ART
                // ---------------------------------

                if (!tags.picture) {
                    return;
                }


                const picture =
                    tags.picture;

                let base64 = "";


                for (
                    let i = 0;
                    i < picture.data.length;
                    i++
                ) {

                    base64 +=
                        String.fromCharCode(
                            picture.data[i]
                        );

                }


                const image =
                    `data:${picture.format};base64,${btoa(base64)}`;


                albumArt.style.backgroundImage =
                    `url(${image})`;

                albumArt.style.backgroundSize =
                    "cover";

                albumArt.style.backgroundPosition =
                    "center";


                // ---------------------------------
                // COLOR THIEF
                // ---------------------------------

                if (
                    typeof ColorThief ===
                    "undefined"
                ) {

                    console.warn(
                        "ColorThief is not available."
                    );

                    return;

                }


                const img =
                    new Image();

                img.src = image;


                img.onload = () => {

                    try {

                        const colorThief =
                            new ColorThief();

                        const colors =
                            colorThief.getPalette(
                                img,
                                2
                            );


                        if (
                            !colors ||
                            colors.length < 2
                        ) {

                            return;

                        }


                        const color1 =
                            colors[0];

                        const color2 =
                            colors[1];


                        document.documentElement.style.setProperty(

                            "--player",

                            `linear-gradient(
                                135deg,
                                rgb(${color1.join(",")}),
                                rgb(${color2.join(",")})
                            )`

                        );

                    }

                    catch (error) {

                        console.error(
                            "ColorThief error:",
                            error
                        );

                    }

                };

            },


            onError: function(error) {

                console.error(
                    "Metadata reading failed:",
                    error
                );

            }

        });

    }
);


// =========================================================
// VISUALIZER
// =========================================================

function animateBars() {

    requestAnimationFrame(
        animateBars
    );


    analyser.getByteFrequencyData(
        dataArray
    );


    bars.forEach(
        (bar, index) => {

            let value =
                dataArray[index];


            // Reduce bass slightly

            const weight =
                0.35 +
                Math.pow(
                    index / BAR_COUNT,
                    0.8
                ) *
                0.65;


            value *= weight;


            // Compress loud sounds

            const compressed =
                Math.pow(
                    value,
                    0.7
                );


            // Calculate height

            const targetHeight =
                Math.max(
                    8,
                    compressed *
                    5 *
                    sensitivity
                );


            // Smooth animation

            const currentHeight =
                parseFloat(
                    bar.style.height
                ) || 8;


            const smoothHeight =
                currentHeight +
                (
                    targetHeight -
                    currentHeight
                ) *
                0.35;


            bar.style.height =
                `${smoothHeight}px`;

        }
    );

}


// =========================================================
// START VISUALIZER
// =========================================================

animateBars();
