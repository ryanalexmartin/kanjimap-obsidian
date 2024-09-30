import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ZhuyinHighlighter } from './ZhuyinHighlighter';
import { CharacterData } from './CharacterData';

// Declare module
declare module 'obsidian' {
    interface App {}
    interface Plugin {}
    interface PluginSettingTab {}
    interface Setting {}
}

export interface ZhuyinHighlighterSettings {
    enabled: boolean;
    orientation: 'vertical-right' | 'horizontal-above' | 'horizontal-below';
}

const DEFAULT_SETTINGS: ZhuyinHighlighterSettings = {
    enabled: true,
    orientation: 'horizontal-above'
}

export default class ZhuyinHighlighterPlugin extends Plugin {
    settings: ZhuyinHighlighterSettings;
    highlighter: ZhuyinHighlighter;
    characterData: CharacterData;

    async onload() {
        await this.loadSettings();
        this.characterData = new CharacterData(this);
        this.highlighter = new ZhuyinHighlighter(this.app, this.settings, this.characterData);

        this.addSettingTab(new ZhuyinHighlighterSettingTab(this.app, this));

        this.registerMarkdownPostProcessor((el, ctx) => {
            if (this.settings.enabled) {
                this.highlighter.processElement(el);
            }
        });

        this.addCommand({
            id: 'toggle-zhuyin-highlighter',
            name: 'Toggle Zhuyin Highlighter',
            callback: () => {
                this.settings.enabled = !this.settings.enabled;
                this.saveSettings();
                this.highlighter.updateSettings(this.settings);
            }
        });
    }

    onunload() {
        // Clean up if necessary
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ZhuyinHighlighterSettingTab extends PluginSettingTab {
    plugin: ZhuyinHighlighterPlugin;

    constructor(app: App, plugin: ZhuyinHighlighterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Zhuyin Highlighter Settings'});

        new Setting(containerEl)
            .setName('Enable Zhuyin Highlighter')
            .setDesc('Turn on/off Zhuyin highlighting')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.enabled = value;
                    await this.plugin.saveSettings();
                    this.plugin.highlighter.updateSettings(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName('Ruby Orientation')
            .setDesc('Choose the orientation of the Zhuyin ruby text')
            .addDropdown(dropdown => dropdown
                .addOption('vertical-right', 'Vertical Right')
                .addOption('horizontal-above', 'Horizontal Above')
                .addOption('horizontal-below', 'Horizontal Below')
                .setValue(this.plugin.settings.orientation)
                .onChange(async (value: string) => {
                    this.plugin.settings.orientation = value as ZhuyinHighlighterSettings['orientation'];
                    await this.plugin.saveSettings();
                    this.plugin.highlighter.updateSettings(this.plugin.settings);
                }));
    }
}