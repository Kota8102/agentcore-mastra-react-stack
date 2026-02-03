import type { AuthUser } from "aws-amplify/auth";
import { Cloud, LogOut } from "lucide-react";

interface HeaderProps {
	signOut?: () => void;
	user?: AuthUser;
}

export const Header = ({ signOut, user }: HeaderProps) => {
	return (
		<header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
			<div className="flex h-12 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<Cloud className="size-5 text-sky-500" />
					<span className="font-medium text-sm">Agent</span>
				</div>

				{user && (
					<div className="flex items-center gap-3">
						<span className="text-muted-foreground text-sm">
							{user.signInDetails?.loginId ?? user.username}
						</span>
						<button
							type="button"
							onClick={signOut}
							className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
						>
							<LogOut className="size-4" />
							<span>Sign out</span>
						</button>
					</div>
				)}
			</div>
		</header>
	);
};
