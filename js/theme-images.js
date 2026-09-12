// Shared image theming engine for InkFing content scripts.
// This must be loaded before any site-specific script that uses it (see manifest.json).

function inkFingHexToRgb(color) {
    if (!color) return { r: 0, g: 0, b: 0, a: 0 };
    color = color.trim();
    if (color.startsWith("#")) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
                a: 1,
            };
        }
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1,
            };
        }
        if (hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: parseInt(hex.slice(6, 8), 16) / 255,
            };
        }
    }
    const match = color.match(
        /rgba?\([\s]*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?[\s]*\)/i,
    );
    if (match) {
        const alpha = match[4] === undefined ? 1 : parseFloat(match[4]);
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: Number.isNaN(alpha) ? 1 : alpha,
        };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
}

let cachedQuality;
async function getQuality() {
    if (cachedQuality === undefined) {
        const result = await chrome.storage.local.get("quality");
        cachedQuality = Number(result.quality) || 2.7;
    }
    return cachedQuality;
}

function themeImage(element, key, color1, color2, point) {
    return new Promise((resolve) => {
        if (!element.src) return resolve();
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onerror = () => resolve();
        img.onload = async () => {
            try {
                const quality = await getQuality();
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", {
                    willReadFrequently: true,
                });
                ctx.imageSmoothingEnabled = true;
                canvas.width = Math.max(1, Math.round(element.width * quality));
                canvas.height = Math.max(
                    1,
                    Math.round(element.height * quality),
                );
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    if (avg < point && color1.a !== 0) {
                        data[i] = color1.r;
                        data[i + 1] = color1.g;
                        data[i + 2] = color1.b;
                    } else if (avg > point && color2.a !== 0) {
                        data[i] = color2.r;
                        data[i + 1] = color2.g;
                        data[i + 2] = color2.b;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                const png = canvas.toDataURL("image/png", 1);
                element.src = png;
                await chrome.storage.local.set({ [key]: png });
            } catch (error) {
                // The image data could not be read (e.g. tainted canvas) or stored; skip it.
            }
            resolve();
        };
        img.src = element.src;
    });
}

async function inkFingProcessImages(elements, prefix, options = {}) {
    const color1 = inkFingHexToRgb(options.color1);
    const color2 = inkFingHexToRgb(options.color2);
    const point = options.point === undefined ? 200 : options.point;
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const key = `${prefix}${i}`;
        const cached = await chrome.storage.local.get([key]);
        if (cached[key]) {
            element.src = cached[key];
        } else {
            await themeImage(element, key, color1, color2, point);
        }
    }
}
