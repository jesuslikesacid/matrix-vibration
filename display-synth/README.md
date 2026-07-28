# Pixel Flow Display Synth

余った液晶ディスプレイやプロジェクターを、PatternFlow系の低解像度ビジュアルシンセとして使うブラウザ版です。

## 今回の構成

- PatternFlowと同じ **128×64** の論理解像度
- 公式PatternFlowのプリセットを、公式JSコードのまま読み込んで実行
- 公式インデックス48件を取得し、`labOnly` を除いた表示可能セットをロード
- 4ノブ入力、ノブ押下、パターン切替
- Round LED / Rounded Pixel / Pixel Art の3表示
- セル間ギャップ、グロー、残像、2:1レターボックス
- 初回ロード後は `localStorage` にキャッシュ
- 外部ライブラリ・ビルド工程なし

## 起動

`file://` でも内蔵2パターンは動きます。公式ライブラリの読み込みはローカルサーバー経由を推奨します。

```bash
python3 -m http.server 8080
```

`http://localhost:8080/display-synth/` をChromeまたはEdgeで開いてください。

## 操作

- 4本のスライダー: PatternFlowの4ノブ
- `Push`: エンコーダー短押し
- `←` / `→`: 前後のパターン
- `M`: LED / Rounded Pixel / Pixel Art切替
- `Space`: 再生・停止
- `H`: 操作パネル表示・非表示
- `F`: フルスクリーン

## PatternFlowとの関係

PatternFlowの公式プリセットは、以下の固定コミットから実行時に読み込みます。

- Upstream: `engmung/Patternflow`
- Commit: `f6f777751a04c44206eeaa5ee6cf602cd4b4a38b`
- Preset source: `web/src/lib/presets/`

公式パターンは **CC BY-SA 4.0**、PatternFlowのWeb/firmwareランタイムは **MIT** です。作者・ライセンス・ソースリンクを画面内に表示します。

`Patternflow` は SeungHun Lee 氏の商標です。このプロジェクトは公式製品ではありません。

## 注意

高速で点滅・変化するパターンを表示します。光過敏性発作のリスクがあるため、異常や不快感があれば直ちに停止してください。
