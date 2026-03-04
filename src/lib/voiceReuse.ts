export interface VoiceReuseAnalysis {
  reusedQuoteCount: number;
  quoteReuseRate: number;
  topReusedPhrases: string[];
  draftWordCount: number;
  sourceWordCount: number;
  notableQuotesCount: number;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function analyzeVoiceReuse(
  draft: string,
  source: string,
  notableQuotes: string[]
): VoiceReuseAnalysis {
  const draftWordCount = countWords(draft);
  const sourceWordCount = countWords(source);
  const notableQuotesCount = notableQuotes.length;

  const reusedPhrases: string[] = [];

  for (const quote of notableQuotes) {
    if (draft.includes(quote)) {
      reusedPhrases.push(quote);
    }
  }

  const reusedQuoteCount = reusedPhrases.length;
  const quoteReuseRate = reusedQuoteCount / Math.max(1, notableQuotesCount);

  const topReusedPhrases = reusedPhrases.slice(0, 8);

  return {
    reusedQuoteCount,
    quoteReuseRate,
    topReusedPhrases,
    draftWordCount,
    sourceWordCount,
    notableQuotesCount,
  };
}

export function highlightReusedPhrases(
  draft: string,
  notableQuotes: string[]
): Array<{ text: string; highlighted: boolean }> {
  const segments: Array<{ text: string; highlighted: boolean }> = [];

  let remainingText = draft;
  let position = 0;

  const sortedQuotes = [...notableQuotes].sort((a, b) => b.length - a.length);

  while (position < draft.length) {
    let foundMatch = false;

    for (const quote of sortedQuotes) {
      const index = remainingText.indexOf(quote);

      if (index === 0) {
        if (position > 0 && segments.length > 0 && segments[segments.length - 1].highlighted === true) {
          segments[segments.length - 1].text += quote;
        } else {
          segments.push({ text: quote, highlighted: true });
        }

        position += quote.length;
        remainingText = draft.substring(position);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      const nextMatchIndex = findNextMatchIndex(remainingText, sortedQuotes);

      if (nextMatchIndex === -1) {
        segments.push({ text: remainingText, highlighted: false });
        break;
      } else {
        segments.push({ text: remainingText.substring(0, nextMatchIndex), highlighted: false });
        position += nextMatchIndex;
        remainingText = draft.substring(position);
      }
    }
  }

  return segments;
}

function findNextMatchIndex(text: string, quotes: string[]): number {
  let minIndex = -1;

  for (const quote of quotes) {
    const index = text.indexOf(quote);
    if (index !== -1) {
      if (minIndex === -1 || index < minIndex) {
        minIndex = index;
      }
    }
  }

  return minIndex;
}
