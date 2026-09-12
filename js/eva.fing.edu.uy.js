const style = getComputedStyle(document.body);
const background200 = style.getPropertyValue("--inkFing-background-200");
const primary = style.getPropertyValue("--inkFing-primary");
const secondary = style.getPropertyValue("--inkFing-secondary");

async function initImages() {
    inkFingProcessImages(
        document.querySelectorAll(".img-fluid"),
        "eva.fing.edu.uy/",
        {
            color1: background200,
            color2: primary,
            point: 200,
        },
    );
}

async function initLogo() {
    inkFingProcessImages(
        document.querySelectorAll(".img-fluid"),
        "eva.fing.edu.uy/login/",
        {
            color1: primary,
            color2: secondary,
            point: 100,
        },
    );
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
            subtree: true,
        });
    });
}

async function treeDisplay() {
    // This is an experimental feature so only run when useExperimental is true;
    let res = await chrome.storage.local.get("useExperimental");
    if (!res.useExperimental) return false;
    // Check if course has vertical nav tab, then run code :p
    if (!document.querySelector('[data-preference="drawer-open-index"]'))
        return false;
    // Wait for the F*ing placeholder to get replaced by the juicy content.
    await waitForDeletion("#course-index-placeholder");
    // IDK, magic selector to get all the parents
    let horizontalTabs = document.querySelectorAll(
        "ul.format_onetopic-tabs",
    )[0];
    if (!horizontalTabs) return false;
    let navTabsTextArray = Array.from(
        horizontalTabs.children,
        (element) => element.children[0]?.innerText,
    );
    // Another magic selector, this time to decide wich is a child or not
    let verticalNavTabs = document.querySelectorAll("div.courseindex")[0];
    if (!verticalNavTabs) return false;
    let lastParent;
    let parentsToPerformInitialexpandedState = [];
    for (let i = 0; i < verticalNavTabs.children.length; i++) {
        const element = verticalNavTabs.children[i];
        // If its child apply changes
        if (
            !navTabsTextArray.includes(
                element.children[0]?.children[1]?.innerText,
            )
        ) {
            if (lastParent !== undefined) {
                element.style.marginLeft = "24px";
                element.setAttribute("inkFing-child", lastParent);
            }
        } else {
            lastParent = element.children[0].children[1].innerText;
            element.setAttribute("inkFing-parent", lastParent);
            parentsToPerformInitialexpandedState.push(element);
            element.addEventListener("click", () => {
                expandedStateDisplay(element, "true");
            });
        }
    }
    parentsToPerformInitialexpandedState.forEach((element) => {
        expandedStateDisplay(element, "false");
    });
}
function expandedStateDisplay(element, property) {
    let parent = element.getAttribute("inkFing-parent");
    const toggle = element.children[0]?.children[0];
    if (!toggle) return;
    // i don't know why or will know but if its false on the initial test it works and for the user input use true
    if (toggle.getAttribute("aria-expanded") == property) {
        document
            .querySelectorAll(`[inkFing-child="${parent}"]`)
            .forEach((childElement) => {
                childElement.style.display = "none";
            });
    } else {
        document
            .querySelectorAll(`[inkFing-child="${parent}"]`)
            .forEach((childElement) => {
                childElement.style.display = "";
            });
    }
}

if (window.location.pathname == "/" || window.location.pathname == "/index.php")
    initImages();
if (window.location.pathname.startsWith("/login")) initLogo();
if (window.location.pathname.startsWith("/course")) treeDisplay();
