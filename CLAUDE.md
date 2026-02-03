# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS BedrockのAgentCore RuntimeとMastraフレームワークを活用したAIエージェントシステムのモノレポ構成ですわ。

## Architecture

```
test-agents/
├── web/                    # Reactフロントエンド (Vite + TailwindCSS)
├── mastra/                 # Mastraエージェント (TypeScript)
├── agentcore-runtime/      # AgentCoreランタイム (Python/Strands Agents)
└── cdk/                    # AWS CDKインフラ
    ├── lib/construct/      # CDK Constructs (Agent, API)
    └── lambda/             # API Gateway Lambda (Hono)
```

### Data Flow

1. **Web** → API Gateway (REST) → Lambda → BedrockAgentCore → **Mastra/AgentCore Runtime**
2. MastraエージェントはBedrockモデル（Claude）を使用
3. AgentCore Runtimeはstrands-agentsとbedrock-agentcoreで構築

## Common Commands

### Root (npm workspaces)

```bash
npm install                  # 全ワークスペースの依存関係インストール
npx biome check .            # コード品質チェック
npx biome check --write .    # フォーマット＆リント修正
```

### Web (frontend)

```bash
npm run dev -w web           # 開発サーバー起動
npm run build -w web         # プロダクションビルド
npm run lint -w web          # ESLint実行
```

### Mastra (agent)

```bash
npm run dev -w mastra        # Mastra Studio起動 (localhost:4111)
npm run build -w mastra      # エージェントビルド (esbuild)
npm run start -w mastra      # 本番起動
```

### CDK (infrastructure)

```bash
npm run build -w cdk         # TypeScriptコンパイル
npm run cdk -w cdk -- synth  # CloudFormationテンプレート生成
npm run cdk -w cdk -- deploy # AWSへデプロイ
npm run test -w cdk          # Jestテスト実行
```

### AgentCore Runtime (Python)

```bash
cd agentcore-runtime
uv sync                      # 依存関係インストール
uv run python main.py        # ローカル実行
```

## Code Style

- **Formatter**: Biome (タブインデント、ダブルクォート)
- **Linter**: Biome (recommended rules)
- **TypeScript**: strict mode

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@mastra/core` | AIエージェントフレームワーク |
| `@ai-sdk/amazon-bedrock` | Bedrock AI SDK統合 |
| `bedrock-agentcore` | AgentCore Runtime SDK |
| `@aws-cdk/aws-bedrock-agentcore-alpha` | AgentCore CDK Construct |
| `strands-agents` | Python AIエージェント (AgentCore用) |
