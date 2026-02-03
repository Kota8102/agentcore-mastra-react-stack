import { Amplify } from "aws-amplify";

export function configureAmplify() {
	const userPoolId = import.meta.env.VITE_USER_POOL_ID;
	const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;
	const identityPoolId = import.meta.env.VITE_IDENTITY_POOL_ID;

	if (!userPoolId || !userPoolClientId) {
		console.warn(
			"Cognito configuration is incomplete. Authentication will not work.",
		);
		return;
	}

	// Amplify Gen2 形式の設定
	// 参考: https://docs.amplify.aws/react/build-a-backend/auth/use-existing-cognito-resources/
	const cognitoConfig = {
		userPoolId,
		userPoolClientId,
		// CDK の signInAliases: { email: true } と一致
		loginWith: {
			email: true,
		},
		// Identity Pool 設定 (オプション)
		...(identityPoolId
			? {
					identityPoolId,
					// Identity Pool で allowUnauthenticatedIdentities: true 設定済み
					allowGuestAccess: true,
				}
			: {}),
	};

	Amplify.configure({
		Auth: {
			Cognito: cognitoConfig,
		},
	} as Parameters<typeof Amplify.configure>[0]);
}
