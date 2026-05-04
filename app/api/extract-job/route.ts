import { NextRequest, NextResponse } from 'next/server';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let html: string;
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Could not access that URL (${pageRes.status}). The site may block automated requests.` },
        { status: 422 }
      );
    }

    html = await pageRes.text();
  } catch {
    return NextResponse.json(
      { error: 'Could not reach that URL. Check the link and try again.' },
      { status: 422 }
    );
  }

  const text = stripHtml(html).slice(0, 12_000);

  const prompt = `Extract job posting details from the text below and return ONLY valid JSON with exactly these fields:
{
  "company": "company name",
  "title": "job title / position",
  "location": "city, state/country — or 'Remote' — or empty string",
  "salary": "salary or pay range as a string, or empty string if not mentioned",
  "job_type": "one of: Remote, Hybrid, On-site, Contract, Part-time, Internship — or empty string if unclear",
  "description": "2-3 sentence plain-English summary of the role and what they are looking for",
  "skills": "comma-separated list of required or preferred technical skills, tools, and technologies — or empty string"
}

Job posting text:
${text}`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise job posting parser. Always respond with valid JSON only. No markdown, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error('Groq error:', err);
    return NextResponse.json({ error: 'AI extraction failed. Try again.' }, { status: 500 });
  }

  const groqData = await groqRes.json();
  const content = groqData.choices?.[0]?.message?.content;

  let extracted: Record<string, string>;
  try {
    extracted = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: 'Could not parse job details from that page.' },
      { status: 422 }
    );
  }

  return NextResponse.json(extracted);
}
