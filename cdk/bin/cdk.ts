#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { Stack } from "../lib/stack";

const app = new cdk.App();

new Stack(app, "Stack", {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: "ap-northeast-1",
	},
});

app.synth();
