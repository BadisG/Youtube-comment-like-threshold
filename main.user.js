// ==UserScript==
// @name YouTube Comment Filter (With Adjustable Threshold)
// @namespace http://tampermonkey.net/
// @version 0.6
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
        margin-left: 5px;
        vertical-align: middle;
        white-space: nowrap;
        position: absolute;
        left: calc(10vw + 60px); // Adjust this value as needed
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #888888;
        padding: 5px;
        border-radius: 5px;
    `;

        const labelText = document.createElement('span');
        labelText.textContent = 'Min Likes:';
        labelText.style.cssText = `
            margin-right: 5px;
            color: white;
            white-space: nowrap;
            opacity: 1;
        `;

        const inputBox = document.createElement('input');
        inputBox.type = 'number';
        inputBox.min = '0';
        inputBox.value = loadMinLikes();
        inputBox.style.cssText = `
            width: 30px;
            background-color: rgba(85, 85, 85, 0.5);
            color: white;
            border: 1px solid #888888;
            padding: 2px 5px;
            flex-shrink: 0;
        `;

        uiContainer.appendChild(labelText);
        uiContainer.appendChild(inputBox);

        logoContainer.parentNode.insertBefore(uiContainer, logoContainer.nextSibling);

        // Event listener
        inputBox.addEventListener('input', applyNewValue);
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
