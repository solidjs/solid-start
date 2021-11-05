import { render, renderActions } from "./app";
import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";

prepareManifest(manifest, assetManifest);

exports.handler = async function(event, context) {
  console.log(`Received new request: ${event.path}`);
  if (event.httpMethod === "POST") {
    const res = await renderActions(event.path, JSON.parse(event.body));
    return {
      body: res.body,
      statusCode: res.status,
      headers: { "content-type": "application/json" },
    }
  } else {
    const html = await render({ url: event.path, manifest });
    return {
      body: html,
      statusCode: 200,
      headers: { "content-type": "text/html;charset=UTF-8" }
    };
  }
}
