import path from "node:path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

export interface ApiProps {
	agentRuntimeArn: string;
	userPool: cognito.UserPool;
}

export class Api extends Construct {
	public readonly restApi: apigateway.RestApi;

	constructor(scope: Construct, id: string, props: ApiProps) {
		super(scope, id);

		const fn = new NodejsFunction(this, "Lambda", {
			entry: path.join(__dirname, "../../lambda/handler.tsx"),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_22_X,
			timeout: cdk.Duration.minutes(15),
			environment: {
				AGENT_RUNTIME_ARN: props.agentRuntimeArn,
				POWERTOOLS_SERVICE_NAME: "agentcore-api",
				POWERTOOLS_LOG_LEVEL: "INFO",
			},
			bundling: {
				externalModules: ["@aws-sdk/*"],
			},
		});

		fn.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ["bedrock-agentcore:InvokeAgentRuntime"],
				resources: [props.agentRuntimeArn, `${props.agentRuntimeArn}/*`],
			}),
		);

		const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
			this,
			"CognitoAuthorizer",
			{
				cognitoUserPools: [props.userPool],
			},
		);

		this.restApi = new apigateway.RestApi(this, "RestApi", {
			restApiName: "AgentCoreApi",
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
				allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, "Authorization"],
			},
		});

		const integration = new apigateway.LambdaIntegration(fn, {
			proxy: true,
			responseTransferMode: apigateway.ResponseTransferMode.STREAM,
		});

		const methodOptions: apigateway.MethodOptions = {
			authorizer,
			authorizationType: apigateway.AuthorizationType.COGNITO,
		};

		// ルートパスにも統合を追加
		this.restApi.root.addMethod("ANY", integration, methodOptions);

		this.restApi.root.addProxy({
			defaultIntegration: integration,
			anyMethod: true,
			defaultMethodOptions: methodOptions,
		});

		new cdk.CfnOutput(this, "ApiUrl", { value: this.restApi.url });
	}
}
