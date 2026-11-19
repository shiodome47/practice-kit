import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPracticeSession, currentSegmentId, practiceSession, usePracticeSession } from '../index'

describe('練習の進み方（ストア）', () => {
  it('始める → 決めた回数で次へ → 最後のあとは「おわり」', () => {
    const store = createPracticeSession()
    const s = () => store.getState()
    s().start('F', ['g1', 'g2'])
    expect(s()).toMatchObject({ status: 'running', folderId: 'F', index: 0, done: 0, openTick: 1 })
    expect(currentSegmentId(s())).toBe('g1')

    expect(s().countRep(2)).toBe(false)
    expect(s().countRep(2)).toBe(true)
    s().next()
    expect(s()).toMatchObject({ index: 1, done: 0, openTick: 2, totalReps: 2 })
    s().countRep(1)
    s().next()
    expect(s()).toMatchObject({ status: 'finished', totalReps: 3 })
    expect(currentSegmentId(s())).toBe('g2')
  })

  it('前へ・とぶ。今の区間へとぶと、回数はそのままで開き直す', () => {
    const store = createPracticeSession()
    const s = () => store.getState()
    s().start('F', ['g1', 'g2', 'g3'], 1)
    s().countRep(5)
    s().jump(1)
    expect(s()).toMatchObject({ index: 1, done: 1, openTick: 2 })
    s().jump(2)
    expect(s()).toMatchObject({ index: 2, done: 0 })
    s().prev()
    expect(s().index).toBe(1)
    s().jump(9)
    expect(s().index).toBe(1)
  })

  it('空の並びでは始めない。やめると最初に戻る（openTick は戻さない）', () => {
    const store = createPracticeSession()
    const s = () => store.getState()
    s().start('F', [])
    expect(s().status).toBe('idle')
    s().start('F', ['g1'], 99)
    expect(s().index).toBe(0)
    s().stop()
    expect(s()).toMatchObject({ status: 'idle', folderId: null, queue: [], openTick: 1 })
    expect(currentSegmentId(s())).toBeNull()
    s().jump(0)
    expect(s().status).toBe('idle')
  })

  it('変わったら、今と変わる前を知らせる。やめたら知らせない', () => {
    const store = createPracticeSession()
    const listener = vi.fn()
    const off = store.subscribe(listener)
    store.getState().start('F', ['g1'])
    expect(listener).toHaveBeenCalledTimes(1)
    const [now, prev] = listener.mock.calls[0]
    expect(prev.status).toBe('idle')
    expect(now.status).toBe('running')
    off()
    store.getState().stop()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('usePracticeSession（React）', () => {
  beforeEach(() => practiceSession.getState().stop())

  it('一部だけ読める。変わると描き直す。getState・subscribe も使える', () => {
    const { result } = renderHook(() => usePracticeSession((s) => s.index))
    const all = renderHook(() => usePracticeSession())
    expect(result.current).toBe(0)
    act(() => usePracticeSession.getState().start('F', ['g1', 'g2']))
    act(() => usePracticeSession.getState().next())
    expect(result.current).toBe(1)
    expect(all.result.current.status).toBe('running')
    expect(usePracticeSession.getState()).toBe(practiceSession.getState())
    expect(usePracticeSession.subscribe).toBe(practiceSession.subscribe)
  })
})
