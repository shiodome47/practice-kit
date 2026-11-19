import { describe, expect, it } from 'vitest'
import { computeStats, dayKey, maxMergeRecords } from '../core'

describe('記録の数え方', () => {
  const today = new Date(2026, 10, 20, 9)

  it('その端末の日付', () => {
    expect(dayKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
  })

  it('今日の回数・つづけた日数・合計・練習した日', () => {
    const recs = [
      { date: '2026-11-19', reps: 5 },
      { date: '2026-11-18', reps: 3 },
      { date: '2026-11-18', reps: 2 },
      { date: '2026-11-17', reps: 4 },
      { date: '2026-11-15', reps: 5 },
    ]
    // 今日まだでも、昨日までつづいていれば数える
    expect(computeStats(recs, today)).toEqual({ todayReps: 0, streak: 3, totalReps: 19, days: 4 })
    expect(computeStats([...recs, { date: '2026-11-20', reps: 4 }], today)).toMatchObject({ todayReps: 4, streak: 4 })
    expect(computeStats([{ date: '2026-11-17', reps: 3 }], today).streak).toBe(0)
    expect(computeStats([], today)).toEqual({ todayReps: 0, streak: 0, totalReps: 0, days: 0 })
  })

  it('月・年をまたいでも、つづけた日数を数える', () => {
    const recs = ['2025-12-30', '2025-12-31', '2026-01-01'].map((date) => ({ date, reps: 1 }))
    expect(computeStats(recs, new Date(2026, 0, 1, 12)).streak).toBe(3)
  })

  it('同じ日・同じ区間の記録がぶつかったら、多いほうを残す（相手に無いものは足さない）', () => {
    const r = (id: string, reps: number, sets = 0) => ({ id, date: id.slice(0, 10), reps, sets })
    const out = maxMergeRecords(
      [r('2026-11-20|g1', 5, 1), r('2026-11-19|g1', 2), r('2026-11-18|g9', 7)],
      [r('2026-11-20|g1', 3, 2), r('2026-11-19|g1', 4)],
      'NOW',
    )
    expect(out).toEqual([{ id: '2026-11-20|g1', date: '2026-11-20', reps: 5, sets: 2, updatedAt: 'NOW' }])
  })
})
