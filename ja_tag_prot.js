// ==UserScript==
// @name         JustAnswer Tag Protection
// @namespace    http://tampermonkey.net/
// @version      2024-09-29
// @description  try to take over the world!
// @author       You
// @match        https://professional-secure.justanswer.com/oprc/*
// @match        https://professional-secure.justanswer.com/oprc
// @icon         https://www.google.com/s2/favicons?sz=64&domain=justanswer.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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

    function apply_protection(li_node) {
        const text = li_node.textContent;
        if ((text.includes("juzek") || text.includes("@")) && !text.includes("@AnneH0912")) {
            console.log("Found a tag in Question");
            console.debug(text);
            li_node.style.color = "red";
        } else {
            console.debug("Parsed Question");
        }
    }

    function main() {
        console.log("Waiting for items-list");
        waitForElm("#items-list").then((question_panel) => {
            console.log(question_panel);
            console.log("Loaded items-list with Questions Panel");

            const children = question_panel.children;
            for (var i = 0; i < children.length; i++) {
                const li = children[i];
                apply_protection(li);
            }

            const mutation_config = { attributeOldValue: true, childList: true, subtree: true, characterDataOldValue: true };

            const callback = (mutationList, observer) => {
                for (const mutation of mutationList) {
                    console.debug("Mutation Event");
                    console.debug(mutation);
                    if (mutation.type === "childList") {
                        console.log("Question list mutated");
                        for (const node of mutation.addedNodes) {
                            if (node.nodeName === "LI") {
                                const li = node.firstChild;
                                apply_protection(li);
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
            };
            const observer = new MutationObserver(callback);

            console.log("Observing question panel");
            observer.observe(question_panel, mutation_config);
        });
    }

    addEventListener("load", () => { setTimeout(() => {
        console.log("Loading JustAnswer Tag Protection");
        main();
        console.log("Loaded JustAnswer Tag Protection v0.1");
    }, 100)});
    console.log("Configured JustAnswer Tag Protection Listener");

})();
