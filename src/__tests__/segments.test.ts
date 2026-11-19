import { describe, expect, it } from 'vitest'
import {
  EN_LABELS,
  FOLDER_COLORS,
  folderColorName,
  formatLength,
  inFolder,
  isValidRange,
  nextFolderColor,
  nextOrderIn,
  planMoveSegment,
  roundSeconds,
  sameRange,
  sortSegments,
} from '../core'

describe('区間の計算', () => {
  it('A・B がほぼ同じ（0.05 秒以内）なら同じ区間', () => {
    const g = { startSeconds: 3, endSeconds: 8 }
    expect(sameRange(g, { a: 3.02, b: 7.99 })).toBe(true)
    expect(sameRange(g, { a: 3.2, b: 8 })).toBe(false)
    expect(sameRange(g, { a: 3, b: null })).toBe(false)
    expect(sameRange(g, { startSeconds: 3.04, endSeconds: 8 })).toBe(true)
  })

  it('B が A より後のときだけ保存できる', () => {
    expect(isValidRange(1, 2)).toBe(true)
    expect(isValidRange(0, 0.1)).toBe(true)
    expect(isValidRange(2, 2)).toBe(false)
    expect(isValidRange(-1, 2)).toBe(false)
    expect(isValidRange(null, 2)).toBe(false)
    expect(isValidRange(1, Number.NaN)).toBe(false)
    expect(isValidRange(1, Number.POSITIVE_INFINITY)).toBe(false)
  })

  it('0.01 秒にそろえる・始まりの早い順に並べる', () => {
    expect(roundSeconds(3.456)).toBe(3.46)
    expect(sortSegments([{ startSeconds: 5, endSeconds: 9 }, { startSeconds: 1, endSeconds: 6 }, { startSeconds: 1, endSeconds: 4 }])).toEqual([
      { startSeconds: 1, endSeconds: 4 },
      { startSeconds: 1, endSeconds: 6 },
      { startSeconds: 5, endSeconds: 9 },
    ])
  })
})

describe('長さの表示（文言を差し替えられる）', () => {
  it('日本語（既定）', () => {
    expect(formatLength(5)).toBe('5秒')
    expect(formatLength(2.5)).toBe('2.5秒')
    expect(formatLength(60)).toBe('1分')
    expect(formatLength(72)).toBe('1分12秒')
    expect(formatLength(-3)).toBe('0秒')
  })
  it('英語（EN_LABELS）と、一部だけの差し替え', () => {
    expect(formatLength(5, EN_LABELS)).toBe('5s')
    expect(formatLength(72, EN_LABELS)).toBe('1m 12s')
    expect(formatLength(72, { minutesSeconds: (m, s) => `${m}:${String(s).padStart(2, '0')}` })).toBe('1:12')
    expect(formatLength(5, { minutesSeconds: () => 'x' })).toBe('5秒')
  })
})

describe('フォルダの中の並び', () => {
  const t = (n: number) => `2026-01-0${n}T00:00:00.000Z`
  const list = [
    { id: 'a', folderId: 'F', order: 1, createdAt: t(1) },
    { id: 'b', folderId: 'F', order: 0, createdAt: t(2) },
    { id: 'c', folderId: 'F', createdAt: t(3) },
    { id: 'd', createdAt: t(4) },
  ]

  it('並び順（order が無いものは付けた順で後ろ）。null は「フォルダなし」', () => {
    expect(inFolder(list, 'F').map((g) => g.id)).toEqual(['b', 'a', 'c'])
    expect(inFolder(list, null).map((g) => g.id)).toEqual(['d'])
  })

  it('最後に足すときの並び順', () => {
    expect(nextOrderIn(list, 'F')).toBe(2)
    expect(nextOrderIn(list, null)).toBe(0)
  })

  it('ドラッグで移すと、移した先の並びを 0, 1, 2 … に振り直す（変わったものだけ返す）', () => {
    expect(planMoveSegment(list, 'd', 'F', 1)).toEqual([
      { id: 'd', folderId: 'F', order: 1 },
      { id: 'a', folderId: 'F', order: 2 },
      { id: 'c', folderId: 'F', order: 3 },
    ])
    expect(planMoveSegment(list, 'c', 'F', 0)).toEqual([
      { id: 'c', folderId: 'F', order: 0 },
      { id: 'b', folderId: 'F', order: 1 },
      { id: 'a', folderId: 'F', order: 2 },
    ])
    expect(planMoveSegment(list, 'zzz', 'F', 0)).toEqual([])
  })
})

describe('フォルダの色', () => {
  it('使われていない色から順に。全部使ったら回る', () => {
    expect(nextFolderColor([])).toBe(FOLDER_COLORS[0])
    expect(nextFolderColor([FOLDER_COLORS[0], undefined])).toBe(FOLDER_COLORS[1])
    expect(nextFolderColor([...FOLDER_COLORS])).toBe(FOLDER_COLORS[0])
  })
  it('色の名前（読み上げ用）。英語もある', () => {
    expect(folderColorName('#14b8a6')).toBe('青緑')
    expect(folderColorName('#14b8a6', EN_LABELS)).toBe('teal')
    expect(folderColorName('#123456')).toBe('#123456')
    for (const c of FOLDER_COLORS) expect(folderColorName(c, EN_LABELS)).not.toBe(c)
  })
})
