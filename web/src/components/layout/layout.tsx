import type { AuthUser } from "aws-amplify/auth";
import type { ReactNode } from "react";
import { Header } from "./header";

interface LayoutProps {
	children: ReactNode;
	signOut?: () => void;
	user?: AuthUser;
}

export const Layout = ({ children, signOut, user }: LayoutProps) => {
	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
			<Header signOut={signOut} user={user} />

			<main className="flex min-h-0 flex-1 flex-col">{children}</main>
		</div>
	);
};
