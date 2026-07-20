const barsContainer = document.getElementById("bars");

const BAR_COUNT = 64;

for (let i = 0; i < BAR_COUNT; i++) {

    const bar = document.createElement("div");

    bar.className = "bar";

    // Give every bar a slightly different starting height
    bar.style.height = `${20 + Math.random() * 80}px`;

    barsContainer.appendChild(bar);

}

const bars = document.querySelectorAll(".bar");

setInterval(() => {

    bars.forEach(bar => {

        const randomHeight = Math.random() * 120 + 10;

        bar.style.height = `${randomHeight}px`;

    });

}, 80);

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
