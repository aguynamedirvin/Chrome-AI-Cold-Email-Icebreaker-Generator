export function formatPositions(positions) {
  return positions.map((position, index) => {
    let positionStr = `Position ${index + 1}:\n`;

    if (position.position) {
      positionStr += `Title: ${position.position}\n`;
    }
    if (position.company) {
      positionStr += `Company: ${position.company}\n`;
    }
    if (position.duration) {
      positionStr += `Duration: ${position.duration}\n`;
    }
    if (position.location) {
      positionStr += `Location: ${position.location}\n`;
    }
    positionStr += '\n';

    return positionStr;
  }).join('');
}

// Clean and format response from OpenAI
export function extractIcebreaker(text) {
  const regex = /(?:Icebreaker:\s*)?"([^"]+)"?/i;
  const match = text.match(regex);
  
  if (match && match[1]) {
    return match[1];
  } else {
    return text;
  }
}

export async function generateIcebreaker(openaiApiKey, profileData, reviewCount, reviewRating) {
  const formattedPositions = formatPositions(profileData.positions);

  let reviewCountLine = '';
  let reviewRatingLine = '';

  if (reviewCount >= 100 && reviewRating >= 4) {
    reviewCountLine = `${reviewCount} Reviews`;
  }

  if (reviewRating >= 4.8) {
    reviewRatingLine = `${reviewRating}/5 Rating`;
  }

  const reviewStatsLine = (reviewCountLine || reviewRatingLine) ? 'Google My Business:' : '';

const prompt = `Generate one personalized icebreaker based on the profile of ${profileData.fullName} and current company ${profileData.currentCompany}. Focus on unique personal details, achievements, or business aspects.  Keep the icebreaker to one sentence, 109 characters max. Use a conversational style for company names, and maintain a professional and simple tone. No questions, and don't mention their name. The icebreaker will be used in a cold email to home service contractors.

Examples of good icebreakers:
1. "Interesting to know your family has been in the plumbing industry for three generations - quite the legacy!"
2. "Congratulations on running Ace Solves It All for nearly three decades and the great reputation you've built for it thus far!"
3. "Kudos on 50+ years in business and the impressive amount of positive reviews you've gathered for Active Plumbing & Air thus far."
------------

${profileData.fullName}'s Profile:
${profileData.tagLine}
${profileData.contactLocation}

${profileData.contactAbout}

${formattedPositions}

${reviewStatsLine}
${reviewCountLine}
${reviewRatingLine}`;

  console.log(prompt);

  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      temperature: 0.85,
      max_tokens: 700,
      n: 1,
      model: "text-davinci-003",
      stop: null
    }),
  });


  const data = await response.json();
  const icebreaker = extractIcebreaker(data.choices[0].text.trim());

  return icebreaker;
}
