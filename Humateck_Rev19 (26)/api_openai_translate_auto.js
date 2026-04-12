module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY 환경변수가 없습니다." });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const countriesInput = Array.isArray(body.countries) ? body.countries : [];
    const requestedCount = Number(body.count) || countriesInput.length || 0;

    const countries = countriesInput
      .slice(0, requestedCount)
      .map((item) => ({
        code: String(item.code || "").trim(),
        country: String(item.country || "").trim(),
      }))
      .filter((item) => item.code);

    if (!title) {
      return res.status(400).json({ error: "title 값이 없습니다." });
    }

    if (!description) {
      return res.status(400).json({ error: "description 값이 없습니다." });
    }

    if (!countries.length) {
      return res.status(400).json({ error: "countries 값이 없습니다." });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const developerPrompt = [
      "You are a professional localization assistant for YouTube metadata.",
      "Translate the source title and description into the requested target locales.",
      "Return JSON only, following the provided schema exactly.",
      "Do not add explanations, notes, markdown, numbering, code fences, or extra text.",
      "Keep the order of items exactly the same as the requested countries list.",
      "Preserve paragraph breaks in the description.",
      "Do not omit any requested language.",
      "Each item's code must exactly match the requested code.",
      "Each item's country must exactly match the requested country.",
      "Translate title and description naturally for each locale, but stay faithful to the source meaning.",
      "Do not inject hashtags, keywords, or promotional extras unless they already exist in the source.",
      "Do not output HTML."
    ].join(" ");

    const userPayload = {
      source: {
        title,
        description
      },
      targets: countries
    };

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "developer", content: developerPrompt },
          { role: "user", content: JSON.stringify(userPayload) }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_payload",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      code: { type: "string" },
                      country: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["code", "country", "title", "description"]
                  }
                }
              },
              required: ["items"]
            }
          }
        }
      })
    });

    const raw = await openaiResponse.json();

    if (!openaiResponse.ok) {
      const msg =
        raw?.error?.message ||
        raw?.message ||
        `OpenAI 호출 실패 (${openaiResponse.status})`;
      return res.status(openaiResponse.status).json({ error: msg });
    }

    const content = raw?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "OpenAI 응답 content가 비어 있습니다." });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({
        error: "OpenAI JSON 파싱 실패",
        rawContent: content
      });
    }

    const returnedItems = Array.isArray(parsed?.items) ? parsed.items : [];
    if (!returnedItems.length) {
      return res.status(500).json({ error: "OpenAI 응답에 items가 없습니다." });
    }

    const byCode = new Map();
    for (const item of returnedItems) {
      const key = String(item.code || "").trim().toLowerCase();
      if (key && !byCode.has(key)) {
        byCode.set(key, {
          code: String(item.code || "").trim(),
          country: String(item.country || "").trim(),
          title: String(item.title || "").trim(),
          description: String(item.description || "").replace(/\r/g, "").trim()
        });
      }
    }

    const normalizedItems = countries.map((target, index) => {
      const matched = byCode.get(target.code.toLowerCase()) || returnedItems[index] || {};
      return {
        code: target.code,
        country: target.country,
        title: String(matched.title || "").trim(),
        description: String(matched.description || "").replace(/\r/g, "").trim()
      };
    });

    const emptyTitleCount = normalizedItems.filter((x) => !x.title).length;
    if (emptyTitleCount === normalizedItems.length) {
      return res.status(500).json({ error: "번역 결과에서 제목을 읽지 못했습니다." });
    }

    const finalText = normalizedItems
      .map((item) => {
        return [
          `Country Code: ${item.code}`,
          `Country Name: ${item.country}`,
          `Title: ${item.title}`,
          `Description:`,
          item.description
        ].join("\n");
      })
      .join("\n\n");

    return res.status(200).json({
      ok: true,
      model,
      count: normalizedItems.length,
      finalText,
      items: normalizedItems
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "서버 함수 처리 중 알 수 없는 오류가 발생했습니다."
    });
  }
};