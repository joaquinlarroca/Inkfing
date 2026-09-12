const style = getComputedStyle(document.body);
const background100 = style.getPropertyValue("--inkFing-background-100");
const primary = style.getPropertyValue("--inkFing-primary");

async function initImage() {
    inkFingProcessImages(
        document.querySelectorAll("img"),
        "login.udelar.edu.uy/",
        {
            color1: primary,
            color2: background100,
            point: 200,
        },
    );
}

if (window.location.pathname.startsWith("/idp/profile/")) initImage();
