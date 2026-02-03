import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			// Proxy to Mastra Studio (local development) at localhost:4111
			// For production (AgentCore), set VITE_API_URL environment variable
			"/api": {
				target: "http://localhost:4111",
				changeOrigin: true,
				configure: (proxy) => {
					proxy.on("proxyRes", (proxyRes) => {
						// AI SDK requires this header to parse UI Message Stream format
						proxyRes.headers["x-vercel-ai-ui-message-stream"] = "v1";
					});
				},
			},
			// AI SDK compatible chat route (via @mastra/ai-sdk chatRoute)
			"/chat": {
				target: "http://localhost:4111",
				changeOrigin: true,
				configure: (proxy) => {
					proxy.on("proxyRes", (proxyRes) => {
						proxyRes.headers["x-vercel-ai-ui-message-stream"] = "v1";
					});
				},
			},
			// Proxy to Hono server (npm run dev:serve -w mastra) at localhost:8080
			"/invocations": {
				target: "http://localhost:8080",
				changeOrigin: true,
				configure: (proxy) => {
					proxy.on("proxyRes", (proxyRes) => {
						proxyRes.headers["x-vercel-ai-ui-message-stream"] = "v1";
					});
				},
			},
		},
	},
});
