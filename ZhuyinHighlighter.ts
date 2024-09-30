import { App } from 'obsidian';
import { ZhuyinHighlighterSettings } from './ZhuyinHighlighterPlugin';
import { CharacterData } from './CharacterData';

export class ZhuyinHighlighter {
    private app: App;
    private settings: ZhuyinHighlighterSettings;
    private characterData: CharacterData;

    constructor(app: App, settings: ZhuyinHighlighterSettings, characterData: CharacterData) {
        this.app = app;
        this.settings = settings;
        this.characterData = characterData;
        this.injectStyles();
    }

    updateSettings(settings: ZhuyinHighlighterSettings) {
        this.settings = settings;
        // Trigger a refresh of the current view
        this.app.workspace.trigger('layout-change');
    }

    processElement(el: HTMLElement) {
        this.highlightKanji(el);
    }

    private highlightKanji(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const kanjiRegex = /[\u4e00-\u9faf]/g;
            let match;
            let lastIndex = 0;
            const fragments: (Text | HTMLElement)[] = [];

            if (!text) {
                return;
            }

            while ((match = kanjiRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                if (match[0]) {
                    const kanji = match[0];
                    if (!this.characterData.isLearned(kanji)) {
                        const span = document.createElement('span');
                        span.className = `kanji-highlight ${this.settings.orientation}`;
                        const ruby = document.createElement('ruby');
                        const rb = document.createElement('rb');
                        rb.textContent = kanji;
                        ruby.appendChild(rb);
                        const rt = document.createElement('rt');
                        rt.textContent = this.characterData.getZhuyin(kanji);
                        ruby.appendChild(rt);
                        span.appendChild(ruby);
                        fragments.push(span);
                    } else {
                        fragments.push(document.createTextNode(kanji));
                    }
                }
                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < text.length) {
                fragments.push(document.createTextNode(text.slice(lastIndex)));
            }

            if (fragments.length > 1) {
                const parent = node.parentNode;
                const container = document.createElement('span');
                fragments.forEach(fragment => container.appendChild(fragment));
                if (node.parentNode) {
                    node.parentNode.replaceChild(container, node);
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE', 'TEXTAREA', 'RUBY', 'RT', 'RB'].includes(node.nodeName)) {
            Array.from(node.childNodes).forEach(child => this.highlightKanji(child));
        }
    }

    private injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .kanji-highlight {
                display: inline-block;
                vertical-align: baseline;
                line-height: normal;
                position: relative;
            }
            .kanji-highlight ruby {
                display: inline-flex;
                vertical-align: baseline;
                line-height: 1;
            }
            .kanji-highlight rb {
                display: inline-block;
                font-size: 1em;
                line-height: inherit;
            }
            .kanji-highlight rt {
                display: inline-block;
                font-size: 0.3em;
                line-height: normal;
                text-align: start;
                color: inherit;
                font-weight: normal;
            }
            .kanji-highlight.vertical-right {
                margin-right: 0.4em;
            }
            .kanji-highlight.vertical-right rt {
                display: flex;
                justify-content: center;
                align-items: center;
                writing-mode: vertical-rl;
                text-orientation: upright;
                position: absolute;
                top: 0;
                right: -1.2em;
                height: 100%;
            }
            .kanji-highlight.horizontal-above rt {
                position: absolute;
                top: -0.6em;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
            }
            .kanji-highlight.horizontal-below rt {
                position: absolute;
                bottom: -0.9em;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    }
}