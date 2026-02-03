import * as cdk from "aws-cdk-lib/core";
import type { Construct } from "constructs";
import { Agent, Api, Auth, Web } from "./construct";

export class Stack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// AgentCore Runtime を作成
		const agentConstruct = new Agent(this, "Agent");

		// Cognito UserPool を作成
		const auth = new Auth(this, "Auth");

		// REST API を作成し、AgentCore ARN と Cognito UserPool を渡す
		const api = new Api(this, "Api", {
			agentRuntimeArn: agentConstruct.runtimeArn,
			userPool: auth.userPool,
		});

		// Web を作成
		const web = new Web(this, "Web", {
			userPool: auth.userPool,
			userPoolClient: auth.userPoolClient,
			identityPool: auth.identityPool,
			apiEndpoint: api.restApi.url,
			hideSignUp: true, // true: サインアップを非表示にする
		});

		// webページのURLを出力
		new cdk.CfnOutput(this, "WebLink", {
			value: `https://${web.distribution.distributionDomainName}`,
		});
	}
}
