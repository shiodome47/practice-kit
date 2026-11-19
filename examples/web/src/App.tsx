import { useEffect, useMemo, useRef, useState } from 'react'
import {
  computeStats,
  currentSegmentId,
  dayKey,
  EN_LABELS,
  folderColorName,
  formatLength,
  inFolder,
  usePracticeSession,
  type PracticeKitLabels,
} from '@shiodome47/practice-kit'

/** 見本の動画（MDN が配っている、著作権のない CC0 の動画。約 5 秒） */
const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

/** 見本の区間（アプリでは、使う側が保存したもの） */
const SEGMENTS = [
  { id: 'g1', label: 'A', folderId: 'F', order: 0, createdAt: '2026-01-01', startSeconds: 0, endSeconds: 1.5 },
  { id: 'g2', label: 'B', folderId: 'F', order: 1, createdAt: '2026-01-01', startSeconds: 1.5, endSeconds: 3 },
  { id: 'g3', label: 'C', folderId: 'F', order: 2, createdAt: '2026-01-01', startSeconds: 3, endSeconds: 4.5 },
]
const FOLDER = { id: 'F', color: '#14b8a6' }

type Lang = 'ja' | 'en'
const TEXT = {
  ja: {
    lead: '動画の区間（A-B リピート）を、決めた回数ずつくり返して練習するための土台。画面は無く、計算と練習の進み方だけ。この見本の画面は、見本のページが作っています。',
    labels: '文言',
    reps: 'くり返す回数',
    start: '練習を始める',
    stop: 'やめる',
    prev: '前へ',
    next: '次へ',
    finished: (n: number) => `おつかれさまでした。${n} 回くり返しました。`,
    now: (i: number, all: number, done: number, target: number) => `${i} / ${all} 番目の区間・${done} / ${target} 回`,
    stats: '記録（この見本では、ページを開いている間だけ）',
    today: '今日の回数',
    streak: 'つづけた日数',
    total: 'これまでの回数',
    folder: 'フォルダの色',
    segment: (label: string) => `区間 ${label}`,
  },
  en: {
    lead: 'A base for practicing video sections (A-B repeat) a set number of times. No UI — just the maths and the practice flow. The UI on this page belongs to the demo.',
    labels: 'Labels',
    reps: 'Repeats',
    start: 'Start practice',
    stop: 'Stop',
    prev: 'Prev',
    next: 'Next',
    finished: (n: number) => `Well done! You repeated ${n} times.`,
    now: (i: number, all: number, done: number, target: number) => `Section ${i} of ${all} · ${done} / ${target}`,
    stats: 'Records (kept only while this page is open)',
    today: 'Today',
    streak: 'Streak (days)',
    total: 'Total',
    folder: 'Folder color',
    segment: (label: string) => `Section ${label}`,
  },
}

export function App() {
  const [lang, setLang] = useState<Lang>('ja')
  const [target, setTarget] = useState(3)
  const [records, setRecords] = useState<{ date: string; reps: number }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const t = TEXT[lang]
  const labels: Partial<PracticeKitLabels> | undefined = lang === 'en' ? EN_LABELS : undefined

  const status = usePracticeSession((s) => s.status)
  const index = usePracticeSession((s) => s.index)
  const done = usePracticeSession((s) => s.done)
  const totalReps = usePracticeSession((s) => s.totalReps)
  const openTick = usePracticeSession((s) => s.openTick)
  const segId = usePracticeSession(currentSegmentId)
  const queue = usePracticeSession((s) => s.queue)
  const segments = useMemo(() => inFolder(SEGMENTS, FOLDER.id), [])
  const seg = segments.find((g) => g.id === segId)

  // 区間を開く合図（openTick）が増えたら、今の区間の A へ移って再生する
  useEffect(() => {
    const v = videoRef.current
    if (!v || !seg || status !== 'running') return
    v.currentTime = seg.startSeconds
    void v.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTick])

  // B まで来たら A に戻して 1 回と数える。決めた回数に届いたら次へ
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => {
      const s = usePracticeSession.getState()
      const g = segments.find((x) => x.id === currentSegmentId(s))
      if (s.status !== 'running' || !g || v.currentTime < g.endSeconds) return
      setRecords((r) => [...r, { date: dayKey(), reps: 1 }])
      if (s.countRep(target)) s.next()
      else v.currentTime = g.startSeconds
      if (usePracticeSession.getState().status === 'finished') v.pause()
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [segments, target])

  const stats = computeStats(records)

  return (
    <main className="demo">
      <header>
        <h1>practice-kit</h1>
        <p>{t.lead}</p>
        <pre className="demo__code">
          <code>npm install @shiodome47/practice-kit</code>
        </pre>
        <div className="demo__row" role="group" aria-label={t.labels}>
          <span className="demo__muted">{t.labels}:</span>
          <button type="button" aria-pressed={lang === 'ja'} onClick={() => setLang('ja')}>
            日本語
          </button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            English
          </button>
        </div>
      </header>

      <section>
        <video ref={videoRef} className="demo__video" src={SAMPLE_VIDEO} muted playsInline controls preload="auto" />

        <ul className="demo__list">
          {segments.map((g, i) => (
            <li key={g.id} aria-current={g.id === segId && status !== 'idle' ? 'true' : undefined}>
              <span className="demo__dot" style={{ background: FOLDER.color }} title={`${t.folder}: ${folderColorName(FOLDER.color, labels)}`} />
              <b>{t.segment(g.label)}</b>
              <span className="demo__muted">
                {g.startSeconds}–{g.endSeconds}・{formatLength(g.endSeconds - g.startSeconds, labels)}
              </span>
              {status !== 'idle' && (
                <button type="button" onClick={() => usePracticeSession.getState().jump(i)}>
                  ▶
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="demo__row">
          <label>
            {t.reps}{' '}
            <input type="number" min={1} max={10} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          {status === 'idle' ? (
            <button type="button" className="demo__primary" onClick={() => usePracticeSession.getState().start(FOLDER.id, segments.map((g) => g.id))}>
              {t.start}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => usePracticeSession.getState().prev()}>
                {t.prev}
              </button>
              <button type="button" onClick={() => usePracticeSession.getState().next()}>
                {t.next}
              </button>
              <button type="button" onClick={() => usePracticeSession.getState().stop()}>
                {t.stop}
              </button>
            </>
          )}
        </div>
        <p aria-live="polite" className="demo__status">
          {status === 'running' && t.now(index + 1, queue.length, done, target)}
          {status === 'finished' && t.finished(totalReps)}
        </p>
      </section>

      <section>
        <h2>{t.stats}</h2>
        <dl className="demo__stats">
          <div>
            <dt>{t.today}</dt>
            <dd>{stats.todayReps}</dd>
          </div>
          <div>
            <dt>{t.streak}</dt>
            <dd>{stats.streak}</dd>
          </div>
          <div>
            <dt>{t.total}</dt>
            <dd>{stats.totalReps}</dd>
          </div>
        </dl>
      </section>

      <footer className="demo__footer">
        <a href="https://github.com/shiodome47/practice-kit">GitHub</a>
        <a href="https://www.npmjs.com/package/@shiodome47/practice-kit">npm</a>
      </footer>
    </main>
  )
}
