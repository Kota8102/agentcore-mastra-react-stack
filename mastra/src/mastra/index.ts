import { Mastra } from "@mastra/core/mastra";
import { agent } from "./agents/agent";

// Mastraインスタンス
// mastra dev: このファイルからMastraインスタンスを読み込んでStudioを起動
// 本番: src/server.ts からimportしてHonoサーバーで使用
export const mastra = new Mastra({
	agents: { agent },
});
