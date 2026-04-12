module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const countries = Array.isArray(body.countries) ? body.countries : [];
    const count = Number(body.count || countries.length || 0);
    const model = String(process.env.OPENAI_TRANSLATE_MODEL || "gpt-5.4-mini").trim();
    const apiKey = String(body.openaiApiKey || process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." });
    }
    if (!title) {
      return res.status(400).json({ error: "title이 비어 있습니다." });
    }
    if (!description) {
      return res.status(400).json({ error: "description이 비어 있습니다." });
    }
    if (!countries.length) {
      return res.status(400).json({ error: "countries 목록이 비어 있습니다." });
    }

    const cleanCountries = countries.map((item) => ({
      code: String(item.code || "").trim(),
      country: String(item.country || item.name || "").trim()
    })).filter((item) => item.code && item.country);

    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["translations"],
      properties: {
        translations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["code", "country", "title", "description"],
            properties: {
              code: { type: "string" },
              country: { type: "string" },
              title: { type: "string" },
              description: { type: "string" }
            }
          }
        }
      }
    };

    const systemInstruction = [
      "You translate YouTube title and description into multiple localizations.",
      "Return only the requested structured data.",
      "Keep the translation faithful to the source.",
      "Do not add hashtags, keyword lists, explanations, HTML, numbering, or extra commentary.",
      "Preserve paragraph breaks in the description whenever natural in the target language.",
      "Keep the output order exactly the same as the requested countries.",
      "Produce one translation item for every requested country code."
    ].join(" ");

    const userInstruction = [
      `Target count: ${count}`,
      "",
      "[Source title]",
      title,
      "",
      "[Source description]",
      description,
      "",
      "[Target countries in fixed order]",
      cleanCountries.map((item, index) => `${index + 1}. ${item.code} | ${item.country}`).join("\n")
    ].join("\n");

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "minimal" },
        max_output_tokens: 24000,
        text: {
          format: {
            type: "json_schema",
            name: "youtube_localizations",
            strict: true,
            schema
          },
          verbosity: "low"
        },
        input: [
          { role: "system", content: [{ type: "input_text", text: systemInstruction }] },
          { role: "user", content: [{ type: "input_text", text: userInstruction }] }
        ]
      })
    });

    const openaiData = await openaiRes.json();
    if (!openaiRes.ok) {
      const message = openaiData?.error?.message || "OpenAI 호출 실패";
      return res.status(openaiRes.status).json({ error: message, raw: openaiData });
    }

    const outputText = extractOutputText(openaiData);
    if (!outputText) {
      return res.status(502).json({ error: "OpenAI 응답에서 출력 텍스트를 찾지 못했습니다.", raw: openaiData });
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (err) {
      return res.status(502).json({ error: "OpenAI JSON 파싱 실패", rawText: outputText });
    }

    const translations = Array.isArray(parsed.translations) ? parsed.translations : [];
    if (!translations.length) {
      return res.status(502).json({ error: "번역 배열이 비어 있습니다.", rawText: outputText });
    }

    const finalText = translations.map((item) => {
      const code = String(item.code || "").trim();
      const country = String(item.country || "").trim();
      const translatedTitle = String(item.title || "").trim();
      const translatedDescription = String(item.description || "").replace(/\r/g, "").trim();
      return [
        `Country Code: ${code}`,
        `Country Name: ${country}`,
        `Title: ${translatedTitle}`,
        "Description:",
        translatedDescription
      ].join("\n");
    }).join("\n\n");

    return res.status(200).json({
      ok: true,
      model: openaiData.model || model,
      count: translations.length,
      translations,
      finalText
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "서버 오류" });
  }
};

function extractOutputText(responseJson) {
  if (!responseJson || typeof responseJson !== "object") return "";
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }
  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  const chunks = [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part && part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}
