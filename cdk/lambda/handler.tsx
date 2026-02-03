import { Logger } from "@aws-lambda-powertools/logger";
import {
	BedrockAgentCoreClient,
	InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { Hono } from "hono";
import { streamHandle } from "hono/aws-lambda";
import { cors } from "hono/cors";

const logger = new Logger({ serviceName: "agentcore-api" });

const client = new BedrockAgentCoreClient({
	region: process.env.AWS_REGION || "us-east-1",
});

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN || "";

const app = new Hono();

app.use("*", cors());

app.post("/chat/stream", async (c) => {
	const body = await c.req.json();
	const sessionId = body.sessionId || `session-${crypto.randomUUID()}`;

	const command = new InvokeAgentRuntimeCommand({
		agentRuntimeArn: AGENT_RUNTIME_ARN,
		runtimeSessionId: sessionId,
		contentType: "application/json",
		accept: "text/event-stream",
		payload: new TextEncoder().encode(JSON.stringify(body)),
	});

	logger.info("Invoking AgentCore", { sessionId });

	const response = await client.send(command);
	const webStream = response.response?.transformToWebStream();

	if (!webStream) {
		return c.json({ error: "No response stream" }, 500);
	}

	return new Response(webStream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
});

export const handler = streamHandle(app);
