# PRISMatrix (pd~ patch lab)

ARGOPd / Ofelia / EYESY にインスパイアされた、**Pure Data 風のオペレーターグラフで駆動するオーディオ反応ネオングリッド**。
単一 `index.html` で完結し、React + Canvas2D 上で metro / osc~ / env~ / sh~ / bp~ ノードを組んだパッチを切替えて、マイク入力とカラーグレーディングを操れます。

## どんなもの？
- **パッチライブラリ (pd~)**: 
  - `pd~ AR↯GO flux` — metro→osc~→fold~→bp~ で対角線とバーストを叩き込む ARGOPd 系
  - `pd~ Ofelia bloom` — noise~→samp-hold→env~ を反応拡散に流し込む Ofelia 系
  - `pd~ EYESY scanlines` — phasor~ スイープと metro バーストでストライプを描く EYESY 系
- **パッチグラフビュー**: 選択したパッチのノードと入力を UI に表示、Pd っぽい流れを確認できます。
- **マイク連動**: 低域エネルギーで衝撃＆色シフトを増幅。
- **ルックコントロール**: パレット、グリッド密度、チルト、グロー、グレイン。
- **ビルド不要**: HTML を開くだけ。静的サーバーに置けば即 VJ 用。

## 使い方
1. ローカルで配信（マイク権限のため `file://` ではなく http 推奨）
   ```bash
   python -m http.server 4173
   # → http://localhost:4173 をブラウザで開く
   ```
2. Play/Pause で再生切替、Patch Rack からパッチ（AR↯GO flux / Ofelia bloom / EYESY scanlines）を選択。
3. 「Enable Mic」でブラウザのマイク許可。VU メーターとグリッドがビートに同期します。
4. Canvas をドラッグして手動で衝撃を描き込み、ルック系スライダーで色味を調整。

## ショートカット
- Space: Pause/Play
- ウィンドウリサイズ: キャンバスを再フレーム

## ビルド＆依存
- 追加ビルドなし。React/Tailwind/Babel は CDN から読み込み。
- コードは `index.html` 一枚に収まっています。

## ライセンス
MIT License（`LICENSE` を参照）
