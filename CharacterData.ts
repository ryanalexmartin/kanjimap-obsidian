import { Plugin } from 'obsidian';

export class CharacterData {
    private plugin: Plugin;
    private zhuyinData: Map<string, string> = new Map();
    private learnedCharacters: Set<string> = new Set();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.loadZhuyinData();
        this.loadLearnedCharacters();
    }

    async loadZhuyinData() {
        try {
            const response = await fetch(this.plugin.app.vault.adapter.getResourcePath('characters.json'));
            const data = await response.json();
            data.forEach((entry: any) => {
                if (entry.meanings && entry.meanings.length > 0) {
                    this.zhuyinData.set(entry.word, entry.meanings[0].bopomofo);
                }
            });
            console.log('Zhuyin data loaded successfully');
        } catch (error) {
            console.error('Failed to load Zhuyin data:', error);
        }
    }

    async loadLearnedCharacters() {
        const learned = await this.plugin.loadData();
        if (learned && learned['learned-characters']) {
            this.learnedCharacters = new Set(learned['learned-characters']);
        }
    }

    async saveLearnedCharacters() {
        await this.plugin.saveData({
            key: 'learned-characters',
            value: Array.from(this.learnedCharacters)
        });
    }

    isLearned(character: string): boolean {
        return this.learnedCharacters.has(character);
    }

    getZhuyin(character: string): string {
        return this.zhuyinData.get(character) || '';
    }

    async toggleLearned(character: string) {
        if (this.learnedCharacters.has(character)) {
            this.learnedCharacters.delete(character);
        } else {
            this.learnedCharacters.add(character);
        }
        await this.saveLearnedCharacters();
    }
}
