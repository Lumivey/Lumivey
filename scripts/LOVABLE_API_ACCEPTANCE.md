# Lovable API acceptance — 17 september 2026

Status: **NOT PASSED**. This file documents a build-tool qualification test, not a selection of Lovable as production engine.

## Mandatory proof (all required)

1. Request a short-lived file-upload ticket using an authenticated, programmatic integration available to Lumivey's production backend (not only an interactive ChatGPT tool). Record the supported authentication method and endpoint or MCP transport. Do not invent an undocumented REST endpoint.
2. Upload an actual PNG from Lumivey's backend with HTTP PUT and the *exact* signed headers. Verify 2xx and preserve the returned `file_id`. Never log/store the signed URL or credential in the repository or browser.
3. Attach that `file_id` to an authenticated create/send operation. Verify the Lovable agent can actually access the bytes of the approved Preview and production assets, not merely the prompt text. This may consume build credits: use a separate approved test budget and do not start it during upload-only checks.
4. Retrieve project/message status, preview URL and generated files programmatically, and confirm that private-by-default/publication approval gates work.
5. Re-run without hand-carrying an upload ticket or attachments through a human. If a manual step remains, the production API criterion has not passed.

## Proven versus not proven

- Connected Lovable client provides `get_file_upload_url`, `create_project`, `send_message`, `get_project` and source-reading actions.
- A presigned URL and a file ID were returned earlier, but the environment that received the ticket cannot perform arbitrary outbound PUT due to DNS/network restrictions.
- This PR adds an isolated PUT smoketest and mock coverage. Mock success != real upload success.
- Whether the connected client's authenticated tool calls can be initiated from the unattended Lumivey backend, using an official documented auth scheme, **remains unverified**.
- Lovable's public 'Build with URL' feature is a browser handoff; current documentation says the person must click Send. Do not classify that feature alone as the required unattended API.

## Next live action

Determine an authorized backend-to-Lovable authentication/transport route. Then perform the actual PUT with an ephemeral ticket on network-enabled infrastructure and record only response status, byte count, file ID (if safe for internal logs), and timestamp. If the route requires a human to copy the ticket, mark it as a transport diagnostic only, not a production API PASS.

Only after all five gates are proven may the AssetPouwer paid generation proceed within its separately agreed 20-credit ceiling. Keep this PR isolated and unmerged until verification is complete.
