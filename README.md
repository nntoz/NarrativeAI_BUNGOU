# NarrativeAI/BUNGOU
***

## Setup

1. **環境変数の設定**
   OpenAI Console から取得した API Key を `.env` ファイルに記述します。

   ```env
   OPENAI_API_KEY="sk-から始まるあなたのAPIキー"
   ```

2. **サーバーの起動**

   ```bash
   npm run dev
   ```

3. ブラウザで `http://localhost:3000` を開くと利用できます。

## 概要

* 縦書き表示に対応したUI
* 小説調の返答
* OpenAI API を利用

## 必要条件

* Node.js v18 以上
* npm