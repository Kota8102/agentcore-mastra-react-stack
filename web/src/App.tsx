import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Layout } from "./components/layout/layout";
import Chat from "./page/chat";

const isCognitoConfigured =
	import.meta.env.VITE_USER_POOL_ID && import.meta.env.VITE_USER_POOL_CLIENT_ID;

const hideSignUp = import.meta.env.VITE_HIDE_SIGN_UP === "true";

function AuthenticatedApp() {
	const { authStatus, signOut, user } = useAuthenticator((context) => [
		context.authStatus,
		context.signOut,
		context.user,
	]);

	// 認証状態の判定中
	if (authStatus === "configuring") {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				Loading...
			</div>
		);
	}

	// 未認証: ログインフォームを中央配置
	if (authStatus !== "authenticated") {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-white">
				<Authenticator hideSignUp={hideSignUp} />
			</div>
		);
	}

	// 認証済み: 全画面表示
	return (
		<Layout signOut={signOut} user={user}>
			<Chat />
		</Layout>
	);
}

function App() {
	if (!isCognitoConfigured) {
		return (
			<Layout>
				<Chat />
			</Layout>
		);
	}

	return (
		<Authenticator.Provider>
			<AuthenticatedApp />
		</Authenticator.Provider>
	);
}

export default App;
