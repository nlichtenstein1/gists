// ==UserScript==
// @name         JustAnswer Tag Protection
// @namespace    http://tampermonkey.net/
// @version      2024-10-05.1
// @updateURL    https://raw.githubusercontent.com/nlichtenstein1/gists/refs/heads/main/ja_tag_prot.js
// @downloadURL  https://raw.githubusercontent.com/nlichtenstein1/gists/refs/heads/main/ja_tag_prot.js
// @description  try to take over the world!
// @author       You
// @match        https://professional-secure.justanswer.com/oprc/*
// @match        https://professional-secure.justanswer.com/oprc
// @icon         https://www.google.com/s2/favicons?sz=64&domain=justanswer.com
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==



function apply_protection_to_node(selector) {
    const prot_node = document.querySelector(selector);
    if (!prot_node) {
        console.warn("Could not find '%s'", selector);
        return false;
    }

    const children = prot_node.children;
    for (var i = 0; i < children.length; i++) {
        const li = children[i];
        apply_protection(li);
    }
}

function apply_protection(li_node) {
    const text = li_node.textContent;
    if (evaluatePredicateList("redList", text, false) && !evaluatePredicateList("allowList", text, false)) {
        console.log("Found a tag in Question");
        console.debug(text);
        li_node.style.color = "red";
    } else if (GM_getValue("debugActive", false)) {
        console.debug("Parsed Question");
        console.debug(text);
        li_node.style.color = "green";
    } else {
        li_node.style.color = "";
    }
}

function evaluatePredicateList(storageKey, text, def) {
    const value = GM_getValue(storageKey, null);
    if (!value) {
        console.warn("No storage key %s found", storageKey);
        return def;
    }

    if (value.constructor.name != "Array") {
        console.warn("Storage key is not an array %s", storageKey);
        return def;
    }

    var ret = def;
    for (const s of value) {
        ret |= text.includes(s);
    }
    return ret;
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

(function() {
    'use strict';

    function main() {
        console.log("Waiting for items-list");
        waitForElm("#header-tabs").then((header_tabs) => {
            const question_panel = header_tabs.parentNode;
            console.log(question_panel);
            console.log("Loaded header-tabs with Questions Panel");

            apply_protection_to_node("#items-list");

            const mutation_config = { attributeOldValue: true, childList: true, subtree: true, characterDataOldValue: true };

            const callback = (mutationList, observer) => {
                console.log("Detected a mutation");
                apply_protection_to_node("#items-list");

                /*
                for (const mutation of mutationList) {
                    console.debug("Mutation Event");
                    console.debug(mutation);
                    if (mutation.type === "childList") {
                        console.log("Question list mutated");
                        for (const node of mutation.addedNodes) {
                            if (node.nodeName === "LI") {
                                const li = node.firstChild;
                                //apply_protection(li);
                            } else {
                                console.debug("Node added was not LI");
                                console.debug(node.nodeName);
                            }
                        }
                    } else {
                        console.log("Mutation List received unhandled event");
                        console.debug(mutation);
                    }
                }
                */
            };
            const observer = new MutationObserver(callback);

            console.log("Observing question panel");
            observer.observe(question_panel, mutation_config);
        });
    }

    const debug_toggle_menu_item = GM_registerMenuCommand("Toggle Debug", function(event) {
        console.log("Toggle Debug selected");
        const debugActive = GM_getValue("debugActive", false);
        console.log("New value is %s", !debugActive);
        GM_setValue("debugActive", !debugActive);
    }, "t");

    const redlist_menu_item = GM_registerMenuCommand("Set Redlist", function(event) {
        console.log("Redlist selected");
        const redList = GM_getValue("redList", ["@"]);
        console.log("Current value is %s", redList);
        const newListStr = window.prompt("Red List:", redList.join(' '));
        console.log("New value is %s", newListStr);
        if (newListStr) {
            const newList = newListStr.trim().split(' ');
            GM_setValue("redList", newList);
        } else {
            console.warn("No redlist provided");
        }
    }, "r");

    const allowlist_menu_item = GM_registerMenuCommand("Set Allowlist", function(event) {
        console.log("allowlist selected");
        const allowList = GM_getValue("allowList", ["@AnneH0912"]);
        console.log("Current value is %s", allowList);
        const newListStr = window.prompt("Allow List:", allowList.join(' '));
        console.log("New value is %s", newListStr);
        if (newListStr) {
            const newList = newListStr.trim().split(' ');
            GM_setValue("allowList", newList);
        } else {
            console.warn("No allowlist provided");
        }
    }, "a");

    function on_highlight_key_change(key, oldValue, newValue, remote) {
        console.debug("The value of the '" + key + "' key has changed from '" + oldValue + "' to '" + newValue + "'");
        apply_protection_to_node("#items-list");
    }

    const debug_active_change_listener = GM_addValueChangeListener("debugActive", on_highlight_key_change);
    const redlist_change_listener = GM_addValueChangeListener("redList", on_highlight_key_change);
    const allowlist_change_listener = GM_addValueChangeListener("allowList", on_highlight_key_change);

    addEventListener("load", () => { setTimeout(() => {
        console.log("Loading JustAnswer Tag Protection");
        main();
        console.log("Loaded JustAnswer Tag Protection v%s", GM_info.script.version);
        console.debug(GM_info);
    }, 1000)});
    console.log("Configured JustAnswer Tag Protection Listener v%s", GM_info.script.version);

})();
