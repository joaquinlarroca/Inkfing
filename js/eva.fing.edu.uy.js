const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
ctx.imageSmoothingEnabled = true;
const style = getComputedStyle(document.body)
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: 1 };
};
const bg_100 = hexToRgb(style.getPropertyValue("--inkFing-background-100"));
const bg_200 = hexToRgb(style.getPropertyValue("--inkFing-background-200"));
const primary = hexToRgb(style.getPropertyValue("--inkFing-primary"));
const secondary = hexToRgb(style.getPropertyValue("--inkFing-secondary"));
const storagePrefix = "eva.fing.edu.uy/";
let quality = undefined;
async function initImage() {
    document.querySelectorAll(".img-fluid").forEach(async (element, i) => {
        const result = await chrome.storage.local.get([`${storagePrefix}${i}`]);
        if (result[`${storagePrefix}${i}`]) {
            element.src = result[`${storagePrefix}${i}`];
        } else {
            await generateAndSaveImage(element, `${storagePrefix}${i}`, bg_200, primary, 200);
        }
    });
}
async function initBanner() {
    document.querySelectorAll(".img-responsive").forEach(async (element, i) => {
        const result = await chrome.storage.local.get([`${storagePrefix}banner/${i}`]);
        if (result[`${storagePrefix}banner/${i}`]) {
            element.src = result[`${storagePrefix}banner/${i}`];
        } else {
            await generateAndSaveImage(element, `${storagePrefix}banner/${i}`, { a: 0 }, bg_100, 240);
        }
    });
}
async function initLogo() {
    document.querySelectorAll(".img-fluid").forEach(async (element, i) => {
        const result = await chrome.storage.local.get([`${storagePrefix}login/${i}`]);
        if (result[`${storagePrefix}login/${i}`]) {
            element.src = result[`${storagePrefix}login/${i}`];
        } else {
            await generateAndSaveImage(element, `${storagePrefix}login/${i}`, primary, secondary, 100);
        }
    });
}
async function generateAndSaveImage(element, i, color1, color2, point) {
    //Updates quality to a number
    if (quality == undefined) {
        let res = await chrome.storage.local.get('quality');
        quality = res.quality || 2.7;
    }
    // Init the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = element.src;
    // Change Canvas size
    canvas.width = element.width * quality;
    canvas.height = element.height * quality;
    canvas.style.width = "auto";
    canvas.style.height = "auto";
    img.onload = async () => {
        // Draw the image to the canvas and process its data
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
        // Save image and clear Canva
        ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
        element.src = canvas.toDataURL("image/png", 1);
        await chrome.storage.local.set({ [i]: canvas.toDataURL("image/png", 1) });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}
// The #courseindex-content div
// has a placeholder element course-index-placeholder
// that it is replaced by the nav element
function waitForDeletion(selector) {
    return new Promise((resolve) => {
        if (!document.querySelector(selector)) {
            return resolve();
        }
        // We observer with our little eye
        const observer = new MutationObserver(() => {
            if (!document.querySelector(selector)) {
                observer.disconnect();
                resolve();
            }
        });
        // We watch the body for any children being added or removed
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

async function treeDisplay() {
    // This is an experimental feature so only run when useExperimental is true;
    let res = await chrome.storage.local.get('useExperimental')
    if (!res.useExperimental) return false;
    // Check if course has vertical nav tab, then run code :p
    if (!document.querySelector('[data-preference="drawer-open-index"]')) return false;
    // Wait for the F*ing placeholder to get replaced by the juicy content. 
    await waitForDeletion("#course-index-placeholder");
    // IDK, magic selector to get all the parents
    let navTabs = document.querySelectorAll("ul.format_onetopic-tabs")[0].children;
    let navTabsTextArray = [];
    for (let i = 0; i < navTabs.length; i++) {
        const element = navTabs[i];
        navTabsTextArray.push(element.children[0].innerText);
    }
    // Another magic selector, this time to decide wich is a child or not
    let verticalNavTabs = document.querySelectorAll("div.courseindex")[0].children;
    let parentsToPerformInitialexpandedState = [];
    for (let i = 0; i < verticalNavTabs.length; i++) {
        const element = verticalNavTabs[i];
        let lastParentElement;
        // If its child apply changes
        if (!navTabsTextArray.includes(element.children[0].children[1].innerText)) {
            element.style.marginLeft = "24px";
            element.setAttribute("inkFing-child", lastParent);
        }
        else {
            lastParent = element.children[0].children[1].innerText;
            element.setAttribute("inkFing-parent", lastParent);
            parentsToPerformInitialexpandedState.push(element)
            element.addEventListener("click", () => {
                expandedStateDisplay(element, "true");
            })
        }
    }
    parentsToPerformInitialexpandedState.forEach(element => {
        expandedStateDisplay(element, "false");
    });
}
function expandedStateDisplay(element, property) {
    let parent = element.getAttribute("inkFing-parent");
    // i don't know why or will know but if its false on the initial test it works and for the user input use true
    if (element.children[0].children[0].getAttribute("aria-expanded") == property) {
        document.querySelectorAll(`[inkFing-child="${parent}"]`).forEach(childElement => {
            childElement.style.display = "none";
        });
    }
    else {
        document.querySelectorAll(`[inkFing-child="${parent}"]`).forEach(childElement => {
            childElement.style.display = "";
        });
    }
}

if (window.location.pathname == "/") initImage();
if (window.location.pathname.startsWith("/login")) initLogo();
if (window.location.pathname.startsWith("/course")) initBanner(); treeDisplay();