/**
 * Google Sheets Integration Handler
 * Actions: read-sheet, write-cells, append-rows, create-sheet
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export async function handleGoogleSheets(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.access_token || creds.api_key;
  if (!apiKey) return { success: false, error: "Missing Google Sheets access_token or API key" };

  // Determine auth method: Bearer token or API key query param
  const isOAuth = apiKey.startsWith("ya29.") || apiKey.length > 100;
  const authHeader = isOAuth ? { Authorization: `Bearer ${apiKey}` } : {};
  const keyParam = isOAuth ? "" : `?key=${apiKey}`;

  const headers = { ...authHeader, "Content-Type": "application/json" };

  switch (action) {
    case "read-sheet": {
      const { spreadsheet_id, range } = params;
      if (!spreadsheet_id) return { success: false, error: "spreadsheet_id required" };

      const sheetRange = range || "Sheet1";
      const url = `${BASE}/${spreadsheet_id}/values/${encodeURIComponent(sheetRange)}${keyParam}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { success: false, error: `Sheets error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "write-cells": {
      const { spreadsheet_id, range, values } = params;
      if (!spreadsheet_id || !range || !values) {
        return { success: false, error: "spreadsheet_id, range, and values required" };
      }

      const url = `${BASE}/${spreadsheet_id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED${isOAuth ? "" : `&key=${apiKey}`}`;
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ range, majorDimension: "ROWS", values }),
      });
      if (!res.ok) return { success: false, error: `Sheets error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "append-rows": {
      const { spreadsheet_id, range, values } = params;
      if (!spreadsheet_id || !values) {
        return { success: false, error: "spreadsheet_id and values required" };
      }

      const sheetRange = range || "Sheet1";
      const url = `${BASE}/${spreadsheet_id}/values/${encodeURIComponent(sheetRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS${isOAuth ? "" : `&key=${apiKey}`}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ values }),
      });
      if (!res.ok) return { success: false, error: `Sheets error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-sheet": {
      if (!isOAuth) return { success: false, error: "Creating sheets requires OAuth token, not API key" };
      const { title } = params;

      const res = await fetch(BASE, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties: { title: title || "New Spreadsheet" } }),
      });
      if (!res.ok) return { success: false, error: `Sheets error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `Google Sheets action "${action}" not supported` };
  }
}
