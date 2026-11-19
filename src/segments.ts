/**
 * 区間（保存した A-B リピート）の計算。画面・保存先には頼らない。
 */
import { withLabels, type PracticeKitLabels } from './labels'

/** 区間の形（Segment のうち、ここで使うところ） */
export interface SegmentRange {
  startSeconds: number
  endSeconds: number
}

/** A・B がこれ以内のずれなら、同じ区間とみなす（秒） */
export const SAME_RANGE_EPSILON = 0.05

/** 同じ区間か（今の A・B が、保存した区間と同じか） */
export function sameRange(a: SegmentRange, b: { a: number | null; b: number | null } | SegmentRange): boolean {
  const [s, e] = 'startSeconds' in b ? [b.startSeconds, b.endSeconds] : [b.a, b.b]
  if (s == null || e == null) return false
  return Math.abs(a.startSeconds - s) <= SAME_RANGE_EPSILON && Math.abs(a.endSeconds - e) <= SAME_RANGE_EPSILON
}

/** 区間として保存できる A・B か（どちらも数で、B が A より後） */
export function isValidRange(start: number | null, end: number | null): start is number {
  return (
    typeof start === 'number' && typeof end === 'number' &&
    Number.isFinite(start) && Number.isFinite(end) &&
    start >= 0 && end > start
  )
}

/** 0.01 秒にそろえる（保存するときの数をきれいにする） */
export const roundSeconds = (t: number) => Math.round(t * 100) / 100

/**
 * 区間の長さの表示（「5秒」「2.5秒」「1分12秒」）。
 * 文言は labels で変えられる（英語は EN_LABELS →「5s」「1m 12s」）
 */
export function formatLength(seconds: number, labels?: Partial<PracticeKitLabels>): string {
  const t = withLabels(labels)
  const s = Math.max(0, Math.round(seconds * 10) / 10)
  if (s < 60) return t.seconds(Number.isInteger(s) ? String(s) : s.toFixed(1))
  const m = Math.floor(s / 60)
  const rest = Math.round(s - m * 60)
  return rest === 0 ? t.minutes(m) : t.minutesSeconds(m, rest)
}

/** 一覧の並び: 始まりの早い順（同じなら短い順） */
export function sortSegments<T extends SegmentRange>(list: T[]): T[] {
  return [...list].sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds)
}

// ─── フォルダの中の並び ─────────────────────────────────────

/** 並べ替えに使うところ */
export interface Orderable {
  id: string
  folderId?: string
  order?: number
  createdAt: string
}

/** フォルダの中の区間（並び順。order が無いものは付けた順で後ろ）。folderId が null なら「フォルダなし」 */
export function inFolder<T extends Orderable>(list: T[], folderId: string | null): T[] {
  return list
    .filter((g) => (g.folderId ?? null) === folderId)
    .sort(
      (a, b) =>
        (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY) ||
        a.createdAt.localeCompare(b.createdAt),
    )
}

/** フォルダの最後に足すときの並び順 */
export function nextOrderIn(list: Orderable[], folderId: string | null): number {
  const orders = list.filter((g) => (g.folderId ?? null) === folderId && typeof g.order === 'number').map((g) => g.order!)
  return orders.length === 0 ? 0 : Math.max(...orders) + 1
}

/**
 * 区間を、フォルダ（null は「フォルダなし」）の index 番目へ移す。
 * 書き換えるもの（移した先のフォルダの並びを 0, 1, 2 … に振り直したもの）を返す。
 */
export function planMoveSegment<T extends Orderable>(
  list: T[],
  id: string,
  toFolderId: string | null,
  index: number,
): { id: string; folderId: string | null; order: number }[] {
  const moving = list.find((g) => g.id === id)
  if (!moving) return []
  const target = inFolder(list, toFolderId).filter((g) => g.id !== id)
  const at = Math.max(0, Math.min(index, target.length))
  target.splice(at, 0, moving)
  return target
    .map((g, i) => ({ id: g.id, folderId: toFolderId, order: i, changed: g.id === id || g.order !== i }))
    .filter((x) => x.changed)
    .map(({ id: gid, folderId, order }) => ({ id: gid, folderId, order }))
}

/** フォルダの印の色（ダーク・ライトのどちらでも見える色） */
export const FOLDER_COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#f43f5e', '#22c55e', '#0ea5e9', '#f97316', '#a3a3a3'] as const

/** 色の名前（読み上げ用）。知らない色はそのまま返す */
export function folderColorName(color: string, labels?: Partial<PracticeKitLabels>): string {
  return withLabels(labels).colorNames[color] ?? color
}

/** 次に作るフォルダの色（使われていない色から順に） */
export function nextFolderColor(used: (string | undefined)[]): string {
  return FOLDER_COLORS.find((c) => !used.includes(c)) ?? FOLDER_COLORS[used.length % FOLDER_COLORS.length]
}
