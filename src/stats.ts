/**
 * 練習の記録の数え方（計算だけ。保存先は使う側）。
 * 記録は「1 日・1 区間につき 1 件」で、くり返した回数（reps）とやりきった回数（sets）を足していく。
 */

/** 記録（使う側の記録の形のうち、ここで使うところ） */
export interface PracticeRecordLike {
  id: string
  date: string
  reps: number
  sets?: number
  updatedAt?: string
}

/** その端末の日付（YYYY-MM-DD） */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface PracticeStats {
  /** 今日くり返した回数 */
  todayReps: number
  /** つづけて練習した日数（今日か昨日までつづいていれば数える） */
  streak: number
  /** これまでにくり返した回数 */
  totalReps: number
  /** 練習した日の数 */
  days: number
}

/** 記録から、今日の回数・つづけた日数などを出す */
export function computeStats(records: Pick<PracticeRecordLike, 'date' | 'reps'>[], today: Date = new Date()): PracticeStats {
  const byDay = new Map<string, number>()
  for (const r of records) byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.reps)
  const practiced = (d: Date) => (byDay.get(dayKey(d)) ?? 0) > 0
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // 今日まだ練習していなくても、昨日までつづいていれば、つづいている日数として出す
  if (!practiced(day)) day.setDate(day.getDate() - 1)
  let streak = 0
  while (practiced(day)) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return {
    todayReps: byDay.get(dayKey(today)) ?? 0,
    streak,
    totalReps: [...byDay.values()].reduce((a, b) => a + b, 0),
    days: [...byDay.values()].filter((n) => n > 0).length,
  }
}

/**
 * 同じ日・同じ区間の記録がぶつかったとき（同期・追記）: 回数は増えるだけなので、多いほうを残す。
 * 書き直すもの（ours より theirs が多いもの）を返す。相手に無い記録は足さない（初期化を伝えるため）。
 */
export function maxMergeRecords<T extends PracticeRecordLike>(ours: T[], theirs: T[], now = new Date().toISOString()): T[] {
  const byId = new Map(theirs.map((r) => [r.id, r]))
  const out: T[] = []
  for (const mine of ours) {
    const other = byId.get(mine.id)
    if (!other) continue
    const reps = Math.max(mine.reps, other.reps)
    const sets = Math.max(mine.sets ?? 0, other.sets ?? 0)
    if (reps !== other.reps || sets !== (other.sets ?? 0)) out.push({ ...other, reps, sets, updatedAt: now })
  }
  return out
}
