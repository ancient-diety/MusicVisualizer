const bars = document.querySelectorAll(".bar");

function animateBars() {

    requestAnimationFrame(animateBars);

    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, index) => {

        let value = dataArray[index];

        // Reduce bass so it isn't ridiculous
        if (index < 8) {
            value *= 0.45;
        }

        const compressed = Math.sqrt(value);

        const height = Math.max(8, compressed * 8);

        const current = parseFloat(bar.style.height) || 8;

        const smooth = current + (height - current) * 0.2;

        bar.style.height = `${smooth}px`;

    });

}

    bars.forEach((bar, index) => {

    let value = dataArray[index];

    if (index < 8) {
        value *= 0.45;
    }

    const compressed = Math.sqrt(value);

    const height = Math.max(8, compressed * 8);

    const current = parseFloat(bar.style.height) || 8;

    const smooth = current + (height - current) * 0.2;

    bar.style.height = `${smooth}px`;

});
