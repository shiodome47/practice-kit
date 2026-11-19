# @shiodome47/practice-kit

動画の区間（**A-B リピート** = 動画の A から B までをくり返し再生すること）を、決めた回数ずつくり返して練習するための**土台**です。
画面は無く、**計算**と**練習の進み方**と**記録の数え方**だけが入っています。画面・保存先・プレイヤーは、使う側のアプリが持ちます。

- 区間の計算: 同じ区間か・保存できる A・B か・長さの表示・並び・フォルダの中の並び・ドラッグで移すときの並び直し・フォルダの色
- 練習の進み方: 始める・1 回くり返した・次へ／前へ／とぶ・おわり（小さなストア。React の hook もある）
- 記録の数え方: 今日の回数・つづけた日数・同期で記録がぶつかったときの決め方

- 見本: https://practice-kit.vercel.app/ （見本の動画で、区間を決めた回数ずつくり返す練習を試せます）
- English: [see below](#english)

## 入れ方

```bash
npm install @shiodome47/practice-kit
```

- React の画面で使うとき: `@shiodome47/practice-kit`（`usePracticeSession` が使える。React 18・19）
- React を使わないとき: `@shiodome47/practice-kit/core`（React は要らない）

ほかに要るものはありません。

## 使い方

### 練習の進み方

```tsx
import { currentSegmentId, usePracticeSession } from '@shiodome47/practice-kit'

// 始める（フォルダの区間を、並び順に）
usePracticeSession.getState().start(folderId, segments.map((g) => g.id))

// 画面で読む（その値が変わったときだけ描き直す）
const index = usePracticeSession((s) => s.index)
const segId = usePracticeSession(currentSegmentId)

// 区間を開く合図（openTick）が増えたら、今の区間の A へ移って再生する（プレイヤーとのつなぎは使う側）
const openTick = usePracticeSession((s) => s.openTick)

// プレイヤーが「B まで来て A に戻った」ときに 1 回と数える。決めた回数に届いたら次へ
const s = usePracticeSession.getState()
if (s.countRep(3)) s.next()
```

| もの | すること |
|---|---|
| `start(folderId, queue, index?)` | 練習を始める。`queue` は区間の ID の並び |
| `countRep(target)` | 今の区間を 1 回くり返した。`target` 回に届いたら `true` |
| `next()`・`prev()`・`jump(i)` | 区間を移る。最後の区間のあとは `status: 'finished'`。今の区間へ `jump` すると、回数はそのままで開き直す |
| `stop()` | やめる（最初に戻る） |
| `status` | `'idle'`（していない）・`'running'`（練習中）・`'finished'`（おわり） |
| `done`・`totalReps` | 今の区間の回数・この練習の合計 |
| `openTick` | 区間を開く合図。増えたら、使う側が今の区間を開く |
| `currentSegmentId(state)` | 今の区間の ID（練習していなければ `null`） |
| `usePracticeSession.subscribe((now, prev) => …)` | 変わったら知る（画面の外で、プレイヤーを動かすときなど） |

練習の進み具合は端末の中だけで、保存しません。React を使わないときや、別々の練習を 2 つ持ちたいときは `createPracticeSession()` で作ります（`getState`・`subscribe` が使える）。

### 区間の計算

```ts
import { formatLength, inFolder, isValidRange, planMoveSegment, sameRange } from '@shiodome47/practice-kit/core'

isValidRange(a, b) // 区間として保存できる A・B か（どちらも数で、B が A より後）
sameRange(segment, { a, b }) // 今の A・B が、保存した区間と同じか（0.05 秒以内のずれは同じ）
formatLength(72) // '1分12秒'
inFolder(segments, folderId) // フォルダの中の区間（並び順）。null は「フォルダなし」
planMoveSegment(segments, id, toFolderId, index) // ドラッグで移すとき、書き換えるもの（並びを 0, 1, 2 … に振り直す）
```

ほかに `roundSeconds`・`sortSegments`・`nextOrderIn`・`FOLDER_COLORS`・`nextFolderColor`・`folderColorName` があります。

### 記録の数え方

記録は「1 日・1 区間につき 1 件」で、くり返した回数（`reps`）を足していく形を考えています（保存は使う側）。

```ts
import { computeStats, dayKey, maxMergeRecords } from '@shiodome47/practice-kit/core'

dayKey() // '2026-11-20'（その端末の日付）
computeStats(records) // { todayReps, streak, totalReps, days }
maxMergeRecords(ours, theirs) // 同期で同じ記録がぶつかったとき、多いほうを残す（書き直すものを返す）
```

- `streak`（つづけた日数）は、今日まだ練習していなくても、昨日までつづいていれば数えます
- `maxMergeRecords` は、相手に無い記録は足しません（ほかの端末で消したことを伝えるため）

## 文言を変える（`labels`）

部品が作る文字は、長さの表示と、フォルダの色の名前（読み上げ用）だけです。既定は日本語で、英語は `EN_LABELS`。変えたいものだけ渡せます。

```ts
import { EN_LABELS, folderColorName, formatLength } from '@shiodome47/practice-kit/core'

formatLength(72, EN_LABELS) // '1m 12s'
formatLength(72, { minutesSeconds: (m, s) => `${m}:${String(s).padStart(2, '0')}` }) // '1:12'
folderColorName('#14b8a6', EN_LABELS) // 'teal'
```

## 使う側で用意するもの

- 区間・フォルダ・記録の保存先（IndexedDB など）
- プレイヤーとのつなぎ: 区間を開く（A・B を入れて再生）・「B まで来て A に戻った」の知らせ
- 画面（区間の一覧・練習の帯など）。見た目はアプリに合わせて作ります

見本のページ（`examples/web`）に、ふつうの `<video>` とつなぐ例があります。

## 開発

```bash
npm install
npm test            # テスト（vitest）
npm run typecheck   # 型の確かめ
npm run build       # dist/ を作る（Vite のライブラリモード）
npm run dev         # 見本のページ（examples/web）
```

公開の手順は [`PUBLISHING.md`](PUBLISHING.md)。

## ライセンス

MIT

---

## English

A headless base for practicing video sections (A-B repeat) a set number of times: section maths, the practice flow, and streak counting. Bring your own UI, storage and player.

- Demo: https://practice-kit.vercel.app/

```bash
npm install @shiodome47/practice-kit
```

- `@shiodome47/practice-kit`: everything, including the React hook `usePracticeSession` (React 18 / 19)
- `@shiodome47/practice-kit/core`: no React

**Practice flow** — `usePracticeSession.getState().start(folderId, ids)`, then call `countRep(target)` each time the player loops from B back to A; when it returns `true`, call `next()`. Watch `openTick`: when it increases, open the current section (`currentSegmentId(state)`). Also `prev()`, `jump(i)`, `stop()`, `status` (`idle` / `running` / `finished`), `done`, `totalReps`. Read slices with `usePracticeSession((s) => s.index)`; subscribe outside React with `usePracticeSession.subscribe((now, prev) => …)`. Use `createPracticeSession()` for a separate store or without React.

**Sections** — `isValidRange`, `sameRange` (±0.05 s), `roundSeconds`, `formatLength`, `sortSegments`, `inFolder`, `nextOrderIn`, `planMoveSegment` (returns the rows to rewrite after a drag), `FOLDER_COLORS`, `nextFolderColor`, `folderColorName`.

**Records** — `dayKey()`, `computeStats(records)` → `{ todayReps, streak, totalReps, days }` (a streak still counts if you practiced yesterday), `maxMergeRecords(ours, theirs)` for sync conflicts (keeps the larger count).

**Labels** — Japanese by default; pass `EN_LABELS` or only the parts you want: `formatLength(72, EN_LABELS) // '1m 12s'`.

MIT License.
