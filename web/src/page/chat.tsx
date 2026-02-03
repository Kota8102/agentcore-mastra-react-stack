import { useChat } from "@ai-sdk/react";
import type {
	DynamicToolUIPart,
	FileUIPart,
	ReasoningUIPart,
	ToolUIPart,
} from "ai";
import { DefaultChatTransport } from "ai";
import { fetchAuthSession } from "aws-amplify/auth";
import { useState } from "react";
import {
	Attachment,
	AttachmentPreview,
	AttachmentRemove,
	Attachments,
} from "@/components/ai-elements/attachments";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputFooter,
	PromptInputHeader,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";

// Type guard for tool parts
type AnyToolPart = ToolUIPart | DynamicToolUIPart;

function isToolPart(part: { type: string }): part is AnyToolPart {
	return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

// API URL configuration
// VITE_API_URL (末尾 `/` 付き) に chat/stream パスを連結
const API_URL = `${import.meta.env.VITE_API_URL}chat/stream`;

const PromptInputAttachmentsDisplay = () => {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<Attachments variant="inline">
			{attachments.files.map((attachment) => (
				<Attachment
					data={attachment}
					key={attachment.id}
					onRemove={() => attachments.remove(attachment.id)}
				>
					<AttachmentPreview />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
};

export default function Chat() {
	const [input, setInput] = useState("");

	const isCognitoConfigured =
		import.meta.env.VITE_USER_POOL_ID &&
		import.meta.env.VITE_USER_POOL_CLIENT_ID;

	const { messages, sendMessage, status, stop } = useChat({
		transport: new DefaultChatTransport({
			api: API_URL,
			fetch: isCognitoConfigured
				? async (url, init) => {
						const session = await fetchAuthSession();
						const idToken = session.tokens?.idToken?.toString();
						const headers = new Headers(init?.headers);
						if (idToken) {
							headers.set("Authorization", idToken);
						}
						return globalThis.fetch(url, { ...init, headers });
					}
				: undefined,
		}),
	});

	const handleSubmit = (message: PromptInputMessage) => {
		const hasContent = message.text.trim() || message.files.length > 0;

		if (hasContent && status === "ready") {
			// AI SDK v6のsendMessage形式: parts配列でテキストとファイルを送信
			sendMessage({
				role: "user",
				parts: [
					// ファイルをpartsに追加（type: 'file'形式）
					...message.files.map((file) => ({
						type: "file" as const,
						mediaType: file.mediaType,
						url: file.url,
						filename: file.filename,
					})),
					// テキストを追加
					{ type: "text" as const, text: message.text },
				],
			});
			setInput("");
		}
	};

	const isLoading = status === "streaming" || status === "submitted";

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden">
			<Conversation className="min-h-0 flex-1">
				<ConversationContent className="mx-auto max-w-3xl overflow-y-auto px-4 md:px-0">
					{messages.length === 0 ? (
						<ConversationEmptyState className="flex items-center justify-center p-0">
							<div className="text-center text-muted-foreground">
								<div className="mb-4 text-4xl">👋</div>
								<p className="font-semibold text-xl text-foreground">
									こんにちは！
								</p>
								<p className="mt-2 text-sm">何でも聞いてください</p>
							</div>
						</ConversationEmptyState>
					) : (
						messages.map((message) => (
							<Message key={message.id} from={message.role}>
								<MessageContent>
									{message.parts.map((part, partIndex) => {
										// File part (画像・ファイル添付)
										if (part.type === "file") {
											const filePart = part as FileUIPart;
											return (
												<Attachments
													key={partIndex}
													variant="grid"
													className="mb-2"
												>
													<Attachment
														data={{
															id: `${message.id}-file-${partIndex}`,
															type: "file",
															url: filePart.url,
															mediaType: filePart.mediaType,
															filename: filePart.filename,
														}}
													>
														<AttachmentPreview />
													</Attachment>
												</Attachments>
											);
										}

										// Text part
										if (part.type === "text") {
											return (
												<MessageResponse key={partIndex}>
													{part.text}
												</MessageResponse>
											);
										}

										// Reasoning part (AI thinking/reasoning content)
										if (part.type === "reasoning") {
											const reasoningPart = part as ReasoningUIPart;
											return (
												<details
													key={partIndex}
													className="my-2 rounded-lg border border-muted bg-muted/30"
													open={reasoningPart.state === "streaming"}
												>
													<summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
														{reasoningPart.state === "streaming"
															? "🤔 考え中..."
															: "💭 思考プロセス"}
													</summary>
													<pre className="whitespace-pre-wrap wrap-break-word px-3 pb-3 text-xs text-muted-foreground">
														{reasoningPart.text}
													</pre>
												</details>
											);
										}

										// Tool part (v5 format: type is `tool-${toolName}` or dynamic-tool)
										if (isToolPart(part)) {
											const toolPart = part as AnyToolPart;
											const toolName =
												toolPart.type === "dynamic-tool"
													? (toolPart as DynamicToolUIPart).toolName
													: toolPart.type.slice(5); // Remove 'tool-' prefix

											return (
												<Tool
													key={`${partIndex}-${toolPart.state}`}
													defaultOpen={toolPart.state !== "output-available"}
												>
													<ToolHeader
														type="dynamic-tool"
														toolName={toolName}
														state={toolPart.state}
													/>
													<ToolContent>
														<ToolInput input={toolPart.input} />
														{(toolPart.state === "output-available" ||
															toolPart.state === "output-error") && (
															<ToolOutput
																output={
																	toolPart.state === "output-available"
																		? toolPart.output
																		: undefined
																}
																errorText={
																	toolPart.state === "output-error"
																		? toolPart.errorText
																		: undefined
																}
															/>
														)}
													</ToolContent>
												</Tool>
											);
										}

										return null;
									})}
								</MessageContent>
							</Message>
						))
					)}
				</ConversationContent>
			</Conversation>

			{/* Input area - PromptInput includes its own form */}
			<div className="from-background via-background to-transparent p-4">
				<div className="mx-auto max-w-3xl">
					<PromptInput globalDrop multiple onSubmit={handleSubmit}>
						<PromptInputHeader>
							<PromptInputAttachmentsDisplay />
						</PromptInputHeader>
						<PromptInputBody>
							<PromptInputTextarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="メッセージを入力..."
								disabled={isLoading}
							/>
						</PromptInputBody>
						<PromptInputFooter>
							<PromptInputTools>
								<PromptInputActionMenu>
									<PromptInputActionMenuTrigger />
									<PromptInputActionMenuContent>
										<PromptInputActionAddAttachments label="ファイルを追加" />
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>
							</PromptInputTools>
							<PromptInputSubmit
								status={
									status === "error"
										? "error"
										: isLoading
											? "streaming"
											: "ready"
								}
								onStop={stop}
								disabled={!input.trim() && !isLoading}
							/>
						</PromptInputFooter>
					</PromptInput>
				</div>
			</div>
		</div>
	);
}
