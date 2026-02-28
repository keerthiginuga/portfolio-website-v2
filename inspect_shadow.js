const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/Users/dhathruthvbaddam/Downloads/keerthi website/portfolio-v2/index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const copyBlock = document.querySelector('.v2-sonix-copy');
const faceBlock = document.querySelector('.v2-sonix-face');

console.log('Copy Block Classes:', copyBlock ? copyBlock.className : 'null');
console.log('Face Block Classes:', faceBlock ? faceBlock.className : 'null');
