import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { systemPrompt, messageHistory = [], userMessage, isUnrestrictedMode } = req.body;
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
    console.error(err);
    res.status(500).json({ error: 'Failed to contact OpenAI' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
