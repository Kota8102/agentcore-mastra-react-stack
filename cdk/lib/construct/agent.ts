import path from "node:path";
import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

export class Agent extends Construct {
	public readonly runtimeArn: string;
	public readonly runtimeId: string;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
			path.join(__dirname, "../../../mastra"),
		);

		const runtime = new agentcore.Runtime(this, "StrandsAgentsRuntime", {
			runtimeName: "mastra",
			agentRuntimeArtifact: agentRuntimeArtifact,
			description: "mastra for TypeScript",
		});

		runtime.addToRolePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"bedrock:InvokeModel",
					"bedrock:InvokeModelWithResponseStream",
				],
				resources: [
					"arn:aws:bedrock:*::foundation-model/*",
					`arn:aws:bedrock:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:inference-profile/*`,
				],
			}),
		);

		runtime.addToRolePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"aws-marketplace:ViewSubscriptions",
					"aws-marketplace:Subscribe",
				],
				resources: ["*"],
			}),
		);

		// ARN と ID をプロパティとして公開
		this.runtimeArn = runtime.agentRuntimeArn;
		this.runtimeId = runtime.agentRuntimeId;

		new cdk.CfnOutput(this, "RuntimeArn", {
			value: runtime.agentRuntimeArn,
			description: "ARN of the AgentCore Runtime",
			exportName: "AgentRuntimeArn",
		});

		new cdk.CfnOutput(this, "RuntimeId", {
			value: runtime.agentRuntimeId,
			description: "ID of the AgentCore Runtime",
			exportName: "AgentRuntimeId",
		});
	}
}
