const bars = document.getElementById("bars");

for (let i = 0; i < 64; i++) {

    const bar = document.createElement("div");

    bar.classList.add("bar");

    bars.appendChild(bar);

}
