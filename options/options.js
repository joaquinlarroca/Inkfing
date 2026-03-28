async function saveOptions(e) {
    e.preventDefault();

    await chrome.storage.local.set({
        useExperimental: document.querySelector("#useExperimental").checked,
        quality: document.querySelector("#quality").value
    });
    restoreOptions();
}

async function restoreOptions() {
    try {
        document.getElementById("storage").innerText = `${((await chrome.storage.local.getBytesInUse()) * 1e-6).toFixed(2)} mb / 10 mb`;
        let useExperimental = await chrome.storage.local.get('useExperimental');
        document.querySelector("#managed-useExperimental").innerText = useExperimental.useExperimental || false;
        document.querySelector("#useExperimental").checked = useExperimental.useExperimental || false;

        let quality = await chrome.storage.local.get('quality');
        document.querySelector("#managed-quality").innerText = quality.quality || 2.7;
        document.querySelector("#quality").value = quality.quality || 2.7;
    } catch (error) {
        document.body.innerText = `Unexpected managed storage error: ${error.message}`;
    }
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