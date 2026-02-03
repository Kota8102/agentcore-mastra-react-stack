import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import type * as idPool from "aws-cdk-lib/aws-cognito-identitypool";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { NodejsBuild } from "deploy-time-build";

export interface WebProps {
	userPool: cognito.UserPool;
	userPoolClient: cognito.UserPoolClient;
	identityPool: idPool.IdentityPool;
	apiEndpoint: string;
	hideSignUp?: boolean;
}

// Webページを作成するためのConstruct
export class Web extends Construct {
	public readonly distribution: cloudfront.Distribution;

	constructor(scope: Construct, id: string, props: WebProps) {
		super(scope, id);

		// ログを保存するS3バケットを作成
		const logBucket = new s3.Bucket(this, "LoggingBucket", {
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
			accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
			lifecycleRules: [
				{
					expiration: cdk.Duration.days(90),
				},
			],
		});

		// CloudFrontToS3を使って、S3とCloudFrontを作成
		const { cloudFrontWebDistribution, s3BucketInterface } = new CloudFrontToS3(
			this,
			"Frontend",
			{
				insertHttpSecurityHeaders: false,
				// S3バケットの設定
				bucketProps: {
					blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
					encryption: s3.BucketEncryption.S3_MANAGED,
					enforceSSL: true,
					autoDeleteObjects: true,
					removalPolicy: cdk.RemovalPolicy.DESTROY,
					serverAccessLogsPrefix: "Frontend-S3/logs/",
					serverAccessLogsBucket: logBucket,
				},
				// CloudFrontの設定
				cloudFrontDistributionProps: {
					logBucket: logBucket,
					logFilePrefix: "Cloudfront/logs/",
					geoRestriction: cloudfront.GeoRestriction.allowlist("JP"),
					publishAdditionalMetrics: true, // キャッシュヒット率などのメトリクスを有効化
					errorResponses: [
						{
							httpStatus: 403,
							responsePagePath: "/index.html",
							responseHttpStatus: 200,
							ttl: cdk.Duration.seconds(0),
						},
					],
					defaultBehavior: {
						// デフォルトの挙動設定
						viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY, // HTTPSのみを強制
					},
				},
			},
		);

		// webページのビルド
		new NodejsBuild(this, "WebBuild", {
			assets: [
				{
					path: "../",
					exclude: [
						".git",
						".vscode",
						"node_modules",
						"cdk",
						"docs",
						"imgs",
						"dist",
						"mastra",
						"web/node_modules",
					],
				},
			],
			destinationBucket: s3BucketInterface,
			distribution: cloudFrontWebDistribution,
			outputSourceDirectory: "web/dist",
			buildCommands: ["npm install -w web", "npm run build -w web"],
			buildEnvironment: {
				VITE_API_URL: props.apiEndpoint,
				VITE_IDENTITY_POOL_ID: props.identityPool.identityPoolId,
				VITE_USER_POOL_ID: props.userPool.userPoolId,
				VITE_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
				VITE_HIDE_SIGN_UP: props.hideSignUp ? "true" : "false",
			},
		});

		this.distribution = cloudFrontWebDistribution;
	}
}
