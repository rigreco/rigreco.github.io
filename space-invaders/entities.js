// entities.js

// Player
export function createPlayer(x, y) {
    return {
        x: x,
        y: y,
        el: createElement(x, y, '🚀')
    };
}

// Invader
export function createInvader(x, y, type, points) {
    return {
        x: x,
        y: y,
        type: type,
        points: points,
        el: createElement(x, y, type, 'alien sprite')
    };
}

// Bullet
export function createBullet(x, y, isAlien = false) {
    const el = createElement(x, y, '|', isAlien ? 'alien-bullet sprite' : 'bullet sprite');
    return { x, y, el };
}

// UFO
export function createUFO(x, y) {
    return {
        x: x,
        y: y,
        el: createElement(x, y, '🛸', 'sprite'),
        active: false
    };
}

// Barrier
export function createBarrier(x, y) {
    return createElement(x, y, '▇', 'barrier');
}

// Helper function to create elements (copied from the original file)
function createElement(x, y, content, className = 'sprite') {
    const el = document.createElement('div');
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = content;
    return el;
}