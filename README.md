# agentcore-mastra-react-stack

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## 概要

MastraエージェントをAWS Bedrock AgentCoreでマネージド実行し、AI SDK互換のストリーミングAPIを提供するモノレポプロジェクトです。

- **Mastra Framework** - TypeScript製AIエージェントフレームワーク
- **AI SDK Integration** - Vercel AI SDKでフロントエンドとシームレスに統合
- **AWS Bedrock AgentCore** - サーバーレスでスケーラブルなエージェントランタイム

## アーキテクチャ

![Architecture](docs/architecture.drawio.svg)

<details>
<summary>シンプル版（Mermaid）</summary>

```mermaid
flowchart TB
    subgraph Client
        Web["React Frontend<br/>AI SDK useChat"]
    end

    subgraph "AWS CDK Stack"
        APIGW["API Gateway<br/>Streaming対応"]
        Lambda["Lambda<br/>Hono"]
        AgentCore["Bedrock AgentCore<br/>Runtime"]
        Mastra["Mastra Agent<br/>+ AI SDK"]
    end

    subgraph Models
        Bedrock["Amazon Bedrock<br/>Claude Haiku 4.5"]
    end

    Web -->|"SSE Stream"| APIGW
    APIGW --> Lambda
    Lambda -->|"InvokeAgentRuntime"| AgentCore
    AgentCore -->|"HTTP Protocol"| Mastra
    Mastra -->|"AI SDK Bedrock"| Bedrock
```

</details>

## クイックスタート

### 前提条件

- Node.js >= 22.13.0
- AWS CLI v2（設定済み）
- AWS CDK CLI >= 2.235.1
- Bedrock Claude モデルへのアクセス権限

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/Kota8102/agentcore-mastra-react-stack.git
cd agentcore-mastra-react-stack

# 依存関係のインストール
npm install

# 環境変数の設定
cp mastra/.env.example mastra/.env
cp web/.env.example web/.env
```

### ローカル開発

```bash
# AWS認証（Bedrockを使うため必須）
aws sso login --profile your-profile
export AWS_PROFILE=your-profile

# ターミナル1: Honoサーバー起動
npm run dev:serve -w mastra  # localhost:8080

# ターミナル2: フロントエンド起動
npm run dev -w web           # localhost:5173
```

`web/.env.development`に`VITE_API_URL=/invocations`を設定し、http://localhost:5173 でチャット開始。

## プロジェクト構成

```
agentcore-mastra-react-stack/
├── web/                  # React + AI SDK useChat
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   └── App.tsx
│   └── package.json
│
├── mastra/               # Mastra Agent
│   ├── src/
│   │   ├── mastra/
│   │   │   ├── agents/   # エージェント定義
│   │   │   └── tools/    # ツール定義
│   │   └── server.ts     # Honoサーバー
│   ├── Dockerfile        # AgentCore用
│   └── package.json
│
├── cdk/                  # AWS CDK
│   ├── lib/
│   │   ├── stack.ts
│   │   └── construct/    # Agent, API Constructs
│   └── lambda/           # API Gateway Lambda
│
├── package.json          # npm workspaces
└── biome.json
```

## 開発コマンド

| ワークスペース | コマンド | 説明 |
|--------------|---------|------|
| ルート | `npx biome check --write .` | フォーマット＆リント |
| web | `npm run dev -w web` | 開発サーバー (5173) |
| web | `npm run build -w web` | ビルド |
| mastra | `npm run dev -w mastra` | Mastra Studio (4111) |
| mastra | `npm run dev:serve -w mastra` | Honoサーバー (8080) |
| mastra | `npm run build -w mastra` | ビルド |
| cdk | `npm run cdk -w cdk -- deploy` | AWSデプロイ |
| cdk | `npm run test -w cdk` | テスト |

## 環境変数

| ファイル | 変数名 | 説明 |
|---------|--------|------|
| `mastra/.env` | `OPENAI_API_KEY` | OpenAI APIキー |
| `web/.env` | `VITE_API_URL` | APIエンドポイント |
| `web/.env` | `VITE_USER_POOL_ID` | Cognito User Pool ID |
| `web/.env` | `VITE_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID |
| `web/.env` | `VITE_IDENTITY_POOL_ID` | Cognito Identity Pool ID |

## デプロイ

```bash
# CDKビルド＆デプロイ
npm run build -w cdk
npm run cdk -w cdk -- bootstrap  # 初回のみ
npm run cdk -w cdk -- deploy
```

作成されるAWSリソース:
- Bedrock AgentCore Runtime
- API Gateway（ストリーミング対応）
- Lambda（プロキシ）
- IAM Roles

## 関連リンク

- [Mastra Documentation](https://mastra.ai/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/)
- [Hono](https://hono.dev/)
