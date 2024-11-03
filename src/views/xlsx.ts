import { IUniverInstanceService, type IWorkbookData, type Nullable, type Univer, UniverInstanceType, type Workbook, generateRandomId } from '@univerjs/core'
import type { TFile, WorkspaceLeaf } from 'obsidian'
import { TextFileView } from 'obsidian'
import { FUniver } from '@univerjs/facade'
import type { UniverPluginSettings } from '@/types/setting'
import { sheetInit } from '@/univer/sheets'
import { fillDefaultSheetBlock, transformWorkbookDataToSnapshotJson } from '@/utils/snapshot'
import { transformToExcelBuffer } from '@/utils/file'

export const Type = 'univer-xlsx'
export class XlsxTypeView extends TextFileView {
  rootContainer: HTMLDivElement
  univer: Univer
  workbook: Workbook
  workbookData: Nullable<IWorkbookData>
  FUniver: any
  settings: UniverPluginSettings
  legacyFile: TFile
  private isFileDeleted: boolean = false
  private univerInstanceService: IUniverInstanceService

  constructor(leaf: WorkspaceLeaf, settings: UniverPluginSettings) {
    super(leaf)
    this.settings = settings

    this.app.vault.on('delete', (file: TFile) => {
      if (file === this.file)
        this.isFileDeleted = true
    })
  }

  getViewData(): string {
    const workbook = this.univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!
    this.saveToExcel(this.legacyFile, workbook)
    return ''
  }

  async setViewData(_data: string, _clear: boolean) {
    if (!this.settings.isSupportXlsx) {
      const btn = this.contentEl.createEl(
        'button',
        {
          text: 'Enable xlsx file type',
          cls: 'excel-enable-btn',
        },
      )
      btn.onclick = () => {
        this.settings.isSupportXlsx = true
        this.setUniverView()
        btn.remove()
      }
    }

    this.setUniverView()
  }

  getViewType() {
    return Type
  }

  clear(): void {}

  async onOpen() {
  }

  domInit() {
    this.contentEl.empty()
    this.rootContainer = this.contentEl.createDiv()
    this.rootContainer.id = 'Xlsx-app'
    this.rootContainer.classList.add('uproduct-container')
  }

  async onClose() {
    const workbook = this.univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!
    if (!this.isFileDeleted)
      await this.saveToExcel(this.file!, workbook)

    this.univer?.dispose()
    this.contentEl.empty()
  }

  async saveToExcel(file: TFile, workbook: Workbook) {
    if (!file || !workbook)
      return
    const saveWorkbookData = this.FUniver.getUniverSheet(workbook.getUnitId())?.getSnapshot()
    if (!saveWorkbookData) {
      return
    }
    const snapshotJSON = await transformWorkbookDataToSnapshotJson(saveWorkbookData)
    const snapshot = JSON.stringify(snapshotJSON)
    // @ts-expect-error
    const excelRaw = await window.univerProExchangeExport(snapshot)
    const excelBuffer = await transformToExcelBuffer(excelRaw)
    await this.app.vault.modifyBinary(file, excelBuffer)
  }

  async setUniverView() {
    this.domInit()

    if (!this.file)
      return

    this.legacyFile = this.file

    const options = {
      container: this.rootContainer,
      header: true,
      footer: true,
    }
    this.univer = sheetInit(options, this.settings)

    const univerApi = FUniver.newAPI(this.univer)
    this.FUniver = FUniver.newAPI(this.univer)
    this.univerInstanceService = this.univer.__getInjector().get(IUniverInstanceService)

    const raw = await this.app.vault.readBinary(this.legacyFile)
    if (raw.byteLength !== 0) {
      this.workbookData = this.FUniver.importXLSXToSnapshot(raw)
      // @ts-expect-error
      // const transformData = await window.univerProExchangeImport(raw)
      // const jsonData = JSON.parse(transformData)
      // this.workbookData = transformSnapshotJsonToWorkbookData(jsonData.snapshot, jsonData.sheetBlocks)
    }

    const workbookData = this.workbookData || { id: generateRandomId(6) } as IWorkbookData
    const filledWorkbookData = fillDefaultSheetBlock(workbookData)
    this.univer.createUnit(UniverInstanceType.UNIVER_SHEET, filledWorkbookData)
  }
}
