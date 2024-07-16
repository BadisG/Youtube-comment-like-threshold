// ==UserScript==
// @name YouTube Comment Filter (With Adjustable Threshold)
// @namespace http://tampermonkey.net/
// @version 0.7
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

        uiContainer.appendChild(labelText);
        uiContainer.appendChild(inputBox);
        logoContainer.parentNode.insertBefore(uiContainer, logoContainer.nextSibling);

        // Event listener
        inputBox.addEventListener('input', applyNewValue);

        // Apply theme-specific styles
        applyThemeStyles(uiContainer, labelText, inputBox);

        // Add a listener for theme changes
        const observer = new MutationObserver(() => {
            applyThemeStyles(uiContainer, labelText, inputBox);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
    }

    function applyThemeStyles(container, label, input) {
        if (isLightTheme()) {
            container.style.background = 'linear-gradient(to bottom right, #ffffff, #f0f0f0)';
            container.style.border = '1px solid rgba(0, 0, 0, 0.4)';
            label.style.color = '#0f0f0f';
            input.style.backgroundColor = 'white';
            input.style.color = '#0f0f0f';
            input.style.border = '1px solid rgba(0, 0, 0, 0.6)';
        } else {
            // Dark mode changes
            container.style.background = 'linear-gradient(to bottom right, black, #262626)';
            container.style.border = '1px solid rgba(255, 255, 255, 0.4)';
            label.style.color = 'white';
            input.style.backgroundColor = 'rgba(50, 50, 50, 0.7)'; // Changed to lighter gray
            input.style.color = 'white';
            input.style.border = '1px solid rgba(255, 255, 255, 0.6)'; // Thicker, white border
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
