import anthropic
import os
import json
from typing import Any

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

PLAN_SYSTEM_PROMPT = """You are a concise code generation assistant. Given a user prompt, return a JSON plan.
Response: valid JSON only, no markdown/backticks.

Schema: {"steps":[{"step_type":"create_file"|"modify_file"|"run_command","title":"short title","description":"brief desc","file_path":"relative path or null","content":"full file content or null"}]}

Rules:
- React app: include package.json (react, react-dom, vite, @vitejs/plugin-react), index.html (root div + script), vite.config.js.
- Write complete runnable files, not snippets.
- Modern React (hooks, functional components).
- Start command: "npm run dev".
- Be concise. Minimal comments in generated code.
"""


def generate_plan(prompt: str, template_type: str = "react-node") -> dict[str, Any]:
    """Call Claude synchronously and return a structured plan."""
    message = client.messages.create(
        model=MODEL,
        max_tokens=3000,
        messages=[
            {
                "role": "user",
                "content": f"Template: {template_type}\n\nUser request: {prompt}\n\nReturn the JSON plan.",
            }
        ],
        system=PLAN_SYSTEM_PROMPT,
    )
    raw = message.content[0].text.strip()
    # Strip markdown code fences if Claude adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    if raw.endswith("```"):
        raw = raw[: raw.rfind("```")]
    return json.loads(raw.strip())


def repair_error(
    prompt: str, error_log: str, files: dict[str, str]
) -> dict[str, Any]:
    """Ask Claude to fix a build/runtime error."""
    files_context = "\n\n".join(
        f"--- {path} ---\n{content}" for path, content in files.items()
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Original request: {prompt}\n\n"
                    f"Error log:\n{error_log}\n\n"
                    f"Current files:\n{files_context}\n\n"
                    "Return a JSON repair plan with the same schema as before. "
                    "Only include files that need to change."
                ),
            }
        ],
        system=PLAN_SYSTEM_PROMPT,
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    if raw.endswith("```"):
        raw = raw[: raw.rfind("```")]
    return json.loads(raw.strip())
