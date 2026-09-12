#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const errors = [];

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function lineAt(source, index) {
    return source.slice(0, index).split("\n").length;
}

function stripComments(css) {
    let out = "";
    let quote = null;
    for (let i = 0; i < css.length; i++) {
        const c = css[i];
        const next = css[i + 1];
        if (quote) {
            out += c;
            if (c === "\\") {
                out += next || "";
                i++;
            } else if (c === quote) {
                quote = null;
            }
            continue;
        }
        if (c === "/" && next === "*") {
            const end = css.indexOf("*/", i + 2);
            if (end === -1) break;
            i = end + 1;
            continue;
        }
        if (c === '"' || c === "'") quote = c;
        out += c;
    }
    return out;
}

function braceBalance(css) {
    let depth = 0;
    let inComment = false;
    let quote = null;
    for (let i = 0; i < css.length; i++) {
        const c = css[i];
        const next = css[i + 1];
        if (inComment) {
            if (c === "*" && next === "/") {
                inComment = false;
                i++;
            }
            continue;
        }
        if (quote) {
            if (c === "\\") i++;
            else if (c === quote) quote = null;
            continue;
        }
        if (c === "/" && next === "*") {
            inComment = true;
            i++;
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === "{") {
            depth++;
        } else if (c === "}") {
            depth--;
        }
    }
    return depth;
}

// 1. manifest.json must be valid JSON
try {
    const manifest = JSON.parse(read("manifest.json"));
    if (!manifest.name || !manifest.version) {
        errors.push("manifest.json is missing name/version");
    }
} catch (e) {
    errors.push(`manifest.json is not valid JSON: ${e.message}`);
}

// Collect every custom property defined in root.css
const rootCss = read("css/root.css");
const definedVariables = new Set();
for (const match of stripComments(rootCss).matchAll(/--[\w-]+(?=\s*:)/g)) {
    definedVariables.add(match[0]);
}

// 2. Validate each stylesheet
for (const file of fs.readdirSync(path.join(root, "css"))) {
    if (!file.endsWith(".css")) continue;
    const relativePath = path.join("css", file);
    const source = read(relativePath);
    const clean = stripComments(source);

    const unbalanced = braceBalance(source);
    if (unbalanced !== 0) {
        errors.push(
            `${relativePath}: unbalanced braces (depth ${unbalanced} != 0)`,
        );
    }

    for (const match of clean.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!definedVariables.has(match[1])) {
            errors.push(
                `${relativePath}:${lineAt(clean, match.index)} undefined variable ${match[1]}`,
            );
        }
    }

    const nthChild = clean.match(/:nth-child\(0\)/);
    if (nthChild) {
        errors.push(
            `${relativePath}:${lineAt(clean, nthChild.index)} :nth-child(0) matches nothing, use :first-child`,
        );
    }
}

const optionsCss = path.join(root, "options", "options.css");
const optionsSource = fs.readFileSync(optionsCss, "utf8");
const optionsBalanced = braceBalance(optionsSource);
if (optionsBalanced !== 0) {
    errors.push("options/options.css: unbalanced braces");
}

if (errors.length === 0) {
    console.log(
        "OK: manifest.json valid, CSS braces balanced, all CSS variables defined.",
    );
} else {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exit(1);
}
