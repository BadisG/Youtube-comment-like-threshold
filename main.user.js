// ==UserScript==
// @name YouTube Comment Filter (With Adjustable Threshold)
// @namespace http://tampermonkey.net/
// @version 1.0
// @description Filter YouTube comments with less than X likes, with adjustable threshold
// @match https://www.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    function saveMinLikes(value) {
        localStorage.setItem('youtubeCommentFilterMinLikes', value);
    }

    function loadMinLikes() {
        return localStorage.getItem('youtubeCommentFilterMinLikes') || '1';
    }

    let MIN_LIKES = parseInt(loadMinLikes());

    function isLightTheme() {
        return document.documentElement.getAttribute('dark') === null;
    }

    function insertUIElements() {
        const logoContainer = document.querySelector('ytd-topbar-logo-renderer');
        if (!logoContainer) {
            setTimeout(insertUIElements, 1000);
            return;
        }

        const uiContainer = document.createElement('div');
        uiContainer.style.cssText = `
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    white-space: nowrap;
    position: absolute;
    left: calc(10vw + 60px);
    padding: 5px 3px;
    border-radius: 5px;
    box-sizing: border-box;
    width: 152px;
`;

        const labelText = document.createElement('span');
        labelText.textContent = 'Min Likes:';
        labelText.style.cssText = `
            margin-right: 5px;
            margin-left: 5px;
            white-space: nowrap;
            opacity: 1;
            font-size: 12px;
        `;

        const inputBox = document.createElement('input');
        inputBox.type = 'number';
        inputBox.min = '0';
        inputBox.value = loadMinLikes();
        inputBox.style.cssText = `
            width: 30px;
            padding: 2px 5px;
            flex-shrink: 0;
            height: 24px;
            font-size: 14px;
            border-radius: 3px;
            margin-right: 2px;
        `;

        // Create buttons container for vertical stacking
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 24px;
    width: 18px;
    margin-left: 2px;
    align-self: center;
`;
        // Create up button
        const upButton = document.createElement('button');
        upButton.textContent = '▲';
        upButton.style.cssText = `
    width: 200%;
    flex: 1;
    padding: 0;
    font-size: 10px;
    line-height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px 3px 0 0;
    cursor: pointer;
    margin: 0;
    border: none;
    box-sizing: border-box;
`;

        // Create down button
        const downButton = document.createElement('button');
        downButton.textContent = '▼';
        downButton.style.cssText = `
    width: 200%;
    flex: 1;
    padding: 0;
    font-size: 10px;
    line-height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 0 3px 3px;
    cursor: pointer;
    margin: 0;
    border: none;
    box-sizing: border-box;
`;
        // Add buttons to the container
        buttonsContainer.appendChild(upButton);
        buttonsContainer.appendChild(downButton);

        uiContainer.appendChild(labelText);
        uiContainer.appendChild(inputBox);
        uiContainer.appendChild(buttonsContainer);
        logoContainer.parentNode.insertBefore(uiContainer, logoContainer.nextSibling);

        // Event listeners
        inputBox.addEventListener('input', applyNewValue);

        upButton.addEventListener('click', () => {
            const currentValue = parseInt(inputBox.value) || 0;
            inputBox.value = currentValue + 1;
            applyNewValue({ target: inputBox });
        });

        downButton.addEventListener('click', () => {
            const currentValue = parseInt(inputBox.value) || 0;
            if (currentValue > 0) {
                inputBox.value = currentValue - 1;
                applyNewValue({ target: inputBox });
            }
        });

        // Apply theme-specific styles
        applyThemeStyles(uiContainer, labelText, inputBox, upButton, downButton);

        // Add a listener for theme changes
        const observer = new MutationObserver(() => {
            applyThemeStyles(uiContainer, labelText, inputBox, upButton, downButton);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
    }

    function applyThemeStyles(container, label, input, upButton, downButton) {
        if (isLightTheme()) {
            container.style.background = 'linear-gradient(to bottom right, #ffffff, #f0f0f0)';
            container.style.border = '1px solid rgba(0, 0, 0, 0.4)';
            label.style.color = '#0f0f0f';
            input.style.backgroundColor = 'white';
            input.style.color = '#0f0f0f';
            input.style.border = '1px solid rgba(0, 0, 0, 0.6)';

            // Button light theme
            [upButton, downButton].forEach(btn => {
                btn.style.backgroundColor = '#f5f5f5';
                btn.style.color = '#0f0f0f';
                btn.style.border = '1px solid rgba(0, 0, 0, 0.6)';
            });
        } else {
            // Dark mode changes
            container.style.background = 'linear-gradient(to bottom right, black, #262626)';
            container.style.border = '1px solid rgba(255, 255, 255, 0.4)';
            label.style.color = 'white';
            input.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
            input.style.color = 'white';
            input.style.border = '1px solid rgba(255, 255, 255, 0.6)';

            // Button dark theme
            [upButton, downButton].forEach(btn => {
                btn.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
                btn.style.color = 'white';
                btn.style.border = '1px solid rgba(255, 255, 255, 0.6)';
            });
        }
    }

    function applyNewValue(event) {
        MIN_LIKES = parseInt(event.target.value) || 0;
        saveMinLikes(MIN_LIKES);
        filterComments();
    }

    function filterComments() {
        const comments = document.querySelectorAll('ytd-comment-thread-renderer');
        comments.forEach(comment => {
            const likeButton = comment.querySelector('#vote-count-middle');
            if (likeButton) {
                const likeText = likeButton.textContent.trim();
                const likes = parseLikeCount(likeText);
                if (likes < MIN_LIKES) {
                    comment.style.display = 'none';
                } else {
                    comment.style.display = 'block';
                }
            }
        });
    }

    function parseLikeCount(likeText) {
        if (likeText === '') return 0;
        if (likeText.includes('K')) {
            return parseInt(parseFloat(likeText) * 1000);
        }
        return parseInt(likeText);
    }

    const observer = new MutationObserver((mutations) => {
        filterComments();
    });

    function startObserver() {
        const commentSection = document.querySelector('ytd-comments');
        if (commentSection) {
            observer.observe(commentSection, { childList: true, subtree: true });
            filterComments();
        } else {
            setTimeout(startObserver, 1000);
        }
    }

    startObserver();
    insertUIElements();
})();
