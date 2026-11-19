/**
 * 練習（フォルダの区間を、上から順に、決めた回数ずつくり返す）の進み具合。React に頼らない小さなストア。
 * React の画面で使うときは `usePracticeSession`（react.ts）。
 *
 * - start: 練習を始める（区間の並びを決め、最初の区間を開く合図を出す）
 * - 区間を開くのは使う側（画面を移れるところ）。openTick が増えたら、今の区間を開く
 * - countRep: 今の区間を 1 回くり返した。決めた回数に届いたら true（届いたら next）
 * - next / prev / jump: 区間を移る。最後の区間のあとは「おわり」
 * 端末の中だけ（保存しない）。記録は stats.ts（数え方）と、使う側の保存先。
 */
export type SessionStatus = 'idle' | 'running' | 'finished'

/** 練習の進み具合（読むだけ。変えるときは actions を使う） */
export interface SessionData {
  status: SessionStatus
  /** 練習しているフォルダ */
  folderId: string | null
  /** 練習する区間（並び順） */
  queue: string[]
  /** 今の区間（queue の何番目か） */
  index: number
  /** 今の区間をくり返した回数 */
  done: number
  /** この練習でくり返した回数（おわりに出す） */
  totalReps: number
  /** 区間を開く合図（増えたら、今の区間を開く） */
  openTick: number
}

export interface SessionActions {
  start: (folderId: string, queue: string[], index?: number) => void
  jump: (index: number) => void
  next: () => void
  prev: () => void
  /** 今の区間を 1 回くり返した。決めた回数（target）に届いたら true */
  countRep: (target: number) => boolean
  stop: () => void
}

/** getState() で返るもの（進み具合と、変えるための関数） */
export type SessionState = SessionData & SessionActions

export interface PracticeSessionStore {
  /** 今の進み具合 */
  getState: () => SessionState
  /** 変わったら呼ばれる（今と、変わる前）。やめるときは返り値の関数を呼ぶ */
  subscribe: (listener: (state: SessionState, prev: SessionState) => void) => () => void
}

const INITIAL: SessionData = { status: 'idle', folderId: null, queue: [], index: 0, done: 0, totalReps: 0, openTick: 0 }

/** 練習の進み具合のストアを作る（ふつうは、作ってある practiceSession を使う） */
export function createPracticeSession(): PracticeSessionStore {
  const listeners = new Set<(s: SessionState, prev: SessionState) => void>()
  let state: SessionState

  const set = (patch: Partial<SessionData> | ((s: SessionState) => Partial<SessionData>)) => {
    const prev = state
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
    for (const l of listeners) l(state, prev)
  }
  const get = () => state

  const actions: SessionActions = {
    start: (folderId, queue, index = 0) => {
      if (queue.length === 0) return
      set((s) => ({
        status: 'running',
        folderId,
        queue,
        index: Math.max(0, Math.min(index, queue.length - 1)),
        done: 0,
        totalReps: 0,
        openTick: s.openTick + 1,
      }))
    },

    jump: (index) => {
      const { queue, status } = get()
      if (status === 'idle' || index < 0 || index >= queue.length) return
      // 今の区間をもう一度開くときは、くり返した回数はそのまま
      if (status === 'running' && index === get().index) set((s) => ({ openTick: s.openTick + 1 }))
      else set((s) => ({ status: 'running', index, done: 0, openTick: s.openTick + 1 }))
    },

    next: () => {
      const { index, queue } = get()
      if (index + 1 >= queue.length) set({ status: 'finished' })
      else set((s) => ({ index: s.index + 1, done: 0, openTick: s.openTick + 1 }))
    },

    prev: () => {
      const { index } = get()
      if (index > 0) set((s) => ({ status: 'running', index: s.index - 1, done: 0, openTick: s.openTick + 1 }))
    },

    countRep: (target) => {
      const done = get().done + 1
      set((s) => ({ done, totalReps: s.totalReps + 1 }))
      return done >= target
    },

    // openTick は戻さない（次に始めたときも「増えた」と分かるように）
    stop: () => set({ status: 'idle', folderId: null, queue: [], index: 0, done: 0, totalReps: 0 }),
  }

  state = { ...INITIAL, ...actions }
  return {
    getState: get,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** 今の区間の ID（練習していなければ null） */
export const currentSegmentId = (s: Pick<SessionData, 'status' | 'queue' | 'index'>) =>
  s.status === 'idle' ? null : (s.queue[s.index] ?? null)
