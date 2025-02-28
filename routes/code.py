import json

from flask import Blueprint, jsonify, request
from ollama import chat

codescan_bp = Blueprint("codescan", __name__, url_prefix="/api")

@codescan_bp.route("/codescan", methods=["POST"])
def codescan():
    code = request.json.get("code")
    if not code:
        return jsonify({"error": "No code provided"}), 400
    
    try:
        # Create a prompt that asks for structured output
        prompt = f"""
        *** BEGIN CODE***
{code}
*** END CODE ***

You are a specialized code security analyzer that ONLY outputs JSON arrays of vulnerabilities. Your task is to analyze code the user provides and return a list of vulnerabilities.

IMPORTANT: You must ONLY return a JSON array of vulnerabilities. Do not include ANY other text, markdown, explanations, or formatting.
If you include anything other than the JSON array, the system will break.

IMPORTANT: This is the format of the JSON array you must return:
        [
            {{
                "severity": "high|medium|low",
                "description": "Detailed description of the vulnerability",
                "line": line_number
            }}
        ]

Here is the code you need to analyze and return the vulnerabilities for:

Remember: Return ONLY the JSON array. No other text."""
        
        response = chat(model="deepseek-r1:14b", messages=[{
            "role": "user",
            "content": prompt
        }])

        content = response['message']['content'].strip()
        print(content)
        
        # Remove any content before and including </think> if it exists
        think_end_idx = content.find('</think>')
        if think_end_idx != -1:
            content = content[think_end_idx + len('</think>'):].strip()
        
        print("Cleaned content:", content)
        
        try:
            return jsonify({"vulnerabilities": json.loads(content)})
        except json.JSONDecodeError:
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            if start_idx == -1 or end_idx == 0:
                return jsonify({"error": "Invalid response format from AI model"}), 500
                
            json_str = content[start_idx:end_idx]
            vulnerabilities = json.loads(json_str)
            return jsonify({"vulnerabilities": vulnerabilities})
    
    except Exception as e:
        print("Error:", str(e))
        print("Raw response:", content)
        return jsonify({"error": str(e)}), 500

