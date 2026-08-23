import httpx

from thingso_worker.llm_client import OpenAICompatibleClient


def test_openai_compatible_client_decodes_json_object() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/chat/completions")
        return httpx.Response(
            200,
            request=request,
            json={
                "choices": [
                    {
                        "message": {
                            "content": '{"schema_version":"repo-review-v1","decision":"approved"}'
                        }
                    }
                ]
            },
        )

    client = OpenAICompatibleClient(
        api_key="test-key",
        base_url="https://provider.invalid/v1",
        transport=httpx.MockTransport(handler),
    )
    try:
        response = client.generate_json(
            model="test-model",
            system_prompt="system",
            user_prompt="user",
        )
    finally:
        client.close()

    assert response.data["decision"] == "approved"
    assert response.model == "test-model"


def test_openai_compatible_client_accepts_json_fence() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            request=request,
            json={"choices": [{"message": {"content": "```json\n{\"ok\": true}\n```"}}]},
        )

    client = OpenAICompatibleClient(
        api_key="test-key",
        transport=httpx.MockTransport(handler),
    )
    try:
        response = client.generate_json(
            model="test-model",
            system_prompt="system",
            user_prompt="user",
        )
    finally:
        client.close()
    assert response.data == {"ok": True}
