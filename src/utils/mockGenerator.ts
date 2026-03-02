export function generateMockOutput(
  chapterText: string,
  authorName: string,
  platform: string,
  engagementGoal: string
) {
  const wordCount = chapterText.split(/\s+/).length;
  const firstSentence = chapterText.split('.')[0] || chapterText.substring(0, 100);

  const platformStyle = platform === 'LinkedIn'
    ? 'a professional, engaging LinkedIn post'
    : 'a thoughtful Substack article';

  const draft = `${firstSentence.trim()}.

This is ${platformStyle} generated from your chapter content, optimized for ${engagementGoal.toLowerCase()}.

The key insight from your chapter is captured here in a way that resonates with your audience. Your unique voice and perspective shine through, making complex ideas accessible and engaging.

Here's what makes this compelling:

→ It opens with a hook that draws readers in
→ It maintains your authentic voice throughout
→ It structures ideas for maximum clarity
→ It ends with a thought-provoking question or call to action

${authorName ? `Written by ${authorName}` : 'Your authentic voice preserved'}

What are your thoughts on this approach?

---
Generated from ${wordCount} words of source material
Platform: ${platform} | Goal: ${engagementGoal}`;

  const structure = JSON.stringify(
    {
      thesis: firstSentence.substring(0, 80) + '...',
      pillars: [
        {
          id: 1,
          title: 'Opening Hook',
          content: 'Captures attention with the core insight',
          wordCount: Math.floor(wordCount * 0.2),
        },
        {
          id: 2,
          title: 'Supporting Evidence',
          content: 'Builds credibility with concrete examples',
          wordCount: Math.floor(wordCount * 0.5),
        },
        {
          id: 3,
          title: 'Call to Action',
          content: 'Encourages engagement and discussion',
          wordCount: Math.floor(wordCount * 0.3),
        },
      ],
      platform: platform,
      engagementGoal: engagementGoal,
      estimatedReadTime: `${Math.ceil(wordCount / 200)} min`,
    },
    null,
    2
  );

  const voiceScore = Math.floor(Math.random() * 15) + 85;

  const reusedPhrases = [
    firstSentence.split(' ').slice(0, 4).join(' ') + '...',
    'authentic voice and perspective',
    'making complex ideas accessible',
    'thought-provoking question',
    'resonates with your audience',
  ];

  return {
    draft,
    structure,
    voiceScore,
    reusedPhrases,
  };
}
