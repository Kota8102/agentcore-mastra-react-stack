import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as idPool from "aws-cdk-lib/aws-cognito-identitypool";
import { Construct } from "constructs";

export class Auth extends Construct {
	public readonly userPool: cognito.UserPool;
	public readonly userPoolClient: cognito.UserPoolClient;
	public readonly identityPool: idPool.IdentityPool;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const userPool = new cognito.UserPool(this, "UserPool", {
			// フロントエンドからユーザー登録を許可
			selfSignUpEnabled: false,

			// メールアドレスをユーザー ID に設定
			signInAliases: {
				email: true,
				username: false,
			},

			// パスワードポリシーを適用(8文字以上かつアルファベット + 数字 + 記号の混合)
			passwordPolicy: {
				minLength: 8,
				requireLowercase: false, // 小文字は必須ではない
				requireUppercase: true, // 大文字を少なくとも1文字含む必要がある
				requireDigits: true, // 数字を少なくとも1文字含む必要がある
				requireSymbols: true, // 記号は必須ではない
			},

			// MFA を有効化
			// mfa: cognito.Mfa.REQUIRED,
			// mfaSecondFactor: {
			//   sms: false,
			//   otp: true,
			// },

			// 以下は本番環境では非推奨
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// Cognito UserPool を利用する Client を作成（フロントエンド用）
		const userPoolClient = userPool.addClient("Client", {
			accessTokenValidity: cdk.Duration.days(1),
			idTokenValidity: cdk.Duration.days(1),
			refreshTokenValidity: cdk.Duration.days(30),
		});

		// Cognito IdentityPool を作成
		const identityPool = new idPool.IdentityPool(this, "IdentityPool", {
			allowUnauthenticatedIdentities: true,
			authenticationProviders: {
				userPools: [
					new idPool.UserPoolAuthenticationProvider({
						userPool: userPool,
						userPoolClient: userPoolClient,
					}),
				],
			},
			roleMappings: [
				{
					providerUrl: idPool.IdentityPoolProviderUrl.userPool(
						userPool,
						userPoolClient,
					),
					useToken: true,
					mappingKey: "cognito",
					resolveAmbiguousRoles: true,
				},
			],
		});

		// リソースの公開
		this.userPool = userPool;
		this.userPoolClient = userPoolClient;
		this.identityPool = identityPool;
	}
}
