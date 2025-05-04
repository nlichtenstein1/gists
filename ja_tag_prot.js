// ==UserScript==
// @name         JustAnswer Tag Protection
// @namespace    http://tampermonkey.net/
// @version      2025-05-04
// @description  try to take over the world!
// @author       You
// @match        https://professional-secure.justanswer.com/oprc/*
// @match        https://professional-secure.justanswer.com/oprc
// @icon         https://www.google.com/s2/favicons?sz=64&domain=justanswer.com
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    function showToast(message, timeout = 90000) {
        let toastContainer = document.getElementById('gm-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'gm-toast-container';
            toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
            z-index: 9999;
            `;
            document.body.appendChild(toastContainer);
        }

        // Converts URLs in text to anchor tags
        function linkify(text) {
            const urlRegex = /(\bhttps?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, url => `<a href="${url}" target="_blank" style="color:#4ea1f3; text-decoration: underline;">${url}</a>`);
        }

        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="
                background: #333;
                color: #fff;
                padding: 14px 18px;
                border-radius: 6px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                max-width: 400px;
                font-family: sans-serif;
                font-size: 14px;
                line-height: 1.4;
                position: relative;
                word-wrap: break-word;
                overflow-wrap: break-word;
            ">
                <span>${linkify(message)}</span>
                <button style="
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                ">&times;</button>
            </div>
        `;

        // Close button functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => toast.remove());

        // Auto-remove after timeout
        setTimeout(() => toast.remove(), timeout);

        // Add toast to container
        toastContainer.appendChild(toast);
    }

    const mk_popup = (url => {
        showToast(url);
    });

    const fmt_question = (q => {
        const summary = q.QuestionSummary;
        const delta = q.Delta;
        const lockedutc = q.LockedUntilUTC;
        const link = q.QuestionLink.substring(q.QuestionLink.lastIndexOf('/') + 1);
        const msg = "Question: " + summary + ", Delta: " + delta + ", Locked: " + lockedutc + ", Link: " + link;
        return msg;
    });

    var loaded = false;
    const WebSocketHandler = {
        construct(target, args) {
            const ws = new target(...args);
            const origSend = ws.send;
            ws.send = function(data) {
                console.log('[Proxy] Outgoing:', data);
                return origSend.call(this, data);
            };

            ws.addEventListener('message', (event) => {
                if (!loaded) {
                    console.log('not loaded');
                    return;
                }
                console.log('[Proxy] Incoming:', event.data);
                console.log(event);

                const idx = event.data.indexOf('{');
                const end = event.data.indexOf('|');
                if (idx != -1) {
                    const subs = end == -1 ? event.data.substring(idx) : event.data.substring(idx, end);
                    const json = JSON.parse(subs);
                    //console.debug(json);
                    if (json.hasOwnProperty('Questions')) {
                        Object.entries(json.Questions).forEach(([key, val]) => {
                            console.info(key, val);
                            const question = val;

                            const locked = question.LockedUntilUTC != null;
                            const delta_d = question.Delta == "D";
                            const delta_m = question.Delta == "M";

                            if (!locked && !delta_d && !delta_m) {
                                console.debug('Potential: ' + fmt_question(question));
                                const tail = question.QuestionLink.substring(question.QuestionLink.lastIndexOf('/') + 1);
                                const pth = `https://professional-secure.justanswer.com/oprc/products/${tail}`;
                                console.debug(pth);
                                mk_popup(pth);
                                //window.open(pth, "_blank");
                            }
                        });
                    }
                }
            });

            return ws;
        }
    };
    window.WebSocket = new Proxy(window.WebSocket, WebSocketHandler);

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

    function main() {
        waitForElm("#items-list").then((question_panel) => {
            console.log(question_panel);
            const mutation_config = { attributes: true, childList: true, subtree: true };

            const callback = (mutationList, observer) => {
                for (const mutation of mutationList) {
                    if (mutation.type === "childList") {
                        console.log("Question list mutated");
                        for (const node of mutation.addedNodes) {
                            if (node.nodeName === "LI") {
                                const li = node.firstChild;

                                const text = node.textContent;
                                if (text.includes("@") && !text.includes("@AnneH0912")) {
                                    console.log("Found a tag in Question:");
                                    console.log(text);
                                    node.style.color = "red";
                                }
                            } else {
                                console.log(node.nodeName);
                            }
                        }
                    }
                }
            };
            const observer = new MutationObserver(callback);
            loaded = true;
            //observer.observe(question_panel, mutation_config);
        });
    }

    addEventListener("load", main);

})();
