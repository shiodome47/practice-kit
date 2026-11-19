import { useSyncExternalStore } from 'react'
import { createPracticeSession, type PracticeSessionStore, type SessionState } from './session'

/** アプリに 1 つの、練習の進み具合 */
export const practiceSession: PracticeSessionStore = createPracticeSession()

export interface UsePracticeSession extends PracticeSessionStore {
  /** 進み具合ぜんぶ（変わるたびに描き直す） */
  (): SessionState
  /** 一部だけ読む（その値が変わったときだけ描き直す）。selector は、新しい配列・オブジェクトを作らないものにする */
  <T>(selector: (s: SessionState) => T): T
}

/**
 * 練習の進み具合（React の画面で使う）。
 *
 * ```tsx
 * const index = usePracticeSession((s) => s.index)
 * usePracticeSession.getState().next() // 画面の外でも使える
 * ```
 */
export const usePracticeSession = Object.assign(
  <T>(selector?: (s: SessionState) => T) => {
    const read = () => (selector ? selector(practiceSession.getState()) : practiceSession.getState())
    return useSyncExternalStore((cb) => practiceSession.subscribe(cb), read, read)
  },
  { getState: practiceSession.getState, subscribe: practiceSession.subscribe },
) as UsePracticeSession
