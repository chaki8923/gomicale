# iOSリリース手順（Expo / EAS）

このドキュメントでは、アプリ「ごみカレ」を iOS App Store にリリースするための手順をまとめています。Expo の Managed Workflow と EAS（Expo Application Services）を前提としています。

---

## 1. Apple Developer Program 登録
1. [Apple Developer Program](https://developer.apple.com/programs/) に登録（年間 99 USD）。
2. App Store Connect へアクセスし、組織で開発する場合はメンバー招待を設定。

## 2. Expo / EAS の準備
1. Expo アカウント作成（未作成の場合）。
2. CLI ログイン  
   ```bash
   npx expo login
   ```
3. EAS CLI をインストール  
   ```bash
   npm install -g eas-cli
   ```

## 3. プロジェクト設定
1. リポジトリで EAS を初期化  
   ```bash
   eas init
   ```
   - Expo プロジェクトにリンクされ、EAS Dashboard から管理可能になります。
2. `app.config.js` を確認（済）
   - `ios.bundleIdentifier` : `com.gomikare.app`
   - `plugins` に `expo-font` を追加済み
3. アイコン、スプラッシュ画像、プライバシーポリシー URL などを `app.config.js` 内で指定。

## 4. 動作チェック
1. 依存関係の確認  
   ```bash
   npx expo-doctor
   ```
2. 必要に応じて `expo-optimize` や `expo prebuild` を実行してアセット最適化。

## 5. ビルド設定
1. iOS 用のビルド設定  
   ```bash
   eas build:configure
   ```
   - Managed Workflow を選択。
2. 証明書・プロファイルは EAS が自動で作成可能（手動アップロードも可）。

## 6. ビルド実行
1. iOS ビルド  
   ```bash
   eas build --platform ios
   ```
   - 初回ビルド時は Apple アカウント連携 & 2FA が求められます。
   - 成功後、EAS Dashboard から `.ipa` ファイルを取得可能。

## 7. テスト配布 & ストア申請
1. TestFlight への配布  
   ```bash
   eas submit --platform ios
   ```
   - もしくは `.ipa` を App Store Connect に手動アップロード。
2. App Store Connect でメタデータ（説明文、スクリーンショット、プライバシーポリシーURLなど）を登録。
3. 審査提出 → Apple のレビューを待機。

---

## メモ
- Expo SDK 52 と依存パッケージは `expo install` 済み。
- `expo-font` プラグインも設定済み。
- コマンド実行時は `npx` を推奨（グローバル汚染を防止）。
- CI/CD で自動化する場合は `EAS Build` + `EAS Submit` を組み合わせると便利です。


