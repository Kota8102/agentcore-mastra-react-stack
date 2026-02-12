import { serve } from "@hono/node-server";
import { handleChatStream } from "@mastra/ai-sdk";
import type { UIMessage } from "ai";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { mastra } from "./mastra";

const app = new Hono();

// AgentCore HTTPプロトコル契約: POST /invocations
app.post("/invocations", async (c) => {
	const body = await c.req.json<{ messages: UIMessage[] }>();

	// handleChatStreamでAI SDK形式のReadableStreamを取得
	// Bedrockはtemperatureとtop_pを同時指定できないため、temperatureのみ指定
	const stream = await handleChatStream({
		mastra,
		agentId: "agent",
		params: {
			messages: body.messages,
		},
		sendReasoning: true,
		sendStart: true,
		sendFinish: true,
	});

	// SSE形式でレスポンス
	return streamSSE(c, async (sseStream) => {
		for await (const chunk of stream) {
			await sseStream.writeSSE({ data: JSON.stringify(chunk) });
		}
	});
});

// AgentCore HTTPプロトコル契約: GET /ping
app.get("/ping", (c) => {
	return c.json({
		status: "Healthy",
		time_of_last_update: Math.floor(Date.now() / 1000),
	});
});

// サーバー起動（Port 8080 - AgentCore要件）
const port = Number(process.env.PORT) || 8080;
serve(
	{
		fetch: app.fetch,
		port,
		hostname: "0.0.0.0",
	},
	() => {
		console.log(`AgentCore Runtime server running on http://0.0.0.0:${port}`);
	},
);
