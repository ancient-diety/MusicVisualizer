const barsContainer = document.getElementById("bars");

const BAR_COUNT = 64;

for (let i = 0; i < BAR_COUNT; i++) {

    const bar = document.createElement("div");

    bar.className = "bar";

    // Give every bar a slightly different starting height
    bar.style.height = `${20 + Math.random() * 80}px`;

    barsContainer.appendChild(bar);

}
