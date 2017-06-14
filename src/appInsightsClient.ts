"use strict";
import * as vscode from "vscode";
import appInsights = require("applicationinsights");

export class AppInsightsClient {
    public static sendEvent(eventName: string, properties?: { [key: string]: string; }): void {
        if (this._enableTelemetry) {
            this._client.trackEvent(eventName, properties);
        }
    }

    private static _client = appInsights.getClient("067ba7db-9013-4f94-9d48-9338459bf259");
    private static _enableTelemetry = vscode.workspace.getConfiguration("docker-explorer").get<boolean>("enableTelemetry");
}
