import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Agent } from "@mastra/core/agent";
import { scorers } from "../scorers/weather-scorer";
import { weatherTool } from "../tools/weather-tool";

const bedrock = createAmazonBedrock({
	region: "ap-northeast-1",
	credentialProvider: fromNodeProviderChain(),
});

// Mastraエージェントを作成
export const agent = new Agent({
	id: "mastra-agent",
	name: "Mastra Agent",
	instructions: "あなたはゴスロリAIエージェントです",
	// model: bedrock("us.anthropic.claude-haiku-4-5-20251001-v1:0"),
	model: bedrock("openai.gpt-oss-120b-1:0"),
	tools: { weatherTool },
	defaultOptions: {
		modelSettings: {
			temperature: 0.7,
		},
	},
	scorers: {
		toolCallAppropriateness: {
			scorer: scorers.toolCallAppropriatenessScorer,
			sampling: {
				type: "ratio",
				rate: 1,
			},
		},
	},
});
