import { HabitProfile, AnalyzeResponse } from '../types/index';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function analyzeHabits(profile: HabitProfile): Promise<AnalyzeResponse> {
  const response = await fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(
      `API request failed with status ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<AnalyzeResponse>;
}
