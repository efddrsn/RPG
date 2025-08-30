import express from 'express';

const app = express();
app.use(express.json());

  const { systemPrompt, messageHistory = [], userMessage, isUnrestrictedMode } = req.body;

  // Input validation
  if (typeof systemPrompt !== 'string' || systemPrompt.trim() === '') {
    return res.status(400).json({ error: 'systemPrompt is required and must be a non-empty string.' });
  }
  if (!Array.isArray(messageHistory)) {
    return res.status(400).json({ error: 'messageHistory must be an array.' });
  }
  if (typeof userMessage !== 'string' || userMessage.trim() === '') {
    return res.status(400).json({ error: 'userMessage is required and must be a non-empty string.' });
  }
  if (typeof isUnrestrictedMode !== 'undefined' && typeof isUnrestrictedMode !== 'boolean') {
    return res.status(400).json({ error: 'isUnrestrictedMode must be a boolean if provided.' });
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messageHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: isUnrestrictedMode ? 1.0 : 0.8,
        max_tokens: 200
      })
    });
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('Error in /api/chat:', err?.message || err);
    res.status(500).json({ error: 'Failed to contact OpenAI' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
