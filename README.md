# おしゃべりブルスコちゃん

ブラウザで日本語音声を合成し、音量に連動した口パクを表示します。音素リップシンクではありません。`?text=こんにちは` は自動再生を試みます。ブラウザの制限時は「お話しする」を押してください。初回は約41MBを取得し、音声合成は端末内で行います。

## 開発

HTTPサーバーで開いてください。アプリのコードはMIT（LICENSE）で、画像と依存物には適用されません。

音声モデル：Blueskyちゃん（https://github.com/kojira/zen-tts-models ）／ ZEN-TTS（https://zenryokukikai.com ）

ZEN-TTS 1.3.0 https://github.com/zenryokukikai/zen-tts/tree/v1.3.0 のライセンス https://github.com/zenryokukikai/zen-tts/blob/v1.3.0/LICENSE.md に従い、画面に必須クレジットを表示します。ランタイムは改変せずTypeScriptからコンパイルしたものをアプリに組み込みます。G2PとWASMは公式GitHubをjsDelivr経由で、声モデルは作者のHugging Face https://huggingface.co/kojira/zen-tts-models から読み込みます。ZEN-TTSの公式READMEはnpm公開なし、GitHub依存からのビルドを案内しています。jsDelivrは公式運営CDNではありません。音声モデルのライセンス https://huggingface.co/kojira/zen-tts-models/blob/main/LICENSE.md 。
