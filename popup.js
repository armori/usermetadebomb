document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "GET_SCORES" }, response => {
            const elOriginal = document.getElementById("score-original");
            const elDebombed = document.getElementById("score-debombed");
            const elDetails = document.getElementById("details");

            if (!response || response.error || !response.distribution) {
                elOriginal.textContent = "N/A";
                elDebombed.textContent = "N/A";
                elDetails.textContent = response?.error ?? "Could not read score. Make sure you're on a Metacritic user-reviews page.";
                return;
            }

            const { score, distribution: { pos, mix, neg } } = response;
            const total = pos + mix + neg;

            elOriginal.textContent = score.toFixed(1);

            // Remove negative reviews (assumed uniform 0–4, avg = 2)
            // debombed = (score × total − neg × 2) / (total − neg)
            const remaining = total - neg;
            if (remaining <= 0) {
                elDebombed.textContent = "N/A";
            } else {
                const debombed = (score * total - neg * 2) / remaining;
                elDebombed.textContent = debombed.toFixed(1);
            }

            elDetails.textContent = `Positive: ${pos.toLocaleString()} | Mixed: ${mix.toLocaleString()} | Negative: ${neg.toLocaleString()}`;
        });
    });
});
