# Pixel Flow Display Synth

使わなくなった液晶ディスプレイやプロジェクターを、低解像度の発光ビジュアルシンセとして再利用する最小MVPです。

- ビルド不要
- 外部ライブラリ不要
- `index.html` だけで動作
- 仮想LED・ピクセルアート・ハイブリッド表示
- 4パラメータ: Speed / Geometry / Chaos / Glow & Trail
- フルスクリーン、マウス・タッチ入力対応

## 起動

`index.html` をChromeやSafariで開くだけです。

ローカルサーバーを使う場合:

```bash
python3 -m http.server 8080
```

その後 `http://localhost:8080/display-synth/` を開きます。

## 操作

- 画面クリック・ドラッグ: 波の中心へ刺激を追加
- `Space`: 再生／停止
- `H`: 操作パネルを隠す
- `F`: フルスクリーン
- `R`: ランダム化
- `M`: LED / Pixel / Hybrid切り替え

## 次の候補

1. Web Audio APIで音声反応
2. MIDI / Web MIDI APIで4ノブ操作
3. プリセット保存
4. OSC / WebSocket遠隔操作
5. Raspberry Piキオスク起動
