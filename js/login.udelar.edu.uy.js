const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const style = getComputedStyle(document.body)
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};
const bg_100 = hexToRgb(style.getPropertyValue("--inkFing-background-100"));
const primary = hexToRgb(style.getPropertyValue("--inkFing-primary"));
const storagePrefix = "login.udelar.edu.uy/"
let quality = undefined;
async function initImage() {
    document.querySelectorAll("img").forEach(async (element, i) => {
        const result = await chrome.storage.local.get([`${storagePrefix}${i}`]);
        if (result[`${storagePrefix}${i}`]) {
            element.src = result[`${storagePrefix}${i}`];
        } else {
            await generateAndSaveImage(element, `${storagePrefix}${i}`, primary, bg_100, 200);
        }
    });
}
async function generateAndSaveImage(element, i, color1, color2, point) {
    if (quality == undefined) {
        let res = await chrome.storage.local.get('quality');
        quality = res.quality || 2.7;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = element.src;
    canvas.width = element.width * quality;
    canvas.height = element.height * quality;
    canvas.style.width = canvas.width;
    canvas.style.height = canvas.height;
    img.onload = async () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (avg < point && (color1.a != 0)) {
                data[i] = color1.r; // r
                data[i + 1] = color1.g; // g
                data[i + 2] = color1.b; // b
            }
            else if (avg > point && (color2.a != 0)) {
                data[i] = color2.r; // r
                data[i + 1] = color2.g; // g
                data[i + 2] = color2.b; // b
            }
        }
        ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
        element.src = canvas.toDataURL("image/png", 1);
        await chrome.storage.local.set({ [i]: canvas.toDataURL("image/png", 1) });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}
if (window.location.pathname.startsWith("/idp/profile/")) initImage();
