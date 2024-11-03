import type { IWorkbookData } from '@univerjs/core'

export function fillDefaultSheetBlock(workbookData: IWorkbookData): IWorkbookData {
  const sheets = workbookData.sheets

  if (sheets) {
    Object.keys(sheets).forEach((sheetId) => {
      const sheet = sheets[sheetId]
      if (sheet.columnCount)
        sheet.columnCount = Math.max(36, sheet.columnCount)

      if (sheet.rowCount)
        sheet.rowCount = Math.max(99, sheet.rowCount)
    })
  }
  return workbookData
}
