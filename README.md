# Matrix Grid Vibration Lab

ネオングリーンの“マトリックス格子”で 2D 振動を可視化するブラウザツール。  
ランダム/規則的シーケンサー、フルスクリーン、VJモード対応。**ビルド不要・単一 `index.html`** です。

## 使い方
- ファイルをダブルクリック or 任意の静的ホスティングにアップロード（GitHub Pages/Netlify/Cloudflare/Vercel 等）
- ショートカット: Space=Play/Pause, **F**=Fullscreen, **V**=VJ Mode

## GitHub への保存（最短）
1. 新規リポジトリを作成（例: `matrix-vibration`）
2. このフォルダの中身をアップロード（`index.html`, `LICENSE`, `README.md`）
3. GitHub Pages で公開するなら:
   - Repository → Settings → Pages → “**Deploy from a branch**”、Branch を `main / root` に
   - 数十秒後に公開URLが出ます

## CLI で一気に
```bash
# unzip 後のディレクトリへ
git init -b main
git add .
git commit -m "Initial commit: Matrix Vibration Lab (single-file)"
# GitHub CLI がある場合
gh repo create <your-username>/matrix-vibration --public --source=. --remote=origin --push
# Pages は Settings から有効化（UI）。または Vercel/Netlify にそのままドラッグ&ドロップ。
```

## ライセンス
MIT License（同梱の `LICENSE` を参照）
