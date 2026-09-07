const QUALITY_MIN = 1;
const QUALITY_MAX = 4;

async function saveOptions(e) {
    e.preventDefault();

    const quality = Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, Number(document.querySelector("#quality").value)));
    await chrome.storage.local.set({
        useExperimental: document.querySelector("#useExperimental").checked,
        quality
    });
    restoreOptions();
}

async function restoreOptions() {
    try {
        document.getElementById("storage").innerText = `${((await chrome.storage.local.getBytesInUse()) * 1e-6).toFixed(2)} MB`;
        let useExperimental = await chrome.storage.local.get('useExperimental');
        document.querySelector("#managed-useExperimental").innerText = useExperimental.useExperimental || false;
        document.querySelector("#useExperimental").checked = useExperimental.useExperimental || false;

        let quality = await chrome.storage.local.get('quality');
        const value = Number(quality.quality) || 2.7;
        document.querySelector("#managed-quality").innerText = value;
        document.querySelector("#quality").value = value;
    } catch (error) {
        document.body.innerText = `Unexpected error: ${error.message}`;
    }
}

async function clearSiteImages(prefix) {
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter((key) => key.startsWith(prefix));
    if (keys.length > 0) {
        await chrome.storage.local.remove(keys);
    }
    restoreOptions();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.getElementById("rls").addEventListener("click", () => {
    chrome.storage.local.clear();
    window.location.reload();
});
document.getElementById("reload").addEventListener("click", () => {
    window.location.reload();
});
document.getElementById("clear-eva").addEventListener("click", () => {
    clearSiteImages("eva.fing.edu.uy/");
});
document.getElementById("clear-login").addEventListener("click", () => {
    clearSiteImages("login.udelar.edu.uy/");
});