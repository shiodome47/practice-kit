/**
 * 部品が作る文字（長さの表示・色の名前）。既定は日本語（JA_LABELS）。
 * `formatLength(s, labels)`・`folderColorName(c, labels)` に、変えたいものだけ渡せば差し替えられる。英語は EN_LABELS。
 */
export interface PracticeKitLabels {
  /** 1 分より短い長さ。s は「5」「2.5」のような文字 */
  seconds: (s: string) => string
  /** ちょうど m 分 */
  minutes: (m: number) => string
  /** m 分 s 秒 */
  minutesSeconds: (m: number, s: number) => string
  /** フォルダの色の名前（読み上げ用）。色（#14b8a6 など）→ 名前 */
  colorNames: Record<string, string>
}

/** フォルダの色の名前（読み上げ用。日本語） */
export const FOLDER_COLOR_NAMES: Record<string, string> = {
  '#14b8a6': '青緑',
  '#3b82f6': '青',
  '#f59e0b': '黄',
  '#f43f5e': '赤',
  '#22c55e': '緑',
  '#0ea5e9': '水色',
  '#f97316': 'だいだい',
  '#a3a3a3': '灰色',
}

/** 日本語（既定） */
export const JA_LABELS: PracticeKitLabels = {
  seconds: (s) => `${s}秒`,
  minutes: (m) => `${m}分`,
  minutesSeconds: (m, s) => `${m}分${s}秒`,
  colorNames: FOLDER_COLOR_NAMES,
}

/** 英語（使うときは `formatLength(s, EN_LABELS)`） */
export const EN_LABELS: PracticeKitLabels = {
  seconds: (s) => `${s}s`,
  minutes: (m) => `${m}m`,
  minutesSeconds: (m, s) => `${m}m ${s}s`,
  colorNames: {
    '#14b8a6': 'teal',
    '#3b82f6': 'blue',
    '#f59e0b': 'yellow',
    '#f43f5e': 'red',
    '#22c55e': 'green',
    '#0ea5e9': 'sky blue',
    '#f97316': 'orange',
    '#a3a3a3': 'gray',
  },
}

/** 渡された文言を、日本語の既定に重ねる */
export function withLabels(labels?: Partial<PracticeKitLabels>): PracticeKitLabels {
  return labels ? { ...JA_LABELS, ...labels } : JA_LABELS
}
