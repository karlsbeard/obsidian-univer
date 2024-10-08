import './style/univer.css'
import { defu } from 'defu'
import { Plugin, addIcon } from 'obsidian'
import { Type as USheetType, USheetView } from './views/usheet'
import { Type as XlsxType, XlsxTypeView } from './views/xlsx'
import { Type as UDocType, UDocView } from './views/udoc'
import { ChooseTypeModal } from './modals/chooseType'
import { SettingTab } from './modals/settingTab'
import { univerIconSvg } from './utils/common'
import { injectWasm } from './utils/wasm'
import type { UniverPluginSettings } from '@/types/setting'
import { createNewFile } from '@/utils/file'

export type ViewType = typeof USheetType | typeof UDocType
export default class UniverPlugin extends Plugin {
  settings: UniverPluginSettings
  async onload() {
    await this.loadSettings()
    await injectWasm()

    addIcon('univer', univerIconSvg)

    // ribbon icon & the class
    this.addRibbonIcon('univer', 'Univer', () => {
      const modal = new ChooseTypeModal(this.app, this.settings)
      modal.open()
    })

    this.addCommand({
      id: 'univer-sheet',
      name: 'Create Univer Sheet',
      callback: () => {
        createNewFile(this.app, 'usheet')
      },
    })

    this.addCommand({
      id: 'univer-doc',
      name: 'Create Univer Doc',
      callback: () => {
        createNewFile(this.app, 'udoc')
      },
    })

    this.addCommand({
      id: 'univer-xlsx',
      name: 'Create Univer Xlsx',
      callback: () => {
        createNewFile(this.app, 'xlsx')
      },
    })

    // add the setting tab
    this.addSettingTab(new SettingTab(this.app, this))
    // register view
    this.registerView(USheetType, leaf => new USheetView(leaf, this.settings))
    this.registerExtensions(['usheet'], USheetType)

    this.registerView(UDocType, leaf => new UDocView(leaf, this.settings))
    this.registerExtensions(['udoc'], UDocType)

    this.registerView(XlsxType, leaf => new XlsxTypeView(leaf, this.settings))
    this.registerExtensions(['xlsx', 'xls', 'xlsm'], XlsxType)
  }

  async loadSettings() {
    const loadedSettings = await this.loadData()
    this.settings = defu(loadedSettings, {
      language: 'EN',
      isSupportXlsx: true,
    })
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async onunload() {}
}
