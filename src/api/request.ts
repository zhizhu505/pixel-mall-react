// Shared request wrapper placeholder. Keep API calls centralized here.
export async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  return response.json();
}
